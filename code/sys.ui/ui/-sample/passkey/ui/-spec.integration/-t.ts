import type { t } from '../common.ts';

/** Type re-exports. */
export type * from '../../common.t.ts';
export type * from './-SPEC.Debug.tsx';

/** Harness preferences only; no view snapshot or authentication state. */
export type DebugValues = {
  debug: boolean;
  theme: t.CommonTheme;
};
