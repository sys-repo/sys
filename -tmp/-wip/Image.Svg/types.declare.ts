/**
 * Importing <SVG> assets.
 * See:
 *    https://react-svgr.com
 */
declare module '*.svg' {
  import React = require('react');
  type Svg = React.SVGProps<SVGSVGElement> & { width?: number; height?: number };
  export const ReactComponent: React.FC<Svg>;
  export default ReactComponent;
}
