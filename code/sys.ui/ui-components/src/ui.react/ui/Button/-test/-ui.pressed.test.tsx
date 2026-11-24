import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Button } from '../mod.ts';
import { button, contentTransform, key, mouse, touch } from './u.fixture.ts';

const defaultOffset = 'translateX(0px) translateY(1px)';

describe('Button: pressed feedback', () => {
  // Generated stylesheet rules share the document's lifetime.
  DomMock.init({ beforeAll, afterAll });

  for (const input of ['Enter', ' '] as const) {
    const name = input === ' ' ? 'Space' : input;
    it(`${name}: focus → held offset → release, without pointer hover`, async () => {
      const events: string[] = [];
      let flags = { over: false, down: false };
      const res = await TestReact.render(
        <Button
          label='Action'
          opacity={({ is }) => {
            flags = { over: is.over, down: is.down };
            return 1;
          }}
          onClick={() => events.push('action')}
          onMouseDown={() => events.push('mouse-down')}
          onMouseUp={() => events.push('mouse-up')}
        />,
      );
      try {
        const root = button(res.container);
        React.act(() => root.focus());
        expect(contentTransform(root)).to.eql('none');

        key(root, 'keydown', input);
        const view = root.ownerDocument.defaultView!;
        const rootTransform = view.getComputedStyle(root).transform || 'none';
        expect(rootTransform).to.eql('none');
        expect(contentTransform(root)).to.eql(defaultOffset);
        expect(flags).to.eql({ over: false, down: true });
        expect(events).to.eql(input === 'Enter' ? ['action'] : []);

        key(root, 'keydown', input, { repeat: true });
        expect(contentTransform(root)).to.eql(defaultOffset);
        key(root, 'keyup', input === 'Enter' ? ' ' : 'Enter');
        expect(contentTransform(root)).to.eql(defaultOffset);

        key(root, 'keyup', input);
        expect(contentTransform(root)).to.eql('none');
        expect(flags).to.eql({ over: false, down: false });
        key(root, 'keyup', input);
        expect(events).to.eql(['action']);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('pointer release, leave, or touch cancellation → keep the keyboard-held offset', async () => {
    let actions = 0;
    const offset = 'translateX(2px) translateY(3px)';
    const res = await TestReact.render(
      <Button label='Action' pressedOffset={[2, 3]} onClick={() => actions++} />,
    );
    try {
      const root = button(res.container);
      React.act(() => root.focus());
      mouse(root, 'mouseover', { relatedTarget: document.body });
      mouse(root, 'mousedown');
      key(root, 'keydown', ' ');
      expect(contentTransform(root)).to.eql(offset);

      mouse(root, 'mouseup');
      expect(actions).to.eql(1);
      expect(contentTransform(root)).to.eql(offset);
      mouse(root, 'mouseout', { relatedTarget: document.body });
      expect(contentTransform(root)).to.eql(offset);
      touch(root, 'touchcancel');
      expect(contentTransform(root)).to.eql(offset);

      key(root, 'keyup', ' ');
      expect(contentTransform(root)).to.eql('none');
      expect(actions).to.eql(2);
    } finally {
      React.act(() => res.dispose());
    }
  });

  const childReleaseCases = [
    { keyboardHeld: false, stopRelease: false },
    { keyboardHeld: true, stopRelease: false },
    { keyboardHeld: false, stopRelease: true },
    { keyboardHeld: true, stopRelease: true },
  ];
  for (const { keyboardHeld, stopRelease } of childReleaseCases) {
    const release = stopRelease ? 'child stops mouseup' : 'mouse release over a child';
    const outcome = keyboardHeld ? 'keep only keyboard feedback' : 'clear pressed feedback';
    it(`${release} → ${outcome}`, async () => {
      let actions = 0;
      const releases: string[] = [];
      const res = await TestReact.render(
        <Button
          onClick={() => actions++}
          onMouseUp={() => releases.push('up')}
          onMouse={(e) => {
            if (e.action === 'MouseUp') releases.push('MouseUp');
          }}
        >
          <button
            type='button'
            onMouseUp={(e) => {
              releases.push('child');
              if (stopRelease) e.stopPropagation();
            }}
          >
            Child
          </button>
        </Button>,
      );
      try {
        const root = button(res.container);
        const child = root.querySelector('button')!;
        React.act(() => root.focus());
        mouse(root, 'mouseover', { relatedTarget: document.body });
        mouse(root, 'mousedown');
        if (keyboardHeld) key(root, 'keydown', ' ');
        expect(contentTransform(root)).to.eql(defaultOffset);

        // Crossing within the root does not leave it or change focus.
        mouse(root, 'mouseout', { relatedTarget: child });
        mouse(child, 'mouseover', { relatedTarget: root });
        const up = mouse(child, 'mouseup');
        expect(up.defaultPrevented).to.eql(false);
        expect(releases).to.eql(['child']);
        expect(document.activeElement).to.equal(root);
        expect(contentTransform(root)).to.eql(keyboardHeld ? defaultOffset : 'none');
        expect(actions).to.eql(0);

        if (keyboardHeld) key(root, 'keyup', ' ');
        expect(contentTransform(root)).to.eql('none');
        const keyboardActions = keyboardHeld ? 1 : 0;
        expect(actions).to.eql(keyboardActions);

        // No stale mouse eligibility; a fresh gesture still activates normally.
        mouse(root, 'mouseup');
        expect(actions).to.eql(keyboardActions);
        mouse(root, 'mousedown');
        expect(contentTransform(root)).to.eql(defaultOffset);
        mouse(root, 'mouseup');
        expect(contentTransform(root)).to.eql('none');
        expect(actions).to.eql(keyboardActions + 1);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('root → child focus transfer cancels held Space without replay', async () => {
    let actions = 0;
    const res = await TestReact.render(
      <Button onClick={() => actions++}>
        <button type='button'>Child</button>
      </Button>,
    );
    try {
      const root = button(res.container);
      const child = root.querySelector('button')!;
      React.act(() => root.focus());
      key(root, 'keydown', ' ');
      expect(contentTransform(root)).to.eql(defaultOffset);

      React.act(() => child.focus());
      expect(document.activeElement).to.equal(child);
      expect(contentTransform(root)).to.eql('none');
      key(child, 'keyup', ' ');
      React.act(() => root.focus());
      key(root, 'keyup', ' ');
      expect(actions).to.eql(0);

      key(root, 'keydown', ' ');
      key(root, 'keyup', ' ');
      expect(actions).to.eql(1);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('key release → keep the mouse-held offset until mouse release', async () => {
    let actions = 0;
    const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
    try {
      const root = button(res.container);
      React.act(() => root.focus());
      mouse(root, 'mouseover', { relatedTarget: document.body });
      mouse(root, 'mousedown');
      expect(contentTransform(root)).to.eql(defaultOffset);

      key(root, 'keyup', 'Enter');
      expect(contentTransform(root)).to.eql(defaultOffset);
      key(root, 'keydown', ' ');
      key(root, 'keyup', ' ');
      expect(contentTransform(root)).to.eql(defaultOffset);
      expect(actions).to.eql(1);

      mouse(root, 'mouseup');
      expect(contentTransform(root)).to.eql('none');
      expect(actions).to.eql(2);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('blur or prevented keyup → reset feedback without a Space action', async () => {
    let actions = 0;
    const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
    try {
      const root = button(res.container);
      React.act(() => root.focus());
      key(root, 'keydown', ' ');
      expect(contentTransform(root)).to.eql(defaultOffset);
      React.act(() => root.blur());
      expect(contentTransform(root)).to.eql('none');

      React.act(() => root.focus());
      key(root, 'keyup', ' ');
      expect(actions).to.eql(0);
      key(root, 'keydown', ' ');
      expect(contentTransform(root)).to.eql(defaultOffset);
      root.addEventListener('keyup', (e) => e.preventDefault(), { once: true });
      key(root, 'keyup', ' ');
      expect(contentTransform(root)).to.eql('none');
      expect(actions).to.eql(0);
    } finally {
      React.act(() => res.dispose());
    }
  });

  for (const mode of ['disabled', 'inactive'] as const) {
    it(`${mode} → reset the offset; becoming available does not replay it`, async () => {
      let actions = 0;
      let setAvailable!: (available: boolean) => void;
      const Probe = () => {
        const [available, update] = React.useState(true);
        setAvailable = update;
        const props = mode === 'disabled' ? { enabled: available } : { active: available };
        return <Button label='Action' {...props} onClick={() => actions++} />;
      };
      const res = await TestReact.render(<Probe />);
      try {
        const root = button(res.container);
        React.act(() => root.focus());
        key(root, 'keydown', ' ');
        expect(contentTransform(root)).to.eql(defaultOffset);

        React.act(() => setAvailable(false));
        expect(contentTransform(root)).to.eql('none');
        React.act(() => setAvailable(true));
        key(root, 'keyup', ' ');
        expect(contentTransform(root)).to.eql('none');
        expect(actions).to.eql(0);

        key(root, 'keydown', ' ');
        expect(contentTransform(root)).to.eql(defaultOffset);
        key(root, 'keyup', ' ');
        expect(contentTransform(root)).to.eql('none');
        expect(actions).to.eql(1);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }
});
