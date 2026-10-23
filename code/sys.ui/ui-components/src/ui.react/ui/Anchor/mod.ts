/**
 * @module
 * Canonical UI primitive for rendering secure-by-default HTML anchor (`<a>`) links.
 */
import type { t } from './common.ts';
import { Anchor as UI } from './ui.tsx';

/** Canonical UI primitive for rendering secure-by-default HTML anchor (`<a>`) links. */
export const Anchor: t.Anchor.Lib = { UI };

/** Canonical UI primitive for rendering secure-by-default HTML anchor (`<a>`) links. */
export const A = Anchor.UI;
