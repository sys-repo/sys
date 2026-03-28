export function specifier(pkg: string, version: string, suffix = ''): string {
  return `npm:${pkg}@${version}${suffix}`;
}
