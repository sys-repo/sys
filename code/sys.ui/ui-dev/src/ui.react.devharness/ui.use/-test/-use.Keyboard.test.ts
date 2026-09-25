import { afterAll, beforeAll, describe, DomMock, expect, it, Time } from '../../-test.ts';
import { listen } from '../use.Keyboard.ts';

describe('useKeyboard', () => {
  DomMock.init({ beforeAll, afterAll });

  it('CMD+Enter opens the DevHarness index from root', async () => {
    window.location.href = 'https://example.com/';
    const keyboard = listen();

    fireCommandEnter();
    await Time.wait(0);

    expect(window.location.href).to.equal('https://example.com/?dev=true');
    keyboard.dispose();
  });

  it('CMD+Shift+Enter navigates from a spec to the DevHarness index', async () => {
    window.location.href = 'https://example.com/?dev=KeyValue';
    const keyboard = listen();

    fireCommandShiftEnter();
    await Time.wait(0);

    expect(window.location.href).to.equal('https://example.com/?dev=true');
    keyboard.dispose();
  });

  it('CMD+Shift+Enter navigates from the DevHarness index to root', async () => {
    window.location.href = 'https://example.com/?dev=true';
    const keyboard = listen();

    fireCommandShiftEnter();
    await Time.wait(0);

    expect(window.location.href).to.equal('https://example.com/');
    keyboard.dispose();
  });

  it('two CMD+Shift+Enter commands navigate from a spec through the index to root', async () => {
    window.location.href = 'https://example.com/?dev=KeyValue';
    const keyboard = listen();

    fireCommandShiftEnter();
    await Time.wait(0);
    fireCommandShiftEnter();
    await Time.wait(0);

    expect(window.location.href).to.equal('https://example.com/');
    keyboard.dispose();
  });

  it('CMD+Shift+Enter navigates from current event modifiers', async () => {
    window.location.href = 'https://example.com/?dev=true';
    const keyboard = listen();

    fireEnter({ metaKey: true, shiftKey: true });
    await Time.wait(0);

    expect(window.location.href).to.equal('https://example.com/');
    keyboard.dispose();
  });

  it('CMD+Shift+Enter treats ?d as the DevHarness index alias', async () => {
    window.location.href = 'https://example.com/?d';
    const keyboard = listen();

    fireCommandShiftEnter();
    await Time.wait(0);

    expect(window.location.href).to.equal('https://example.com/');
    keyboard.dispose();
  });
});

/**
 * Helpers:
 */
function fireKeydown(key: string, init?: KeyboardEventInit) {
  DomMock.Keyboard.fire(DomMock.Keyboard.keydownEvent(key, init));
}

function fireKeyup(key: string, init?: KeyboardEventInit) {
  DomMock.Keyboard.fire(DomMock.Keyboard.keyupEvent(key, init));
}

function fireEnter(init?: KeyboardEventInit) {
  fireKeydown('Enter', init);
  fireKeyup('Enter', init);
}

function fireCommandEnter() {
  fireKeydown('Meta', { code: 'MetaLeft', metaKey: true });
  fireEnter({ metaKey: true });
  fireKeyup('Meta', { code: 'MetaLeft' });
}

function fireCommandShiftEnter() {
  fireKeydown('Meta', { code: 'MetaLeft', metaKey: true });
  fireKeydown('Shift', { code: 'ShiftLeft', metaKey: true, shiftKey: true });
  fireEnter({ metaKey: true, shiftKey: true });
  fireKeyup('Shift', { code: 'ShiftLeft', metaKey: true });
  fireKeyup('Meta', { code: 'MetaLeft' });
}
