// u.mandelbrot.ts

type MandelbrotOptions = {
  width?: number;
  height?: number;
  maxIter?: number;
  escapeRadius?: number;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
};

/** Convert HSL → RGB (h in [0, 360], s,l in [0,100]) */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let [r, g, b] = [0, 0, 0];

  if (h < 60) [r, g] = [c, x];
  else if (h < 120) [r, g] = [x, c];
  else if (h < 180) [g, b] = [c, x];
  else if (h < 240) [g, b] = [x, c];
  else if (h < 300) [r, b] = [x, c];
  else [r, b] = [c, x];

  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Draws a **colored** Mandelbrot into the given canvas.
 */
export function drawMandelbrot(
  canvas: HTMLCanvasElement,
  {
    width = 800,
    height = 600,
    maxIter = 200,
    escapeRadius = 2,
    xMin = -2.5,
    xMax = 1,
    yMin = -1,
    yMax = 1,
  }: MandelbrotOptions = {},
): HTMLCanvasElement {
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');

  const img = ctx.createImageData(width, height);

  for (let py = 0; py < height; py++) {
    const y0 = (py / (height - 1)) * (yMax - yMin) + yMin;

    for (let px = 0; px < width; px++) {
      const x0 = (px / (width - 1)) * (xMax - xMin) + xMin;
      let x = 0,
        y = 0,
        iter = 0;

      while (x * x + y * y <= escapeRadius * escapeRadius && iter < maxIter) {
        const xt = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xt;
        iter++;
      }

      const idx = (py * width + px) * 4;

      if (iter === maxIter) {
        // inside the set → black
        img.data[idx] = img.data[idx + 1] = img.data[idx + 2] = 0;
      } else {
        // outside → color by iteration
        const hue = (360 * iter) / maxIter;
        const [r, g, b] = hslToRgb(hue, 100, 50);
        img.data[idx] = r;
        img.data[idx + 1] = g;
        img.data[idx + 2] = b;
      }
      img.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}
