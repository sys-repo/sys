import { css } from '@sys/ui-css';
import { useFactory } from '@sys/ui-factory/adapter/react';
import { ValidationErrors } from '@sys/ui-factory/components/react';
import { Factory } from '@sys/ui-factory/core';

import React from 'react';
import { makePlan, regs } from '../ui/catalog.harness/mod.ts';

export async function makeRoot() {
  const factory = Factory.make(regs);
  const plan = makePlan();

  function App() {
    const catalog = useFactory(factory, plan, { strategy: 'eager', validate: false });
    const { issues, element } = catalog;
    return catalog.ok ? element : <ValidationErrors errors={issues.validation} />;
  }

  return (
    <React.StrictMode>
      <div className={css({ Absolute: 0, display: 'grid' }).class}>
        <App />
      </div>
    </React.StrictMode>
  );
}
