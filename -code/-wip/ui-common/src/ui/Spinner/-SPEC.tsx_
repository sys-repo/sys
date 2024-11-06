import { cloneElement } from 'react';
import { Spinner } from '.';
import { Dev, Pkg, type t } from '../../test.ui';

type T = { theme?: t.CommonTheme; el?: JSX.Element };
const initial: T = {};

/**
 * Spec
 */
const name = 'Spinner';
export default Dev.describe('Spinner', (e) => {
  const puff = async (dev: t.DevTools<T>, props?: t.SpinnerPuffProps) => {
    return dev.change((d) => (d.el = <Spinner.Puff {...props} />));
  };

  const bar = async (dev: t.DevTools<T>, props?: t.SpinnerBarProps) => {
    return dev.change((d) => (d.el = <Spinner.Bar {...props} />));
  };

  const orbit = async (dev: t.DevTools<T>, props?: t.SpinnerOrbitProps) => {
    return dev.change((d) => (d.el = <Spinner.Orbit {...props} />));
  };

  type LocalStore = { theme?: t.CommonTheme };
  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({ theme: undefined });

  e.it('init', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    await state.change((d) => (d.theme = local.theme));

    dev.ctx.debug.width(300);
    dev.ctx.subject.render<T>((e) => {
      const { el, theme } = e.state;
      Dev.Theme.background(dev, theme);
      return el ? cloneElement(el, { theme }) : null;
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    await puff(dev);

    Dev.Theme.switch(dev, ['theme'], (next) => (local.theme = next));

    dev.hr(5, 20);

    dev.section('Puff', (dev) => {
      dev.button('size: 16px', (e) => puff(dev, { size: 16 }));
      dev.button('size: 32px (default)', (e) => puff(dev, {}));
      dev.button('size: 48px', (e) => puff(dev, { size: 48 }));
    });

    dev.hr();

    dev.section('Bar', (dev) => {
      dev.button('width: 20px', (e) => bar(dev, { width: 20 }));
      dev.button('width: 30px', (e) => bar(dev, { width: 30 }));
      dev.button('width: 100px (default)', (e) => bar(dev, {}));
      dev.button('width: 256px', (e) => bar(dev, { width: 256 }));
    });

    dev.hr();

    dev.section('Orbit', (dev) => {
      dev.button('size: 16px', (e) => orbit(dev, { size: 16 }));
      dev.button('size: 32px (default)', (e) => orbit(dev, {}));
      dev.button('size: 48px', (e) => orbit(dev, { size: 48 }));
    });

    dev.hr();
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = e.state;
      return <Dev.Object name={name} data={data} expand={1} fontSize={11} />;
    });
  });
});
