import { Value } from '../common.ts';
import { Link } from './Helpers.Link.tsx';
import { Theme } from './Helpers.Theme.tsx';

/**
 * Simple helpers useful when workling with the [DevTools].
 */
export const Helpers = {
  Link,
  Theme,
  toggle: Value.toggle,
} as const;
