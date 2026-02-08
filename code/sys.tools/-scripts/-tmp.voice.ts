import { Env } from '@sys/fs';
import { c, Fs, Is } from '../src/common.ts';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const env = await Env.load();

// https://elevenlabs.io/app/developers/api-keys
const ELEVEN_LABS_API_KEY = env.get('ELEVEN_LABS_API_KEY');
const FALLBACK_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

const D = {
  modelId: 'eleven_multilingual_v2',
  outputFormat: 'mp3_44100_128',
  voiceSettings: {
    stability: 0.3,
    similarityBoost: 0.88,
    style: 0.82,
    useSpeakerBoost: true,
    speed: 0.97,
  },
  applyTextNormalization: 'auto',
} as const;

export async function runVoice() {
  console.info();
  console.info(c.bold(c.cyan('11Labs Sample')));
  console.info(c.gray('@elevenlabs/elevenlabs-js'));

  const path = Fs.join(import.meta.dirname ?? '', '-tmp.voice.-script.md');
  const script = (await Fs.readText(path)).data ?? '';
  const text = script.trim();
  if (Is.blank(text)) throw new Error(`Voice script is empty: ${path}`);

  const apiKey = ELEVEN_LABS_API_KEY;
  if (Is.blank(apiKey)) throw new Error('Missing ELEVEN_LABS_API_KEY in environment');

  const elevenlabs = new ElevenLabsClient({ apiKey });
  const voice = await resolveVoice(elevenlabs);
  const outputFormat = env.get('ELEVEN_LABS_OUTPUT_FORMAT')?.trim() || D.outputFormat;
  const outputExt = extFromOutputFormat(outputFormat);

  console.info();
  console.info(`voice: ${voice.name} (${voice.id})`);
  console.info(`model: ${D.modelId}`);
  console.info(`format: ${outputFormat}`);

  const audio = await elevenlabs.textToSpeech.convert(voice.id, {
    text,
    modelId: D.modelId,
    outputFormat,
    voiceSettings: D.voiceSettings,
    applyTextNormalization: D.applyTextNormalization,
  });

  const bytes = new Uint8Array(await new Response(audio).arrayBuffer());
  const outFile = Fs.join(
    import.meta.dirname ?? '',
    `-tmp.voice.${voice.slug}.${outputFormat}.${outputExt}`,
  );
  await Fs.write(outFile, bytes, { force: true });

  console.info();
  console.info(c.green(`Saved: ${Fs.trimCwd(outFile)}`));
  console.info(c.gray(`Bytes: ${bytes.byteLength}`));
  console.info();
}

async function resolveVoice(elevenlabs: ElevenLabsClient) {
  const preferredVoiceId = env.get('ELEVEN_LABS_VOICE_ID')?.trim();
  if (!Is.blank(preferredVoiceId)) {
    const match = await elevenlabs.voices.get(preferredVoiceId);
    return {
      id: match.voiceId,
      name: match.name ?? 'selected',
      slug: slugify(match.name ?? match.voiceId),
    };
  }

  const res = await elevenlabs.voices.search({
    pageSize: 25,
    sort: 'created_at_unix',
    sortDirection: 'desc',
    voiceType: 'saved',
  });

  const voices = res.voices ?? [];
  const scored = voices
    .map((voice) => ({
      voice,
      score:
        (voice.category === 'generated' ? 300 : 0) +
        (voice.category === 'professional' ? 200 : 0) +
        ((voice.highQualityBaseModelIds?.includes(D.modelId) ?? false) ? 100 : 0) +
        (voice.createdAtUnix ?? 0),
    }))
    .sort((a, b) => b.score - a.score)
    .at(0)?.voice;

  const best = scored ?? voices.at(0);
  if (best) {
    return {
      id: best.voiceId,
      name: best.name ?? 'saved',
      slug: slugify(best.name ?? best.voiceId),
    };
  }

  return {
    id: FALLBACK_VOICE_ID,
    name: 'premade',
    slug: 'premade',
  };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extFromOutputFormat(outputFormat: string) {
  const codec = outputFormat.split('_')[0];
  if (codec === 'pcm' || codec === 'ulaw' || codec === 'alaw') return 'raw';
  return codec;
}
