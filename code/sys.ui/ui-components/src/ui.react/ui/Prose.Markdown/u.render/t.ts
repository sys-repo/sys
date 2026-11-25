import type { t } from './common.ts';

export type NotImplementedReason = 'invalid' | 'unsupported';

export type RenderContext = {
  linksTabbable?: boolean;
  renderers?: t.ProseMarkdown.Renderers;
  source?: t.StringMarkdown;
  styles: t.ProseMarkdown.Styles;
};
