/**
 * @module
 * A compact editorial aside. In technical publishing, the
 * [O’Reilly Style Guide](https://oreillymedia.github.io/production-resources/styleguide/#headings)
 * calls notes, tips, and warnings *admonitions* and treats their titles as optional.
 */
import type { t } from './common.ts';
import { Admonition as UI } from './ui.tsx';

export const Admonition: t.Admonition.Lib = Object.freeze({ UI });
