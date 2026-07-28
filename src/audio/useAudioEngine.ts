import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/state/projectStore';
import { useUiStore } from '@/state/uiStore';
import { audioEngine } from './engine';

/**
 * Bridges the imperative AudioEngine to React state: starts/stops playback
 * when uiStore.isPlaying flips, drives the animated playhead, and keeps
 * live mixer/effect tweaks in sync while the transport is running.
 */
export function useAudioEngine(): void {
  const rafRef = useRef<number>();
  const wasPlaying = useRef(false);

  useEffect(() => {
    const tick = () => {
      const { isPlaying, loopEnabled, loopStart, loopEnd, setPlayheadBeat } = useUiStore.getState();
      if (isPlaying) {
        let beat = audioEngine.getCurrentBeat();
        if (loopEnabled && beat >= loopEnd) beat = loopStart;
        setPlayheadBeat(beat);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(
    () =>
      useUiStore.subscribe((state, prev) => {
        if (state.isPlaying === prev.isPlaying) return;
        if (state.isPlaying) {
          const project = useProjectStore.getState().project;
          void audioEngine.play(project, {
            startBeat: state.playheadBeat,
            metronome: state.metronomeEnabled,
            loop: { enabled: state.loopEnabled, startBeat: state.loopStart, endBeat: state.loopEnd },
            onLoadingChange: (loading) => useUiStore.getState().setIsLoadingAudio(loading),
          });
          wasPlaying.current = true;
        } else if (wasPlaying.current) {
          audioEngine.stop();
          useUiStore.getState().setIsLoadingAudio(false);
          wasPlaying.current = false;
        }
      }),
    [],
  );

  useEffect(
    () =>
      useProjectStore.subscribe((state) => {
        if (useUiStore.getState().isPlaying) audioEngine.syncLiveParams(state.project);
      }),
    [],
  );
}
