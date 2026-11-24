import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => {
  const entry = './src/index.html';
  const sw = './src/-test/-sw.ts';
  const paths = Vite.Config.paths({ app: { entry, sw } });
  return Vite.Config.app({
    paths,
    visualizer: false,
    vitePlugins: [{
      name: 'sys-ui:direct-dev-socket',
      apply: 'serve',
      config({ server }) {
        // The page uses the Cell proxy; Vite's client connects to the dev listener itself.
        if (server?.port) return { server: { ws: { clientPort: server.port } } };
      },
    }],
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', '@sys/std');
      e.chunk('css', '@sys/ui-css');
    },
  });
});
