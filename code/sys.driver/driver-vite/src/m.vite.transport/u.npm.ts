export function toViteNpmSpecifier(specifier: string): string {
  const value = specifier.startsWith('npm:') ? specifier.slice(4) : specifier;

  if (value.startsWith('@')) {
    const slash = value.indexOf('/');
    if (slash === -1) return value;
    const at = value.indexOf('@', slash + 1);
    if (at === -1) return value;
    const subpath = value.indexOf('/', at);
    return subpath === -1 ? value.slice(0, at) : value.slice(0, at) + value.slice(subpath);
  }

  const at = value.indexOf('@');
  if (at === -1) return value;
  const slash = value.indexOf('/', at + 1);
  return slash === -1 ? value.slice(0, at) : value.slice(0, at) + value.slice(slash);
}
