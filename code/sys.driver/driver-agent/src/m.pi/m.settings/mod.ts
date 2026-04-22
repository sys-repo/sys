/**
 * @module
 * Wrapper-owned Pi settings.
 *
 * This module models and materializes the subset of Pi `settings.json`
 * that `@sys/driver-agent/pi` controls under project-local `.pi/`.
 *
 * Profile YAML remains the human-edited policy surface.
 * Pi settings are derived integration state for the Pi runtime.
 */
import type { t } from './common.ts';
