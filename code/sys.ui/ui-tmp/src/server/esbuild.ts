import * as esbuild from 'npm:esbuild';
import { denoPlugins } from 'jsr:@luca/esbuild-deno-loader';

const result = await esbuild.build({
  plugins: [...denoPlugins()],
  entryPoints: ['https://deno.land/std@0.185.0/bytes/mod.ts', './src/ui/Components.tsx'],
  // outfile: './dist/bytes.esm.js',
  outdir: './dist',
  bundle: true,
  format: 'esm',
});

console.log('result', result);

esbuild.stop();
