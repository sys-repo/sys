import React from 'react';
import { css, FilesBase, type t } from './common.ts';

/**
 * Render enabled Files capabilities as an inline KeyValue row value.
 */
export function formatCapabilities(value: t.ModelFiles.Capabilities): t.ReactNode {
  const enabled = FilesBase.Capability.names.filter((name) => value[name]);
  return enabled.length > 0 ? renderCapabilityNames(enabled) : 'none';
}

/**
 * Helpers:
 */
const Styles = {
  names: css({ display: 'inline-flex', alignItems: 'baseline', gap: 6 }),
  separator: css({ opacity: 0.3 }),
} as const;

function renderCapabilityNames(names: readonly t.ModelFiles.Capability[]): t.ReactNode {
  return <span className={Styles.names.class}>{names.map(renderCapabilityName)}</span>;
}

function renderCapabilityName(name: t.ModelFiles.Capability, index: number): t.ReactNode {
  return (
    <React.Fragment key={name}>
      {index > 0 && renderCapabilitySeparator()}
      <span>{name}</span>
    </React.Fragment>
  );
}

function renderCapabilitySeparator(): t.ReactNode {
  return (
    <span aria-hidden={true} className={Styles.separator.class}>
      •
    </span>
  );
}
