import { Fs } from '@sys/fs';

const PATH = {
  from: '/Users/phil/code/samples/vitepress-slc/docs/.vitepress/dist',
  to: Fs.resolve('./dist.docs'),
};

const res = await Fs.copy(PATH.from, PATH.to, { force: true });
// console.log('res', res);
