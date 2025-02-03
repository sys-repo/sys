import type { Plugin } from 'vitepress';
import { Esm } from '@sys/std/esm';

// RegExp

// A custom Vite plugin for dynamic alias resolution
export function dynamicNpmAliasPlugin(): Plugin {
  console.log('dynamicNpmAliasPlugin', dynamicNpmAliasPlugin);

  return {
    name: 'vite:dynamic-npm-alias',
    enforce: 'pre', // Ensure this plugin runs before built-in alias resolution.
    resolveId(source: string) {
      // Look for module IDs that follow the npm:<lib>@<semver> pattern
      const match = source.match(/^npm:(\w+?)@(\d+\.\d+\.\d+(?:-[\w.]+)?)$/);

      const m = Esm.parse(source);
      // console.log('m', m);

      if (m.name.startsWith('react')) {
        console.log('m', m);
      }

      if (m.prefix === 'npm') {
        console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔`);
        console.log('npm match::', m);
        return m.name;
      }

      //       if (m.name === 'react') {
      //         console.log('m', m);
      //       }
      //
      //       if (source === 'react') {
      //         // TEMP | 🐷
      //         console.log('match', match, source);
      //       }
      //
      //       if (match) {
      //         const [, lib] = match;
      //         // Only process specific libraries, e.g., 'react' or 'react-dom'
      //         console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔`);
      //         if (lib === 'react' || lib === 'react-dom') {
      //           // Return the alias replacement
      //           // TEMP 🐷
      //           console.log('return :: ', lib);
      //           return lib;
      //         }
      //       }
      return null;
    },
  };
}
