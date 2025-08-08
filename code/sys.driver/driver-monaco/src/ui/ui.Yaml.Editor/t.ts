import type { PathViewProps } from '@sys/ui-react-components/t';
import type { t } from './common.ts';

export type * from './t.Editor.ts';

/**
 * Dev Library Namespace:
 */
export type MonacoDevLib = Readonly<{
  Editor: React.FC<t.YamlEditorProps>;
  PathView: React.FC<PathViewProps>;
}>;
