/**
 * Testing
 * Namespace: @std (deno)
 *            @sys (deno)
 *
 * Proves that key imports work from across the workspace
 * and do not cause build/bundle errors within Vite.
 * @module
 */
const now = new Date();

import { Jsr } from '@sys/jsr';
import { Args, D, Path, rx, Time, Value } from '@sys/std';
import { IndexedDb } from '@sys/std/indexeddb';
import { Semver } from '@sys/std/semver';
import { Str } from '@sys/text';
import { pkg } from '../pkg.ts';

console.info(`💦 import '${pkg.name}/sample-imports';`);

/**
 * Namespace: @sys
 */
console.groupCollapsed('🧫 @sys/std');

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

/**
 * Namespace: @sys : driver
 */
console.groupCollapsed('🧫 @sys/driver');
const { Crdt } = await import('@sys/driver-automerge/web/ui');
console.info('@sys/driver-automerge/ui:', Crdt);
console.groupEnd();

console.info(' ');
