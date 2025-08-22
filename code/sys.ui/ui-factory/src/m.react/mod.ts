/**
 * @module @sys/ui-factory/react
 * Host adapters: React
 *
 * Bridges the framework-agnostic UI-factory core into React's runtime:
 * - Wraps each resolved plan node into a `React.ComponentType`.
 * - Specializes registrations and factories with `ReactModule`.
 * - Provides the `HostAdapter` contract for React element trees.
 */
import type { t } from './common.ts';
