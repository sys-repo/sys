/**
 * Helpers for working with the "crdt:<id>" URI format.
 */
export const CrdtUri = {
  hasPrefix(input: string = '') {
    return input.startsWith('crdt:');
  },

  trimPrefix(input: string = '') {
    return input.trim().replace(/^crdt\:/, '');
  },

  ensurePrefix(input: string = '') {
    return `crdt:${CrdtUri.trimPrefix(input)}`;
  },
};
