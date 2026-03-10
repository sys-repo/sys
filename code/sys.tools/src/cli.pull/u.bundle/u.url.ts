import { Is, Url } from '../common.ts';

export function toDistUrl(input?: string): URL | undefined {
  const parsed = Url.parse(wrangle.normalizeInput(input));
  if (!parsed.ok) return undefined;

  const url = parsed.toURL();
  let p = url.pathname;

  if (p.endsWith('/dist.json')) {
    // already correct
  } else if (p.endsWith('/')) {
    p = p + 'dist.json';
  } else {
    p = p + '/dist.json';
  }

  url.pathname = p;
  return url;
}

const wrangle = {
  normalizeInput(input?: string): string | undefined {
    if (!Is.string(input)) return undefined;
    const text = input.trim();
    if (!text) return undefined;

    const parsed = Url.parse(text);
    if (parsed.ok) return text;

    const local = wrangle.localHost(text);
    if (local) return `http://${text}`;

    if (wrangle.domainHost(text)) return `https://${text}`;
    return undefined;
  },

  localHost(input: string) {
    return /^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(input);
  },

  domainHost(input: string) {
    return /^(?!https?:\/\/)(?!\/)(?:[a-z0-9-]+\.)+[a-z0-9-]+(?::\d+)?(?:\/.*)?$/i.test(input);
  },
} as const;
