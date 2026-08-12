const trace: string[] = [];
{
  using resource = { [Symbol.dispose]: () => trace.push('worker:dispose') };
  void resource;
}
self.postMessage({ marker: 'module-worker-loaded', trace });
