export const FILTER_SAMPLES = {
  /** "Blown-out spotlight" (extreme) */
  blowOut: 'brightness(180%) contrast(130%) saturate(70%)',

  /** High-key over-exposure (strong but still usable for faces) */
  highKey: 'brightness(160%) contrast(120%) saturate(80%)',

  /** Neutral daylight pop (balanced, vivid) */
  vividPop: 'brightness(115%) contrast(110%) saturate(150%)',

  /** Soft pastel wash (desaturated, low contrast) */
  pastelSoft: 'brightness(110%) contrast(90%) saturate(70%)',

  /** Classic noir (monochrome with punchy tones) */
  noir: 'grayscale(100%) contrast(125%) brightness(110%)',

  /** Vintage sepia */
  sepia: 'sepia(85%) contrast(100%) brightness(105%)',

  /** Warm sunset tint */
  warmTint: 'hue-rotate(-20deg) saturate(120%) brightness(110%)',

  /** Cool arctic tint */
  coolTint: 'hue-rotate(190deg) saturate(120%) brightness(110%)',

  /** Muted documentary (flat, slightly desat) */
  muted: 'saturate(60%) contrast(95%) brightness(105%)',

  /** Dreamy blur-soft focus */
  dreamyBlur: 'blur(4px) brightness(120%) contrast(105%)',
} as const;
