export function specifier(pkg: string, version: string, suffix = ''): string {
  return `jsr:${pkg}@${version}${suffix}`;
}
