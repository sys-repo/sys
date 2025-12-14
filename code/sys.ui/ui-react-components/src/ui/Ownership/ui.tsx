import React from 'react';
import { type t, Color, css, D, KeyValue, Obj, Icons } from './common.ts';

/**
 * 🐷 Design concept (exploratory) - 💡
 *
 * Enumerates provisional ownership modes used to sample and exercise
 * the Ownership UI surface during design exploration.
 *
 * This set is intentionally non-final and will evolve as ownership
 * semantics, policy, or capability layers are clarified.
 */
const OWNERSHIP_MODES = ['own', 'use', 'lease', 'cc', 'commons'] as const;
type OwnershipMode = (typeof OWNERSHIP_MODES)[number];

export const Ownership: React.FC<t.OwnershipProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
    }),
  };

  const mono = true;

  return (
    <div className={css(styles.base, props.style).class}>
      <Icons.Certificate size={24} />
      <KeyValue.View
        theme={theme.name}
        items={[
          // { kind: 'title', v: D.displayName, y: [0, 12] },

          // Current ownership snapshot (descriptive)
          // { k: 'ownership', v: OWNERSHIP_MODES.join(', '), mono }, // own | use | commons | view
          // { k: 'rights', v: 'full local-first rights' }, // short human string

          // ----
          { kind: 'hr' },

          // Documented affordances (UI intent only)
          { k: 'affordance (pay, koha)', v: 'UI.Ownership.Action', mono },
          // { k: 'selection', v: 'UI.Ownership.Menu', mono },
          // { k: 'semantics', v: 'UI.Ownership.Info', mono },
        ]}
      />
    </div>
  );
};
