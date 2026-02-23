import { backupConfig } from './-tmp.backup-config.ts';
import { mdFileToPdf } from './-tmp.pdf.ts';
import { sendMailSample } from './-tmp.send-email.ts';

await sendMailSample();
// await mdFileToPdf('.tmp/SUMMARY.md');

// await backupConfig({ from: './.tmp/-config/', to: '../../-config/', snapshot: false, merge: true });
// await backupConfig({ from: './.tmp/-config/', to: '~/code.data/-backup.from.sys-tmp/' });
