import { type DocumentId, isValidAutomergeUrl, Repo } from '@automerge/automerge-repo';
import { type t } from './common.ts';
import { toAutomergeHandle, toRef } from './u.toRef.ts';

const REF = Symbol('ref:automerge:handle');
type O = Record<string, unknown>;

/**
 * Extract the hidden automerge Repo from a [CrdtRepo].
 */
export function toAutomergeRepo(repo: t.CrdtRepo): Repo | undefined {
  return (repo as any)[REF];
}

/**
 * Wrap an Automerge repo in a lightweight functional API.
 */
export function toRepo(repo: Repo = new Repo()): t.CrdtRepo {
  /**
   * API:
   */
  const api: t.CrdtRepo = {
    create<T extends O>(initial: T) {
      const handle = repo.create<T>(initial);
      return toRef(handle);
    },
    async get<T extends O>(id: t.StringId) {
      id = wrangle.id(id);
      try {
        const handle = await repo.find<T>(id as DocumentId);
        await handle.whenReady();
        return toRef(handle);
      } catch (error: any) {
        if (error.message.includes('is unavailable')) return undefined;
        throw error;
      }
    },
  };

  // Hidden reference (automerge).
  Object.defineProperty(api, REF, {
    value: repo,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return api;
}

/**
 * Helpers:
 */
const wrangle = {
  id(input: string) {
    if (typeof input !== 'string') return '';
    input = input.trim();
    return isValidAutomergeUrl(input) ? input.replace(/^automerge\:/, '') : input;
  },
} as const;
