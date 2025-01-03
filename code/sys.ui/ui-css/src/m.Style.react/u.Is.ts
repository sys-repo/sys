import { isObject, type t } from './common.ts';

/**
 * CSS type validation flags.
 */
export const Is = {
  serizlisedStyle(input: any): input is t.SerializedStyles {
    if (!isObject(input)) return false;
    const obj = input as t.SerializedStyles;
    if (typeof obj.name !== 'string' || typeof obj.styles !== 'string') return false;
    return isObject(obj.next) ? Is.serizlisedStyle(obj.next) : true;
  },

  reactCssObject(input: any): input is t.ReactCssObject {
    if (!isObject(input)) return false;
    const obj = input as t.ReactCssObject;
    return Is.serizlisedStyle(obj.css);
  },
} as const;
