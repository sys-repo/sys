import { Crdt } from '../../-exports/-fs/mod.ts';

const dir = '.tmp/-test.worker';
const repo = await Crdt.repo({
  dir,
  // network: [{ ws: 'waiheke.sync.db.team' }],
}).whenReady();

// const doc = (await repo.get('CwBR7J4McLYoX5C5wpZgvn2Aztv')).doc;
// console.log('doc.current', doc?.current);

// Send initial snapshot once ready:
postMessage({ kind: 'ready', repo: { id: repo.id, stores: repo.stores } } as const);
