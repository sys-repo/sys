import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';

/**
 * Vite "common" setup.
 */
export default defineConfig(() => {
  return Vite.Plugin.common({
    mutate(e) {
      e.ws?.log();
    },
  });
});
