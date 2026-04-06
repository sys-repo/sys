import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'npm:vite';

export default defineConfig(() => {
  const entry = './src/-test/index.html';
  const sw = 'src/-test/-sw.ts';
  const paths = Vite.Config.paths({ app: { entry, sw } });
  return Vite.Config.app({
    visualizer: false,
    paths,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
      e.chunk('css', ['@sys/ui-css']);
      e.chunk('devharness', ['@sys/ui-react-devharness']);
      e.chunk('yaml', ['yaml']);
      e.chunk('motion', ['motion']);
      e.chunk('icons', ['react-icons']);
      e.chunk('automerge', ['@automerge/automerge', '@automerge/automerge-repo']);
      e.chunk('prosemirror', [
        '@automerge/prosemirror',
        'prosemirror-example-setup',
        'prosemirror-schema-basic',
        'prosemirror-state',
        'prosemirror-view',
      ]);
    },
  });
});
