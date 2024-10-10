/**
 * A response value from a function that is not used by the function
 * (allows for artibrary return values signalling to the consumer
 * that whatever is returned will not be used.)
 */
export type IgnoredResponse = any | Promise<any>;

/**
 * Direction a list is sorted in
 * - asc:  ascending ↑,
 * - desc: descending ↓
 */
export type SortOrder = 'asc' | 'desc';
