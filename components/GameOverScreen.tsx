
import React from 'react';
import { translations } from '../translations';
import { Language } from '../types';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  lang: Language;
  onRestart: () => void;
  speak: (text: string) => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, highScore, lang, onRestart, speak }) => {
  const t = translations[lang];

  const handleRestart = () => {
    speak(t.restart);
    onRestart();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-red-500/90 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center border-4 border-white">
        <h2 className="text-5xl font-black text-red-600 mb-2">{t.gameOver}</h2>
        
        <div className="flex justify-around mb-10 mt-8">
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">{t.score}</p>
            <p className="text-6xl font-black text-sky-600">{score}</p>
          </div>
          <div className="border-r border-gray-100 h-16 self-center mx-4"></div>
          <div>
            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">{t.highScore}</p>
            <p className="text-6xl font-black text-pink-500">{highScore}</p>
          </div>
        </div>

        <button 
          onClick={handleRestart}
          className="w-full bg-red-500 hover:bg-red-400 text-white font-black text-3xl px-12 py-5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 border-b-4 border-red-700"
        >
          {t.restart} ↺
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;
