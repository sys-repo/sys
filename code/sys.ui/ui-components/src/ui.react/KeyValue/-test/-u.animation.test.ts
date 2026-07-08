import { describe, expect, it, type t } from '../../../-test.ts';
import { hasStableProjectionIdentity, toProjectionAnimation } from '../u/u.animation.ts';

const items: t.KeyValue.Item[] = [
  { id: 'a', k: 'alpha' },
  { id: 'b', k: 'bravo' },
];

describe('KeyValue.u.animation', () => {
  it('keeps projection animation opt-in', () => {
    expect(toProjectionAnimation(undefined, items)).to.eql(undefined);
    expect(toProjectionAnimation(false, items)).to.eql(undefined);
    expect(toProjectionAnimation({ enabled: false, projection: true }, items)).to.eql(undefined);
    expect(toProjectionAnimation({ projection: false }, items)).to.eql(undefined);
  });

  it('resolves default direct-child projection animation', () => {
    const res = toProjectionAnimation(true, items);
    expect(res).to.eql({ transition: { duration: 0.18, ease: 'easeOut' } });
  });

  it('normalizes custom projection transition options', () => {
    const res = toProjectionAnimation(
      { projection: { duration: 250 as t.Msecs, ease: 'linear' } },
      items,
    );
    expect(res).to.eql({ transition: { duration: 0.25, ease: 'linear' } });
  });

  it('clamps negative projection durations to zero seconds', () => {
    const res = toProjectionAnimation({ projection: { duration: -10 as t.Msecs } }, items);
    expect(res?.transition.duration).to.eql(0);
    expect(res?.transition.ease).to.eql('easeOut');
  });

  it('requires stable root direct-child identity', () => {
    const missing: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { k: 'missing id' }];
    const blank: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { id: ' ', k: 'blank id' }];
    const duplicate: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'a', k: 'duplicate id' },
    ];
    expect(hasStableProjectionIdentity(items)).to.eql(true);
    expect(hasStableProjectionIdentity(missing)).to.eql(false);
    expect(hasStableProjectionIdentity(blank)).to.eql(false);
    expect(hasStableProjectionIdentity(duplicate)).to.eql(false);
    expect(toProjectionAnimation(true, missing)).to.eql(undefined);
    expect(toProjectionAnimation(true, blank)).to.eql(undefined);
    expect(toProjectionAnimation(true, duplicate)).to.eql(undefined);
  });

  it('does not require nested group member identity for parent-level projection', () => {
    const grouped: t.KeyValue.Item[] = [
      { id: 'group:status', kind: 'group', items: [{ k: 'nested row without id' }] },
      { id: 'events', k: 'events' },
    ];
    expect(hasStableProjectionIdentity(grouped)).to.eql(true);
    expect(toProjectionAnimation(true, grouped)).to.eql({
      transition: { duration: 0.18, ease: 'easeOut' },
    });
  });
});
