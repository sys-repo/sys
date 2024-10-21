import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Pkg } from '../../pkg.ts';

console.info('Pkg', Pkg);
document.title = Pkg.name;

import { SAMPLES } from '../../ui/m.Dev.Harness/-test/sample.specs.unit-test/mod.ts';
import { Dev } from '../../ui/m.Dev.Harness/mod.ts';

console.log('@sys/ui-dev/:react:Dev', Dev);
const elRoot = <Dev.Harness spec={SAMPLES.Sample1} style={{ Absolute: 0 }} />;

/**
 * Entry Point.
 */
const root = createRoot(document.getElementById('root'));
root.render(<StrictMode>{elRoot}</StrictMode>);
