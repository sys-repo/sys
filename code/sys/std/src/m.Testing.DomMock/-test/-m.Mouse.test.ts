import { afterAll, beforeAll, describe, expect, it } from '../../-test.ts';
import { DomMock } from '../mod.ts';

describe('DomMock.Mouse', () => {
  DomMock.init({ beforeAll, afterAll });

  it('creates mouse events with primary bubbling cancelable defaults', () => {
    const event = DomMock.Mouse.event('mousedown');

    expect(event.type).to.eql('mousedown');
    expect(event.bubbles).to.eql(true);
    expect(event.cancelable).to.eql(true);
    expect(event.button).to.eql(0);
  });

  it('preserves explicit native MouseEventInit fields', () => {
    const event = DomMock.Mouse.event('mouseup', {
      button: 2,
      clientX: 123,
      clientY: 456,
      metaKey: true,
    });

    expect(event.button).to.eql(2);
    expect(event.clientX).to.eql(123);
    expect(event.clientY).to.eql(456);
    expect(event.metaKey).to.eql(true);
    expect(event.bubbles).to.eql(true);
  });

  it('fires mouse events to the given target', () => {
    const el = globalThis.document.createElement('button');
    const fired: MouseEvent[] = [];
    el.addEventListener('mousedown', (e) => fired.push(e));

    const res = DomMock.Mouse.down(el, { shiftKey: true });

    expect(res.dispatched).to.eql(true);
    expect(fired).to.eql([res.event]);
    expect(res.event.shiftKey).to.eql(true);
  });

  it('returns cancellation state and event for click dispatch', () => {
    const el = globalThis.document.createElement('a');
    el.addEventListener('click', (e) => e.preventDefault());

    const res = DomMock.Mouse.click(el);

    expect(res.dispatched).to.eql(false);
    expect(res.event.defaultPrevented).to.eql(true);
  });

  it('activates with the simple down/up mouse gesture', () => {
    const el = globalThis.document.createElement('button');
    const fired: string[] = [];
    el.addEventListener('mousedown', (e) => fired.push(`${e.type}:${e.button}`));
    el.addEventListener('mouseup', (e) => fired.push(`${e.type}:${e.button}`));
    el.addEventListener('click', (e) => fired.push(e.type));

    const res = DomMock.Mouse.activate(el, { button: 1 });

    expect(fired).to.eql(['mousedown:1', 'mouseup:1']);
    expect(res.down.event.type).to.eql('mousedown');
    expect(res.up.event.type).to.eql('mouseup');
    expect(res.down.event.button).to.eql(1);
    expect(res.up.event.button).to.eql(1);
  });
});
