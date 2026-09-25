import { type t, D, Is } from './common.ts';

export const Persist = {
  slot(persistKey?: string): string {
    const key = persistKey?.trim();
    if (!key) return D.Persist.key;
    return `${D.Persist.key}:${key}`;
  },

  readVisible<TPersist extends t.JsonMapU>(
    persist: t.ImmutableRef<TPersist> | undefined,
    slot: string,
  ): boolean | undefined {
    if (!persist) return undefined;
    const value = persist.current[slot];
    if (!Is.object(value) || Is.array(value)) return undefined;
    const visible = (value as t.JsonMapU)['resultVisible'];
    return Is.bool(visible) ? visible : undefined;
  },

  writeVisible<TPersist extends t.JsonMapU>(
    persist: t.ImmutableRef<TPersist> | undefined,
    slot: string,
    visible: boolean,
  ) {
    if (!persist) return;
    persist.change((d) => {
      const json = d as unknown as t.JsonMapU;
      const current = json[slot];
      const next: t.JsonMapU =
        Is.object(current) && !Is.array(current) ? { ...(current as t.JsonMapU) } : {};
      next.resultVisible = visible;
      json[slot] = next;
    });
  },
} as const;

