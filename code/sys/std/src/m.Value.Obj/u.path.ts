import { R } from '../common.ts';

/**
 * Builds an object from the given path
 * (shallow or a period seperated deep path).
 */
export function build<T>(
  keyPath: string,
  root: { [key: string]: any },
  value?: any, // Optional.  Value to set, defaults to {}.
) {
  const parts = prepareKeyPath(keyPath);
  const result = { ...root };
  let current = result;
  let path = '';

  parts.forEach((key, i) => {
    const isLast = i === parts.length - 1;
    const hasValue = isLast && value !== undefined;
    if (hasValue) {
      current[key] = value;
    } else {
      path = path ? `${path}.${key}` : key;
      const level = current[key] !== undefined ? current[key] : {};
      if (!R.is(Object, level)) {
        throw new Error(
          `Cannot build object '${keyPath}' as it will overwrite value '${level}' at '${path}'.`,
        );
      }
      current[key] = { ...level };
      current = current[key];
    }
  });

  return result as T;
}

/**
 * Walks the given (period seperated) key-path to retrieve a value.
 */
export function pluck<T>(keyPath: string, root: { [key: string]: any }) {
  const parts = prepareKeyPath(keyPath);

  let current = root;
  let result: any;
  let index = -1;

  for (const key of parts) {
    if (!current) break;
    index++;
    const isLast = index === parts.length - 1;
    if (isLast) {
      result = current[key];
    } else {
      current = current[key];
    }
  }

  return result as T;
}

/**
 * Remove values from the given object.
 */
export function remove(
  keyPath: string,
  root: { [key: string]: any },
  options: { type?: 'LEAF' | 'PRUNE' } = {},
) {
  type KeyMap = { [key: string]: any };
  const { type = 'LEAF' } = options;
  const isEmptyObject = (value: any) => R.equals(value, {});
  const isWildcard = (value: any) => value === '*';

  const process = (parts: string[], obj: KeyMap, parent?: { key: string; obj: KeyMap }) => {
    const key = parts[0];
    const nextKey = parts[1];

    // Process rest of path (bottom up)
    if (isWildcard(nextKey) || (parts.length > 1 && R.is(Object, obj[key]))) {
      process(parts.slice(1), obj[key], { key, obj }); // <== RECURSION.
    }

    const isDeepest = parts.length === 1;
    const value = obj && obj[key];
    const isEmpty = isEmptyObject(value);

    if (isWildcard(key) && !isDeepest) {
      // NB: This may be changed in future for operations at a higher level in the path (?) .
      throw new Error(`Wild card can only be used at end of path (error: '${keyPath}')`);
    }

    let shouldDelete = false;
    if (isEmpty && type === 'PRUNE') {
      shouldDelete = true;
    }
    if (isDeepest && isWildcard(key)) {
      shouldDelete = true;
    }
    if (isDeepest && !R.is(Object, value)) {
      shouldDelete = true;
    }

    if (shouldDelete) {
      if (parent) {
        parent.obj[parent.key] = { ...parent.obj[parent.key] };
        if (isWildcard(key)) {
          // Wildcard - delete all children.
          switch (type) {
            case 'LEAF':
              parent.obj[parent.key] = {};
              break;
            case 'PRUNE':
              delete parent.obj[parent.key];
              break;
            default:
              throw new Error(`Type '${type}' not supported.`);
          }
        } else {
          // Deleted the specified child at the key-path.
          delete parent.obj[parent.key][key];
        }
      } else {
        delete obj[key];
      }
    }

    return obj;
  };

  const parts = prepareKeyPath(keyPath);
  return parts.length === 1 && parts[0] === '*'
    ? {} // NB: A root wildcard was passed ("*"), this can only mean an empty object.
    : process(parts, { ...root });
}

/**
 * Prunes values on the given period seperated key-path from an object.
 */
export function prune(keyPath: string, root: { [key: string]: any }) {
  return remove(keyPath, root, { type: 'PRUNE' });
}

/**
 * Helpers
 */
function prepareKeyPath(keyPath: string) {
  keyPath = keyPath.trim();
  if (keyPath.startsWith('.') || keyPath.endsWith('.')) {
    throw new Error(`The keyPath cannot start or end with a period (.): "${keyPath}"`);
  }
  const list = keyPath.replace(/\s/g, '').split('.');
  return list.filter(Boolean);
}
