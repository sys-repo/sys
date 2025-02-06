export * from '../common.ts';

type D = { [key: string]: string };
type O = Record<string, unknown>;

export function sortKeys(obj: D) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {} as D);
}
