import { useId } from 'react';
import { LuArrowRight, LuArrowUpRight, LuGlobe } from 'react-icons/lu';
import { Arr, D, Is, type t } from './common.ts';
import { Icon } from '../Icon/mod.ts';
import { Anchor } from './ui.tsx';

const icons = {
  web: Icon.renderer(LuGlobe),
  self: Icon.renderer(LuArrowRight),
  newTab: Icon.renderer(LuArrowUpRight),
};

/**
 * Present resource identity and requested opening context through the native anchor.
 */
export const Link: t.FC<t.Anchor.Link.Props> = (props) => {
  const hintId = useId();
  const { children, resource, openIn = D.link.openIn, openHint, ...native } = props;
  if (!native.href) return children;

  const enabled = native.enabled ?? D.enabled;
  const newContext = openIn === 'new-tab';
  const hasHint = enabled && newContext;
  const hint = Is.blank(openHint) ? D.link.openHint : openHint;
  const callerDescription = native['aria-describedby'];
  const describedBy = hasHint
    ? Arr.uniq([
      ...(callerDescription ?? '').split(/[ \t\n\r\f]+/).filter((id) => !Is.blank(id)),
      hintId,
    ]).join(' ')
    : callerDescription;
  const title = native.title === undefined && hasHint ? hint : native.title;

  return (
    <>
      <Anchor
        {...native}
        target={newContext ? '_blank' : '_self'}
        download={undefined}
        aria-disabled={undefined}
        aria-describedby={describedBy}
        title={title}
        icons={{
          leading: resource === 'web' ? icons.web : undefined,
          trailing: enabled ? (newContext ? icons.newTab : icons.self) : undefined,
        }}
      >
        {children}
      </Anchor>
      {hasHint && <span id={hintId} hidden>{hint}</span>}
    </>
  );
};
