import { type t } from '../common.ts';

/**
 * Checks invariants that sit on top of the raw JSON schema:
 *
 * 1. Body text requires a heading (either headline or title).
 * 2. Images and body text must not appear simultaneously.
 *
 * These are enforced after the structural/schema validation has succeeded.
 */
export function checkSequenceInvariants(sequence: t.SequenceItem[]): string | undefined {
  for (let itemIndex = 0; itemIndex < sequence.length; itemIndex += 1) {
    const item = sequence[itemIndex];

    const isImageItem = typeof (item as { image?: unknown }).image === 'string';

    /**
     * Pause item: enforce invariants on its text block (if present).
     * Here we treat the pause title as a valid "heading" context.
     */
    if (typeof (item as { pause?: unknown }).pause === 'string') {
      const pauseItem = item as t.SequencePauseItem;
      const text = pauseItem.text;
      const hasTitle = typeof pauseItem.title === 'string' && pauseItem.title.trim() !== '';

      const error = checkTextBlockInvariants({
        text,
        context: `item[${itemIndex}] (pause)`,
        imageActive: false,
        hasTitle,
      });
      if (error) return error;
    }

    /**
     * Items with timestamps (video, slug, image) – walk each entry.
     */
    const timestamps = (item as { timestamps?: t.SequenceTimestamps }).timestamps;
    if (timestamps && typeof timestamps === 'object') {
      const imageActive = isImageItem;

      for (const [timecode, value] of Object.entries(timestamps)) {
        const entry = value as t.SequenceTimestampEntry;
        const hasTitle = typeof entry.title === 'string' && entry.title.trim() !== '';

        const error = checkTimestampEntryInvariants({
          entry,
          context: `item[${itemIndex}] at timecode "${timecode}"`,
          imageActive,
          hasTitle,
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
  readonly entry: t.SequenceTimestampEntry;
  readonly context: string;
  readonly imageActive: boolean;
  readonly hasTitle?: boolean;
}): string | undefined {
  const { entry, context, imageActive, hasTitle = false } = args;
  const { text, image } = entry;

  const error = checkTextBlockInvariants({
    text,
    context,
    imageActive: imageActive || typeof image === 'string',
    hasTitle,
  });

  return error;
}

/**
 * Invariants that apply to any text block:
 *
 * - If body is present, heading must be present:
 *     heading := headline || title (hasTitle flag).
 * - If an image is active, body must not be present.
 */
export function checkTextBlockInvariants(args: {
  readonly text: t.SequenceTimestampText | undefined;
  readonly context: string;
  readonly imageActive: boolean;
  readonly hasTitle?: boolean;
}): string | undefined {
  const { text, context, imageActive, hasTitle = false } = args;
  if (!text) return undefined;

  const { headline, body } = text;

  const hasBody = body != null;
  const hasHeadline = headline != null && headline !== '';
  const hasHeading = hasHeadline || hasTitle;

  if (hasBody && !hasHeading) {
    return `Invalid sequence: body text requires a heading (${context}).`;
  }

  if (imageActive && hasBody) {
    return `Invalid sequence: image and body text cannot appear simultaneously (${context}).`;
  }

  return undefined;
}
