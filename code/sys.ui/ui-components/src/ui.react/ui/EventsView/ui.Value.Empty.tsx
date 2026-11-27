import { css, D, type t } from './common.ts';

const style = css({ opacity: D.emptyOpacity });

/** A subdued em dash for an absent value. */
export const EmptyValue: t.FC = () => <span className={style.class}>—</span>;
