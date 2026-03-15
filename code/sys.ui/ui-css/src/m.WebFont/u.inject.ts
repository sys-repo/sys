import { type t, D } from './common.ts';
import {
  buildSources,
  defaultFileForStatic,
  defaultFileForVariable,
  fontFaceBlock,
  inferFormatFromUrl,
  slugify,
} from './u.ts';

/**
 * Injects @font-face rules for the given family into <head> once.
 * SSR-safe: returns { injected:false } if there is no DOM.
 */
export const inject: t.WebFontLib['inject'] = (dir, opts) => {
  const {
    family,
    variable = D.variable,
    weights = D.weight,
    italic = D.italic,
    display = D.display,
    local = D.local,
    fileForStatic,
    fileForVariable,
  } = opts;

  const key = `${D.attr.key}:${family}:${dir}:${variable ? 'var' : 'static'}:${italic ? 'i' : 'n'}/${weights.join(',')}`;
  const id = `${D.attr.id}-${slugify(key)}`;

  const doc = globalThis.document;
  if (!doc?.head) return { id, injected: false };
  if (doc.getElementById(id)) return { id, injected: false };

  let css = '';
  if (variable) {
    const toFace = (isItalic: boolean) => {
      const url = (fileForVariable ?? defaultFileForVariable)({ family, italic: isItalic, dir });
      const format = inferFormatFromUrl(url) ?? 'woff2';
      return fontFaceBlock({
        family,
        display,
        weight: '100 900',
        style: isItalic ? 'italic' : 'normal',
        sources: buildSources({ local, url, format }),
      });
    };

    css += toFace(false);
    if (italic) {
      css += '\n\n';
      css += toFace(true);
    }
  } else {
    for (const w of weights) {
      const urlNormal = (fileForStatic ?? defaultFileForStatic)({
        family,
        weight: w,
        italic: false,
        dir,
      });
      const fmtNormal = inferFormatFromUrl(urlNormal) ?? 'woff2';
      css += fontFaceBlock({
        family,
        display,
        weight: String(w),
        style: 'normal',
        sources: buildSources({ local, url: urlNormal, format: fmtNormal }),
      });

      if (italic) {
        const urlItalic = (fileForStatic ?? defaultFileForStatic)({
          family,
          weight: w,
          italic: true,
          dir,
        });
        const fmtItalic = inferFormatFromUrl(urlItalic) ?? 'woff2';
        css +=
          '\n\n' +
          fontFaceBlock({
            family,
            display,
            weight: String(w),
            style: 'italic',
            sources: buildSources({ local, url: urlItalic, format: fmtItalic }),
          });
      }
      css += '\n\n';
    }
    css = css.trimEnd();
  }

  // Insert into DOM.
  const style = doc.createElement('style');
  style.id = id;
  style.setAttribute(D.attr.data, family);
  style.textContent = css;
  doc.head.appendChild(style);

  /**
   * API:
   */
  return {
    id,
    injected: true,
  };
};
