import type { SheetProps as BaseSheetProps } from '@sys/ui-components/t';
import type { t } from './common.ts';

/**
 * <Sheet> component props.
 */
export type SheetProps = BaseSheetProps & { orientation?: t.SheetOrientationY };
