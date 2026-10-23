import { afterAll, afterEach, beforeAll, beforeEach, describe, it } from './mod.ts';

const order: string[] = [];
const expected = [
  'global:beforeAll',
  'global:beforeEach',
  'global:test',
  'global:afterEach',
  'global:afterAll',
];

beforeAll(() => {
  order.push('global:beforeAll');
});
beforeEach(() => {
  order.push('global:beforeEach');
});
afterEach(() => {
  order.push('global:afterEach');
});
afterAll(() => {
  order.push('global:afterAll');
  if (order.join('\n') !== expected.join('\n')) {
    throw new Error(`Unexpected global hook order:\n${order.join('\n')}`);
  }
});

describe('BDD top-level hooks', () => {
  it('wrap tests through the historical global suite', () => {
    order.push('global:test');
  });
});

Deno.test('BDD native bootstrap → proves global-hook execution', () => {
  if (order.join('\n') !== expected.join('\n')) {
    throw new Error(`Global hook contract did not execute:\n${order.join('\n')}`);
  }
});
