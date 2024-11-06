import { COLORS, DevBase, DevKeyboard, DevWrangle, type t } from '../common';
import { CmdHostStateful } from '../Dev.CmdHost.Stateful';
import { KeyboardActions } from './Keyboard';

type EscapeAction = 'ReloadRootUrl';

type Options = {
  location?: t.UrlInput;
  badge?: t.ImageBadge;
  env?: t.DevEnvVars;
  hrDepth?: number;
  keyboard?: boolean;
  doubleEscapeKeyAction?: null | EscapeAction;
  defaultNamespace?: string;
  autoGrabFocus?: boolean;
  forceDev?: boolean;
  style?: t.CssValue;
};

/**
 * Render a harness with the selected `dev=<namespace>` import
 * or an index list of available specs.
 */
export async function render(
  pkg: { name: string; version: string },
  specs: t.SpecImports,
  options: Options = {},
) {
  const {
    keyboard = true,
    autoGrabFocus = true,
    doubleEscapeKeyAction = 'ReloadRootUrl',
  } = options;
  const url = DevWrangle.Url.navigate.formatDevFlag(options);
  const spec = await DevWrangle.Url.module(url, specs);
  const style = options.style ?? { Absolute: 0, backgroundColor: COLORS.WHITE };

  if (keyboard) {
    DevKeyboard.listen({
      onDoubleEscape() {
        if (spec) KeyboardActions.onDoubleEscape(doubleEscapeKeyAction);
      },
    });
  }

  if (spec) {
    return <DevBase.Harness spec={spec} env={options.env} style={style} />;
  }

  return (
    <CmdHostStateful
      pkg={pkg}
      imports={specs}
      badge={options.badge}
      hrDepth={options.hrDepth}
      autoGrabFocus={autoGrabFocus}
      style={style}
    />
  );
}
