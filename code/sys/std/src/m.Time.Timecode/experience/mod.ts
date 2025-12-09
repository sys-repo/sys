/**
 * @module
 * Timecode-experience primitives.
 *
 * This layer enriches a resolved `TimecodeComposite` timeline with
 * semantic "beats" — timestamp-aligned payloads such as titles, text,
 * images, or pause markers. It forms a neutral substrate for UI/UX
 * layers to drive overlays, transitions, and interaction models.
 *
 * No assumptions are made about rendering, players, or frameworks.
 */
export { Experience } from './m.Experience.ts';
