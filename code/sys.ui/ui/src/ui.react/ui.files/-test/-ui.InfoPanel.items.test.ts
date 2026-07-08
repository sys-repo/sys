import React from 'react';
import { describe, Err, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { D } from '../ui.InfoPanel/common.ts';
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

describe('Files.InfoPanel item projection', () => {
  describe('title field', () => {
    it('renders the title row only when the title field is visible', () => {
      const hidden = toItems({ fields: [], snapshot: { status: 'ready' } });
      const visible = toItems({ fields: ['title'], snapshot: { status: 'ready' } });

      expect(hidden.map((item) => item.id)).to.eql([]);
      expect(visible.map((item) => item.id)).to.eql(['title']);
    });

    it('defaults the title status marker on and its label off', () => {
      const items = toItems({ fields: [...D.fields], snapshot: { status: 'ready' } });
      const title = items[0] as t.KeyValue.Title;
      const value = Array.isArray(title.v) ? title.v[1] : undefined;

      expect(items[0]?.id).to.eql('title');
      expect(React.isValidElement<{ showLabel?: boolean }>(value)).to.eql(true);
      if (!React.isValidElement<{ showLabel?: boolean }>(value)) return;
      expect(value.props.showLabel).to.eql(false);
    });

    it('projects title status marker and label controls independently', () => {
      const marker = toItems({
        fields: ['title', 'title.status'],
        snapshot: { status: 'ready' },
      });
      const label = toItems({
        fields: ['title', 'title.status', 'title.status.label'],
        snapshot: { status: 'ready' },
      });
      const markerTitle = marker[0] as t.KeyValue.Title;
      const labelTitle = label[0] as t.KeyValue.Title;
      const markerValue = Array.isArray(markerTitle.v) ? markerTitle.v[1] : undefined;
      const labelValue = Array.isArray(labelTitle.v) ? labelTitle.v[1] : undefined;

      expect(React.isValidElement<{ showLabel?: boolean }>(markerValue)).to.eql(true);
      expect(React.isValidElement<{ showLabel?: boolean }>(labelValue)).to.eql(true);
      if (!React.isValidElement<{ showLabel?: boolean }>(markerValue)) return;
      if (!React.isValidElement<{ showLabel?: boolean }>(labelValue)) return;
      expect(markerValue.props.showLabel).to.eql(false);
      expect(labelValue.props.showLabel).to.eql(true);
    });

    it('maps legacy status:title fields to the nested title controls', () => {
      const legacy = 'status:title' as unknown as t.Files.InfoPanel.Field;
      const items = toItems({ fields: [legacy], snapshot: { status: 'ready' } });
      const title = items[0] as t.KeyValue.Title;
      const value = Array.isArray(title.v) ? title.v[1] : undefined;

      expect(items.map((item) => item.id)).to.eql(['title']);
      expect(React.isValidElement<{ showLabel?: boolean }>(value)).to.eql(true);
      if (!React.isValidElement<{ showLabel?: boolean }>(value)) return;
      expect(value.props.showLabel).to.eql(true);
    });
  });

  describe('events field', () => {
    it('projects a switch row only when ready with watch capability', () => {
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
      const row = items[0];

      expect(stopped.length).to.eql(0);
      expect(noWatch.length).to.eql(0);

      expect(row?.kind).to.eql('row');
      if (!row || row.kind !== 'row') return;
      expect(row.k).to.eql('events');
      expect(React.isValidElement(row.v)).to.eql(true);
    });
  });

  describe('transport field', () => {
    it('projects a transport action row when callbacks exist', () => {
      const stopped = toItems({
        fields: ['transport'],
        snapshot: { status: 'stopped' },
        transport: { onConnect: () => undefined, onDisconnect: () => undefined },
      });
      const ready = toItems({
        fields: ['transport'],
        snapshot: { status: 'ready' },
        transport: { onConnect: () => undefined, onDisconnect: () => undefined },
      });
      const stoppedRow = stopped[0];
      const readyRow = ready[0];

      expect(stoppedRow?.id).to.eql('transport');
      expect(readyRow?.id).to.eql('transport');
      expect(stoppedRow?.kind).to.eql('row');
      expect(readyRow?.kind).to.eql('row');
      if (!stoppedRow || stoppedRow.kind !== 'row') return;
      if (!readyRow || readyRow.kind !== 'row') return;

      expect(stoppedRow.k).to.eql('network');
      expect(readyRow.k).to.eql('network');
      expect(React.isValidElement<{ label?: string }>(stoppedRow.v)).to.eql(true);
      expect(React.isValidElement<{ label?: string }>(readyRow.v)).to.eql(true);
      if (!React.isValidElement<{ label?: string }>(stoppedRow.v)) return;
      if (!React.isValidElement<{ label?: string }>(readyRow.v)) return;
      expect(stoppedRow.v.props.label).to.eql('connect');
      expect(readyRow.v.props.label).to.eql('disconnect');
    });

    it('hides the transport field without callbacks', () => {
      const items = toItems({ fields: ['transport'], snapshot: { status: 'stopped' } });

      expect(items.map((item) => item.id)).to.eql([]);
    });
  });

  describe('projection identity', () => {
    it('projects stable item ids in field order, including title', () => {
      const items = toItems({
        fields: ['events', 'title', 'status', 'capabilities'],
        events: { enabled: true },
        snapshot: { status: 'ready', capabilities },
      });

      expect(items.map((item) => item.id)).to.eql(['events', 'title', 'status', 'capabilities']);
    });
  });

  describe('error field', () => {
    it('is visible only for an error snapshot', () => {
      const error = Err.std('stale');
      const stopped = toItems({
        fields: ['error'],
        snapshot: { status: 'stopped', error },
      });
      const failed = toItems({
        fields: ['error'],
        snapshot: { status: 'error', error },
      });

      expect(stopped.length).to.eql(0);
      expect(failed.length).to.eql(1);
      expect(failed[0]?.id).to.eql('error');
    });
  });
});

