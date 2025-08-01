import type { SampleFactoryId as FactoryId } from './-views/mod.ts';
import type { t } from './common.ts';

/**
 * Keys for looking up views within the factory.
 */
export type SampleFactoryId = t.Static<typeof FactoryId>;
