import React from 'react';

import type { t } from '../common.ts';
import { LayoutCenterColumn as Base } from '@sys/ui-react-components';

/**
 * Shim root that situates catalog slots into the upstream component.
 * No re-implementation; we just thread props and slots through.
 */
type SlotNames = 'left' | 'center' | 'right';

/** Catalog runtime typically provides `slots?: Record<name, ReactNode>`. */
type WithSlots = { slots?: Partial<Record<SlotNames, t.ReactNode>> };

/**
 * Local-only prop overlay:
 * - inferred serializable props from schema
 * - plus ReactNode slots for DX
 * (not exported, so no JSR leakage)
 */
type Props = t.Infer<typeof import('./schema.ts').LayoutSchema> &
  WithSlots & { left?: t.ReactNode; center?: t.ReactNode; right?: t.ReactNode };

export const Layout: React.FC<Props> = (props) => {
  const { slots, left, center, right, ...rest } = props;
  return (
    <Base
      {...rest}
      left={left ?? slots?.left ?? null}
      center={center ?? slots?.center ?? null}
      right={right ?? slots?.right ?? null}
    />
  );
};

export default Layout;
