import { Lens } from '../Doc.Lens/mod.ts';
import { Namespace } from '../Doc.Namespace/mod.ts';
import { Text } from '../Doc.Text/mod.ts';

import { DocMeta as Meta } from './Doc.Meta.ts';
import { DocPatch as Patch } from './Doc.Patch.ts';
import { toBinary } from './Doc.u.binary.ts';
import { del } from './Doc.u.delete.ts';
import { ephemeral } from './Doc.u.ephemeral.ts';
import { get } from './Doc.u.get.ts';
import { getOrCreate } from './Doc.u.getOrCreate.ts';
import { heads, history } from './Doc.u.history.ts';
import { map } from './Doc.u.map.ts';
import { merge } from './Doc.u.merge.ts';
import { Tag } from './Doc.u.tag.ts';

import { type t, Data, Is, DocUri as Uri, toObject } from './common.ts';
import { Mutate, toHandle } from './u.ts';

export const Doc = {
  Is,
  Uri,
  Meta,
  Data,
  Patch,
  Tag,
  Text,

  Lens,
  lens: Lens.create,
  Namespace,
  ns: Namespace.create,

  get,
  getOrCreate,
  delete: del,

  toObject,
  merge,
  map,
  ensure: Mutate.ensure,

  ephemeral,
  history,
  heads,
  toHandle,
  toBinary,
} as const;
