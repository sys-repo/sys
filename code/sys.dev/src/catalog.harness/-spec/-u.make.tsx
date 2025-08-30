import { css } from '@sys/ui-css';
import { LocalStorage } from '@sys/ui-dom';
import { useFactory } from '@sys/ui-factory/adapter/react';
import { ValidationErrors } from '@sys/ui-factory/components/react';
import { Factory } from '@sys/ui-factory/core';

import React from 'react';
import { makePlan, regs } from '../mod.ts';

type Storage = {};

export function makeRoot(opts: { localstorageKey?: string } = {}) {
  const defaults: Storage = {};
  const localstorageKey = opts.localstorageKey ?? 'dev:harness';
  const state = LocalStorage.immutable<Storage>(localstorageKey, defaults);

  const factory = Factory.make(regs);
  const plan = makePlan({ state });

  function App() {
    const catalog = useFactory(factory, plan, { strategy: 'eager', validate: false });
    const { issues, element } = catalog;
    return catalog.ok ? element : <ValidationErrors errors={issues.validation} />;
  }

  const element = (
    <React.StrictMode>
      <div className={css({ Absolute: 0, display: 'grid' }).class}>
        <App />
      </div>
    </React.StrictMode>
  );

  return { element, factory, plan, state };
}
