import { RepoProcess } from '../cmd.repo.daemon/mod.ts';

import { type t, c, D, Cli } from '../common.ts';
import { Config } from '../u.config.ts';
import { dirsMenu } from './u.menu.dirs.ts';
import { buildFsIndexSnapshot } from './u.fs.index.build.ts';
import {
  applyMenuFilterToDirs,
  getExistingFilter,
  promptExtensionFilter,
  scanDirExtensionCounts,
  toCheckedSet,
} from './u.menu.filter.ts';
import { Fmt } from './u.fmt.ts';

export async function runDirectoryIndexer(cwd: t.StringDir, docid: t.Crdt.Id) {
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
  let checked = toCheckedSet(existing.includeExt);

  type Action = 'write:crdt' | 'index:rerun' | 'exit';

  while (true) {
    /**
     * Scan directory → extension counts.
     */
    let counts: Awaited<ReturnType<typeof scanDirExtensionCounts>>;
    {
      const spinner = Cli.spinner();
      spinner.start(Fmt.spinnerText('Scanning file types'));
      try {
        counts = await scanDirExtensionCounts(picked.dir);
        spinner.succeed();
      } catch (err) {
        spinner.fail();
        throw err;
      }
    }

    /**
     * Prompt filter selection (preselected) → normalized includeExt.
     * (No spinner during prompts.)
     */
    const includeExt = await promptExtensionFilter({ counts, checked });
    checked = toCheckedSet(includeExt);

    /**
     * Persist selection to config file.
     */
    config.change((d) => {
      const entry = Config.findDocEntry(d, docid);
      if (!entry) return;

      const indexes = (entry.indexes ??= {});
      const fsdirs = (indexes['fs:dirs'] ??= {});
      const dirs = (fsdirs.dirs ??= []);
      fsdirs.dirs = applyMenuFilterToDirs({
        dirs,
        mountKey,
        defaultMount,
        filter: { includeExt },
      });
    });
    await config.fs.save();

    /**
     * Build filesystem snapshot.
     */
    let snapshot: t.CrdtIndex.Fs.Snapshot;
    {
      const spinner = Cli.spinner();
      spinner.start(Fmt.spinnerText('Building filesystem index'));
      try {
        snapshot = await buildFsIndexSnapshot({
          dir: picked.dir,
          subdir: picked.subdir,
          filter: { includeExt },
        });
        spinner.succeed();
      } catch (err) {
        spinner.fail();
        throw err;
      }
    }

    /**
     * Prepare write payload (dirs omitted from `entries`, but retained in meta counts).
     */
    snapshot = snapshotFilesOnly(snapshot);

    /**
     * Next action.
     */
    const mountPath = mountKeyToPath(mountKey);
    console.info(Fmt.Index.snapshotTable(snapshot, mountKey));

    const crdtTarget = c.gray(`${c.green(docid.slice(-5))}/${mountPath}`);
    const action = await Cli.Input.Select.prompt<Action>({
      message: 'Action',
      options: [
        { name: `Write to → crdt:${crdtTarget}`, value: 'write:crdt' },
        { name: 'Change file types & re-scan', value: 'index:rerun' },
        { name: c.gray('(exit)'), value: 'exit' },
      ],
      default: 'write:crdt',
      hideDefault: true,
    });

    if (action === 'exit') return;

    if (action === 'index:rerun') {
      continue;
    }

    /**
     * Write to CRDT.
     */
    const value = snapshot;
    const payload = { doc: docid, path: mountPath, value };
    const res = await cmd.send('doc:write', payload);

    if (!res.ok) {
      console.info(c.yellow('Failed to write to CRDT'));
    } else {
      console.info(c.gray(`✔ written to ${Fmt.prettyUri(docid)}/${mountPath}`));
    }
    return;
  }
}

/**
 * Internal: helpers.
 */

function mountKeyToPath(mountKey: string): t.ObjectPath {
  return mountKey.split('/').filter((s) => s.length > 0);
}

function snapshotFilesOnly(snapshot: t.CrdtIndex.Fs.Snapshot): t.CrdtIndex.Fs.Snapshot {
  const entries: Record<string, t.CrdtIndex.Fs.FsIndexEntry> = {};
  for (const [k, v] of Object.entries(snapshot.entries)) {
    if (v.kind === 'file') entries[k] = v;
  }
  return { ...snapshot, entries };
}
