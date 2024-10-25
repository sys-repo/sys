/**
 * @example
 * Namespace: @std (deno)
 *            @sys (deno)
 *
 * Proves that key imports work from across the workspace
 * and do not cause build/bundle errors within Vite.
 */
const now = new Date();

console.group('🌳 import: @std (deno)');

import * as path from '@std/path';
console.info('@std/path', path);

import * as datetime from '@std/datetime';
console.info('@std/datetime', datetime, datetime.format(now, 'yyyy-MM-dd'));

import * as async from '@std/async';
console.info('@std/async', async);

import * as semver from '@std/semver';
console.info('@std/semver', semver);

import * as testing from '@std/testing/bdd';
console.info('@std/testing', testing);

console.groupEnd();

/**
 * Namespace: @sys
 */
console.group('🌳 import: @sys/std');
import { Args, D, IndexedDb, Path, Time, rx } from '@sys/std';
import { Str } from '@sys/text';

console.info('@sys/std:rx', rx);
console.info('@sys/std:Path', Path);
console.info('@sys/std:D (Date)', D, `"${D.format(now, 'E MMM do, yyyy')}"`);
console.info('@sys/std:Time', Time);
console.info('@sys/std:Args', Args, 'parsed:', Args.parse(['--foo', '--bar=baz', './file.txt']));
console.info('@sys/std:IndexedDb', IndexedDb);
console.info('@sys/text:Str', Str);
console.info('@sys/text:Str.bytes', `"${Str.bytes(1337)}"`);
console.groupEnd();

/**
 * Namespace: @sys_driver
 */
console.group('🌳 import: @sys/driver');
import { Json } from '@sys/driver-immer';
console.info('@sys/driver-immer', Json);
console.groupEnd();
