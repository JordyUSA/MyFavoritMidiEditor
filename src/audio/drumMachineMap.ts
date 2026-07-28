/**
 * Real drum machine sample kits, sourced directly from
 * https://smpldsnds.github.io/drum-machines (the same CDN `smplr`'s
 * `DrumMachine` helper uses). We build a minimal custom sampler instead of
 * using `DrumMachine` directly because that helper fetches every sample in
 * the kit (100+ files, mostly tuning/velocity variations we'd never play)
 * before it considers itself "ready" — we only need one representative
 * sample per GM percussion pitch, so we map straight to exact filenames.
 */
export const DRUM_MACHINE_NAMES = ['TR-808', 'Casio-RZ1', 'LM-2', 'MFB-512', 'Roland CR-8000'] as const;
export type DrumMachineName = (typeof DRUM_MACHINE_NAMES)[number];

/** kit display name -> its CDN folder (case-sensitive; differs from the display name for one kit). */
const KIT_BASE_URL: Record<DrumMachineName, string> = {
  'TR-808': 'https://smpldsnds.github.io/drum-machines/TR-808',
  'Casio-RZ1': 'https://smpldsnds.github.io/drum-machines/Casio-RZ1',
  'LM-2': 'https://smpldsnds.github.io/drum-machines/LM-2',
  'MFB-512': 'https://smpldsnds.github.io/drum-machines/MFB-512',
  'Roland CR-8000': 'https://smpldsnds.github.io/drum-machines/Roland-CR-8000',
};

/** GM percussion pitch -> exact sample filename (no extension), confirmed against each kit's dm.json. */
const TR_808: Record<number, string> = {
  35: 'kick/bd0000', 36: 'kick/bd0000', 37: 'rimshot/rs', 38: 'snare/sd0000', 39: 'clap/cp', 40: 'snare/sd0000',
  41: 'tom-low/lt00', 42: 'hihat-close/ch', 43: 'tom-low/lt00', 44: 'hihat-close/ch', 45: 'mid-tom/mt00',
  46: 'hihat-open/oh00', 47: 'mid-tom/mt00', 48: 'tom-hi/ht00', 49: 'cymbal/cy0000', 50: 'tom-hi/ht00',
  51: 'cymbal/cy0000', 52: 'cymbal/cy0000', 53: 'cymbal/cy0000', 54: 'maraca/ma', 55: 'cymbal/cy0000',
  56: 'cowbell/cb', 57: 'cymbal/cy0000', 59: 'cymbal/cy0000',
};

const CASIO_RZ1: Record<number, string> = {
  35: 'kick', 36: 'kick', 37: 'clave', 38: 'snare', 39: 'clap', 40: 'snare',
  41: 'tom-3', 42: 'hihat-closed', 43: 'tom-3', 44: 'hihat-closed', 45: 'tom-2',
  46: 'hihat-open', 47: 'tom-2', 48: 'tom-1', 49: 'crash', 50: 'tom-1',
  51: 'ride', 52: 'ride', 53: 'ride', 54: 'clave', 55: 'crash',
  56: 'cowbell', 57: 'crash', 59: 'ride',
};

const LM_2: Record<number, string> = {
  35: 'kick-alt', 36: 'kick-alt', 37: 'stick-h', 38: 'snare-h', 39: 'clap', 40: 'snare-h',
  41: 'tom-l', 42: 'hhclosed-long', 43: 'tom-ll', 44: 'hhclosed-long', 45: 'tom-m',
  46: 'hhopen', 47: 'tom-m', 48: 'tom-h', 49: 'crash', 50: 'tom-hh',
  51: 'ride', 52: 'ride', 53: 'ride', 54: 'tambourine', 55: 'crash',
  56: 'cowbell', 57: 'crash', 59: 'ride',
};

const MFB_512: Record<number, string> = {
  35: 'kick', 36: 'kick', 37: 'clap', 38: 'snare', 39: 'clap', 40: 'snare',
  41: 'tom-low', 42: 'hihat-closed', 43: 'tom-low', 44: 'hihat-closed', 45: 'tom-mid',
  46: 'hihat-open', 47: 'tom-mid', 48: 'tom-hi', 49: 'cymbal', 50: 'tom-hi',
  51: 'cymbal', 52: 'cymbal', 53: 'cymbal', 54: 'clap', 55: 'cymbal',
  56: 'clap', 57: 'cymbal', 59: 'cymbal',
};

const ROLAND_CR_8000: Record<number, string> = {
  35: 'kick', 36: 'kick', 37: 'rimshot', 38: 'snare', 39: 'clap', 40: 'snare',
  41: 'tom-low', 42: 'hihat-closed', 43: 'tom-low', 44: 'hihat-closed', 45: 'tom-low',
  46: 'hihat-open', 47: 'tom-low', 48: 'tom-high', 49: 'cymball', 50: 'tom-high',
  51: 'cymball', 52: 'cymball', 53: 'cymball', 54: 'clave', 55: 'cymball',
  56: 'cowbell', 57: 'cymball', 59: 'cymball',
};

const KIT_SAMPLE_MAPS: Record<DrumMachineName, Record<number, string>> = {
  'TR-808': TR_808,
  'Casio-RZ1': CASIO_RZ1,
  'LM-2': LM_2,
  'MFB-512': MFB_512,
  'Roland CR-8000': ROLAND_CR_8000,
};

export const DEFAULT_DRUM_MACHINE: DrumMachineName = 'TR-808';

let cachedFormat: 'ogg' | 'm4a' | null = null;
/** Ogg Vorbis isn't supported in Safari; fall back to AAC (m4a) there. */
function preferredAudioFormat(): 'ogg' | 'm4a' {
  if (cachedFormat) return cachedFormat;
  try {
    const canOgg = document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"');
    cachedFormat = canOgg ? 'ogg' : 'm4a';
  } catch {
    cachedFormat = 'ogg';
  }
  return cachedFormat;
}

/**
 * Builds a minimal `{ label: url }` map covering only the GM pitches actually
 * used by `pitches`, for `Sampler({ buffers })`. Falls back to the kit's
 * kick sample for any pitch we don't have an explicit mapping for.
 */
export function drumSampleUrlsFor(kit: DrumMachineName, pitches: number[]): Record<string, string> {
  const map = KIT_SAMPLE_MAPS[kit];
  const base = KIT_BASE_URL[kit];
  const format = preferredAudioFormat();
  const out: Record<string, string> = {};
  for (const pitch of pitches) {
    const file = map[pitch] ?? map[36] ?? Object.values(map)[0];
    out[drumLabel(pitch)] = `${base}/${file}.${format}`;
  }
  return out;
}

export function drumLabel(pitch: number): string {
  return `gm${pitch}`;
}
