import type { MarkdownRenderer } from 'vitepress';
import { parse } from 'yaml';

export const markdown = {
  config(md: MarkdownRenderer) {
    const rules = md.renderer.rules;

    // Store the original fence rule.
    const defaultFence =
      rules.fence ||
      function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
      };

    // Override the fence rule looking for YAML structures.
    rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];

      if (token.info.trim() === 'yaml') {
        const yaml = parse(token.content) || undefined;
        if (yaml?.component === 'Video') {
          const defaultHtml = defaultFence(tokens, idx, options, env, self);
          const src = yaml.src || '';
          let html = `<Video src="${src}" />`;
          if (yaml.debug) html = `${html}\n${defaultHtml}`;
          return html;
        }

        if (yaml?.component === 'ConceptPlayer') {
          const defaultHtml = defaultFence(tokens, idx, options, env, self);
          const src = yaml.video || '';
          let html = `<Video src="${src}" />`;
          if (yaml.debug) html = `${html}\n${defaultHtml}`;
          return html;
        }
      }

      // No overriden matches found, return default rendering.
      return defaultFence(tokens, idx, options, env, self);
    };
  },
};
