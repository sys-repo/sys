import { CliFmt, type t } from '../common.ts';
import { json } from '../-bundle/-bundle.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

const Resource = CliFmt.Chapters.Resources.create<t.StringPath>({
  json,
  label: 'WorkspaceHelp',
  parse: HelpYaml.record,
});

export const RootHelp: t.WorkspaceHelp.Root.Lib = {
  load() {
    const data = Resource.readRecord(HelpResource.Root, ['summary', 'sections']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      sections: HelpYaml.sections(data, 'sections'),
    });
  },
};

const DslBook = CliFmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'WorkspaceHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: Resource.readParsedRecord,
});

export const DslHelp: t.WorkspaceHelp.Dsl.Lib = {
  load(path = []) {
    return DslBook.load(path);
  },
};
