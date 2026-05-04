import { json } from '../-bundle/-bundle.ts';
import { FileMap, Is, type t } from '../common.ts';
import type { CellHelp } from '../t.ts';
import { HelpYaml } from './u.yaml.ts';

const RootPath = 'yaml/root.yaml' as t.StringPath;
const InitPath = 'yaml/init.yaml' as t.StringPath;
const AgentPath = 'yaml/agent.yaml' as t.StringPath;

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
    const data = readRecord(InitPath, ['summary', 'usage', 'options', 'safety']);
    return {
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      safety: HelpYaml.list(data, 'safety'),
    };
  },
};

export const AgentHelp: CellHelp.Agent.Lib = {
  async load() {
    const data = readRecord(AgentPath, [
      'intro',
      'init',
      'preserve',
      'rule',
      'speechActs',
      'ownerFlows',
      'actMapping',
    ]);
    return {
      intro: HelpYaml.string(data, 'intro'),
      init: HelpYaml.list(data, 'init'),
      preserve: HelpYaml.list(data, 'preserve'),
      rule: HelpYaml.lines(data, 'rule'),
      speechActs: HelpYaml.list(data, 'speechActs'),
      ownerFlows: HelpYaml.list(data, 'ownerFlows'),
      actMapping: HelpYaml.list(data, 'actMapping'),
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
