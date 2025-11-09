/** Assumes valid timecode. Use `is` before calling in untrusted paths. */
export function parseMs(tc: string): number {
  const [hms, mmm] = tc.split('.');
  const parts = hms.split(':').map((x) => Number(x));
  let hh = 0,
    mm = 0,
    ss = 0;
  if (parts.length === 2) {
    [mm, ss] = parts;
  } else {
    [hh, mm, ss] = parts;
  }
  const ms = mmm ? Number(mmm) : 0;
  return ((hh * 60 + mm) * 60 + ss) * 1000 + ms;
}
