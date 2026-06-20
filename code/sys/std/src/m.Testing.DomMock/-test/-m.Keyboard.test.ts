import { afterAll, beforeAll, describe, expect, it } from '../../-test.ts';
import { DomMock } from '../mod.ts';

describe('DomMock.Keyboard', () => {
  DomMock.init({ beforeAll, afterAll });

  it('creates the default keydown event', () => {
    const event = DomMock.Keyboard.keydownEvent();

    expect(event.type).to.eql('keydown');
    expect(event.key).to.eql('z');
    expect(event.code).to.eql('KeyZ');
    expect(event.keyCode).to.eql(90);
  });

  it('infers named key code values', () => {
    const event = DomMock.Keyboard.keydownEvent('Escape');

    expect(event.key).to.eql('Escape');
    expect(event.code).to.eql('Escape');
    expect(event.keyCode).to.eql(27);
  });

  it('infers digit key code values', () => {
    const event = DomMock.Keyboard.keydownEvent('1');

    expect(event.key).to.eql('1');
    expect(event.code).to.eql('Digit1');
    expect(event.keyCode).to.eql(49);
  });

  it('preserves explicit code and modifier init', () => {
    const event = DomMock.Keyboard.event('keydown', 'Escape', 27, 'Escape', { metaKey: true });

    expect(event.key).to.eql('Escape');
    expect(event.code).to.eql('Escape');
    expect(event.keyCode).to.eql(27);
    expect(event.metaKey).to.eql(true);
  });

  it('supports keydown event init modifiers', () => {
    const event = DomMock.Keyboard.keydownEvent('Escape', { metaKey: true });

    expect(event.key).to.eql('Escape');
    expect(event.code).to.eql('Escape');
    expect(event.keyCode).to.eql(27);
    expect(event.metaKey).to.eql(true);
  });

  it('fires event', () => {
    const fired: KeyboardEvent[] = [];
    globalThis.document.addEventListener('keydown', (e: KeyboardEvent) => fired.push(e));
    globalThis.document.addEventListener('keydown', (_e: KeyboardEvent) => {
      /* handle keyboard event */
    });

    const event = DomMock.Keyboard.keydownEvent();
    DomMock.Keyboard.fire(event);

    expect(fired.length).to.eql(1);
    expect(fired[0]).to.equal(event);
  });

  it('throw: mock not poly-filled', () => {
    DomMock.unpolyfill();
    const fn = () => DomMock.Keyboard.fire();
    expect(fn).to.throw(/Cannot read properties of undefined/);
  });
});
