import { INITIALIZATION_ERROR } from './u.fixture.import-boundary.error.ts';

// Model an upstream initializer that cannot execute in the importing host.
throw INITIALIZATION_ERROR;

// Named exports allow linking; no operation can bypass the initialization refusal.
export default function react() {}
export class Workspace {}
export const RequestedModuleType = { Default: 'default' };
export const ResolutionMode = { Import: 'import' };
export function loadConfigFromFile() {}
