import { Path as StdPath, type t } from '../common.ts';
import { Chapters } from '../../m.Fmt.Chapters/mod.ts';
import { Text } from '../../m.Fmt.Text/mod.ts';
import { Commit } from './m.Commit.ts';
import { Header } from './m.Header.ts';
import { Help } from './m.Help.ts';
import { Path } from './m.Path.ts';
import { ServiceUrl } from './m.ServiceUrl.ts';
import { Tree } from './m.Tree.ts';
import { hr } from '../u/u.hr.ts';
import { hyperlink } from '../u/u.hyperlink.ts';
import { omission } from '../u/u.omission.ts';
import { spinnerRaw, spinnerText } from '../u/u.spinner.ts';

/** Shared command-line formatting helper library. */
export const Fmt: t.CliFormat.Lib = Object.freeze({
  Header,
  Commit,
  Help,
  Text,
  Chapters,
  Tree,
  Path,
  ServiceUrl,
  hr,
  hyperlink,
  omission,
  path: StdPath.Format.string,
  spinnerRaw,
  spinnerText,
});
