import React from 'react';
import { Button } from '../../u.ts';
import { type t } from './common.ts';
import { CursorHelp, type CursorHelpProps } from './-ui.CursorHelp.tsx';

export type CursorEnabledSignal = { value: boolean };
export type CursorModelSignal = { value: t.KeyValue.Cursor.Model };
export type CursorArrivalSignal = { value: t.KeyValue.Cursor.Arrival };

export type ToggleButtonProps = {
  readonly enabled: CursorEnabledSignal;
  readonly model?: CursorModelSignal;
  readonly clearModelOnDisable?: boolean;
};

export type ArrivalButtonProps = {
  readonly arrival: CursorArrivalSignal;
};

export type HelpProps = CursorHelpProps;

const arrivalOptions = [false, 'flash'] as const;

export const CursorDebug = {
  arrivalOptions,

  toArrival(input: unknown): t.KeyValue.Cursor.Arrival {
    return input === false ? false : 'flash';
  },

  hasArrival(input: unknown): input is t.KeyValue.Cursor.ArrivalMode {
    return input === 'flash';
  },

  cycleArrival(args: ArrivalButtonProps) {
    const index = arrivalOptions.indexOf(CursorDebug.toArrival(args.arrival.value));
    const nextIndex = (index + 1) % arrivalOptions.length;
    args.arrival.value = arrivalOptions[nextIndex];
  },

  toggle(args: ToggleButtonProps) {
    const next = !args.enabled.value;
    args.enabled.value = next;
    if (!next && args.clearModelOnDisable && args.model) args.model.value = {};
  },

  ToggleButton(props: ToggleButtonProps) {
    return (
      <Button
        block
        label={() => `cursor.enabled: ${props.enabled.value}`}
        onClick={() => CursorDebug.toggle(props)}
      />
    );
  },

  ArrivalButton(props: ArrivalButtonProps) {
    return (
      <Button
        block
        label={() => `cursor.arrival: ${CursorDebug.toArrival(props.arrival.value) || 'false'}`}
        onClick={() => CursorDebug.cycleArrival(props)}
      />
    );
  },

  Help: CursorHelp,
} as const;
