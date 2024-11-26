import { ArgsCard } from './ui.Main.ArgsCard.tsx';
import { Config } from './ui.Main.Config.tsx';
import { Run } from './ui.Main.Run.tsx';
import { renderTop } from './ui.Main.u.render.tsx';

import { DEFAULTS, FC, type t } from './common.ts';
import { View } from './ui.Main.ui.tsx';

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
  Config: typeof Config;
  ArgsCard: typeof ArgsCard;
  Run: typeof Run;
  renderTop: typeof renderTop;
};

export const Main = FC.decorate<t.MainProps, Fields>(
  View,
  { DEFAULTS, Config, ArgsCard, Run, renderTop },
  { displayName: DEFAULTS.displayName },
);
