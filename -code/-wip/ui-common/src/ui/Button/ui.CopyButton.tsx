import { useState } from 'react';
import { DEFAULTS, css, type t, Color } from './common.ts';
import { View as Button } from './ui.Button.tsx';

type Content = JSX.Element | string | number | false;

/**
 * A Button that supports clipboard copying.
 */
export const CopyButton: React.FC<t.CopyButtonProps> = (props) => {
  const { onCopy, onClick } = props;
  const properties = { ...props };
  delete properties.onCopy;

  const [timer, setTimer] = useState<number | undefined>();
  const [copiedContent, setCopiedContent] = useState<Content>();
  const [copiedFontSize, setCopiedFontSize] = useState<number>(DEFAULTS.copy.fontSize);
  const [copiedOpacity, setCopiedOpacity] = useState<number>(DEFAULTS.copy.opacity);

  /**
   * Handlers
   */
  const reset = () => {
    setTimer(undefined);
    setCopiedContent(undefined);
    setCopiedFontSize(DEFAULTS.copy.fontSize);
    setCopiedOpacity(DEFAULTS.copy.opacity);
  };

  const startTimer = (delay: t.Msecs) => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(reset, delay));
  };

  const handleClick: React.MouseEventHandler = (e) => {
    onClick?.(e);
    if (onCopy) {
      let delay: number = DEFAULTS.copy.delay;
      let content: Content = <div {...styles.copied}>{DEFAULTS.copy.message}</div>;
      let fontSize: number = DEFAULTS.copy.fontSize;
      let opacity: number = DEFAULTS.copy.opacity;

      const args: t.ButtonCopyHandlerArgs = {
        delay(value) {
          delay = Math.max(0, value);
          return args;
        },
        message(value) {
          content = value;
          return args;
        },
        fontSize(value) {
          fontSize = value;
          return args;
        },
        opacity(value) {
          opacity = Math.max(0, Math.min(1, value));
          return args;
        },
        async copy(value) {
          if (value !== undefined) await navigator.clipboard.writeText(String(value));
        },
      };
      onCopy?.(args);

      setCopiedContent(content);
      setCopiedFontSize(fontSize);
      setCopiedOpacity(opacity);
      startTimer(delay);
    }
  };

  /**
   * [Render]
   */
  const theme = Color.theme(props.theme);
  const styles = {
    copied: css({
      color: theme.fg,
      fontSize: copiedFontSize,
      opacity: copiedOpacity,
    }),
  };

  const elOverlay = timer && copiedContent && <div>{copiedContent}</div>;
  return <Button {...properties} onClick={handleClick} overlay={elOverlay} />;
};
