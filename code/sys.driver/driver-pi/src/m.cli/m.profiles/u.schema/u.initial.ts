import type { t } from './common.ts';

/** Create the default profile YAML object. */
export function initial(): t.PiCliProfiles.Yaml.Profile {
  return {
    sandbox: {
      capability: { read: [], write: [], env: {} },
      context: { append: [] },
    },
    tools: {
      remove: { enabled: true, recursive: true },
      move: { enabled: true },
      copy: { enabled: true },
      ocr: {
        pdf: {
          enabled: false,
          languages: ['eng'],
          defaultLanguage: 'eng',
          dpi: 200,
          maxPages: 10,
          maxChars: 60_000,
          timeoutMs: 120_000,
        },
      },
    },
  };
}
