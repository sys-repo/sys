import { Is, Obj, type t } from '../common.ts';
import { PkgIs } from './m.Is.ts';

type Data = Readonly<Record<string, unknown>>;

/**
 * Validate and freeze named distribution pins.
 */
export const Pins: t.Pkg.Dist.Pins.Lib = Object.freeze({ capture });

function capture(input: unknown): t.DistPins;
function capture<const N extends string>(
  input: unknown,
  requirements: t.Pkg.Dist.Pins.Requirements<N>,
): t.DistPins<N>;
function capture(input: unknown, requirements?: unknown): t.DistPins {
  try {
    const value = data(input);
    exact(value, ['pins']);
    const rawPins = data(value.pins);
    const names = Object.keys(rawPins);
    if (names.length === 0) throw invalid();
    const pins: Record<string, t.DistPin> = Object.fromEntries(names.map((name) => {
      // Validate the copy, not the caller's object.
      const pin = data(rawPins[name]);
      if (!PkgIs.distPin(pin)) throw invalid();
      return [name, Object.freeze({ 'dist.json': pin['dist.json'] })] as const;
    }));
    if (requirements !== undefined) {
      const required = data(requirements);
      exact(required, ['names']);
      const expected = data(required.names);
      const expectedNames = Object.keys(expected);
      if (expectedNames.length === 0 || expectedNames.some((name) => expected[name] !== true)) {
        throw invalid();
      }
      exact(pins, expectedNames);
    }
    return Object.freeze({ pins: Object.freeze(pins) });
  } catch {
    throw invalid();
  }
}

/**
 * Helpers:
 */
function data(input: unknown): Data {
  if (!Is.object(input) || Object.getPrototypeOf(input) !== Object.prototype) throw invalid();
  const entries = Reflect.ownKeys(input).map((key) => {
    if (!Is.str(key) || !key) throw invalid();
    const property = Object.getOwnPropertyDescriptor(input, key);
    if (!property || !Obj.hasOwn(property, 'value')) throw invalid();
    return [key, property.value] as const;
  });
  return Object.freeze(Object.fromEntries(entries));
}

function exact(input: Data, keys: readonly string[]): void {
  if (Object.keys(input).length !== keys.length || keys.some((key) => !Obj.hasOwn(input, key))) {
    throw invalid();
  }
}

function invalid(): TypeError {
  return new TypeError('Invalid Dist pins.');
}
