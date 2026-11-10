import type { t } from './common.ts';
import { Anchor } from '../ui/Anchor/mod.ts';

/**
 * Dev resource default; navigation, markers, and accessibility remain owned by Anchor.Link.
 */
export const DevLink = (props: t.Dev.Link.Props) => <Anchor.Link resource='web' {...props} />;
