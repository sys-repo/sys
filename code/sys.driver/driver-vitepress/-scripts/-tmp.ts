import { VitePress } from '../src/mod.ts';

const inDir = './.tmp/sample';
// await VitePress.init({ inDir, force: true });

const res = await VitePress.Env.update({ inDir });

console.log('res', res);
res.ops.forEach((op) => {
  // console.log("op", op.)
});

const op = res.ops.find((op) => op.file.source.name === '.gitignore');

// console.log('op', op);

if (op) {
  if (op.file.target.name === '.gitignore') {
    const isDiff = op.text.target.isDiff;
    console.log('isDiff', isDiff, op.file.target.name);
    console.log('op.file', op.file);
    console.log('op.', op.text);
    console.log('op.text.isDiff', op.text.isDiff);
    console.log('op.text.target.isDiff', op.text.target.isDiff);
  }
}
