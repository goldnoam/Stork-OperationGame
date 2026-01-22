
import React from 'react';
import { translations } from '../translations';
import { Language } from '../types';

interface LevelEndScreenProps {
  level: number;
  saved: number;
  lang: Language;
  onNext: () => void;
  speak: (text: string) => void;
}

const LevelEndScreen: React.FC<LevelEndScreenProps> = ({ level, saved, lang, onNext, speak }) => {
  const t = translations[lang];

  const handleNext = () => {
    speak(t.nextLevel);
    onNext();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-lg">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center border-4 border-sky-400">
        <h2 className="text-4xl font-black text-sky-600 mb-2">{t.levelComplete}</h2>
        <div className="text-6xl mb-6">🍼</div>
        
        <p className="text-2xl text-pink-500 font-bold mb-4">
          {t.score}: {saved}
        </p>

        <button 
          onClick={handleNext}
          className="w-full bg-sky-500 hover:bg-sky-400 text-white font-black text-2xl px-10 py-4 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border-b-4 border-sky-700"
        >
          {t.nextLevel} ➔
        </button>
      </div>
    </div>
  );
};

export default LevelEndScreen;
