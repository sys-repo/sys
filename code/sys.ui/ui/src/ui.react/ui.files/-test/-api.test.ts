import { describe, expect, it } from '../../../-test.ts';
import { Files } from '../mod.ts';
import { InfoPanel } from '../ui.InfoPanel/mod.ts';
import { createController } from '../ui.InfoPanel/u.controller.ts';

describe('@sys/ui/react/files: API', () => {
  it('exports the Files.InfoPanel surface', async () => {
    const m = await import('@sys/ui/react/files');

    expect(m.Files).to.equal(Files);
    expect(m.Files.InfoPanel).to.equal(InfoPanel);
    expect(m.Files.InfoPanel.controller).to.equal(createController);
    expect(m.Files.InfoPanel.Config.DEFAULTS).to.equal(InfoPanel.Config.DEFAULTS);
    expect(m.Files.InfoPanel.Config.DEFAULTS.reorder).to.eql(true);
  });
});
