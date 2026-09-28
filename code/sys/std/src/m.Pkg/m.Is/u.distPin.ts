import { Is, Obj, type t } from '../common.ts';
import { Content } from '../m/m.Dist.Content.ts';
import { sha256Hash } from './u.ts';

export function distPin(input: unknown): input is t.DistPin {
  try {
    if (!Is.object(input) || Object.getPrototypeOf(input) !== Object.prototype) return false;
    const keys = Reflect.ownKeys(input);
    if (keys.length !== 2 || !keys.includes('scheme') || !keys.includes('digest')) return false;
    const scheme = Object.getOwnPropertyDescriptor(input, 'scheme');
    const digest = Object.getOwnPropertyDescriptor(input, 'digest');
    if (!scheme || !digest || !Obj.hasOwn(scheme, 'value') || !Obj.hasOwn(digest, 'value')) {
      return false;
    }
    return scheme.value === Content.scheme && sha256Hash(digest.value);
  } catch {
    return false;
  }
}
