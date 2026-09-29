import { text } from '../helpers';
import type { Check, LessonBundle } from '../schema';

const out = (name: string, expect: string, files?: Record<string, string>, visible = true): Check => ({ kind: 'output', name, expect, files, visible });

/**
 * INDEPENDENT MODE (Python, Phase 2). Problem statements only: no concept names, no hints, no starter code,
 * no named functions or modules. The manual is available. Hidden data checks catch hard-coded or fragile answers.
 */
export const bundle: LessonBundle = {
  lesson: {
    id: 'py-26-independent-python', title: 'Trial: The Ledger Vault', language: 'python', skillId: 'ps.decomposition',
    blurb: 'Two open problems. No hints, no scaffolding. Solve them your own way.', prerequisites: ['py-25-projects'], xpReward: 0,
    reference: { title: 'Independent trials', body: 'Independent trials give you a problem and nothing else. Use the Field Manual, run small experiments, and test your own edge cases. The hidden checks use different data from the example.' },
    steps: [
      { kind: 'challenge', challengeId: 'py-26-inventory-analyzer' },
      { kind: 'challenge', challengeId: 'py-26-sensor-report' },
    ],
  },
  challenges: [
    {
      id: 'py-26-inventory-analyzer', title: 'The Reorder List', mode: 'independent', language: 'python', skillIds: ['de.files', 'de.cleaning', 'py.records', 'ps.decomposition'], concepts: [], difficulty: 4, transfer: true, context: 'logistics', project: true,
      prompt: text(
        'The warehouse exports its stock levels to `stock.csv`, with the columns `sku,name,qty,reorder_level,unit_cost`. The manager wants two things:',
        'The **SKUs of every item whose quantity is below its reorder level**, in alphabetical order, one per line. Then a final line showing the **total value of all stock** (quantity × unit cost), like `Stock value: 68.50`, with two decimals.',
        'Some rows are incomplete (a missing quantity or cost). They cannot be valued, so leave them out of both the list and the total. The manager will run your program on next month’s export too, so it should not assume anything about this month’s data.',
      ),
      fixtures: { files: { 'stock.csv': 'sku,name,qty,reorder_level,unit_cost\nB-200,"Bolt, steel",40,50,0.25\nA-100,Gear,3,5,12.50\nC-300,Nut,,20,0.10\nD-400,Cog,8,8,2.00\nE-500,Shaft,2,4,\nF-600,Washer,100,30,0.05\n' } },
      starterCode: '',
      hints: [],
      checks: [
        out('This month’s export', 'A-100\nB-200\nStock value: 68.50'),
        out('A different export', 'Z-9\nStock value: 11.00', { 'stock.csv': 'sku,name,qty,reorder_level,unit_cost\nZ-9,Widget,0,1,3.00\nY-8,"Gadget, big",10,10,1.10\n' }, false),
        out('Nothing needs reordering', 'Stock value: 15.00', { 'stock.csv': 'sku,name,qty,reorder_level,unit_cost\nP-1,Pin,100,10,0.15\n' }, false),
        out('An empty export', 'Stock value: 0.00', { 'stock.csv': 'sku,name,qty,reorder_level,unit_cost\n' }, false),
        out('Incomplete rows are ignored everywhere', 'K-2\nStock value: 4.00', { 'stock.csv': 'sku,name,qty,reorder_level,unit_cost\nJ-1,Jig,,50,1.00\nK-2,Key,2,9,2.00\nL-3,Lock,5,1,\n' }, false),
      ],
      xpReward: 150, coinReward: 25,
    },
    {
      id: 'py-26-sensor-report', title: 'The Suspicious Sensors', mode: 'independent', language: 'python', skillIds: ['de.files', 'py.records', 'py.dicts', 'ps.decomposition', 'ps.research'], concepts: [], difficulty: 4, transfer: true, context: 'science', project: true,
      prompt: text(
        '`readings.json` is a list of sensor readings like `{"sensor": "S1", "value": 12.5}`, all mixed together.',
        'For each sensor, in order of sensor name, print its **median reading** with one decimal, like `S1: 6.0`. (With an even number of readings the median is the mean of the two middle ones.) Then print `Suspicious: N`, where N is the number of individual readings **more than 50% above their own sensor’s median**.',
      ),
      fixtures: { files: { 'readings.json': '[{"sensor": "S2", "value": 10}, {"sensor": "S1", "value": 4}, {"sensor": "S1", "value": 6}, {"sensor": "S1", "value": 20}, {"sensor": "S2", "value": 11}, {"sensor": "S2", "value": 30}]' } },
      starterCode: '',
      hints: [],
      checks: [
        out('The example file', 'S1: 6.0\nS2: 11.0\nSuspicious: 2'),
        out('An even number of readings', 'S: 15.0\nSuspicious: 0', { 'readings.json': '[{"sensor": "S", "value": 10}, {"sensor": "S", "value": 20}]' }, false),
        out('Exactly 50% above is not suspicious', 'Q: 6.0\nSuspicious: 0', { 'readings.json': '[{"sensor": "Q", "value": 4}, {"sensor": "Q", "value": 6}, {"sensor": "Q", "value": 9}]' }, false),
        out('No readings', 'Suspicious: 0', { 'readings.json': '[]' }, false),
        out('Sensors sorted by name, each judged against its own median', 'A1: 100.0\nB2: 2.0\nSuspicious: 1', { 'readings.json': '[{"sensor": "B2", "value": 2}, {"sensor": "A1", "value": 100}, {"sensor": "B2", "value": 2}, {"sensor": "B2", "value": 7}, {"sensor": "A1", "value": 101}, {"sensor": "A1", "value": 99}]' }, false),
      ],
      xpReward: 150, coinReward: 25,
    },
  ],
};
