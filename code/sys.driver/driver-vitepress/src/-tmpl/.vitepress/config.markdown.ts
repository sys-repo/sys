import type { MarkdownRenderer } from 'vitepress';
import { parse } from 'yaml';
import { Props } from '../.sys/mod.ts';

export const markdown = {
  config(md: MarkdownRenderer) {
    const rules = md.renderer.rules;

    // NB: Store the original fence rule.
    const originalFenceRule =
      rules.fence || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

    // Override the fence rule looking for YAML structures.
    rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      const renderOriginal = () => originalFenceRule(tokens, idx, options, env, self);

      if (token.info.trim() === 'yaml') {
        const yaml = parse(token.content) || undefined;
        const formatHtml = (html: string) => (yaml.debug ? `${html}\n${renderOriginal()}` : html);

        if (typeof yaml?.component === 'string') {
          const data = { ...yaml };
          delete data.component;
          const html = `<React kind="${yaml.component}" props="${Props.encode(data)}" />`;
          return formatHtml(html);
        }
      }

      // No match found, return default.
      return renderOriginal();
    };
  },
};
