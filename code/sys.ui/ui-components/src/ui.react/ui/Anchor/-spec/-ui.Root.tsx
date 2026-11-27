import { Anchor } from '../mod.ts';
import { Dev, type t } from './common.ts';
import { FocusExamples } from './-ui.FocusExamples.tsx';
import { LinkExamples } from './-ui.LinkExamples.tsx';

/** Route to the selected sample or comparison. */
export function Root(props: t.DebugValues) {
  const { examples, link, theme, enabled, href, target, download, children } = props;
  const { mono, truncate, maxWidth } = props;
  if (examples === 'links') return <LinkExamples theme={theme} enabled={enabled} />;
  if (examples === 'focus') return <FocusExamples theme={theme} enabled={enabled} />;
  const style = truncate ? { maxWidth } : undefined;
  if (examples === 'button') {
    return (
      <Anchor.Button
        theme={theme}
        enabled={enabled}
        mono={mono}
        truncate={truncate}
        style={style}
        onClick={() => {}}
      >
        Anchor.Button
      </Anchor.Button>
    );
  }
  if (link) {
    const shared = { theme, enabled, href, mono, truncate, style, children, openIn: link.openIn };
    if (link.api === 'dev') {
      // Omission exercises the real default; an explicit undefined opts out.
      const resource = link.resource === 'default'
        ? {}
        : { resource: link.resource === 'none' ? undefined : link.resource };
      return <Dev.Link {...shared} {...resource} />;
    }
    return <Anchor.Link {...shared} resource={link.resource} />;
  }
  return (
    <Anchor.UI
      theme={theme}
      enabled={enabled}
      href={href}
      target={target}
      download={download}
      mono={mono}
      truncate={truncate}
      style={style}
    >
      {children}
    </Anchor.UI>
  );
}
