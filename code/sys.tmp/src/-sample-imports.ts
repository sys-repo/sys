/**
 * @module
 * Testing
 * Namespace: @std (deno)
 *            @sys (deno)
 *
 * Proves that key imports work from across the workspace
 * and do not cause build/bundle errors within Vite.
 */
const now = new Date();

import { pkg } from './pkg.ts';
console.info(`💦 import '${pkg.name}/sample-imports';`);

/**
 * Namespace: @sys
 */
console.group('🌳 import: @sys/std');
import { Json } from '@sys/driver-immer';
import { Jsr } from '@sys/jsr';
import { Args, D, Path, rx, Time, Value } from '@sys/std';
import { IndexedDb } from '@sys/std/indexeddb';
import { Semver } from '@sys/std/semver';
import { Str } from '@sys/text';

console.info('@sys/std:rx', rx);
console.info('@sys/std:Path', Path);
console.info('@sys/std:D (Date)', D, `"${D.format(now, 'E MMM do, yyyy')}"`);
console.info('@sys/std:Time', Time);
console.info('@sys/std:Args', Args, 'parsed:', Args.parse(['--foo', '--bar=baz', './file.txt']));
console.info('@sys/std:IndexedDb', IndexedDb);
console.info('@sys/text:Str', Str);
console.info('@sys/text:Str.bytes', `"${Str.bytes(1337)}"`);
console.log();
console.info('@sys/std/jsr', Jsr);
console.info('@sys/std/semver', Semver, Semver.parse('1.2.3'));
console.info('@sys/std:Value.Str.bytes:', Value.Str.bytes(1234));

console.groupEnd();

console.info(' ');

/**
 * Namespace: @sys : driver
 */
console.group('🌳 import: @sys/driver');

console.info('@sys/driver-immer', Json);
console.groupEnd();

console.info(' ');
