import { type t } from '../common.ts';

/**
 * Checks invariants that sit on top of the raw JSON schema:
 *
 * 1. Body text requires a headline.
 * 2. Images and body text must not appear simultaneously.
 *
 * These are enforced after the structural/schema validation has succeeded.
 */
export function checkSequenceInvariants(sequence: t.SlugSequence): string | undefined {
  for (let itemIndex = 0; itemIndex < sequence.length; itemIndex += 1) {
    const item = sequence[itemIndex];

    const isImageItem = typeof (item as { image?: unknown }).image === 'string';

    /**
     * Pause item: enforce invariants on its text block (if present).
     */
    if (typeof (item as { pause?: unknown }).pause === 'string') {
      const text = (item as t.SlugSequencePauseItem).text;
      const error = checkTextBlockInvariants({
        text,
        context: `item[${itemIndex}] (pause)`,
        imageActive: false,
      });
      if (error) return error;
    }

    /**
     * Items with timestamps (video, slug, image) – walk each entry.
     */
    const timestamps = (item as { timestamps?: t.SlugSequenceTimestamps }).timestamps;
    if (timestamps && typeof timestamps === 'object') {
      const imageActive = isImageItem;

      for (const [timecode, value] of Object.entries(timestamps)) {
        const entry = value as t.SlugSequenceTimestampEntry;
        const error = checkTimestampEntryInvariants({
          entry,
          context: `item[${itemIndex}] at timecode "${timecode}"`,
          imageActive,
        });
        if (error) return error;
      }
    }
  }

  return undefined;
}

/**
 * Invariants on a single timestamp entry (including its nested text).
 */
export function checkTimestampEntryInvariants(args: {
  readonly entry: t.SlugSequenceTimestampEntry;
  readonly context: string;
  readonly imageActive: boolean;
}): string | undefined {
  const { entry, context, imageActive } = args;
  const { text, image } = entry;

  const error = checkTextBlockInvariants({
    text,
    context,
    imageActive: imageActive || typeof image === 'string',
  });

  return error;
}

/**
 * Invariants that apply to any text block:
 *
 * - If body is present, headline must also be present (non-empty).
 * - If an image is active, body must not be present.
 */
export function checkTextBlockInvariants(args: {
  readonly text: t.SlugSequenceTimestampText | undefined;
  readonly context: string;
  readonly imageActive: boolean;
}): string | undefined {
  const { text, context, imageActive } = args;
  if (!text) return undefined;

  const { headline, body } = text;

  if (body != null && (headline == null || headline === '')) {
    return `Invalid sequence: body text requires a headline (${context}).`;
  }

  if (imageActive && body != null) {
    return `Invalid sequence: image and body text cannot appear simultaneously (${context}).`;
  }

  return undefined;
}
