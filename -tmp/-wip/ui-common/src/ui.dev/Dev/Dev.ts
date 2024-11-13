import { DEFAULTS, DevBase, LocalStorage, Test, Value } from '../common.ts';

import { Lorem } from '../../ui.tools/mod.ts';
import { ObjectView } from '../../ui/ObjectView/mod.ts';
import { PropList } from '../../ui/PropList/mod.ts';
import { Spinner } from '../../ui/Spinner/mod.ts';
import { DevIcons as Icons } from '../Dev.Icons.ts';
import { RowSpinner } from '../Dev.RowSpinner/mod.ts';
import { DevSplash as Splash } from '../Dev.Splash/mod.ts';
import { DevTools, Helpers } from '../DevTools/mod.ts';
import { TestRunner } from '../TestRunner/mod.ts';

import { render } from './Dev.render.tsx';
import { find } from './u.ts';

const { describe, ctx } = DevBase.Spec;
const { trimStringsDeep } = Value.Obj;
const qs = DEFAULTS.qs;

export const Dev = {
  ...DevBase,
  ...Helpers,

  bundle: Test.bundle,
  FieldSelector: PropList.FieldSelector,
  Tools: DevTools,
  tools: DevTools.init,

  Icons,
  Spinner,
  RowSpinner,
  Splash,
  TestRunner,
  LocalStorage,
  Object: ObjectView,
  Lorem,
  Url: { qs },

  ctx,
  describe,
  trimStringsDeep,
  render,
  find,
};
