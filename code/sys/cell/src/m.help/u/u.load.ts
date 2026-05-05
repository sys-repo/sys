import { json } from '../-bundle/-bundle.ts';
import { FileMap, Is, type t } from '../common.ts';
import type { CellHelp } from '../t.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

export const RootHelp: CellHelp.Root.Lib = {
  async load() {
    const data = readRecord(HelpResource.Root, ['summary', 'usage', 'commands', 'options']);
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
    const data = readRecord(HelpResource.Init, ['summary', 'usage', 'options', 'safety', 'agent']);
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
    const data = readRecord(HelpResource.Dsl.Index, ['intro', 'sections']);
    const sections = HelpYaml.sections(data, 'sections');
    return {
      intro: HelpYaml.string(data, 'intro'),
      sections: [...sections, ...readDslActSections()],
    };
  },
};

/**
 * Helpers:
 */

function readDslActSections(): readonly CellHelp.Section[] {
  return HelpResource.Dsl.Acts.flatMap((path) => {
    const data = readRecord(path, ['sections']);
    return HelpYaml.sections(data, 'sections');
  });
}

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
