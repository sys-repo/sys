/**
 * @external
 */
export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { ExtractSignalValue, Signal } from '@sys/std/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

/**
 * CRDT:
 */
export type { CrdtEvents, CrdtRef, CrdtRepo, DocumentIdProps } from '@sys/driver-automerge/t';

/**
 * PeerJS (WebRTC):
 */
import type { MediaConnection as _MediaConnection, Peer as _Peer } from 'peerjs';
export namespace PeerJS {
  export type Peer = _Peer;
  export type MediaConnection = _MediaConnection;
}

/**
 * @local
 */
export type * from '../types.ts';
