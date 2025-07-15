import { type t, Obj, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

const curry = Obj.Path.curry;

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/ui';
export { Media } from '@sys/ui-react-components';
export { Avatar } from '../ui.Avatar/mod.ts';

/**
 * Constants:
 */
const name = 'Sample';
export const DEFAULTS = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const D = DEFAULTS;

export const P = {
  DEV: {
    base: curry(['dev']),
    mode: curry<boolean>(['dev', 'mode']),
    view: curry<t.SampleView>(['dev', 'view']),
    files: curry(['dev', 'files']),
    filesRef: curry<t.StringId>(['dev', 'files.ref']),
    notesRef: curry<t.StringId>(['dev', 'notes.ref']),
  },
  ROOM: {
    connections: {
      '-root': curry<{}>(['connections']),
      ts: curry<t.UnixTimestamp>(['connections', 'ts']),
      group: curry<t.WebRtc.PeerId[]>(['connections', 'group']),
      dyads: curry<t.WebRtc.PeerDyad[]>(['connections', 'dyads']),
    },
  },
};

const ALL_VIEWS: t.SampleView[] = ['Room', 'Notes', 'FileShare', 'Debug'];
export const VIEWS = {
  ALL: ALL_VIEWS,
};
