import { type t, Time, D, Immutable, Fs } from './common.ts';

type D = t.CrdtConfigDoc;
const singleton = new Map<t.StringDir, t.CrdtConfig>();

export const ConfigFile = {
  async getOrCreate(dir: t.StringDir) {
    if (singleton.has(dir)) return singleton.get(dir)!;
    // await Fs.ensureDir(dir);

    const initial: D = { '.meta': { createdAt: Time.now.timestamp } };
    const config = Immutable.clonerRef<D>(initial);

    singleton.set(dir, config);
    return config;
  },
};
