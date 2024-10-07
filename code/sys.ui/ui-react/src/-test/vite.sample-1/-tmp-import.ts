/**
 * Namespcae: @std (deno)
 */

const now = new Date();

console.group('🌳 import: @std');

import * as path from '@std/path';
console.log('@std/path', path);

import * as datetime from '@std/datetime';
console.log('@std/datetime', datetime, datetime.format(now, 'yyyy-MM-dd'));

import * as async from '@std/async';
console.log('@std/async', async);

import * as semver from '@std/semver';
console.log('@std/semver', semver);

import * as testing from '@std/testing/bdd';
console.log('@std/testing', testing);

console.groupEnd();

/**
 * Namespace: @sys
 */
console.group('🌳 import: @sys');
import { Path, Dates, Time } from '@sys/std';
console.log('@sys/std:Path', Path);
console.log('@sys/std:Dates', Dates, `"${Dates.format(now, 'E MMM do, yyyy')}"`);
console.log('@sys/std:Time', Time);
console.groupEnd();
