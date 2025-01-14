import type { t } from './common.ts';

/**
 * https://w3c.github.io/webvtt
 * https://en.wikipedia.org/wiki/WebVTT
 *
 * @example
 *
 *   WEBVTT
 *
 *   1
 *   00:00:00.165 --> 00:00:01.735
 *   This is a model for understanding
 *
 *   2
 *   00:00:01.875 --> 00:00:03.335
 *   and working with group scale.
 *
 */
export type Timestamps = { [key: StringTime]: Timestamp };
export type Timestamp = {
  image?: t.StringUrl;
};

export type StringTime = string; // HH:MM:SS.mmm
