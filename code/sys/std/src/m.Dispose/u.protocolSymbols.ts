import { isSymbol } from '../common/u.is.ts';

type DisposalProtocolKey = 'dispose' | 'asyncDispose';

type DisposalProtocolSymbolSource = {
  [key in DisposalProtocolKey]?: symbol;
};

type DefineProperties = (source: object, descriptors: PropertyDescriptorMap) => object;

const KEYS = ['dispose', 'asyncDispose'] as const;
const ERROR = 'ECMAScript disposal protocol symbols are incompatible';

/**
 * Install missing ECMAScript disposal protocol symbols.
 *
 * Existing own symbol-valued properties are authoritative and remain unchanged. Installation
 * rejects incompatible or inherited definitions before mutating the source.
 */
export function installDisposalProtocolSymbols(
  source: DisposalProtocolSymbolSource = Symbol,
  defineProperties: DefineProperties = Object.defineProperties,
): void {
  const descriptors = KEYS.map((key) =>
    [key, Object.getOwnPropertyDescriptor(source, key)] as const
  );
  const missing: DisposalProtocolKey[] = [];

  for (const [key, descriptor] of descriptors) {
    if (!descriptor) {
      if (key in source) throw new TypeError(ERROR);
      missing.push(key);
      continue;
    }
    if (!('value' in descriptor) || !isSymbol(descriptor.value)) throw new TypeError(ERROR);
  }

  if (missing.length === 0) return;
  if (!Object.isExtensible(source)) throw new TypeError(ERROR);

  const additions: PropertyDescriptorMap = {};
  for (const key of missing) {
    additions[key] = {
      configurable: false,
      enumerable: false,
      value: Symbol(`Symbol.${key}`),
      writable: false,
    };
  }
  defineProperties(source, additions);
}
