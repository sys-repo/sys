/**
 * Starter entry view using the shared primitive splash component.
 */
import { Splash as SplashBase } from '@sys/ui-react-components/splash';
import { pkg } from '../pkg.ts';

export const Splash = () => {
  return <SplashBase.UI pkg={pkg} style={{ Absolute: 0 }} />;
};
