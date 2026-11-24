import type { t } from '../common.ts';

/** Props forwarded to Anchor.Link with a default web resource marker. */
export type Props = Omit<t.Anchor.Link.Props, 'resource'> & {
  /**
   * Resource identity, not origin, trust, or availability.
   * Omitted defaults to web; explicitly pass undefined for no resource marker.
   */
  resource?: t.Anchor.Link.Props['resource'];
};
