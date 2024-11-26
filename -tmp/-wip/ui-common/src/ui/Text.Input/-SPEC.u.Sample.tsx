import { useRef } from 'react';
import { TextInput } from './mod.ts';
import { Color, css, type t } from '../common.ts';

export type SampleProps = {
  props: t.TextInputProps;
  debug: {
    isHintEnabled: boolean;
    isUpdateEnabled: boolean;
    isUpdateAsync: boolean;
    elementPlaceholder: boolean;
  };
};

export const Sample: React.FC<SampleProps> = (dev) => {
  const { debug, props } = dev;
  const inputRef = useRef<t.TextInputRef>(null);

  /**
   * Render
   */
  const styles = {
    placeholder: css({ display: 'grid', gridTemplateColumns: 'auto auto 1fr', columnGap: 10 }),
    label: css({ fontStyle: 'normal', display: 'grid', alignContent: 'center' }),
    key: css({
      PaddingX: 5,
      fontSize: 10,
      borderRadius: 5,
      border: `solid 1px ${Color.format(-0.4)}`,
      fontStyle: 'normal',
      fontWeight: 600,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elPlaceholder = (
    <div {...styles.placeholder}>
      <div {...styles.label}>custom placeholder</div>
      <div {...styles.key}>⌘K</div>
    </div>
  );

  return (
    <TextInput
      {...dev.props}
      ref={inputRef}
      placeholder={debug.elementPlaceholder ? elPlaceholder : props.placeholder}
    />
  );
};
