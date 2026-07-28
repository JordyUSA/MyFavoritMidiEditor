import { useAudioEngine } from '@/audio/useAudioEngine';
import { useUiStore } from '@/state/uiStore';
import { MainToolbar } from '@/components/Toolbar/MainToolbar';
import { TransportBar } from '@/components/Toolbar/TransportBar';
import { OverviewView } from '@/components/OverviewView/OverviewView';
import { InstrumentView } from '@/components/InstrumentView/InstrumentView';
import { ImportConfirmDialog } from '@/components/common/ImportConfirmDialog';
import { EffectsPanel } from '@/components/common/EffectsPanel';
import { BeatPresetsPanel } from '@/components/Presets/BeatPresetsPanel';
import { SongPresetsPanel } from '@/components/Presets/SongPresetsPanel';

export function App() {
  useAudioEngine();
  const view = useUiStore((s) => s.view);

  return (
    <div className="app-shell">
      <MainToolbar />
      <TransportBar />
      <div className="app-main">{view === 'overview' ? <OverviewView /> : <InstrumentView />}</div>
      <ImportConfirmDialog />
      <EffectsPanel />
      <BeatPresetsPanel />
      <SongPresetsPanel />
    </div>
  );
}
