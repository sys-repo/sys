import type { t } from '../common.ts';
import { Type } from '../common.ts';

export const Hash = Type.String({
  minLength: 1,
  description: 'SHA256 hash of the source payload.',
});

export const ContentType = Type.String({
  minLength: 1,
  description: 'MIME content type for the source payload.',
});

export const Path = Type.String({
  description: 'Optional relative source path.',
});

export const Ref = Type.Unsafe<t.StringRef>(
  Type.String({
    minLength: 1,
    description: 'CRDT reference for the source content.',
  }),
);

export const DocId = Type.Unsafe<t.StringId>(
  Type.String({
    minLength: 1,
    description: 'Slug document identifier.',
  }),
);

export const Title = Type.String({
  minLength: 1,
  description: 'Optional title extracted from frontmatter.',
});

export const Frontmatter = Type.Object(
  {
    ref: Type.Optional(Ref),
    title: Type.Optional(Title),
  },
  {
    additionalProperties: true,
    description: 'Frontmatter metadata (ref optional; other keys allowed).',
  },
);
