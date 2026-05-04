import { json } from '../-bundle/-bundle.ts';
import { FileMap, Is, type t } from '../common.ts';
import type { CellHelp } from '../t.ts';
import { HelpYaml } from './u.yaml.ts';

const RootPath = 'yaml/root.yaml' as t.StringPath;
const InitPath = 'yaml/init.yaml' as t.StringPath;
const DslPath = 'yaml/dsl.yaml' as t.StringPath;

export const RootHelp: CellHelp.Root.Lib = {
  async load() {
    const data = readRecord(RootPath, ['summary', 'usage', 'commands', 'options']);
    return {
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      commands: HelpYaml.pairs(data, 'commands'),
      options: HelpYaml.pairs(data, 'options'),
    };
  },
};

export const InitHelp: CellHelp.Init.Lib = {
  async load() {
    const data = readRecord(InitPath, ['summary', 'usage', 'options', 'safety', 'agent']);
    return {
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      safety: HelpYaml.list(data, 'safety'),
      agent: HelpYaml.list(data, 'agent'),
    };
  },
};

export const DslHelp: CellHelp.Dsl.Lib = {
  async load() {
    const data = readRecord(DslPath, ['intro', 'rule', 'speechActs', 'owners', 'mappings']);
    return {
      intro: HelpYaml.string(data, 'intro'),
      rule: HelpYaml.lines(data, 'rule'),
      speechActs: HelpYaml.list(data, 'speechActs'),
      owners: HelpYaml.list(data, 'owners'),
      mappings: HelpYaml.list(data, 'mappings'),
    };
  },
};

/**
 * Helpers:
 */

function readRecord(path: t.StringPath, fields: readonly string[]) {
  const text = readText(path);
  const data = HelpYaml.record(text, path);
  HelpYaml.require(data, fields);
  return data;
}

function readText(path: t.StringPath): string {
  const dataUri = json[path];
  if (!Is.str(dataUri)) throw new Error(`CellHelp: resource not found: ${path}`);

  const data = FileMap.Data.decode(dataUri);
  if (!Is.str(data)) throw new Error(`CellHelp: resource is not text: ${path}`);
  return data;
}
