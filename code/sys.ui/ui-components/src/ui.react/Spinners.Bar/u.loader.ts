export async function loadBarLoader() {
  const loader = await import('npm:react-spinners@0.17.0/BarLoader.js');
  return loader.default?.default ?? loader.default;
}
