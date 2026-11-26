import { Str } from '../common.ts';

export const registrationAdvisory = Str.dedent(`
  # Use a sample passkey

  The \`sys.ui:accounts\` service keeps [accounts](https://www.w3.org/TR/webauthn-3/#user-account),
  [passkey registrations](https://www.w3.org/TR/webauthn-3/#credential-record), and
  [sessions](https://pages.nist.gov/800-63-4/sp800-63b/session/#sessmgmt) in memory only.
  Restarting the service clears them. Your [authenticator](https://www.w3.org/TR/webauthn-3/#authenticator)
  may still offer the [passkey](https://www.w3.org/TR/webauthn-3/#passkey), but you can no longer use it to sign in here.
  Save the sample passkey in your usual password manager.
`);
