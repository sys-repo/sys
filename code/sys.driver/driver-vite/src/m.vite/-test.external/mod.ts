/**
 * External release-smoke lane for `driver-vite`.
 *
 * These checks validate published JSR package behavior from outside the local
 * `/sys` workspace and should be run only after the pinned release is visible
 * to remote resolution.
 */
import './-baseline.ts';
