import { describe, expect, it } from '../../-test.ts';
import { ViteStartup } from '../mod.ts';

describe(`ViteStartup`, () => {
  it('exposes Projection and Delivery', () => {
    expect(ViteStartup.Projection).to.equal(ViteStartup.Projection);
    expect(ViteStartup.Delivery).to.equal(ViteStartup.Delivery);
  });

  it('Projection.create throws until implemented', async () => {
    await expectRejectMessage(
      () =>
        ViteStartup.Projection.create({
          cwd: '/tmp' as never,
          vite: 'npm:vite@8.0.9',
        }),
      'ViteStartup.Projection.create not implemented',
    );
  });

  it('Delivery.create throws until implemented', async () => {
    await expectRejectMessage(
      () =>
        ViteStartup.Delivery.create({
          authority: {
            dir: '/tmp' as never,
            imports: {},
          },
        }),
      'ViteStartup.Delivery.create not implemented',
    );
  });
});

async function expectRejectMessage(
  fn: () => Promise<unknown>,
  message: string,
) {
  try {
    await fn();
    throw new Error(`Expected rejection: ${message}`);
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    expect(error.message).to.equal(message);
  }
}
