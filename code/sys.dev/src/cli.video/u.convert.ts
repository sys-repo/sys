import { Cli } from './common.ts';

export type Conversion = 'webm-to-mp4' | 'mp4-to-webm';

const OPTIONS: { name: string; value: Conversion }[] = [
  { name: 'convert .webm → .mp4', value: 'webm-to-mp4' },
  { name: 'convert .mp4 → .webm', value: 'mp4-to-webm' },
];

/**
 * Ask the user what conversion they want to perform.
 */
export async function entry() {
  const choice = await Cli.Prompt.Select.prompt<Conversion>({
    message: 'Choose conversion type:',
    options: OPTIONS,
  });

  switch (choice) {
    case 'webm-to-mp4':
      console.log('Converting .webm → .mp4 …');
      // TODO: convert.webmToMp4()
      break;

    case 'mp4-to-webm':
      console.log('Converting .mp4 → .webm …');
      // TODO: convert.mp4ToWebm()
      break;
  }
}
