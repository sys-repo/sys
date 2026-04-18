export function pkgName(input: string) {
  const part = '[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?';
  const pattern = new RegExp(`^(?:@${part}\\/)?${part}$`);
  return pattern.test(input);
}
