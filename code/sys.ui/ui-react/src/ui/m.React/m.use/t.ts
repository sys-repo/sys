import type { t } from '../common.ts';

type M = React.MouseEventHandler;

export type UseMouseProps = {
  onDown?: M;
  onUp?: M;
  onEnter?: M;
  onLeave?: M;
  onDrag?: UseMouseDragHandler;
};

export type UseMouseMovement = {
  readonly x: number;
  readonly y: number;
  readonly movement: t.Point;
  readonly client: t.Point;
  readonly page: t.Point;
  readonly offset: t.Point;
  readonly screen: t.Point;
  readonly button: number;
  readonly modifiers: t.KeyboardModifierFlags;
};

/**
 * Events
 */
export type UseMouseDragHandler = (e: UseMouseDragHandlerArgs) => void;
export type UseMouseDragHandlerArgs = UseMouseMovement & { cancel(): void };
