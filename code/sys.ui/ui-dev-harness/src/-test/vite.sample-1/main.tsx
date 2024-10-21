import { default as Pkg } from '../../../deno.json' with { type: 'json' };

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';

console.info('Pkg', Pkg);
document.title = Pkg.name;

import { SAMPLES } from '../../ui/m.Dev.Harness/-test/sample.specs.unit-test/mod.ts';
import { Dev } from '../../ui/m.Dev.Harness/mod.ts';

import { Color } from '@sys/ui-dom';

console.log("@sys/ui-dev/:react:Dev", Dev)


const el = <Dev.Harness
  spec={SAMPLES.Sample1}
  style={{ 
    Absolute: 0, 
    backgroundColor: Color.WHITE,
    backdropFilter: 'blur(5px)'
  }}
  />

/**
 * Entry Point.
*/
const root = createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App style={{border: `solid 1px blue`, color: 'blue',}}/>
    {/* <DevHarness/> */}
    {el}
  </StrictMode>,
);
