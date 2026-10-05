import { describe, expect, it } from '../../../-test.ts';
import { Signal } from '../common.ts';
import { createController } from '../ui.InfoPanel/u.controller.ts';

describe('Files.InfoPanel controller', () => {
  it('toggles event stream state without component-local useState', () => {
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
