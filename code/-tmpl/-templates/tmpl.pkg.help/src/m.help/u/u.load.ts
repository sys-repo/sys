import { json } from '../-bundle/-bundle.ts';
import { FileMap, Is, type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

export const RootHelp: t.Help.Root.Lib = {
  load() {
    const data = readRecord(HelpResource.Root, ['summary', 'sections']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      sections: HelpYaml.sections(data, 'sections'),
    });
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
  if (!Is.str(dataUri)) throw new Error(`Help: resource not found: ${path}`);

  const data = FileMap.Data.decode(dataUri);
  if (!Is.str(data)) throw new Error(`Help: resource is not text: ${path}`);
  return data;
}
