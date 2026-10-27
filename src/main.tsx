import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { canSpeak } from './lib/speech';
import { StoreProvider } from './lib/store';
import './styles.css';

// Chrome loads its voices lazily; asking early makes them ready for the first dictation.
if (canSpeak()) window.speechSynthesis.getVoices();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
