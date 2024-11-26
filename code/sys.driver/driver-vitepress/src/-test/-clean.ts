import { Fs } from '@sys/std-s';
const remove = (path: string) => Fs.remove(Fs.resolve(path), { log: true });

export const cleanTestFolder = async () => {
  await remove('./src/-test/vitepress.sample-1/.vitepress');
  await remove('./.vitepress');
};

export default cleanTestFolder;
