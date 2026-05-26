import { Is, type t } from './common.ts';

type OverrideNode = string | t.PkgNodeOverrides;

/** Helpers for deps.yaml package.json resolver policy. */
export const PackageJsonPolicy = {
  hasOwn(input: unknown, key: string): boolean {
    return Is.object(input) && Object.prototype.hasOwnProperty.call(input, key);
  },

  hasOverridesItem(input: unknown): boolean {
    return PackageJsonPolicy.hasOwn(input, 'overrides');
  },

  toPolicy(overrides: t.PkgNodeOverrides): t.EsmDeps.PackageJsonPolicy | undefined {
    if (Object.keys(overrides).length === 0) return;
    return { overrides: PackageJsonPolicy.cloneOverrides(overrides) };
  },

  parseOverridesItem(
    item: t.EsmDeps.YamlEntry,
    index: number,
  ): { overrides?: t.PkgNodeOverrides; error?: string } {
    const mixedKeys = ['import', 'group', 'subpaths', 'name', 'dev'].filter((key) =>
      PackageJsonPolicy.hasOwn(item, key)
    );
    if (mixedKeys.length > 0) {
      return {
        error: `Invalid deps.yaml: package.json[${index}] mixes overrides with ${
          mixedKeys.join(', ')
        }`,
      };
    }

    const parsed = PackageJsonPolicy.parseOverrideObject(item.overrides, [
      `package.json[${index}].overrides`,
    ]);
    if (parsed.error) return { error: parsed.error };
    return { overrides: parsed.value };
  },

  parseOverrideObject(
    input: unknown,
    path: string[],
  ): { value?: t.PkgNodeOverrides; error?: string } {
    if (!isOverrideObject(input)) {
      return { error: `Invalid deps.yaml: ${pathText(path)} must be a non-empty object` };
    }

    const keys = Object.keys(input);
    if (keys.length === 0) {
      return { error: `Invalid deps.yaml: ${pathText(path)} must be a non-empty object` };
    }

    const output: t.PkgNodeOverrides = {};
    for (const key of keys.toSorted((a, b) => a.localeCompare(b))) {
      if (!key.trim()) {
        return { error: `Invalid deps.yaml: ${pathText(path)} contains an empty override key` };
      }

      const value = input[key];
      if (Is.str(value)) {
        if (!value.trim()) {
          return {
            error: `Invalid deps.yaml: ${pathText([...path, key])} must be a non-empty string`,
          };
        }
        output[key] = value;
      } else {
        const parsed = PackageJsonPolicy.parseOverrideObject(value, [...path, key]);
        if (parsed.error) return { error: parsed.error };
        output[key] = parsed.value!;
      }
    }

    return { value: output };
  },

  mergeOverrides(
    target: t.PkgNodeOverrides,
    source: t.PkgNodeOverrides,
    reject: (err: string) => void,
    path: string[] = [],
  ) {
    Object.keys(source)
      .toSorted((a, b) => a.localeCompare(b))
      .forEach((key) => {
        const nextPath = [...path, key];
        const existing = target[key];
        const incoming = source[key];

        if (existing === undefined) {
          target[key] = PackageJsonPolicy.cloneOverrideNode(incoming);
          return;
        }

        if (isOverrideBranch(existing) && isOverrideBranch(incoming)) {
          PackageJsonPolicy.mergeOverrides(existing, incoming, reject, nextPath);
          return;
        }

        reject(`Invalid deps.yaml: duplicate package override path ${pathText(nextPath)}`);
      });
  },

  cloneOverrides(input: t.PkgNodeOverrides): t.PkgNodeOverrides {
    const output: t.PkgNodeOverrides = {};
    Object.keys(input)
      .toSorted((a, b) => a.localeCompare(b))
      .forEach((key) => (output[key] = PackageJsonPolicy.cloneOverrideNode(input[key])));
    return output;
  },

  cloneOverrideNode(input: OverrideNode): OverrideNode {
    return Is.str(input) ? input : PackageJsonPolicy.cloneOverrides(input);
  },
} as const;

/**
 * Helpers:
 */
function isOverrideObject(input: unknown): input is Record<string, unknown> {
  return Is.object(input) && !Array.isArray(input) && Object.keys(input).length > 0;
}

function isOverrideBranch(input: OverrideNode): input is t.PkgNodeOverrides {
  return !Is.str(input);
}

function pathText(path: string[]): string {
  return path.join('.');
}
