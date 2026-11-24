/** Stable harness addresses; the pure view is addressable but not listed in the main menu. */
const sample = 'sys.ui: -sample/passkey';
export const SpecNames = { sample, view: `${sample}/view` } as const;

/** Normal query links preserve the host/path and replace any dev alias. */
const href = (dev: string) => `?${new URLSearchParams({ dev })}`;
export const SpecLinks = {
  sample: { label: 'view:integration (sample)', href: href(SpecNames.sample) },
  view: { label: 'view:pure', href: href(SpecNames.view) },
} as const;
