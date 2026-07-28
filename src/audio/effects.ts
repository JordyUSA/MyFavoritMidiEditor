import * as Tone from 'tone';
import type { EffectInstance } from '@/state/types';

export type ToneEffectNode = InstanceType<
  typeof Tone.Reverb | typeof Tone.FeedbackDelay | typeof Tone.Chorus | typeof Tone.Distortion |
  typeof Tone.EQ3 | typeof Tone.Compressor | typeof Tone.Phaser | typeof Tone.BitCrusher |
  typeof Tone.Tremolo | typeof Tone.AutoFilter
>;

/** Builds a live Tone.js node for an effect definition and applies its current params. */
export function createToneEffect(effect: EffectInstance): Tone.ToneAudioNode {
  switch (effect.type) {
    case 'reverb': {
      const node = new Tone.Reverb({ decay: effect.params.decay ?? 2.5, preDelay: effect.params.preDelay ?? 0.02 });
      node.wet.value = effect.wet;
      return node;
    }
    case 'delay': {
      const node = new Tone.FeedbackDelay({
        delayTime: effect.params.delayTime ?? 0.25,
        feedback: effect.params.feedback ?? 0.3,
      });
      node.wet.value = effect.wet;
      return node;
    }
    case 'chorus': {
      const node = new Tone.Chorus({
        frequency: effect.params.frequency ?? 1.5,
        depth: effect.params.depth ?? 0.5,
      }).start();
      node.wet.value = effect.wet;
      return node;
    }
    case 'distortion': {
      const node = new Tone.Distortion({ distortion: effect.params.distortion ?? 0.3 });
      node.wet.value = effect.wet;
      return node;
    }
    case 'eq3': {
      const node = new Tone.EQ3({
        low: effect.params.low ?? 0,
        mid: effect.params.mid ?? 0,
        high: effect.params.high ?? 0,
      });
      return node;
    }
    case 'compressor': {
      const node = new Tone.Compressor({
        threshold: effect.params.threshold ?? -24,
        ratio: effect.params.ratio ?? 4,
        attack: effect.params.attack ?? 0.02,
        release: effect.params.release ?? 0.2,
      });
      return node;
    }
    case 'phaser': {
      const node = new Tone.Phaser({
        frequency: effect.params.frequency ?? 0.5,
        octaves: effect.params.octaves ?? 3,
      });
      node.wet.value = effect.wet;
      return node;
    }
    case 'bitcrusher': {
      const node = new Tone.BitCrusher({ bits: effect.params.bits ?? 8 });
      node.wet.value = effect.wet;
      return node;
    }
    case 'tremolo': {
      const node = new Tone.Tremolo({
        frequency: effect.params.frequency ?? 9,
        depth: effect.params.depth ?? 0.6,
      }).start();
      node.wet.value = effect.wet;
      return node;
    }
    case 'autoFilter': {
      const node = new Tone.AutoFilter({
        frequency: effect.params.frequency ?? 1,
        baseFrequency: effect.params.baseFrequency ?? 200,
      }).start();
      node.wet.value = effect.wet;
      return node;
    }
    default:
      return new Tone.Gain(1);
  }
}

/** Updates an already-live node's params in place, so mixer tweaks are heard immediately during playback. */
export function updateToneEffect(node: Tone.ToneAudioNode, effect: EffectInstance): void {
  const anyNode = node as any;
  if ('wet' in anyNode && anyNode.wet?.value !== undefined) {
    anyNode.wet.value = effect.enabled ? effect.wet : 0;
  }
  switch (effect.type) {
    case 'reverb':
      if (effect.params.decay !== undefined) anyNode.decay = effect.params.decay;
      if (effect.params.preDelay !== undefined) anyNode.preDelay = effect.params.preDelay;
      break;
    case 'delay':
      if (effect.params.delayTime !== undefined) anyNode.delayTime.value = effect.params.delayTime;
      if (effect.params.feedback !== undefined) anyNode.feedback.value = effect.params.feedback;
      break;
    case 'chorus':
      if (effect.params.frequency !== undefined) anyNode.frequency.value = effect.params.frequency;
      if (effect.params.depth !== undefined) anyNode.depth = effect.params.depth;
      break;
    case 'distortion':
      if (effect.params.distortion !== undefined) anyNode.distortion = effect.params.distortion;
      break;
    case 'eq3':
      if (effect.params.low !== undefined) anyNode.low.value = effect.params.low;
      if (effect.params.mid !== undefined) anyNode.mid.value = effect.params.mid;
      if (effect.params.high !== undefined) anyNode.high.value = effect.params.high;
      break;
    case 'compressor':
      if (effect.params.threshold !== undefined) anyNode.threshold.value = effect.params.threshold;
      if (effect.params.ratio !== undefined) anyNode.ratio.value = effect.params.ratio;
      if (effect.params.attack !== undefined) anyNode.attack.value = effect.params.attack;
      if (effect.params.release !== undefined) anyNode.release.value = effect.params.release;
      break;
    case 'phaser':
      if (effect.params.frequency !== undefined) anyNode.frequency.value = effect.params.frequency;
      if (effect.params.octaves !== undefined) anyNode.octaves = effect.params.octaves;
      break;
    case 'bitcrusher':
      if (effect.params.bits !== undefined) anyNode.bits.value = effect.params.bits;
      break;
    case 'tremolo':
    case 'autoFilter':
      if (effect.params.frequency !== undefined) anyNode.frequency.value = effect.params.frequency;
      if (effect.params.depth !== undefined && 'depth' in anyNode) anyNode.depth.value = effect.params.depth;
      break;
  }
}
