/**
 * External smoke lane for `driver-vite`.
 *
 * These checks validate published package behavior from outside the local
 * `/sys` workspace. Keep scenarios here explicit and additive.
 *
 * Next candidate:
 * - `-repo-generated.ts` for `tmpl.repo → tmpl:project → foo build`
 */
import './-baseline.ts';
import './-ui-baseline.ts';
import './-ui-components.ts';

// import './-repo-generated.ts';
