/**
 * @module
 * Catalog entry-point.
 *
 * Public exports of schemas, registrations, and plan.
 * Consumers can import from here for testing/inference/validation.
 */
export * from './def/mod.ts';

/**
 * Factory libs:
 */
export { Factory } from '@sys/ui-factory/core';
export { useFactory } from '@sys/ui-factory/adapter/react';
export { ValidationErrors } from '@sys/ui-factory/components/react';
