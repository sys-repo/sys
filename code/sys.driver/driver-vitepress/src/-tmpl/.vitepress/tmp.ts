import type { Plugin } from 'vitepress';

// A custom Vite plugin for dynamic alias resolution
export function dynamicNpmAliasPlugin(): Plugin {
  console.log('dynamicNpmAliasPlugin', dynamicNpmAliasPlugin);

  return {
    name: 'vite:dynamic-npm-alias',
    resolveId(source: string) {
      // Look for module IDs that follow the npm:<lib>@<semver> pattern
      const match = source.match(/^npm:(\w+?)@(\d+\.\d+\.\d+(?:-[\w.]+)?)$/);

      console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→✔`);
      console.log('match', match);

      if (match) {
        const [, lib] = match;
        // Only process specific libraries, e.g., 'react' or 'react-dom'
        if (lib === 'react' || lib === 'react-dom') {
          // Return the alias replacement
          // TEMP 🐷
          console.log('return :: ', lib);
          return lib;
        }
      }
      return null;
    },
  };
}
