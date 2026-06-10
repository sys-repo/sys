import { WorkflowSafe } from '../../u/u.safe.ts';
import { JSR_BODY_TEMPLATE } from './u.tmpl.ts';
import type { Module } from './u.module.ts';

export function toModuleYaml(module: Pick<Module, 'path' | 'name' | 'version'>) {
  const name = WorkflowSafe.scalar(module.name, 'package name');
  const path = WorkflowSafe.scalar(module.path, 'package path');
  const version = WorkflowSafe.scalar(module.version, 'package version');
  return JSR_BODY_TEMPLATE
    .replaceAll('__NAME__', name)
    .replaceAll('__PATH__', path)
    .replaceAll('__VERSION__', version);
}

export function toMatrixEntryYaml(module: Pick<Module, 'path' | 'name' | 'version'>) {
  const name = WorkflowSafe.scalar(module.name, 'package name');
  const path = WorkflowSafe.scalar(module.path, 'package path');
  const version = WorkflowSafe.scalar(module.version, 'package version');
  return [`- name: "${name}"`, `  path: "${path}"`, `  version: "${version}"`].join('\n');
}
