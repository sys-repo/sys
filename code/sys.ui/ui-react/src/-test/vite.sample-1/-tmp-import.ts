/**
 * Namespcae: @std (deno)
 */
console.group('🌳 import: @std');

import * as path from '@std/path';
console.log('path', path);

import * as datetime from '@std/datetime';
console.log('datetime', datetime);

import * as async from '@std/async';
console.log('async', async);

import * as semver from '@std/semver';
console.log('semver', semver);

import * as testing from '@std/testing/bdd';
console.log('testing', testing);

console.groupEnd();

/**
 * Namespace: @sys
 */
console.group('🌳 import: @sys');

import { Path } from '@sys/std';
console.log('Path', Path);

console.groupEnd();
