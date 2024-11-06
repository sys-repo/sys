import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { TextInputRef } from './Ref.ts';
import { Time, rx, type t } from './common.ts';
import { View } from './ui.tsx';

/**
 * A simple HTML text input primitive.
 */
export const TextInput: React.FC<t.TextInputProps> = forwardRef<t.TextInputRef, t.TextInputProps>(
  (props: t.TextInputProps, ref: t.TextInputRef) => {
    const readyRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const handleRef = useRef<t.TextInputRef>();
    const busRef = useRef(rx.bus<t.TextInputEvent>());
    const bus = busRef.current;

    const createHandle = () => (handleRef.current = TextInputRef(inputRef, bus.$));
    const getOrCreateHandle = () => handleRef.current || createHandle();

    useImperativeHandle(ref, getOrCreateHandle);

    useEffect(() => {
      const { focusOnReady, selectOnReady } = props;
      const ref = getOrCreateHandle();
      if (focusOnReady) Time.delay(0, () => ref.focus(selectOnReady));
      if (!readyRef.current) {
        readyRef.current = true;
        const input = inputRef.current!;
        props.onReady?.({ ref, input });
      }
    }, []);

    return <View {...props} bus={bus} inputRef={inputRef} />;
  },
);
