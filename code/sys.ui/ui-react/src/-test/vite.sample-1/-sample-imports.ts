/**
 * Namespcae: @std (deno)
 */

const now = new Date();

console.group('🌳 import: @std');

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
import { Json } from '@sys/driver-immer';
import { Args, D, IndexedDb, Path, Text, Time } from '@sys/std';

console.group('🌳 import: @sys');
console.info('@sys/std:Path', Path);
console.info('@sys/std:D (Date)', D, `"${D.format(now, 'E MMM do, yyyy')}"`);
console.info('@sys/std:Time', Time);
console.info('@sys/std:Args', Args, 'parse:', Args.parse(['--foo', '--bar=baz', './file.txt']));
console.info('@sys/std:IndexedDb', IndexedDb);
console.info('@sys/std:Text', Text);
console.info('@sys/driver-immer', Json);

console.groupEnd();
