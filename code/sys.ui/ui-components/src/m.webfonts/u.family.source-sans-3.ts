import { type t, WebFont } from './common.ts';

const dir = '/fonts/source-sans-3';
const config = WebFont.def({
  family: 'Source Sans 3',
  variable: true,
  italic: true,
  local: ['Source Sans 3', 'SourceSans3-Regular', 'SourceSans3-Italic'],
  fileForVariable: ({ dir, italic }) => {
    return italic ? `${dir}/source-sans-3-var-italic.woff2` : `${dir}/source-sans-3-var.woff2`;
  },
});

export const SourceSans3: t.Fonts.Bundle = {
  dir,
  config,
};
