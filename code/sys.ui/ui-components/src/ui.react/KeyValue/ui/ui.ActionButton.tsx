import React from 'react';
import { Button } from '../../Button/mod.ts';
import { Color, type t } from '../common.ts';

/**
 * Compact action button for use in a KeyValue row value cell.
 */
export const ActionButton: React.FC<t.KeyValue.ActionButtonProps> = (props) => {
  return (
    <Button
      theme={'Dark'}
      label={<span style={{ color: Color.WHITE }}>{props.label}</span>}
      enabled={props.enabled}
      padding={[0, 8]}
      style={{ backgroundColor: Color.BLUE, borderRadius: 3 }}
      tooltip={props.tooltip}
      onClick={props.onClick}
    />
  );
};
