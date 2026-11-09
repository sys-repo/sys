import { Anchor } from '../mod.ts';
import type { t } from './common.ts';
import { FocusExamples } from './-ui.FocusExamples.tsx';
import { LinkExamples } from './-ui.LinkExamples.tsx';

/** Keep single samples unwrapped; comparison views own their layout. */
export function Root(props: t.DebugValues) {
  const { examples, link, theme, enabled, href, target, download, children } = props;
  const { truncate, maxWidth } = props;
  if (examples === 'links') return <LinkExamples theme={theme} enabled={enabled} />;
  if (examples === 'focus') return <FocusExamples theme={theme} enabled={enabled} />;
  const style = truncate ? { maxWidth } : undefined;
  if (link) {
    return (
      <Anchor.Link
        theme={theme}
        enabled={enabled}
        href={href}
        truncate={truncate}
        style={style}
        {...link}
      >
        {children}
      </Anchor.Link>
    );
  }
  return (
    <Anchor.UI
      theme={theme}
      enabled={enabled}
      href={href}
      target={target}
      download={download}
      truncate={truncate}
      style={style}
    >
      {children}
    </Anchor.UI>
  );
}
