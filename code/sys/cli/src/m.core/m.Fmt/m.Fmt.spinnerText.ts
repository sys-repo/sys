import { c } from '../common.ts';
import type { t } from '../common.ts';

export const spinnerText: t.CliFormatLib['spinnerText'] = (text) => c.gray(c.italic(text));
