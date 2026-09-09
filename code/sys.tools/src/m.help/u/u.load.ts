import { json } from '../-bundle/-bundle.ts';
import { Cli, type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

const Resource = Cli.Fmt.Chapters.Resources.create<t.StringPath>({
  json,
  label: 'ToolsHelp',
  parse: HelpYaml.record,
});

export const RootHelp: t.Help.Root.Lib = {
  load() {
    const data = Resource.readRecord(HelpResource.Root, ['summary', 'sections']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      sections: HelpYaml.sections(data, 'sections'),
    });
  },
};

const DslBook = Cli.Fmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'ToolsHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: Resource.readParsedRecord,
});

export const DslHelp: t.Help.Dsl.Lib = {
  load(path = []) {
    return DslBook.load(path);
  },
};
