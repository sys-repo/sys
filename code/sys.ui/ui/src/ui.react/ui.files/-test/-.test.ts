import { describe, expect, it } from '../../../-test.ts';
import { Files } from '../mod.ts';
import { InfoPanel } from '../ui.InfoPanel/mod.ts';

describe('@sys/ui/react/files', () => {
  it('API', async () => {
    const m = await import('@sys/ui/react/files');
    expect(m.Files).to.equal(Files);
    expect(m.Files.InfoPanel).to.equal(InfoPanel);
  });
});
