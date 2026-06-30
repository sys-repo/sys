import { Button as Default } from '../Button/mod.ts';
import { IconButtons as Icons } from '../Buttons.Icons/mod.ts';
import { Switch } from '../Buttons.Switch/mod.ts';
import { type t } from './common.ts';

/** Button family composition surface. */
export const Buttons: t.ButtonsLib = {
  Button: { Default },
  Icons,
  Switch,
};
