import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

import { Env } from '@sys/fs/env';
import { Slug } from '@sys/tools/staging/prog';
import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, Rx, c, Cli, Crdt, D, Is, Schedule, Str } from '../common.ts';
import { Fmt as BaseFmt } from '../u.fmt.ts';

type O = Record<string, unknown>;
const env = await Env.load();

const Fmt = {
  ...BaseFmt,
  headerTable(docid?: t.StringId) {
    const short = docid ? Str.ellipsize(docid, [4, 8], '..') : '-';
    const table = Cli.table();
    const kv = (k: string, value: t.Json = '') => table.push([c.gray(k), String(value)]);
    kv('document', Fmt.prettyUri(short ?? '-'));

    const str = Str.builder()
      .blank()
      .line(Str.trimEdgeNewlines(String(table)));
    return String(str);
  },
} as const;

export async function tmp(cwd: t.StringDir, docid: t.Crdt.Id, yamlPath: t.ObjectPath) {
  const port = D.port.repo;
  const life = Rx.lifecycle();

  /**
   * CRDT Commands (Network)
   */
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;
  life.dispose$.subscribe(() => cmd?.dispose());

  console.info(Fmt.headerTable(docid));
  console.info('cmd', cmd);
  console.info();

  /**
   * Document Graph (DAG)
   */
  const spinner = Cli.spinner(Fmt.spinnerText('walking graph...'));
  const dag = await buildDocumentDAG(cmd, docid, yamlPath);
  spinner.stop();
}
