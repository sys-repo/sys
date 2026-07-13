import { afterAll, beforeAll, describe, DomMock, expect, it, Rx } from '../../-test.ts';
import { Keyboard } from '../mod.ts';
import { keydown, releaseKey } from './u.fixture.ts';

describe('Keyboard.Monitor event ownership', () => {
  DomMock.init({ beforeAll, afterAll });

  it('observe only → does not prevent default or stop DOM propagation', () => {
    const key = 'o';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyO', () => calls.push('subscriber'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(false);
      expect(calls).to.eql(['subscriber', 'target']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('pattern subscribers ignore native defaultPrevented as ownership', () => {
    const key = 'f';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    const keyboard = Keyboard.until();
    keyboard.on('KeyF', () => calls.push('subscriber'));

    try {
      const ev = keydown(key);
      ev.preventDefault();
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(true);
      expect(calls).to.eql(['subscriber']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('preventDefault() → prevents browser default without stopping keyboard or DOM propagation', () => {
    const key = 'a';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyA', (e) => {
      calls.push('first');
      e.preventDefault();
    });
    keyboard.on('KeyA', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(true);
      expect(calls).to.eql(['first', 'second', 'target']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('stopKeyboardPropagation() → suppresses later pattern subscribers without preventing default or stopping DOM propagation', () => {
    const key = 'b';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyB', (e) => {
      calls.push('first');
      e.stopKeyboardPropagation();
    });
    keyboard.on('KeyB', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(false);
      expect(calls).to.eql(['first', 'target']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('preventDefault() + stopKeyboardPropagation() → combines browser default prevention and keyboard-route ownership without stopping DOM propagation', () => {
    const key = 'c';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyC', (e) => {
      calls.push('first');
      e.preventDefault();
      e.stopKeyboardPropagation();
    });
    keyboard.on('KeyC', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(true);
      expect(calls).to.eql(['first', 'target']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('consume() → prevents default, stops keyboard propagation, and stops DOM propagation', () => {
    const key = 'd';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyD', (e) => {
      calls.push('first');
      e.consume();
    });
    keyboard.on('KeyD', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(true);
      expect(calls).to.eql(['first']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('handled() → remains destructive consume alias', () => {
    const key = 'e';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyE', (e) => {
      calls.push('first');
      e.handled();
    });
    keyboard.on('KeyE', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(true);
      expect(calls).to.eql(['first']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('event.handled() → remains destructive compatibility escape hatch', () => {
    const key = 'j';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyJ', (e) => {
      calls.push('first');
      e.event.handled();
    });
    keyboard.on('KeyJ', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(true);
      expect(calls).to.eql(['first']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('stopKeyboardPropagation() → leaves event.is.handled as native default-prevented state', () => {
    const key = 'h';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    const handled: boolean[] = [];

    const keyboard = Keyboard.until();
    keyboard.on('KeyH', (e) => {
      calls.push('first');
      e.stopKeyboardPropagation();
      handled.push(e.event.is.handled);
    });
    keyboard.on('KeyH', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(false);
      expect(calls).to.eql(['first']);
      expect(handled).to.eql([false]);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('stopKeyboardPropagation() → state observers still receive keyboard events', () => {
    const key = 'g';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    const observed: string[] = [];

    const keyboard = Keyboard.until();
    keyboard.$.pipe(Rx.filter((e) => e.last?.code === 'KeyG')).subscribe((e) => {
      if (e.last) observed.push(e.last.code);
    });
    keyboard.on('KeyG', (e) => {
      calls.push('first');
      e.stopKeyboardPropagation();
    });
    keyboard.on('KeyG', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(calls).to.eql(['first']);
      expect(observed).to.eql(['KeyG']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });

  it('control calls are idempotent and monotonic', () => {
    const key = 'i';
    const target = document.createElement('button');
    document.body.appendChild(target);

    const calls: string[] = [];
    target.addEventListener('keydown', () => calls.push('target'));

    const keyboard = Keyboard.until();
    keyboard.on('KeyI', (e) => {
      calls.push('first');
      e.preventDefault();
      e.preventDefault();
      e.stopKeyboardPropagation();
      e.stopKeyboardPropagation();
    });
    keyboard.on('KeyI', () => calls.push('second'));

    try {
      const ev = keydown(key);
      target.dispatchEvent(ev);

      expect(ev.defaultPrevented).to.eql(true);
      expect(calls).to.eql(['first', 'target']);
    } finally {
      releaseKey(key);
      keyboard.dispose();
      target.remove();
    }
  });
});
