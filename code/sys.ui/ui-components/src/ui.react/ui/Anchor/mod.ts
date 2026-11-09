/**
 * @module
 * Native HTML links and opt-in resource/opening cues.
 * For `_blank`, Anchor adds `noopener noreferrer`; callers own destination validation.
 */
import type { t } from './common.ts';
import { Anchor as UI } from './ui.tsx';
import { Link } from './ui.Link.tsx';

/**
 * Use UI for native target/download controls; Link adds resource and opening cues.
 */
export const Anchor: t.Anchor.Lib = { UI, Link };

/**
 * Literal alias of Anchor.UI.
 */
export const A = Anchor.UI;
