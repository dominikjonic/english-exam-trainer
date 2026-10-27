import { useState } from 'react';
import type { MiniGameInfo } from './lib/minigames';
import type { ExamResult } from './lib/types';
import { ArcadeScreen } from './screens/ArcadeScreen';
import { CrewScreen } from './screens/CrewScreen';
import { ExamScreen } from './screens/ExamScreen';
import { HomeScreen } from './screens/HomeScreen';
import { LearnScreen } from './screens/LearnScreen';
import { ParentScreen } from './screens/ParentScreen';
import { ResultScreen } from './screens/ResultScreen';

type Screen =
  | { name: 'home' | 'exam' | 'learn' | 'parent' | 'crew' }
  | { name: 'result'; result: ExamResult }
  | { name: 'arcade'; start?: MiniGameInfo };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const home = () => setScreen({ name: 'home' });
  switch (screen.name) {
    case 'home':
      return <HomeScreen go={(name) => setScreen({ name })} play={(start) => setScreen({ name: 'arcade', start })} />;
    case 'exam':
      return <ExamScreen onCancel={home} onFinish={(result) => setScreen({ name: 'result', result })} />;
    case 'result':
      return <ResultScreen result={screen.result} onHome={home} />;
    case 'learn':
      return <LearnScreen onHome={home} />;
    case 'parent':
      return <ParentScreen onHome={home} />;
    case 'crew':
      return <CrewScreen onHome={home} />;
    case 'arcade':
      return <ArcadeScreen start={screen.start} onHome={home} />;
  }
}
