import React from 'react';
import { afterAll, beforeAll, describe, DomMock, expect, it, TestReact } from '../../../-test.ts';
import { Is, Obj, Style, type t } from '../../common.ts';
import { Button } from '../../../ui/Button/mod.ts';
import { Dev } from '../../mod.ts';
import { DevButton } from '../mod.ts';

/** Registered declarations only; mock layout is not visual acceptance. */
function ruleText(el: Element) {
  const selector = `.${el.className}`;
  const rules = Style.Dom.stylesheet().rules.items;
  const rule = rules.find((r) => r.selector === selector);
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${selector}`);
  return rule.rule;
}

describe('@sys/ui-components/react/dev: Dev.Button', () => {
  DomMock.init({ beforeAll, afterAll });

  it('caller props → forwarded unchanged to the inner Button, not the frame', () => {
    const style: t.CssInput = [{ Padding: 4 }, [false, { minWidth: undefined }]];
    const props: t.Dev.Button.Props = {
      block: true,
      label: () => 'Run',
      children: <span>child</span>,
      style,
      padding: [1, 2],
      margin: 3,
      minWidth: 100,
      enabled: () => false,
      active: false,
      theme: 'Dark',
      subscribe: () => {},
      onClick: () => {},
    };
    const frame = DevButton(props);
    const inner = frame.props.children as React.ReactElement<t.Button.Props>;
    expect(frame.type).to.eql('div');
    expect(Obj.keys(frame.props)).to.have.members(['className', 'children']);
    expect(inner.type).to.equal(Button);
    expect(inner.props).to.eql(props);
    expect(inner.props.style).to.equal(style);
  });

  it('adds left-only Button spacing inside the compact frame', async () => {
    const res = await TestReact.render(
      <>
        <Dev.Button block>Run</Dev.Button>
        <Button block margin={[0, 0, 0, -2]} padding={[0, 0, 0, 2]}>Run</Button>
      </>,
    );
    try {
      const frame = res.container.firstElementChild!;
      const inner = frame.firstElementChild!;
      const bare = res.container.lastElementChild!;
      expect(frame.children.length).to.eql(1);
      expect(inner.getAttribute('role')).to.eql('button');
      expect(inner.className).to.eql(bare.className);

      const layout = ruleText(frame);
      expect(layout).to.include('line-height: 1.2;');
      expect(layout).to.include('padding: 4px;');
      expect(layout).to.include('margin: 0 -4px;');
      expect(layout).to.include('padding-left: 6px;');
      expect(layout).to.include('margin-left: -6px;');

      const base = ruleText(inner);
      expect(base).to.include('margin-left: -2px;');
      expect(base).to.include('padding-left: 2px;');
      expect(base).to.include('margin-right: 0px;');
      expect(base).to.include('padding-right: 0px;');
    } finally {
      React.act(() => res.dispose());
    }
  });

  it('preserves explicit layout and focus clears through nested style input', async () => {
    const style: t.CssInput = [
      { ':focus-visible': { outline: '2px solid red' } },
      [false, { Padding: 4, minWidth: undefined, ':focus-visible': undefined }],
    ];
    const res = await TestReact.render(<Dev.Button minWidth={100} style={style}>Run</Dev.Button>);
    try {
      const frame = res.container.firstElementChild!;
      const inner = frame.firstElementChild!;
      const base = ruleText(inner);
      expect(base).to.include('padding-top: 4px;');
      expect(base).not.to.include('min-width:');
      expect(base).not.to.include('--sys-button-focus');
      expect(ruleText(frame)).not.to.include('padding-top:');

      const selector = `.${inner.className}:focus-visible`;
      const rules = Style.Dom.stylesheet().rules.items;
      const hasFocusRule = rules.some((r) => r.selector === selector);
      expect(hasFocusRule).to.eql(false);
    } finally {
      React.act(() => res.dispose());
    }
  });
});
