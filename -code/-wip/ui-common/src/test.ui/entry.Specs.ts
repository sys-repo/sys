import type { t } from '../common.ts';

import { pkg } from '../pkg.ts';
export { pkg };
const ns = pkg.name;

export const ModuleSpecs = {
  tmp: () => import('./-tmp.tsx'),

  [`${ns}.tests`]: () => import('./-TestRunner.tsx'),
  // [`${ns}.Button`]: () => import('../ui/Button/-SPEC'),
  // [`${ns}.Button.Copy`]: () => import('../ui/Button/-SPEC.CopyButton'),
  // [`${ns}.Button.Switch`]: () => import('../ui/Button.Switch/-SPEC'),
  // [`${ns}.Card`]: () => import('../ui/Card/-SPEC'),
  // [`${ns}.Center`]: () => import('../ui/Center/-SPEC'),
  // [`${ns}.Chip`]: () => import('../ui/Chip/-SPEC'),
  // [`${ns}.CmdBar`]: () => import('../ui/CmdBar/-SPEC'),
  // [`${ns}.CmdBar.Stateful`]: () => import('../ui/CmdBar.Stateful/-SPEC'),
  // [`${ns}.CmdBar.Dev`]: () => import('../ui/CmdBar.Dev/-SPEC'),
  // [`${ns}.CmdBar.Prefix`]: () => import('../ui/CmdBar.Prefix/-SPEC'),
  // [`${ns}.ContainerQuery`]: () => import('../ui/ContainerQuery/-SPEC'),
  // [`${ns}.EdgePosition`]: () => import('../ui/EdgePosition/-SPEC'),
  // [`${ns}.EdgePosition.Selector`]: () => import('../ui/EdgePosition.Selector/-SPEC'),
  // [`${ns}.Flip`]: () => import('../ui/Flip/-SPEC'),
  // [`${ns}.Grid`]: () => import('../ui/Grid/-dev/-SPEC'),
  // [`${ns}.HashView`]: () => import('../ui/HashView/-SPEC'),
  // [`${ns}.Icon`]: () => import('../ui/Icon/-SPEC'),
  // [`${ns}.IFrame`]: () => import('../ui/IFrame/-SPEC'),
  // [`${ns}.KeyHint`]: () => import('../ui/KeyHint/-SPEC'),
  // [`${ns}.KeyHint.Combo`]: () => import('../ui/KeyHint/-SPEC.Combo'),
  // [`${ns}.Layout.Split`]: () => import('../ui/Layout.Split/-SPEC'),
  // [`${ns}.Measure`]: () => import('../ui.tools/Measure/-SPEC'),
  // [`${ns}.Module.Loader`]: () => import('../ui/Module.Loader/-SPEC'),
  // [`${ns}.Module.Loader.Stateful`]: () => import('../ui/Module.Loader/-SPEC.Stateful'),
  // [`${ns}.RenderCount`]: () => import('../ui/RenderCount/-SPEC'),
  // [`${ns}.PageStack`]: () => import('../ui/PageStack/-SPEC'),
  // [`${ns}.ProgressBar`]: () => import('../ui/ProgressBar/-SPEC'),
  // [`${ns}.PropList`]: () => import('../ui/PropList/-dev/-SPEC'),
  // [`${ns}.PropList.FieldSelector`]: () => import('../ui/PropList.FieldSelector/-SPEC'),
  // [`${ns}.PropList.InfoPanel`]: () => import('../ui/PropList.InfoPanel/-SPEC'),
  // [`${ns}.ObjectView`]: () => import('../ui/ObjectView/-SPEC'),
  // [`${ns}.QRCode`]: () => import('../ui/QRCode/-SPEC'),
  // [`${ns}.Slider`]: () => import('../ui/Slider/-SPEC'),
  // [`${ns}.Spinner`]: () => import('../ui/Spinner/-SPEC'),
  // [`${ns}.Text`]: () => import('../ui/Text/-dev/-SPEC'),
  // [`${ns}.Text.Font`]: () => import('../ui/Text.Font/-SPEC'),
  // [`${ns}.Text.Input`]: () => import('../ui/Text.Input/-SPEC'),
  // [`${ns}.Text.Keyboard`]: () => import('../ui/Text.Keyboard/-dev/-SPEC'),
  // [`${ns}.Text.Secret`]: () => import('../ui/Text.Secret/-SPEC'),
  // [`${ns}.Text.Syntax`]: () => import('../ui/Text.Syntax/-SPEC'),
  // [`${ns}.Textbox.Sync`]: () => import('../ui/Textbox.Sync/-SPEC'),
} as t.SpecImports;

export const HookSpecs = {
  // [`${ns}.hook.useFocus`]: () => import('../ui.use/use.Focus/-SPEC'),
  // [`${ns}.hook.useMouse`]: () => import('../ui.use/use/-SPEC.useMouse'),
  // [`${ns}.hook.useDragTarget`]: () => import('../ui.use/use.DragTarget/-dev/-SPEC'),
  // [`${ns}.hook.useSizeObserver`]: () => import('../ui.use/use.SizeObserver/-SPEC'),
  // [`${ns}.hook.useProxy`]: () => import('../ui.use/use.Proxy/-SPEC'),
} as t.SpecImports;

export const DevSpecs = {
  // [`sys.ui.dev.TestRunner.Results`]: () => import('../ui.dev/TestRunner/-dev/-SPEC.Results'),
  // [`sys.ui.dev.TestRunner.PropList`]: () => import('../ui.dev/TestRunner/-dev/-SPEC.PropList'),
  // 'sys.ui.dev.TestRunner.PropList.runner': () =>
  //   import('../ui.dev/TestRunner/-dev/-SPEC.PropList.runner'),
  // [`sys.ui.dev.Cmd.Host`]: () => import('../ui.dev/Dev.CmdHost/-SPEC'),
  // [`sys.ui.dev.ModuleList`]: () => import('../ui.dev/-SPEC/-SPEC.ModuleList'),
  // [`sys.ui.dev.DevSplash`]: () => import('../ui.dev/Dev.Splash/-SPEC'),
  // [`sys.ui.dev.DevTools`]: () => import('../ui.dev/DevTools/-SPEC'),
  // [`sys.ui.dev.DevTools.Hr`]: () => import('../ui.dev/DevTools.Hr/-SPEC'),
  // [`sys.ui.dev.DevTools.Button`]: () => import('../ui.dev/DevTools.Button/-SPEC'),
  // [`sys.ui.dev.DevTools.Boolean`]: () => import('../ui.dev/DevTools.Boolean/-SPEC'),
  // [`sys.ui.dev.DevTools.Textbox`]: () => import('../ui.dev/DevTools.Textbox/-SPEC'),
  // [`sys.ui.dev.DevTools.Bdd`]: () => import('../ui.dev/DevTools.Bdd/-SPEC'),
  // [`sys.ui.dev.DevTools.Title`]: () => import('../ui.dev/DevTools.Title/-SPEC'),
  // [`sys.ui.dev.DevTools.Todo`]: () => import('../ui.dev/DevTools.Todo/-SPEC'),
} as t.SpecImports;

export const SampleSpecs = {
  // [`sys.ui.sample.Random`]: () => import('../ui.sample/ui.Random/-SPEC'),
  // [`sys.ui.sample.Signals`]: () => import('../ui.sample/ui.Signal/-SPEC'),
} as t.SpecImports;

export const Specs = {
  ...ModuleSpecs,
  ...HookSpecs,
  ...DevSpecs,
  ...SampleSpecs,
} as t.SpecImports;

export default Specs;
