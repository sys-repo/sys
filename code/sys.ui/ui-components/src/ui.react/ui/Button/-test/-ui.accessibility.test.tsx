import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Button } from '../mod.ts';
import { button, key, mouse } from './u.fixture.ts';

describe('Button: keyboard accessibility', () => {
  // Generated stylesheet rules share the document's lifetime.
  DomMock.init({ beforeAll, afterAll });

  for (const pressed of [true, false, undefined]) {
    it(`controlled aria-pressed=${pressed} → forward state without visual press coupling`, async () => {
      const res = await TestReact.render(<Button aria-pressed={pressed} label='Choice' />);
      try {
        const root = button(res.container);
        expect(root.getAttribute('aria-pressed')).to.eql(
          pressed === undefined ? null : String(pressed),
        );
        expect(root.getAttribute('aria-disabled')).to.eql(null);
        const view = root.ownerDocument.defaultView!;
        expect(view.getComputedStyle(root.firstElementChild!).transform).to.eql('');
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('preserves rich content and caller layout while adding keyboard focus', async () => {
    const res = await TestReact.render(
      <Button label={() => 'Run'} block padding={4} style={{ minWidth: 120 }}>
        <div>Action</div>
      </Button>,
    );
    try {
      const root = button(res.container);
      const view = root.ownerDocument.defaultView!;
      const style = view.getComputedStyle(root);
      const bodyStyle = view.getComputedStyle(root.firstElementChild!);
      expect(root.tagName).to.eql('DIV');
      expect(root.textContent).to.eql('RunAction');
      expect(root.tabIndex).to.eql(0);
      expect(root.getAttribute('aria-disabled')).to.eql(null);
      expect(style.display).to.eql('block');
      expect(style.minWidth).to.eql('120px');
      expect(style.padding).to.eql('4px');
      expect(style.cursor).to.eql('pointer');
      expect(bodyStyle.opacity).to.eql('1');
      expect(bodyStyle.filter).to.eql('blur(0px) grayscale(0%)');
      expect(bodyStyle.transition).to.eql('opacity 0.1s ease');

      React.act(() => root.focus());
      expect(document.activeElement).to.equal(root);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('Enter keydown → one action, without mouse callbacks or form submission', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <form
        onSubmit={(e) => {
          e.preventDefault();
          events.push('submit');
        }}
      >
        <Button
          label='Action'
          onClick={(e) => events.push(`action:${e.type}`)}
          onMouseDown={() => events.push('mouse-down')}
          onMouseUp={() => events.push('mouse-up')}
          onMouse={() => events.push('mouse')}
        />
      </form>,
    );
    try {
      const root = button(res.container);
      React.act(() => root.focus());

      const down = key(root, 'keydown', 'Enter');
      expect(down.defaultPrevented).to.eql(true);
      expect(events).to.eql(['action:click']);

      key(root, 'keydown', 'Enter', { repeat: true });
      expect(events).to.eql(['action:click']);
      key(root, 'keyup', 'Enter');
      expect(events).to.eql(['action:click']);

      key(root, 'keydown', 'Enter');
      key(root, 'keyup', 'Enter');
      expect(events).to.eql(['action:click', 'action:click']);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('Space keydown → prevent default; keyup → one action', async () => {
    let actions = 0;
    const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
    try {
      const root = button(res.container);
      React.act(() => root.focus());
      key(root, 'keyup', ' ');
      expect(actions).to.eql(0);

      const down = key(root, 'keydown', ' ');
      key(root, 'keydown', ' ', { repeat: true });
      expect(down.defaultPrevented).to.eql(true);
      expect(actions).to.eql(0);

      const up = key(root, 'keyup', ' ');
      expect(up.defaultPrevented).to.eql(true);
      expect(actions).to.eql(1);
      key(root, 'keyup', ' ');
      expect(actions).to.eql(1);
    } finally {
      React.act(() => res.dispose());
    }
  });

  for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'isComposing'] as const) {
    it(`${modifier} → Enter and Space remain unhandled`, async () => {
      let actions = 0;
      const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
      try {
        const root = button(res.container);
        React.act(() => root.focus());
        for (const input of ['Enter', ' ']) {
          const down = key(root, 'keydown', input, { [modifier]: true });
          const up = key(root, 'keyup', input, { [modifier]: true });
          expect(down.defaultPrevented).to.eql(false);
          expect(up.defaultPrevented).to.eql(false);
          expect(actions).to.eql(0);
        }
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('honors a keydown canceled before the Button handler runs', async () => {
    let actions = 0;
    const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
    try {
      const root = button(res.container);
      React.act(() => root.focus());
      for (const input of ['Enter', ' ']) {
        root.addEventListener('keydown', (e) => e.preventDefault(), { once: true });
        key(root, 'keydown', input);
        key(root, 'keyup', input);
        expect(actions).to.eql(0);
      }
    } finally {
      React.act(() => res.dispose());
    }
  });

  for (const state of ['disabled', 'inactive'] as const) {
    it(`${state} → unavailable semantics and no keyboard or pointer activation`, async () => {
      let actions = 0;
      const res = await TestReact.render(
        <Button
          label='Action'
          enabled={state !== 'disabled'}
          active={state !== 'inactive'}
          onClick={() => actions++}
          onDoubleClick={() => actions++}
        />,
      );
      try {
        const root = button(res.container);
        expect(root.tabIndex).to.eql(-1);
        expect(root.getAttribute('aria-disabled')).to.eql('true');

        // tabindex=-1 permits programmatic focus; unavailability must still block keys.
        React.act(() => root.focus());
        expect(document.activeElement).to.equal(root);
        key(root, 'keydown', 'Enter');
        key(root, 'keyup', 'Enter');
        key(root, 'keydown', ' ');
        key(root, 'keyup', ' ');
        expect(actions).to.eql(0);

        mouse(root, 'mousedown');
        mouse(root, 'mouseup');
        mouse(root, 'click', { detail: 0 });
        mouse(root, 'dblclick');
        expect(actions).to.eql(0);
      } finally {
        React.act(() => res.dispose());
      }
    });
  }

  it('rechecks dynamic enabled callbacks on release, even without a redraw', async () => {
    let actions = 0;
    let enabled = true;
    const res = await TestReact.render(
      <Button label='Action' enabled={() => enabled} onClick={() => actions++} />,
    );
    try {
      const root = button(res.container);
      React.act(() => root.focus());
      key(root, 'keydown', ' ');
      enabled = false;
      key(root, 'keyup', ' ');
      expect(actions).to.eql(0);

      enabled = true;
      key(root, 'keyup', ' ');
      expect(actions).to.eql(0);
      key(root, 'keydown', ' ');
      key(root, 'keyup', ' ');
      expect(actions).to.eql(1);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('assistive click → one action, without an ancestor click', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <div onClick={() => events.push('ancestor')}>
        <Button label='Action' onClick={() => events.push('action')} />
      </div>,
    );
    try {
      const root = button(res.container);
      React.act(() => root.click());
      expect(events).to.eql(['action']);
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('leaves focused interactive descendants in charge of their input', async () => {
    const events: string[] = [];
    const res = await TestReact.render(
      <div onClick={() => events.push('ancestor')}>
        <Button onClick={() => events.push('action')}>
          <button type='button' onClick={() => events.push('child')}>Child</button>
        </Button>
      </div>,
    );
    try {
      const root = button(res.container);
      const child = root.querySelector('button')!;
      React.act(() => child.focus());
      expect(document.activeElement).to.equal(child);

      for (const input of ['Enter', ' ']) {
        const down = key(child, 'keydown', input);
        key(child, 'keyup', input);
        expect(down.defaultPrevented).to.eql(false);
      }
      mouse(child, 'mousedown');
      mouse(child, 'mouseup');
      expect(events).to.eql([]);

      // DomMock does not synthesize the native button's default keyboard click.
      React.act(() => child.click());
      expect(events).to.eql(['child']);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
