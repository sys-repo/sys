import { type t } from '../common.ts';

export function processEvent(source: t.Process.StdStream, text: string): t.Process.Event {
  return {
    source,
    data: new TextEncoder().encode(text),
    toString: () => text,
  };
}

export function paths(): t.ViteConfig.Paths {
  return {
    cwd: '/tmp/pkg',
    app: {
      entry: 'src/index.html',
      outDir: 'dist',
      base: './',
    },
  };
}

export function pkg(): t.Pkg {
  return {
    name: '@sys/example',
    version: '0.0.0',
  };
}
