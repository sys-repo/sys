/**
 * @module
 * Filesystem-specific package exports.
 */
import type { t } from './common.ts';
import { Fs } from './common.ts';

void Fs; // Keep @sys/fs on the ./fs runtime graph for the scaffold boundary test.
