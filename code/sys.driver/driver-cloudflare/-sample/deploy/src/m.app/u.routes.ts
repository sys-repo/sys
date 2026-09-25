/**
 * Map admitted shell filenames to mount-relative application paths.
 */
export function routesFor(files: readonly string[]): Readonly<Record<string, string>> {
  const routes: Record<string, string> = { '/': 'index.html' };
  for (const file of files) routes[`/${file}`] = file;
  return Object.freeze(routes);
}
