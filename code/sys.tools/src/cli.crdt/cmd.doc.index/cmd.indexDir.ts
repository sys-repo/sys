import { RepoProcess } from '../cmd.repo.daemon/mod.ts';

import { type t, c, D, Cli } from '../common.ts';
import { Config } from '../u.config.ts';
import { dirsMenu } from './u.menu.dirs.ts';
import { buildFsIndexSnapshot } from './u.fs.index.build.ts';
import {
  applyMenuFilterToDirs,
  getExistingFilter,
  promptExtensionFilter,
  scanDirExtensions,
  toCheckedSet,
} from './u.menu.filter.ts';
import { Fmt } from './u.fmt.ts';

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
  const exts = await scanDirExtensions(picked.dir);

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

  /**
   * Read the filesystem and compile the snapshot.
   */
  let snapshot = await buildFsIndexSnapshot({
    dir: picked.dir,
    subdir: picked.subdir,
    filter: { includeExt },
  });

  /**
   * Prepare write payload (dirs omitted from `entries`, but retained in meta counts).
   */
  snapshot = snapshotFilesOnly(snapshot);
  const mountPath = mountKeyToPath(picked.mountKey);

  /**
   * Write to CRDT.
   */
  console.info(Fmt.Index.snapshotTable(snapshot, picked.mountKey));
  const yes = await Cli.Input.Confirm.prompt({ message: 'Write to crdt' });
  if (yes) {
    const value = snapshotFilesOnly(snapshot);
    const res = await cmd.send('doc:write', { doc: docid, path: mountPath, value });
    if (!res.ok) console.info(c.yellow('Failed to write to CRDT'));
  }
}

/**
 * Convert canonical mountKey ("a/b/c") into an ObjectPath.
 * Notes:
 * - We do not split on ':'; ':' is part of a segment.
 * - Empty segments are dropped defensively.
 */
function mountKeyToPath(mountKey: string): t.ObjectPath {
  return mountKey.split('/').filter((s) => s.length > 0);
}

/**
 * Rule: do not write directory entries into the CRDT index payload.
 * Keep dir information only in meta.counts.
 */
function snapshotFilesOnly(snapshot: t.CrdtIndex.Fs.Snapshot): t.CrdtIndex.Fs.Snapshot {
  const entries: Record<string, t.CrdtIndex.Fs.FsIndexEntry> = {};
  for (const [k, v] of Object.entries(snapshot.entries)) {
    if (v.kind === 'file') entries[k] = v;
  }
  return { ...snapshot, entries };
}
