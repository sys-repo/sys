/**
 * Sample
 */
export const TESTS = {
  get all() {
    return [
      import('./-TEST.sample-1'),
      'MyTitle',
      import('./-TEST.sample-2'),
      import('./-TEST.controller'),
    ];
  },
};
