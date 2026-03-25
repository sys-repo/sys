/**
 * @module
 * Test helpers for workspace structure.
 */
import { Workspace as Base } from '../mod.Workspace.ts';
import type { t } from './common.ts';

export const WorkspaceTesting: t.WorkspaceTesting.TestingLib = {};
export const Workspace = { ...Base, Test: WorkspaceTesting };
