/**
 * Datasets behind the in-game API (see apiServer.js). Deterministic: a seeded generator, so tests and the
 * player see the same data. Every collection has an "a" (visible) and a "b" (hidden) variant with the same
 * shape but different rows, so a web challenge cannot be passed by hard-coding what the example API returns.
 */
export type ApiVariant = 'a' | 'b';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const MACHINE_NAMES = ['Press', 'Lathe', 'Welder', 'CNC mill', 'Sorter', 'Packer', 'Drill', 'Saw', 'Grinder', 'Robot arm', 'Furnace', 'Conveyor'];
const CITIES = ['Bath', 'Leeds', 'York', 'Derby', 'Ely', 'Hull', 'Truro'];
const FIRST = ['Ada', 'Bo', 'Cy', 'Di', 'Ed', 'Flo', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kit', 'Lu'];
const LAST = ['Reyes', 'Khan', 'Nair', 'Okafor', 'Silva', 'Tan', 'Ito', 'Moreau', 'Brooks', 'Chen'];

export function apiCollections(variant: ApiVariant): Record<string, Record<string, unknown>[]> {
  const r = rng(variant === 'a' ? 4242 : 9797);
  const person = () => `${pick(r, FIRST)} ${pick(r, LAST)}`;
  const machines = MACHINE_NAMES.slice(0, 10).map((name, i) => ({
    id: i + 1, name: `${name} ${String.fromCharCode(65 + (i % 4))}${i + 1}`, type: pick(r, ['press', 'cutter', 'welder', 'packer']),
    status: pick(r, ['running', 'running', 'idle', 'down']), downtime_hours: round(r() * 40, 1), department: pick(r, ['Assembly', 'Machining', 'Packing']),
  }));
  const teams = ['Owls', 'Bears', 'Cats', 'Wolves', 'Hawks', 'Foxes'].map((name, i) => ({ id: i + 1, name, city: pick(r, CITIES), wins: Math.floor(r() * 20), losses: Math.floor(r() * 20) }));
  // Deliberate ties (in both data sets) so a ranking must break them properly: fewer losses first, then name A-Z.
  if (variant === 'a') teams[3]!.losses = 5;
  else teams[4]!.wins = 4, (teams[4]!.losses = 4);
  const players = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, name: person(), team: pick(r, teams).name, position: pick(r, ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF']),
    batting_avg: round(0.18 + r() * 0.17, 3), home_runs: Math.floor(r() * 40),
  }));
  const products = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, name: `${pick(r, ['Bolt', 'Gear', 'Clamp', 'Valve', 'Hose', 'Gauge', 'Filter', 'Belt'])} ${100 + i * 7}`, category: pick(r, ['Fasteners', 'Tools', 'Safety', 'Electrical']),
    price: round(3 + r() * 120), stock: Math.floor(r() * 80),
  }));
  const employees = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1, name: person(), role: pick(r, ['operator', 'technician', 'supervisor']), department: pick(r, ['Assembly', 'Machining', 'Packing']), rate: round(15 + r() * 30),
  }));
  const weather = Array.from({ length: 14 }, (_, i) => ({
    id: i + 1, city: pick(r, CITIES), date: `2024-06-${String(i + 1).padStart(2, '0')}`, temp_c: round(8 + r() * 20, 1), rain_mm: round(r() < 0.5 ? 0 : r() * 15, 1),
  }));
  const races = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1, driver: person(), track: pick(r, ['Monza', 'Silverstone', 'Suzuka', 'Spa']), lap_time_ms: 80000 + Math.floor(r() * 9000), position: (i % 6) + 1,
  }));
  const measurements = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1, sensor: pick(r, ['S1', 'S2', 'S3']), value: round(20 + r() * 60, 1), unit: 'C', taken_at: `2024-05-${String(1 + (i % 28)).padStart(2, '0')}T${String(8 + (i % 10)).padStart(2, '0')}:00:00`,
  }));
  const courses = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1, title: `${pick(r, ['Intro to', 'Applied', 'Advanced', 'Foundations of'])} ${pick(r, ['Databases', 'Statistics', 'Robotics', 'Networks', 'Ethics', 'Design'])}`, credits: pick(r, [10, 15, 20]), department: pick(r, ['CS', 'Maths', 'Engineering']), seats: Math.floor(r() * 60),
  }));
  courses[2]!.seats = 1; // a nearly-full course in both data sets, so "the last seat" behaviour can be checked
  return { machines, teams, players, products, employees, weather, races, measurements, courses };
}

/** Fields the API insists on for POST/PUT (drives the 400 "Missing required fields" response). */
export const apiRequired: Record<string, string[]> = {
  machines: ['name', 'type'],
  teams: ['name'],
  players: ['name', 'team'],
  products: ['name', 'price'],
  employees: ['name', 'role'],
  weather: ['city', 'date'],
  races: ['driver', 'track'],
  measurements: ['sensor', 'value'],
  courses: ['title', 'credits'],
};

export function apiConfig(variant: ApiVariant, latency = 20) {
  return { collections: apiCollections(variant), required: apiRequired, latency, retryAfter: variant === 'a' ? 2 : 7 };
}
