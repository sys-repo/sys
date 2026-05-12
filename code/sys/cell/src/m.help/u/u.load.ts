import { Fmt as CliFmt } from '@sys/cli/fmt';
import { json } from '../-bundle/-bundle.ts';
import { FileMap, Is, type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

export const RootHelp: t.CellHelp.Root.Lib = {
  load() {
    const data = readRecord(HelpResource.Root, ['summary', 'usage', 'commands', 'options']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      commands: HelpYaml.pairs(data, 'commands'),
      options: HelpYaml.pairs(data, 'options'),
    });
  },
};

export const InitHelp: t.CellHelp.Init.Lib = {
  load() {
    const data = readRecord(HelpResource.Init, ['summary', 'usage', 'options', 'safety', 'agent']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      safety: HelpYaml.list(data, 'safety'),
      agent: HelpYaml.list(data, 'agent'),
    });
  },
};

export const ActionHelp: t.CellHelp.Action.Lib = {
  load() {
    const data = readRecord(HelpResource.Action, ['summary', 'usage', 'options', 'action']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      action: HelpYaml.list(data, 'action'),
    });
  },
};

export const StartHelp: t.CellHelp.Start.Lib = {
  load() {
    const data = readRecord(HelpResource.Start, ['summary', 'usage', 'options', 'runtime']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      runtime: HelpYaml.list(data, 'runtime'),
    });
  },
};

const DslBook = CliFmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'CellHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: readParsedRecord,
});

export const DslHelp: t.CellHelp.Dsl.Lib = {
  load(path = []) {
    return DslBook.load(path);
  },
};

/**
 * Helpers:
 */

function readRecord(path: t.StringPath, fields: readonly string[]) {
  const data = readParsedRecord(path);
  HelpYaml.require(data, fields);
  return data;
}

function readParsedRecord(path: t.StringPath) {
  const text = readText(path);
  return HelpYaml.record(text, path);
}

function readText(path: t.StringPath): string {
  const dataUri = json[path];
  if (!Is.str(dataUri)) throw new Error(`CellHelp: resource not found: ${path}`);

  const data = FileMap.Data.decode(dataUri);
  if (!Is.str(data)) throw new Error(`CellHelp: resource is not text: ${path}`);
  return data;
}
