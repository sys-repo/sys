import React from 'react';
import { afterEach, beforeEach, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Button } from '../mod.ts';
import { button, compatibilityMouse, key, mouse, touch } from './u.fixture.ts';

describe('Button: activation compatibility', () => {
  DomMock.init({ beforeEach, afterEach });

  describe('mouse', () => {
    it('release → one action; later keyboard input stays usable', async () => {
      const events: string[] = [];
      const res = await TestReact.render(
        <div onClick={() => events.push('ancestor')}>
          <Button
            label='Action'
            onMouseDown={() => events.push('down')}
            onMouseUp={() => events.push('up')}
            onClick={(e) => events.push(`action:${e.type}`)}
          />
        </div>,
      );
      try {
        const root = button(res.container);
        const released = ['down', 'up', 'action:mouseup'];
        mouse(root, 'mousedown');
        expect(events).to.eql(['down']);
        mouse(root, 'mouseup');
        expect(events).to.eql(released);
        mouse(root, 'click');
        expect(events).to.eql(released);

        React.act(() => root.focus());
        key(root, 'keydown', 'Enter');
        key(root, 'keyup', 'Enter');
        key(root, 'keydown', ' ');
        key(root, 'keyup', ' ');
        expect(events).to.eql([...released, 'action:click', 'action:click']);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('release on noninteractive content → retain normal activation and propagation', async () => {
      const events: string[] = [];
      const res = await TestReact.render(
        <div onMouseUp={() => events.push('ancestor-up')}>
          <Button
            onMouseDown={() => events.push('down')}
            onMouseUp={() => events.push('up')}
            onClick={() => events.push('action')}
          >
            <span>Action</span>
          </Button>
        </div>,
      );
      try {
        const content = button(res.container).querySelector('span')!;
        mouse(content, 'mousedown');
        expect(events).to.eql(['down']);
        const up = mouse(content, 'mouseup');
        const released = ['down', 'up', 'action', 'ancestor-up'];
        expect(up.defaultPrevented).to.eql(false);
        expect(events).to.eql(released);
        mouse(content, 'click');
        expect(events).to.eql(released);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('rejects stray, secondary, abandoned, and blurred releases', async () => {
      let actions = 0;
      const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
      try {
        const root = button(res.container);
        mouse(root, 'mouseup');
        expect(actions).to.eql(0);

        mouse(root, 'mousedown', { button: 2 });
        mouse(root, 'mouseup', { button: 2 });
        expect(actions).to.eql(0);

        mouse(root, 'mousedown');
        mouse(root, 'mouseout', { relatedTarget: document.body });
        mouse(root, 'mouseup');
        expect(actions).to.eql(0);

        React.act(() => root.focus());
        mouse(root, 'mousedown');
        React.act(() => root.blur());
        mouse(root, 'mouseup');
        expect(actions).to.eql(0);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('descendant → root focus transfer preserves the pending mouse action', async () => {
      const events: string[] = [];
      const res = await TestReact.render(
        <Button
          onMouseDown={() => events.push('down')}
          onMouseUp={() => events.push('up')}
          onClick={() => events.push('action')}
        >
          <button type='button'>Child</button>
        </Button>,
      );
      try {
        const root = button(res.container);
        const child = root.querySelector('button')!;
        React.act(() => child.focus());
        expect(document.activeElement).to.equal(child);

        mouse(root, 'mousedown');
        expect(events).to.eql(['down']);
        // DomMock does not perform mousedown's default focus transfer.
        React.act(() => root.focus());
        expect(document.activeElement).to.equal(root);
        expect(events).to.eql(['down']);
        mouse(root, 'mouseup');
        const released = ['down', 'up', 'action'];
        expect(events).to.eql(released);
        mouse(root, 'click');
        expect(events).to.eql(released);

        // A descendant losing focus outside the component still cancels the press.
        React.act(() => child.focus());
        mouse(root, 'mousedown');
        React.act(() => child.blur());
        React.act(() => root.focus());
        mouse(root, 'mouseup');
        expect(events).to.eql([...released, 'down', 'up']);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('disable → keep physical hover, but cancel the armed press', async () => {
      let actions = 0;
      let over = false;
      let setEnabled!: (enabled: boolean) => void;
      const Probe = () => {
        const [enabled, update] = React.useState(true);
        setEnabled = update;
        return (
          <Button
            label='Action'
            enabled={enabled}
            opacity={({ is }) => {
              over = is.over;
              return 1;
            }}
            onClick={() => actions++}
          />
        );
      };
      const res = await TestReact.render(<Probe />);
      try {
        const root = button(res.container);
        mouse(root, 'mouseover', { relatedTarget: document.body });
        mouse(root, 'mousedown');
        React.act(() => setEnabled(false));
        expect(over).to.eql(true);

        React.act(() => setEnabled(true));
        mouse(root, 'mouseup');
        expect(actions).to.eql(0);

        React.act(() => setEnabled(false));
        mouse(root, 'mouseout', { relatedTarget: document.body });
        expect(over).to.eql(false);
      } finally {
        React.act(() => res.dispose());
      }
    });

    for (const phase of ['MouseDown', 'MouseUp'] as const) {
      it(`${phase} cancellation → no action`, async () => {
        let actions = 0;
        const res = await TestReact.render(
          <Button
            label='Action'
            onClick={() => actions++}
            onMouse={(e) => {
              if (e.action === phase) e.cancel();
            }}
          />,
        );
        try {
          const root = button(res.container);
          const down = mouse(root, 'mousedown');
          const up = mouse(root, 'mouseup');
          const canceled = phase === 'MouseDown' ? down : up;
          expect(canceled.defaultPrevented).to.eql(true);
          expect(actions).to.eql(0);
        } finally {
          React.act(() => res.dispose());
        }
      });
    }
  });

  describe('touch', () => {
    it('release → one action; the following click does not duplicate it', async () => {
      const events: string[] = [];
      const res = await TestReact.render(
        <Button
          label='Action'
          onMouseDown={(e) => events.push(`down:${e.type}`)}
          onMouseUp={(e) => events.push(`up:${e.type}`)}
          onClick={(e) => events.push(`action:${e.type}`)}
        />,
      );
      try {
        const root = button(res.container);
        touch(root, 'touchstart');
        expect(events).to.eql(['down:touchstart']);

        const end = touch(root, 'touchend');
        const released = ['down:touchstart', 'up:touchend', 'action:touchend'];
        expect(end.defaultPrevented).to.eql(true);
        expect(events).to.eql(released);
        mouse(root, 'click');
        expect(events).to.eql(released);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('rejects stray, canceled, and unmatched endings', async () => {
      const events: string[] = [];
      const res = await TestReact.render(
        <Button
          label='Action'
          onMouseUp={() => events.push('up')}
          onClick={() => events.push('action')}
        />,
      );
      try {
        const root = button(res.container);
        touch(root, 'touchend');
        expect(events).to.eql([]);

        touch(root, 'touchstart');
        touch(root, 'touchcancel');
        touch(root, 'touchend');
        expect(events).to.eql([]);

        touch(root, 'touchstart');
        touch(root, 'touchend', { identifier: 2 });
        expect(events).to.eql([]);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('ignores compatibility mouse callbacks without blocking a real mouse', async () => {
      const events: string[] = [];
      const gesture = ['down', 'MouseDown', 'up', 'MouseUp', 'action'];
      const res = await TestReact.render(
        <Button
          label='Action'
          onMouseDown={() => events.push('down')}
          onMouseUp={() => events.push('up')}
          onMouse={(e) => events.push(e.action)}
          onClick={() => events.push('action')}
        />,
      );
      try {
        const root = button(res.container);
        touch(root, 'touchstart');
        touch(root, 'touchend');
        expect(events).to.eql(gesture);

        for (const type of ['mouseover', 'mousedown', 'mouseup', 'mouseout', 'click']) {
          compatibilityMouse(root, type);
        }
        expect(events).to.eql(gesture);

        mouse(root, 'mousedown');
        mouse(root, 'mouseup');
        mouse(root, 'click');
        expect(events).to.eql([...gesture, ...gesture]);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('move outside → cancel the press, even if it ends back inside', async () => {
      let actions = 0;
      const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
      try {
        const root = button(res.container);
        const view = root.ownerDocument.defaultView!;
        const bounds = new view.DOMRect(10, -10, 80, 20);
        root.getBoundingClientRect = () => bounds;
        const inside = { clientX: 20 };
        const outside = { clientX: 100 };

        touch(root, 'touchstart', inside);
        touch(root, 'touchmove', outside);
        touch(root, 'touchend', inside);
        expect(actions).to.eql(0);

        // The same bounds allow a fresh gesture that stays inside.
        touch(root, 'touchstart', inside);
        touch(root, 'touchend', inside);
        expect(actions).to.eql(1);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('blur → cancel the press and suppress its compatibility click', async () => {
      let actions = 0;
      const res = await TestReact.render(<Button label='Action' onClick={() => actions++} />);
      try {
        const root = button(res.container);
        React.act(() => root.focus());
        touch(root, 'touchstart');
        React.act(() => root.blur());
        const end = touch(root, 'touchend');
        expect(end.defaultPrevented).to.eql(true);

        mouse(root, 'click');
        expect(actions).to.eql(0);
      } finally {
        React.act(() => res.dispose());
      }
    });

    it('mouse rollup cancellation → no touch action', async () => {
      let actions = 0;
      const res = await TestReact.render(
        <Button
          label='Action'
          onClick={() => actions++}
          onMouse={(e) => {
            if (e.action === 'MouseUp') e.cancel();
          }}
        />,
      );
      try {
        const root = button(res.container);
        touch(root, 'touchstart');
        const end = touch(root, 'touchend');
        expect(end.defaultPrevented).to.eql(true);
        expect(actions).to.eql(0);
      } finally {
        React.act(() => res.dispose());
      }
    });
  });
});
