/**
 * @module YAML → Schema pipeline utilities.
 *
 * Provides a staged pipeline:
 * - Parse YAML text into AST or plain values.
 * - Extract candidate `slug` objects.
 * - Validate against schemas.
 * - Map structural errors onto AST ranges (for editor hints).
 */
import type { t } from './common.ts';
