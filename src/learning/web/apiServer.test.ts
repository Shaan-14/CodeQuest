import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { apiConfig, apiCollections } from './apiData';

type Res = { status: number; headers: Record<string, string>; body: string };
interface Server {
  handle(method: string, url: string, o?: { headers?: Record<string, string>; body?: string }): Res;
  log: unknown[];
  latencyFor(url: string): number;
}
const src = readFileSync(new URL('./apiServer.js', import.meta.url), 'utf8');
const make = (variant: 'a' | 'b' = 'a'): Server => new Function(`${src}\nreturn createApiServer;`)()(apiConfig(variant));
const get = (s: Server, url: string, headers?: Record<string, string>) => {
  const r = s.handle('GET', url, { headers });
  return { ...r, json: r.body ? JSON.parse(r.body) : null };
};
const JSON_H = { 'Content-Type': 'application/json' };

describe('in-game API (deterministic HTTP simulation)', () => {
  it('serves the same data every time, and different data for the hidden variant', () => {
    expect(apiCollections('a')).toEqual(apiCollections('a'));
    expect(apiCollections('a').machines).not.toEqual(apiCollections('b').machines);
    expect(Object.keys(apiCollections('a')).sort()).toEqual(['courses', 'employees', 'machines', 'measurements', 'players', 'products', 'races', 'teams', 'weather']);
    for (const rows of Object.values(apiCollections('b'))) expect(rows.length).toBeGreaterThan(5);
  });

  it('lists with filters, search, sorting, paging and a total-count header', () => {
    const s = make();
    const all = get(s, '/api/products');
    expect(all.status).toBe(200);
    expect(all.headers['X-Total-Count']).toBe(String(all.json.length));
    const sorted = get(s, '/api/products?sort=-price').json as { price: number }[];
    expect(sorted.map((p) => p.price)).toEqual(sorted.map((p) => p.price).slice().sort((a, b) => b - a));
    const page = get(s, '/api/products?sort=id&limit=3&offset=2');
    expect(page.json.map((p: { id: number }) => p.id)).toEqual([3, 4, 5]);
    expect(page.headers['X-Total-Count']).toBe(String(all.json.length));
    const cat = get(s, '/api/products?category=Tools').json as { category: string }[];
    expect(cat.every((p) => p.category === 'Tools')).toBe(true);
    const q = get(s, `/api/products?q=${encodeURIComponent(all.json[0].name.slice(0, 4).toLowerCase())}`).json as unknown[];
    expect(q.length).toBeGreaterThan(0);
    expect(get(s, 'https://api.codequest.test/api/products?limit=1').json).toHaveLength(1);
  });

  it('uses proper status codes for missing things and wrong methods', () => {
    const s = make();
    expect(get(s, '/api/machines/999').status).toBe(404);
    expect(get(s, '/api/nothing').status).toBe(404);
    expect(get(s, '/elsewhere').status).toBe(404);
    expect(get(s, '/api/machines/1/extra').status).toBe(404);
    const patchList = s.handle('PATCH', '/api/machines');
    expect(patchList.status).toBe(405);
    expect(patchList.headers.Allow).toBe('GET, POST');
  });

  it('requires an API key for /api/private and never allows writes there', () => {
    const s = make();
    expect(get(s, '/api/private/employees').status).toBe(401);
    expect(get(s, '/api/private/employees', { authorization: 'Bearer wrong' }).status).toBe(401);
    expect(get(s, '/api/private/employees', { Authorization: 'Bearer codequest-key' }).status).toBe(200);
    expect(s.handle('DELETE', '/api/private/employees/1', { headers: { Authorization: 'Bearer codequest-key' } }).status).toBe(405);
  });

  it('creates, updates and deletes with validation', () => {
    const s = make();
    expect(s.handle('POST', '/api/products', { headers: { 'Content-Type': 'text/plain' }, body: '{}' }).status).toBe(415);
    expect(s.handle('POST', '/api/products', { headers: JSON_H, body: 'not json' }).status).toBe(400);
    const missing = s.handle('POST', '/api/products', { headers: JSON_H, body: '{"name":"Bolt"}' });
    expect(missing.status).toBe(400);
    expect(JSON.parse(missing.body).fields).toEqual(['price']);
    const created = s.handle('POST', '/api/products', { headers: JSON_H, body: '{"name":"Bolt","price":2.5}' });
    expect(created.status).toBe(201);
    const id = JSON.parse(created.body).id;
    expect(created.headers.Location).toBe(`/api/products/${id}`);
    expect(get(s, `/api/products/${id}`).json.name).toBe('Bolt');
    const patched = s.handle('PATCH', `/api/products/${id}`, { headers: JSON_H, body: '{"price":3}' });
    expect(JSON.parse(patched.body)).toMatchObject({ id, name: 'Bolt', price: 3 });
    expect(s.handle('PUT', `/api/products/${id}`, { headers: JSON_H, body: '{"name":"Nut"}' }).status).toBe(400);
    expect(s.handle('DELETE', `/api/products/${id}`).status).toBe(204);
    expect(get(s, `/api/products/${id}`).status).toBe(404);
    expect(s.handle('DELETE', `/api/products/${id}`).status).toBe(404);
  });

  it('flaky and rate-limited endpoints are deterministic per server instance', () => {
    const s = make();
    expect([1, 2, 3, 4].map(() => get(s, '/api/flaky').status)).toEqual([503, 503, 200, 200]);
    const t = make();
    const codes = [1, 2, 3, 4, 5].map(() => get(t, '/api/rate-limited'));
    expect(codes.map((c) => c.status)).toEqual([200, 200, 200, 429, 429]);
    expect(codes[3]!.headers['Retry-After']).toBe('2');
    expect(make().latencyFor('/api/slow')).toBe(400);
    expect(make().latencyFor('/api/machines')).toBe(20);
  });

  it('is isolated per instance (a POST in one server does not leak into another)', () => {
    const a = make();
    const b = make();
    a.handle('POST', '/api/teams', { headers: JSON_H, body: '{"name":"New"}' });
    expect(get(a, '/api/teams').json.length).toBe(get(b, '/api/teams').json.length + 1);
  });
});
