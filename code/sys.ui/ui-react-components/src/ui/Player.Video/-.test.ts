import { describe, expect, it } from '../../-test.ts';
import { playerSignalsFactory } from './mod.ts';

describe('VideoPlayer', () => {
  it('initial values', () => {
    const s = playerSignalsFactory();
    expect(s.props.playing.value).to.eql(false);
    expect(s.props.currentTime.value).to.eql(0);
    expect(s.props.jumpTo.value).to.eql(undefined);

    s.props.playing.value = true;
    expect(s.props.playing.value).to.eql(true);
  });

  it('jumpTo() method → props.jumpTo', () => {
    const s = playerSignalsFactory();
    expect(s.props.jumpTo.value).to.eql(undefined);

    s.jumpTo(10);
    expect(s.props.jumpTo.value).to.eql({ time: 10, play: true });

    s.jumpTo(15, false);
    expect(s.props.jumpTo.value).to.eql({ time: 15, play: false });
  });
});
