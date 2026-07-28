import { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import type { InstrumentSpec } from '@/state/types';
import { createPlayableInstrument, disposeInstrument, instrumentOutputNode, triggerNote, type PlayableInstrument } from './instruments';

/** A small throwaway instrument (routed straight to the speakers) for click-to-preview interactions. */
export function usePreviewInstrument(spec: InstrumentSpec) {
  const ref = useRef<PlayableInstrument | null>(null);
  const specKey = `${spec.source}-${spec.isDrumKit}-${spec.program}-${spec.drumKitName ?? ''}`;

  useEffect(() => {
    const ctx = Tone.getContext().rawContext as unknown as BaseAudioContext;
    const instrument = createPlayableInstrument(spec, ctx);
    // A sample fetch can fail (offline, blocked CDN, etc.) — swallow it here so it
    // never surfaces as an unhandled rejection; preview clicks just stay silent.
    if (instrument.kind === 'sampled') instrument.ready.catch(() => undefined);
    instrumentOutputNode(instrument).toDestination();
    ref.current = instrument;
    return () => {
      disposeInstrument(instrument);
      if (ref.current === instrument) ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey]);

  return (pitch: number, velocity = 100) => {
    if (!ref.current) return;
    void Tone.start();
    triggerNote(ref.current, pitch, 0.35, Tone.now(), velocity);
  };
}
