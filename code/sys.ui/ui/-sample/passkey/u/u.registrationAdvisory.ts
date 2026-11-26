import { Str } from '../common.ts';

export const registrationAdvisory = Str.dedent(`
  # Use a sample passkey

  Restarting the cell’s \`sys.ui:accounts\` service clears its in-memory accounts, registrations,
  and sessions. Your [authenticator](https://www.w3.org/TR/webauthn-3/#authenticator) may still
  offer the [passkey](https://www.w3.org/TR/webauthn-3/#passkey), but it will no longer work here.
`);
