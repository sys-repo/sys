import { main as profileMain } from './-entry.exit.profiles.fixture.ts';

export async function main(input: { argv?: readonly string[] } = {}) {
  const result = await profileMain(input);
  if (result.kind === 'gui') throw new Error('Unexpected GUI result at raw fixture boundary.');
  return result;
}

export function run(): Promise<never> {
  return Promise.reject(new Error('fixture run is unavailable'));
}
