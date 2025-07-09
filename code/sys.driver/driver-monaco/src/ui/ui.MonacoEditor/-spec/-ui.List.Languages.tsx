import React from 'react';
import { type t, Bullet, Button, Color, css, Languages } from '../common.ts';

export type LanguagesListProps = {
  current?: t.EditorLanguage;
  show?: t.EditorLanguage[];

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: SelectLanguageHandler;
};

export type SelectLanguageHandler = (e: SelectLanguage) => void;
export type SelectLanguage = { language: t.EditorLanguage };

/**
 * Component:
 */
export const LanguagesList: React.FC<LanguagesListProps> = (props) => {
  const { debug = false, current, onSelect, show = Languages.all } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {show.map((lang) => {
        return <Language key={lang} language={lang} current={current} onSelect={onSelect} />;
      })}
    </div>
  );
};

/**
 * Helpers:
 */
function Language(props: {
  language: t.EditorLanguage;
  current?: t.EditorLanguage;
  onSelect?: SelectLanguageHandler;
}) {
  const { language, current, onSelect } = props;
  const isSelected = language === current;
  const styles = {
    base: css({
      margin: 1,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignItems: 'center',
      columnGap: 10,
    }),
  };
  return (
    <div key={language} className={styles.base.class}>
      <Bullet selected={isSelected} />
      <Button block label={() => language} onClick={() => onSelect?.({ language })} />
    </div>
  );
}
