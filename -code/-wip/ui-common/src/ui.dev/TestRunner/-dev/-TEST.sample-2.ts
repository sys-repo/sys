import { Dev, Lorem, Time, Wrangle, expect } from './-common';

export default Dev.describe(`Sample-2: ${Lorem.words(20)}.`, (e) => {
  const length = 50;

  e.it('pause...', async (e) => {
    const ctx = Wrangle.ctx(e);
    await Time.wait(ctx.delay);
  });

  Array.from({ length }).forEach((_, i) => {
    e.describe(`suite ${i + 1}`, (e) => {
      const length = 5;

      Array.from({ length }).forEach((_, i) => {
        e.it(`does thing ${i + 1}`, async (e) => {
          if (Wrangle.shouldThrow(e)) {
            expect(123).to.eql('BOO');
          }
        });
      });
    });
  });
});
