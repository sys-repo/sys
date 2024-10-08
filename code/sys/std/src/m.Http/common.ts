export * from '../common/mod.ts';

const Mime = {
  json: 'application/json',
} as const;

export const DEFAULTS = {
  Mime,
  contentType: Mime.json,
} as const;
