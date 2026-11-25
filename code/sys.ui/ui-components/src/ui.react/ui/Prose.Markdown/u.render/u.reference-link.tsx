import { Anchor } from '../../Anchor/mod.ts';
import { type t, Url } from '../common.ts';

/** Opt-in renderer: only absolute web references request a new tab. */
export function renderReferenceLink(
  link: t.ProseMarkdown.Inline.Link.RendererArgs,
  theme: t.CommonTheme,
) {
  // Prose.Markdown has already filtered the destination. Keep the authored href.
  const { href, title, tabIndex, children } = link;
  const props = { href, title, tabIndex, theme };
  const url = Url.parse(href);
  const protocol = url.ok ? url.toURL().protocol : undefined;
  if (protocol === 'https:' || protocol === 'http:') {
    return <Anchor.Link {...props} openIn='new-tab'>{children}</Anchor.Link>;
  }
  return <Anchor.UI {...props}>{children}</Anchor.UI>;
}
