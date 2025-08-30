import { css } from '@sys/ui-css';
import { useFactory } from '@sys/ui-factory/adapter/react';
import { ValidationErrors } from '@sys/ui-factory/components/react';
import { Factory } from '@sys/ui-factory/core';

import { makePlan, regs } from '../mod.ts';
import { type t } from './common.ts';

export function makeRoot(
  opts: { state?: t.ImmutableRef; theme?: t.CommonTheme; debug?: boolean } = {},
) {
  const { state, theme, debug } = opts;

  /**
   * Factory:
   */
  const factory = Factory.make(regs);
  const plan = makePlan({ state, theme, debug });

  /**
   * View:
   */
  function App() {
    const catalog = useFactory(factory, plan, { strategy: 'eager', validate: false });
    const { issues, element } = catalog;
    return catalog.ok ? element : <ValidationErrors errors={issues.validation} />;
  }

  /**
   * API:
   */
  return {
    App,
    factory,
    plan,
    state,
    render() {
      return (
        <div className={css({ Absolute: 0, display: 'grid' }).class}>
          <App />
        </div>
      );
    },
  };
}
