/**
 * Textbox value helpers.
 */
export const Value = {
  format(value?: string, maxLength?: number) {
    value = value || '';
    if (typeof maxLength === 'number' && value.length > maxLength) {
      value = value.substring(0, maxLength);
    }
    return value;
  },
} as const;
