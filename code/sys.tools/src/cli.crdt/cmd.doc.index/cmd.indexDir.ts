import { RepoProcess } from '../cmd.repo.daemon/mod.ts';

import { type t, D } from '../common.ts';
import { Config } from '../u.config.ts';
import { dirsMenu } from './u.menu.dirs.ts';
import {
  applyMenuFilterToDirs,
  getExistingFilter,
  promptExtensionFilter,
  scanDirExtensions,
  toCheckedSet,
} from './u.menu.filter.ts';

export async function indexDir(cwd: t.StringDir, docid: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  /**
   * Configuration file.
   */
  const config = await Config.get(cwd);
  const doc = (config.current.docs ?? []).find((d) => d.id === docid);
  if (!doc) return;

  /**
   * Initial menu selection.
   */
  const picked = await dirsMenu({ config, cwd, docid });
  if (picked.kind === 'exit') return;

  const defaultMount = 'fs:index';
  const { mountKey } = picked;

  /** Existing filter defaults (for checkbox preselect). */
  const existing = getExistingFilter({ doc, mountKey, defaultMount });
  const checked = toCheckedSet(existing.includeExt);
  const exts = await scanDirExtensions(picked.dir); // Candidate extensions from the selected directory.

  /** Prompt filter selection (preselected) → normalized includeExt. */
  const includeExt = await promptExtensionFilter({ exts, checked });

  /**
   * Persist selection to config file.
   */
  config.change((d) => {
    const entry = Config.findDocEntry(d, docid);
    if (!entry) return;

    const indexes = (entry.indexes ??= {});
    const fsdirs = (indexes['fs:dirs'] ??= {});
    const dirs = (fsdirs.dirs ??= []);
    fsdirs.dirs = applyMenuFilterToDirs({ dirs, mountKey, defaultMount, filter: { includeExt } });
  });
  await config.fs.save();

  console.log(`-------------------------------------------`);
  console.info(`
    - dir:    ${picked.dir}
    - kind:   ${picked.kind}
    - subdir: ${picked.subdir}
    - mount:  ${picked.mountKey}
    - filter: ${includeExt.map((e) => `.${e}`).join(' ')}
  `);
}
