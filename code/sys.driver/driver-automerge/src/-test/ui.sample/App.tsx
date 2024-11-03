import { useEffect, useState } from 'react';
import { Color, css, Doc, WebStore, type t } from './common.ts';

export type AppProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

type D = { count: number };

const sample = async () => {
  const store = WebStore.init();
  const doc = await store.doc.getOrCreate<D>((d) => (d.count = 0));

  doc.change((d) => d.count++);
  console.log('doc.current', Doc.toObject(doc.current));
  return doc;
};

export const App: React.FC<AppProps> = (props) => {
  const [doc, setDoc] = useState<t.Doc<D>>(null);

  useEffect(() => {
    sample().then((doc) => setDoc(doc));
  }, []);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
  };

  console.log(doc);

  return (
    <div {...css(styles.base, props.style)}>
      <div>{`🐷 Sample`}</div>
    </div>
  );
};
