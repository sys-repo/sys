import type React from 'react';
import type { CommonTheme } from '@sys/types';
import type { Style } from '@sys/ui-css/t';

// Copied into the generated package: runtime imports must remain browser-only.
export { Schedule } from '@sys/std/async';
export { Is } from '@sys/std/is';
export { Json } from '@sys/std/json';
export { Obj } from '@sys/std/obj';
export { Time } from '@sys/std/time';
export { Color, css, Style } from '@sys/ui-css';

export type Palette = CommonTheme;
export type ComponentProps = { theme?: Palette; style?: Style.Input };
export type ProofProps = { UI: React.FC<ComponentProps> };
export type SampleProps = ComponentProps & ProofProps & { children?: React.ReactNode };

// Independent expectation from the named materialization input, not generated output.
export const D = { displayName: '@fixture/ui:XMLPanel' } as const;
