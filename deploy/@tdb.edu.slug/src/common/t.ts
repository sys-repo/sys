/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type * from '@sys/model-slug/t';
export type * from '@sys/model/timecode/playback/t';

export type { MenuResult, MenuResultKind } from '@sys/cli/t';
export type { Crdt } from '@sys/driver-automerge/t';
export type { Graph } from '@sys/immutable/t';
export type { TSchema, ValueError } from '@sys/schema/t';
export type {
  Alias,
  Obj,
  ShardCount,
  ShardIndex,
  ShardStrategy,
  StrBuilder,
  Timecode,
} from '@sys/std/t';
export type { Yaml, YamlConfig } from '@sys/yaml/t';

/** User interface */
export type { Color } from '@sys/color/t';
import type * as TCss from '@sys/ui-css/t';
export type CssEdgesInput = TCss.CssEdges.Input;
export type CssInput = TCss.Style.Input;
export type CssMarginArray = TCss.CssEdges.Margin.Array;
export type CssProps = TCss.Style.Props;
export type CssValue = TCss.Style.Value;
export type { Keyboard } from '@sys/ui-dom/t';
export type {
  ActionProbe,
  BulletList,
  HttpOrigin,
  KeyValue,
  SheetProps,
  TimecodePlaybackDriver,
  TreeHost,
  TreeViewNode,
  TreeViewNodeList,
  VideoDecks,
} from '@sys/ui-components/t';
export type { TimecodeState } from '@sys/ui-state/t';

/** User interface: Testing */
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { DevCtx } from '@sys/ui-dev/react/devharness/t';

/**
 * @local
 */
export type * from '../types.ts';

/** Dev types (harness) */
export type * from '../ui/ui.TreeHost/-spec/-t.ts';
