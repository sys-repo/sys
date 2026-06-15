import { Is as StdIs, type t } from './common.ts';
import type { JsrUrl } from './t.ts';

const PKG_NAME = /^@[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/;

/** JSR package-name type predicates. */
export const Is: JsrUrl.Pkg.IsLib = {
  name(input): input is t.StringPkgName {
    return StdIs.string(input) && PKG_NAME.test(input);
  },
};
