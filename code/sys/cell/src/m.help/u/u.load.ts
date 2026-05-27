import { Fmt as CliFmt } from '@sys/cli/fmt';
import { json } from '../-bundle/-bundle.ts';
import { type t } from '../common.ts';
import { HelpResource } from './u.paths.ts';
import { HelpYaml } from './u.yaml.ts';

const Resource = CliFmt.Chapters.Resources.create<t.StringPath>({
  json,
  label: 'CellHelp',
  parse: HelpYaml.record,
});

export const RootHelp: t.CellHelp.Root.Lib = {
  load() {
    const data = Resource.readRecord(HelpResource.Root, [
      'summary',
      'usage',
      'commands',
      'options',
    ]);
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
    const data = Resource.readRecord(HelpResource.Init, [
      'summary',
      'usage',
      'options',
      'safety',
      'agent',
    ]);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      safety: HelpYaml.list(data, 'safety'),
      agent: HelpYaml.list(data, 'agent'),
    });
  },
};

export const MigrateHelp: t.CellHelp.Migrate.Lib = {
  load() {
    const data = Resource.readRecord(HelpResource.Migrate, [
      'summary',
      'usage',
      'options',
      'safety',
    ]);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      safety: HelpYaml.list(data, 'safety'),
    });
  },
};

export const TaskHelp: t.CellHelp.Task.Lib = {
  load() {
    const data = Resource.readRecord(HelpResource.Task, ['summary', 'usage', 'options', 'task']);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      task: HelpYaml.list(data, 'task'),
    });
  },
};

export const StartHelp: t.CellHelp.Start.Lib = {
  load() {
    const data = Resource.readRecord(HelpResource.Start, [
      'summary',
      'usage',
      'options',
      'services',
    ]);
    return Promise.resolve({
      summary: HelpYaml.string(data, 'summary'),
      usage: HelpYaml.list(data, 'usage'),
      options: HelpYaml.pairs(data, 'options'),
      services: HelpYaml.list(data, 'services'),
    });
  },
};

const DslBook = CliFmt.Chapters.Book.create<t.StringPath>({
  root: HelpResource.Dsl.Root,
  label: 'CellHelp',
  noun: 'DSL chapter',
  recordKind: 'YAML record',
  read: Resource.readParsedRecord,
});

export const DslHelp: t.CellHelp.Dsl.Lib = {
  load(path = []) {
    return DslBook.load(path);
  },
};
