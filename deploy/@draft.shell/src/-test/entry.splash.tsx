import { Splash as SplashBase, pkg } from '../ui/common.ts';

export const Splash = () => {
  return <SplashBase.UI pkg={pkg} style={{ Absolute: 0 }} />;
};
