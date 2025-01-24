import { Jsr } from '@sys/jsr/server';

const { manifest } = await Jsr.Manifest.fetch('@sys/driver-vitepress', '0.0.218');

if (manifest) {
  const dir = '.tmp/sample-pull';
  const res = await manifest.pull(dir);
  console.log('res', res);
}
