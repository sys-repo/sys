import React from 'react';
import { DevActions } from 'sys.ui.dev';

import { Sample, SampleProps } from './Sample';

type Ctx = { props: SampleProps };

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace('ui.Image.Svg')
  .context((e) => {
    if (e.prev) return e.prev;
    return {
      props: { width: 600, color: 'dark' },
    };
  })

  .items((e) => {
    e.title('<Svg>');

    e.button('width: 600', (e) => (e.ctx.props.width = 600));
    e.button('width: 200', (e) => (e.ctx.props.width = 200));

    e.hr(1, 0.1);

    e.button('color: dark', (e) => (e.ctx.props.color = 'dark'));
    e.button('color: blue', (e) => (e.ctx.props.color = 'blue'));

    e.hr();
  })

  .subject((e) => {
    e.settings({
      host: { background: -0.04 },
      layout: { cropmarks: -0.2 },
    });

    e.render(<Sample {...e.ctx.props} />);
  });

export default actions;
