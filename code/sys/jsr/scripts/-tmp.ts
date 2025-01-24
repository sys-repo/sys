import { Jsr } from '@sys/jsr/server';

const pull = async (name: string, version: string) => {
  const { manifest } = await Jsr.Manifest.fetch(name, version);
  if (manifest) {
    const dir = '.tmp/sample-pull';
    const res = await manifest.pull(dir);
    console.info('res:', res);
  }
};

await pull('@sys/driver-vitepress', '0.0.25');
await pull('@sys/std', '0.0.42');
