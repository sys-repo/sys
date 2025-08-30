import { css } from '@sys/ui-css';
import { LocalStorage } from '@sys/ui-dom';
import { useFactory } from '@sys/ui-factory/adapter/react';
import { ValidationErrors } from '@sys/ui-factory/components/react';
import { Factory } from '@sys/ui-factory/core';

import React from 'react';
import { makePlan, regs } from '../mod.ts';
import { type t } from './common.ts';

type Storage = {};

export function makeRoot(opts: { localstorageKey?: string; state?: t.ImmutableRef } = {}) {
  const defaults: Storage = {};
  const localstorageKey = opts.localstorageKey ?? 'dev:harness';
  const state = opts.state ?? LocalStorage.immutable<Storage>(localstorageKey, defaults);

  const factory = Factory.make(regs);
  const plan = makePlan({ state });

  function App() {
    const catalog = useFactory(factory, plan, { strategy: 'eager', validate: false });
    const { issues, element } = catalog;
    return catalog.ok ? element : <ValidationErrors errors={issues.validation} />;
  }

  return {
    render() {
      return (
        <div className={css({ Absolute: 0, display: 'grid' }).class}>
          <App />
        </div>
      );
    },
    App,
    factory,
    plan,
    state,
  };
}
