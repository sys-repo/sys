export * from '../common.ts';
export { afterEach, beforeEach, describe, expect, expectError, it, Testing } from '../../-test.ts';

export { bindKeyboardInput, FakeSpinner } from '@sys/cli/testing';
export { spawn } from 'node:child_process';
export { EventEmitter } from 'node:events';
export { default as nodeProcess, kill } from 'node:process';
