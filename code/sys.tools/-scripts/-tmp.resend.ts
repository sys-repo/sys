import { Env } from '@sys/fs';
import { Resend } from 'npm:resend';

/**
 * Resend.com:
 * "Email for developers"
 * https://resend.com/onboarding
 *
 */
export async function resendSample() {
  const RESEND_API_KEY = (await Env.load()).get('RESEND_API_KEY');
  const resend = new Resend(RESEND_API_KEY);

  const to = 'phil@cockfield.net';
  const res = await resend.emails.send({
    from: 'phil@db.team',
    to,
    subject: `Hello World "${to}" 👋`,
    html: `<p>Test from <strong>@system</strong>! <br>Hello ${to}.</p>`,
  });

  console.log(`-------------------------------------------`);
  console.log('result', res);
}
