/**
 * @module
 * Native navigation and inline buttons with a shared link appearance.
 */
import type { t } from './common.ts';
import { Anchor as UI } from './ui.tsx';
import { Button } from './ui.Button.tsx';
import { Link } from './ui.Link.tsx';

/**
 * `UI` exposes native anchor options. `Link` adds resource and opening cues.
 * `Button` performs an in-place action without submitting a form.
 * For `_blank`, anchors add `noopener noreferrer`; callers own destination validation.
 */
export const Anchor: t.Anchor.Lib = { UI, Link, Button };

/**
 * Literal alias of Anchor.UI.
 */
export const A = Anchor.UI;
