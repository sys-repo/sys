import type { PathViewProps } from '@sys/ui-react-components/t';
import type { t } from './common.ts';

/**
 * Dev Library Namespace:
 */
export type MonacoDevLib = Readonly<{
  Editor: React.FC<t.DevEditorProps>;
  PathView: React.FC<PathViewProps>;
}>;

/**
 * Component:
 */
export type DevEditorProps = {
  repo?: t.Crdt.Repo;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
