import { D, Fs, pkg, Pkg, type t, Time } from './common.ts';
import { ensureRepo } from './u.repo.ts';

/**
 * Retrieve the index doc.
 */
export async function getIndexJson(cwd: t.StringDir) {
  const repo = await ensureRepo(cwd);
  const path = Fs.join(cwd, D.Path.index);
  await Fs.ensureDir(Fs.dirname(path));

  if (!(await Fs.exists(path))) {
    const doc = repo.create({});
    const json: t.CrdtIndexJson = {
      kind: 'crdt:index',
      docid: doc.id,
      created: { by: Pkg.toString(pkg), at: Time.now.timestamp },
    };
    await Fs.writeJson(path, json);
  }

  const json = (await Fs.readJson<t.CrdtIndexJson>(path)).data;
  if (!json) throw new Error(`Failed to load index.json from path: ${path}`);

  const doc = (await repo.get<t.CrdtIndexDoc>(json.docid)).doc;
  if (!doc) throw new Error(`Failed to retrieve index document: ${json.docid}`);

  return { path, json, doc, repo } as const;
}
