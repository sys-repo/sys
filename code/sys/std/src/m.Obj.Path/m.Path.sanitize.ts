import type { t } from './common.ts';

export const sanitize: t.ObjPathLib['sanitize'] = (text, opts) => {
  const fixes: t.ObjPathFix[] = [];
  const codecKind = resolveCodecKind(opts?.codec);

  let out = String(text);

  // 1. Trim whitespace:
  const trimmed = out.trim();
  if (trimmed !== out) {
    out = trimmed;
    fixes.push('trimmed');
  }

  if (codecKind === 'pointer') {
    // 2. Ensure leading slash for non-empty strings:
    if (out !== '' && !out.startsWith('/')) {
      out = '/' + out.replace(/^\/+/, '');
      fixes.push('ensured-leading-slash');
    }

    // 3. Collapse multiple slashes (do not affect empty or root-only):
    if (out.length > 1) {
      const collapsed = out.replace(/\/{2,}/g, '/');
      if (collapsed !== out) {
        out = collapsed;
        fixes.push('collapsed-multiple-slashes');
      }

      // 4. remove trailing slash (but never remove sole root '/'):
      if (out.endsWith('/')) {
        out = out.slice(0, -1);
        fixes.push('removed-trailing-slash');
      }
    }
  }

  return {
    text: out,
    fixes: fixes,
  };
};

/**
 * Helpers:
 */
function resolveCodecKind(codec?: t.ObjPathCodecKind | t.ObjPathCodec): t.ObjPathCodecKind {
  if (!codec) return 'pointer';
  return typeof codec === 'string' ? codec : ((codec.kind as t.ObjPathCodecKind) ?? 'pointer');
}
