import { Is, Yaml } from '../common.ts';

type O = Record<string, unknown>;

export const HelpYaml = {
  record(text: string, path: string): O {
    const parsed = Yaml.parse<unknown>(text);
    if (parsed.error) {
      const cause = parsed.error;
      throw new Error(`PiHelp: failed to parse resource YAML: ${path}`, { cause });
    }

    const data = parsed.data;
    if (!Is.record<O>(data)) {
      throw new Error(`PiHelp: resource must be a YAML record: ${path}`);
    }
    return data;
  },
} as const;
