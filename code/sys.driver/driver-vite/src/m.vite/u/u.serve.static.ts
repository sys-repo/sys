import { type t } from '../common.ts';

type Snapshot = t.ViteServe.Static.Snapshot;

/** Pure static-serve semantics shared by raw and screen presentation. */
export const ServeStatic = {
  displayDir(dir: string) {
    return `${dir.replace(/^\.\//, '').replace(/\/$/, '')}/`;
  },

  warning(snapshot: Snapshot) {
    if (snapshot.kind === 'directory') return;
    return snapshot.kind === 'missing' ? '(does not exist)' : '(not a directory)';
  },

  output(snapshot: Snapshot): Pick<t.ViteScreen.Output.Line, 'source' | 'text'> {
    if (snapshot.kind === 'directory') {
      return {
        source: 'stdout',
        text: snapshot.dist
          ? 'serving build on HTTP server…'
          : 'serving static files on HTTP server…',
      };
    }

    return {
      source: 'stderr',
      text: snapshot.kind === 'missing'
        ? 'static directory does not exist'
        : 'static path is not a directory',
    };
  },
} as const;
