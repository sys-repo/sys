export const Factory = {
  entry: async () => (await import('../ui.Entry/mod.ts')).factory(),
  trailer: async () => (await import('../ui.Trailer/mod.ts')).factory(),
  overview: async () => (await import('../ui.Overview/mod.ts')).factory(),
  programme: async () => (await import('../ui.Programme/mod.ts')).factory(),
} as const;
