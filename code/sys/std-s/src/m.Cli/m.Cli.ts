import ora from 'ora';
import { Table as CliffyTable } from '@cliffy/table';
import type { t } from '../common.ts';

/**
 * Library: Tools for CLI (command-line-interface).
 */
export const Cli: t.CliLib = {
  spinner: (text = 'Processing...') => ora(text).start(),
  table: (items) => new CliffyTable(items).padding(3),
};
