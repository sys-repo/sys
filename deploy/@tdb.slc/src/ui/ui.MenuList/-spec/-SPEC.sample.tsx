import { type t, css } from '../common.ts';
type P = t.MenuListProps;

/**
 * Component:
 */
export const MyChevron = () => {
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
  };
  return <div className={styles.base.class}>🌳</div>;
};

/**
 * Sample items;
 */
const items: P['items'] = [
  { label: 'One' },
  'Two',
  { label: 'Three' },
  undefined,
  { label: 'Four - chevron: false', chevron: false },
  { label: 'Five - custom chevron <Element>', chevron: <MyChevron /> },
];
export const Sample = { items } as const;
