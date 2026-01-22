
import React, { useState } from 'react';
import { translations } from '../translations';
import { Language } from '../types';

interface StartScreenProps {
  onStart: () => void;
  highScore: number;
  lang: Language;
  speak: (text: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, highScore, lang, speak }) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const t = translations[lang];

  const handleStart = () => {
    speak(t.start);
    onStart();
  };

  const handleShowHow = () => {
    speak(t.howToPlay);
    setShowInstructions(true);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-sky-400/90 to-sky-600/90 text-white text-center">
      <div className="mb-8 animate-bounce">
         <span className="text-8xl drop-shadow-2xl" role="img" aria-label="baby bottle">🍼</span>
      </div>
      <h1 className="text-6xl font-black mb-4 drop-shadow-md">{t.title}</h1>
      <p className="text-xl max-w-md mb-8 opacity-90 leading-relaxed">
        {t.controlsDesc}
      </p>
      
      {highScore > 0 && (
        <div className="mb-8 bg-white/20 px-6 py-2 rounded-full border border-white/30 backdrop-blur-sm">
          <span className="font-bold">{t.highScore}: {highScore}</span>
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button 
          onClick={handleStart}
          onFocus={() => speak(t.start)}
          className="bg-pink-500 hover:bg-pink-400 text-white font-black text-3xl px-12 py-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95 border-b-8 border-pink-700 active:border-b-0"
          aria-label={t.start}
        >
          {t.start}
        </button>

        <button 
          onClick={handleShowHow}
          onFocus={() => speak(t.howToPlay)}
          className="bg-sky-700/50 hover:bg-sky-700/70 text-white font-bold text-lg px-8 py-3 rounded-full border border-white/20 transition-all"
        >
          {t.howToPlay}
        </button>
      </div>

      {showInstructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white text-slate-900 p-8 rounded-3xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setShowInstructions(false)}
              onFocus={() => speak("Close")}
              className="absolute top-4 left-4 text-gray-400 hover:text-pink-500 text-2xl"
              aria-label="Close"
            >
              ✕
            </button>
            <h2 className="text-3xl font-black mb-6 text-sky-600">{t.instructionsTitle}</h2>
            
            <div className="space-y-6 text-right" dir={lang === 'he' ? 'rtl' : 'ltr'}>
              <div>
                <h3 className="font-bold text-lg border-b-2 border-sky-100 pb-1 mb-2">{t.controls}</h3>
                <p>{t.controlsDesc}</p>
              </div>

              <div>
                <h3 className="font-bold text-lg border-b-2 border-sky-100 pb-1 mb-2">{t.scoring}</h3>
                <p>{t.scoringDesc}</p>
              </div>

              <div>
                <h3 className="font-bold text-lg border-b-2 border-sky-100 pb-1 mb-2">{t.powerups}</h3>
                <p>{t.powerupsDesc}</p>
              </div>
            </div>

            <button 
              onClick={() => setShowInstructions(false)}
              onFocus={() => speak(t.understand)}
              className="mt-8 w-full bg-pink-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-pink-400 transition-colors"
            >
              {t.understand}
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm opacity-70">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-sky-300 rounded-full"></div> {t.standard} (10)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-pink-400 rounded-full"></div> {t.speedy} (30)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div> {t.golden} (50)
        </div>
      </div>
    </div>
  );
};

export default StartScreen;
