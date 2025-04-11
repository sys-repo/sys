export const Factory = {
  entry: async () => (await import('./ui.Entry/mod.tsx')).factory(),
  trailer: async () => (await import('./ui.Trailer/mod.tsx')).factory(),
  overview: async () => (await import('./ui.Overview/mod.tsx')).factory(),
  programme: async () => (await import('./ui.Programme/mod.tsx')).factory(),
} as const;
