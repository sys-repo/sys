/** Reporting facts only; no execution policy or enclosure detection. */
export const PiAuthority = {
  process: 'not provided by Pi-Driver',
  enclosure: 'unknown',
  limitation: 'Deno path limits do not constrain Bash or its subprocesses.',
} as const;
