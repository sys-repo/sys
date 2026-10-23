import type { t } from './common.ts';

/** Inspect supporting material beside the sample, regardless of its origin. */
export function ReferenceLink({ href, children }: t.Page.ReferenceLinkProps) {
  return (
    <a href={href} target='_blank' rel='noopener noreferrer' title='Opens in a new tab'>
      {children} <span className='reference-link-arrow'>↗</span>
    </a>
  );
}
