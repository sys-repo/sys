import React from 'react';
import { describe, Err, expect, it } from '../../../-test.ts';
import { Signal, type t } from '../common.ts';
import { Files } from '../mod.ts';
import { ErrorMessage } from '../ui.InfoPanel/ui.ErrorMessage.tsx';
import { EventSwitch } from '../ui.InfoPanel/ui.EventSwitch.tsx';
import { InfoPanel } from '../ui.InfoPanel/mod.ts';
import { StatusTitle } from '../ui.InfoPanel/ui.StatusTitle.tsx';
import { createController } from '../ui.InfoPanel/u.controller.ts';
import { toItems } from '../ui.InfoPanel/u.items.tsx';

const capabilities: t.ModelFiles.Capabilities = {
  list: true,
  stat: true,
  read: true,
  write: false,
  remove: false,
  watch: true,
  manifest: true,
};

describe('@sys/ui/react/files', () => {
  it('API', async () => {
    const m = await import('@sys/ui/react/files');
    expect(m.Files).to.equal(Files);
    expect(m.Files.InfoPanel).to.equal(InfoPanel);
    expect(m.Files.InfoPanel.controller).to.equal(createController);
  });

  it('error placeholder → native title tooltip with complete error string', () => {
    const error = Err.std('Sample tooltip error', {
      name: 'FilesClientError',
      cause: 'Socket closed',
    });
    const element = ErrorMessage({ value: error });

    expect(React.isValidElement<{ title?: string; children?: React.ReactNode }>(element)).to.eql(
      true,
    );
    if (!React.isValidElement<{ title?: string; children?: React.ReactNode }>(element)) return;

    const children = React.Children.toArray(element.props.children);
    const name = children[0];
    const message = children[1];

    expect(element.type).to.equal('div');
    expect(React.isValidElement<{ children?: string }>(name)).to.eql(true);
    expect(React.isValidElement<{ children?: string }>(message)).to.eql(true);
    if (!React.isValidElement<{ children?: string }>(name)) return;
    if (!React.isValidElement<{ children?: string }>(message)) return;

    expect(name.props.children).to.eql('FilesClientError:');
    expect(message.props.children).to.eql(' Sample tooltip error');
    expect(element.props.title).to.eql(Err.summary(error, { cause: true, stack: true }));
    expect(element.props.title).to.contain('Cause: Error: Socket closed');
  });

  it('status title hides only the error label', () => {
    const error = StatusTitle({ status: 'error' });
    const ready = StatusTitle({ status: 'ready' });

    expect(React.isValidElement<{ children?: React.ReactNode }>(error)).to.eql(true);
    expect(React.isValidElement<{ children?: React.ReactNode }>(ready)).to.eql(true);
    if (!React.isValidElement<{ children?: React.ReactNode }>(error)) return;
    if (!React.isValidElement<{ children?: React.ReactNode }>(ready)) return;

    const errorChildren = React.Children.toArray(error.props.children);
    const readyChildren = React.Children.toArray(ready.props.children);
    const readyLabel = readyChildren[0];

    expect(errorChildren.length).to.eql(1);
    expect(readyChildren.length).to.eql(2);
    expect(React.isValidElement<{ children?: string }>(readyLabel)).to.eql(true);
    if (!React.isValidElement<{ children?: string }>(readyLabel)) return;
    expect(readyLabel.props.children).to.eql('ready');
  });

  it('events field projects a switch row only when ready with watch capability', () => {
    const items = toItems({
      fields: ['events'],
      events: { enabled: true },
      snapshot: { status: 'ready', capabilities },
    });
    const stopped = toItems({
      fields: ['events'],
      events: { enabled: true },
      snapshot: { status: 'stopped', capabilities },
    });
    const noWatch = toItems({
      fields: ['events'],
      events: { enabled: true },
      snapshot: { status: 'ready', capabilities: { ...capabilities, watch: false } },
    });
    const row = items[1];

    expect(stopped.length).to.eql(1);
    expect(noWatch.length).to.eql(1);

    expect(row?.kind ?? 'row').to.eql('row');
    if (!row || row.kind != null) return;
    expect(row.k).to.eql('events');
    expect(React.isValidElement(row.v)).to.eql(true);
    if (!React.isValidElement(row.v)) return;
    expect(row.v.type).to.equal(EventSwitch);
  });

  it('error field is visible only for an error snapshot', () => {
    const error = Err.std('stale');
    const stopped = toItems({
      fields: ['error'],
      snapshot: { status: 'stopped', error },
    });
    const failed = toItems({
      fields: ['error'],
      snapshot: { status: 'error', error },
    });

    expect(stopped.length).to.eql(1);
    expect(failed.length).to.eql(2);
  });

  it('controller toggles event stream state without component-local useState', () => {
    const enabled = Signal.create(false);
    const controller = createController({ events: { enabled } });

    try {
      expect(controller.view().events?.enabled).to.eql(false);
      controller.view().events?.onToggle?.(true);
      expect(enabled.value).to.eql(true);
      expect(controller.view().events?.enabled).to.eql(true);
    } finally {
      controller.dispose();
    }
  });
});
