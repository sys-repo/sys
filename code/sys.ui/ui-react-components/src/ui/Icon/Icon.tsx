import type { IconType } from 'react-icons';

import type { t } from './common.ts';
import { IconView as View } from './Icon.View.tsx';

export const Icon = {
  View,
  renderer(type: IconType): t.IconRenderer {
    return (props: t.IconProps) => <View type={type} {...props} />;
  },
};
