import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  return await Vite.Config.app({
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
    },
  });
});
