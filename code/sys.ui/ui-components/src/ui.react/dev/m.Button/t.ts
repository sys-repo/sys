import type { t } from '../common.ts';

/**
 * Button props and style target the inner Button; the frame owns row spacing and line-height.
 * Dev.Button's default margin/padding extend the Button's left edge 2px without moving its label;
 * supplied margin/padding replace those defaults. The frame reserves non-clickable outline clearance.
 * Allow 6px left and 4px right overhang inside the host panel; larger custom outlines need their
 * own clearance. Font size is inherited.
 */
export type Props = t.Button.Props;
