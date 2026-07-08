import React from 'react';
import { describe, Err, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
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
      const row = items[1];

      expect(stopped.length).to.eql(1);
      expect(noWatch.length).to.eql(1);

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
      const stoppedRow = stopped[1];
      const readyRow = ready[1];

      expect(stoppedRow?.id).to.eql('transport');
      expect(readyRow?.id).to.eql('transport');
      expect(stoppedRow?.kind).to.eql('row');
      expect(readyRow?.kind).to.eql('row');
      if (!stoppedRow || stoppedRow.kind !== 'row') return;
      if (!readyRow || readyRow.kind !== 'row') return;

      expect(stoppedRow.k).to.eql('transport');
      expect(readyRow.k).to.eql('transport');
      expect(React.isValidElement<{ label?: string }>(stoppedRow.v)).to.eql(true);
      expect(React.isValidElement<{ label?: string }>(readyRow.v)).to.eql(true);
      if (!React.isValidElement<{ label?: string }>(stoppedRow.v)) return;
      if (!React.isValidElement<{ label?: string }>(readyRow.v)) return;
      expect(stoppedRow.v.props.label).to.eql('connect');
      expect(readyRow.v.props.label).to.eql('disconnect');
    });

    it('hides the transport field without callbacks', () => {
      const items = toItems({ fields: ['transport'], snapshot: { status: 'stopped' } });

      expect(items.map((item) => item.id)).to.eql(['title']);
    });
  });

  describe('projection identity', () => {
    it('projects stable item ids for row projection animation', () => {
      const items = toItems({
        fields: ['events', 'status', 'capabilities'],
        events: { enabled: true },
        snapshot: { status: 'ready', capabilities },
      });

      expect(items.map((item) => item.id)).to.eql(['title', 'events', 'status', 'capabilities']);
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

      expect(stopped.length).to.eql(1);
      expect(failed.length).to.eql(2);
      expect(failed[1]?.id).to.eql('error');
    });
  });
});
