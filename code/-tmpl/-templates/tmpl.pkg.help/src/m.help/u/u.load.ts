import { Chapters } from '@sys/cli/fmt';
import { json } from '../-bundle/-bundle.ts';
import { type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

const Resource = Chapters.Resources.create<t.StringPath>({
  json,
  label: 'Help',
  parse: HelpYaml.record,
});

export const RootHelp: t.Help.Root.Lib = Object.freeze({
  load() {
    const data = Resource.readRecord(HelpResource.Root, ['summary', 'sections']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      sections: HelpYaml.sections(data, 'sections'),
    });
  },
});
