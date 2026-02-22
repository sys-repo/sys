import { backupConfig } from './-tmp.backup-config.ts';
import { mdFileToPdf } from './-tmp.pdf.ts';
import { resendSample } from './-tmp.resend.ts';

// await resendSample();
// await mdFileToPdf('.tmp/SUMMARY.md');

// await backupConfig({ from: './.tmp/-config/', to: '../../-config/', snapshot: false, merge: true });
await backupConfig({ from: './.tmp/-config/', to: '~/code.data/-backup.from.sys-tmp/' });
