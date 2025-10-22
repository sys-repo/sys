/**
 * @external
 */
export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { MediaVideoStreamReadyHandler } from '@sys/ui-react-components/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';
export type { PointerEventsHandler } from '@sys/ui-react/t';
export type { YamlSyncParser } from '@sys/yaml/t';

/**
 * CRDT:
 */
export type { Crdt, DocumentIdProps } from '@sys/driver-automerge/t';
export type { Monaco } from '@sys/driver-monaco/t';

/**
 * PeerJS (WebRTC):
 */
export namespace PeerJS {
  export type Peer = import('peerjs').Peer;
  export type MediaConnection = import('peerjs').MediaConnection;
}

/**
 * @local
 */
export type * from '../types.ts';
