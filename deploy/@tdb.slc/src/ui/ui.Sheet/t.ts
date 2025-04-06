import type { SheetProps as BaseSheetProps } from '@sys/ui-react-components/t';
import type { t } from './common.ts';

export type SheetProps = t.ContentProps & BaseProps;
type BaseProps = Pick<BaseSheetProps, 'orientation' | 'margin'>;
