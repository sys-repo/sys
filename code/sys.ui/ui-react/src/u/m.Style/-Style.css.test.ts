import { describe, expect, it, type t } from '../../-test.ts';
import { Style, css } from './mod.ts';

describe('Style.css (transform)', () => {
  it('empty', () => {
    const a = css();
    const b = css([]);
    const c = css(...[], false);
    const d = css(null, undefined, [], false, ...[]);

    expect(a.css.name).to.eql('0');
    expect(a.css.styles).to.eql('');

    expect(b).to.eql(a);
    expect(c).to.eql(a);
    expect(d).to.eql(a);
  });

  it('simple', () => {
    const res = Style.css({ fontSize: 16 });
    expect(res.css.styles).to.include('font-size:16px;');
  });

  it('basic merge', () => {
    const a = Style.css({ color: 'red' });
    const b = css({ background: 'blue' });

    const res = Style.css(a, b);
    expect(res.css.styles).to.include('color:red;');
    expect(res.css.styles).to.include('background:blue;');
  });

  it('deep merge', () => {
    const props = { style: { color: 'red' } };
    const styles = { base: css({ background: 'blue' }) };

    const assert = (res: t.ReactCssObject) => {
      expect(res.css.styles).to.include('color:red;');
      expect(res.css.styles).to.include('background:blue;');
    };

    assert(css(styles.base, props.style));
    assert(css(styles.base, css(props.style)));
    assert(css(css(styles.base), css(css(props.style))));
    assert(css([css(styles.base), css(css(props.style))]));
    assert(
      css(
        css([css(styles.base), css(css(props.style))]),
        css([css(styles.base), [css(css([css([[props.style]])]))]]),
      ),
    );
  });

  it('cache name repeats (reused)', () => {
    const props = { style: { color: 'red' } };
    const styles = { base: css({ background: 'blue' }) };

    const a = css(css(styles.base), css(css(props.style)));
    const b = css(css(styles.base), css(css(props.style)));

    expect(a.css.name).to.equal(b.css.name); // NB: cache key (used by emotion-js).
  });

  it('wrapped ← equality', () => {
    const a = css({ color: 'red' });
    const b = css(a);
    const c = css([b]);
    const d = css([a, c], b);
    expect(b).to.eql(a);
    expect(c).to.eql(a);
    expect(d).to.eql(a);
  });
});
