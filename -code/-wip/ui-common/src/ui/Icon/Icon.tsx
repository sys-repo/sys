import type { t } from '../common.ts';
import { IconView as View } from './Icon.View.tsx';
import type { IconComponent } from './Icon.View.tsx';

export const Icon = {
  View,
  renderer(type: IconComponent): t.IconRenderer {
    return (props: t.IconProps) => <View type={type} {...props} />;
  },
};
