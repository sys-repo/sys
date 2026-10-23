import { D, Is, type t } from '../common.ts';

export const unknown: t.Pkg.Is.Lib['unknown'] = (input) => {
  if (Is.object(input)) {
    const { name, version } = input;
    if (!Is.str(name)) return true;
    if (!Is.str(version)) return true;
    const UNKNOWN = D.unknown();
    return name === UNKNOWN.name && version === UNKNOWN.version;
  }
  if (!Is.str(input)) return true;
  const UNKNOWN = D.unknown();
  return input === `${UNKNOWN.name}@${UNKNOWN.version}`;
};
