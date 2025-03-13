import { Spec, expect } from '../-ui.test.ts';
import { Player } from '../../mod.ts';

import { type t } from './common.ts';
import { Thumbnails } from './mod.ts';

export default Spec.describe('VideoPlayer', (e) => {
  e.it('API', (e) => {
    expect(Player.Timestamp.Thumbnails).to.equal(Thumbnails);
  });

  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.subject.size([520, null]).render((e) => {
      return <Player.Timestamp.Thumbnails timestamps={sampleTimestamps} />;
    });
  });
});

export const sampleTimestamps: t.VideoTimestamps = {
  '00:00:01.000': {
    image: '/images/intro/slc.png',
  },
  '00:01:34.000': {
    image: '/images/intro/strategy.png',
  },
  '00:01:35.001': {
    image: '/images/intro/strategy.png',
  },
  '00:01:38.002': {
    image: '/images/intro/strategy.png',
  },
  '00:01:60.003': {
    image: '/images/intro/strategy.png',
  },
  '00:01:68.004': {
    image: '/images/intro/strategy.png',
  },
  '00:02:23.000': {
    image: '/images/intro/strategy-map.png',
  },
  '00:03:01.001': {
    image:
      'https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwallsdesk.com%2Fwp-content%2Fuploads%2F2018%2F03%2Flizard-Pictures.jpg&f=1&nofb=1&ipt=911857ca72652ef79180dfb173a382d9df8624f0d745fec33b982487db39048f&ipo=images',
  },
  '00:01:05.002': {
    image: '/images/intro/strategy-map.png',
  },
};
