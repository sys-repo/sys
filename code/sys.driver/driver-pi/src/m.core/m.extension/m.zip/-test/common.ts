export { describe, expect, it } from '../../../../-test.ts';
export * from '../common.ts';
export type * as t from './t.ts';

export { Fixture as ArchiveFixture } from '../../../../../../../sys/archive/src/m.Zip/-test/u.fixture.ts';
export {
  createRooted,
  DEFAULT_IO,
  withIo,
  wrapFile,
} from '../../../../../../../sys/fs/src/m.Fs.capability/m.Rooted/-test/u.fixture.ts';
