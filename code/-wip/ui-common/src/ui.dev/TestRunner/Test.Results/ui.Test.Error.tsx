import { ObjectView, css, type t } from './common.ts';

export type TestErrorProps = {
  data: t.TestRunResponse;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const TestError: React.FC<TestErrorProps> = (props) => {
  const { data } = props;
  if (!data.error) return null;

  const error = {
    ...data.error,
    message: data.error.message,
    stack: data.error.stack,
  };

  /**
   * [Render]
   */
  const styles = { base: css({}) };
  return (
    <div {...css(styles.base, props.style)}>
      <ObjectView data={error} fontSize={10} theme={props.theme} />
    </div>
  );
};
