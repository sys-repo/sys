import type { t } from '../common.ts';

const RX_HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RX_RGB = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/i;
const RX_RGBA = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(?:0|1|0?\.\d+)\s*\)$/i;

export function isHexColor(input: string): input is t.HexColor {
  return RX_HEX.test(input);
}

export function isRgbColor(input: string): input is t.RgbColor {
  return RX_RGB.test(input);
}

export function isRgbaColor(input: string): input is t.RgbaColor {
  return RX_RGBA.test(input);
}

export function isAlphaColorInput(input: string): input is t.AlphaColorInput {
  return isHexColor(input) || isRgbColor(input) || isRgbaColor(input);
}

export function assertHexColor(input: string, method: string): asserts input is t.HexColor {
  if (isHexColor(input)) return;
  throw new TypeError(`${method} expects a hex color.`);
}

export function assertAlphaColorInput(
  input: string,
  method: string,
): asserts input is t.AlphaColorInput {
  if (isAlphaColorInput(input)) return;
  throw new TypeError(`${method} expects a hex/rgb/rgba color.`);
}
