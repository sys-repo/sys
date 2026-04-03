export function pkgName(input: string) {
  return /^@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(input);
}
