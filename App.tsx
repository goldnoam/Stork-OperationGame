
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PowerUpType, Language, FontSize } from './types';
import { translations } from './translations';
import GameCanvas from './components/GameCanvas';
import StartScreen from './components/StartScreen';
import LevelEndScreen from './components/LevelEndScreen';
import GameOverScreen from './components/GameOverScreen';

const LEVEL_DURATION = 30;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [isPaused, setIsPaused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMusicOn, setIsMusicOn] = useState(false);
  const [lang, setLang] = useState<Language>('he');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(LEVEL_DURATION);
  const [babiesSavedInLevel, setBabiesSavedInLevel] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [activeEffects, setActiveEffects] = useState<PowerUpType[]>([]);
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = translations[lang];
  const isRtl = lang === 'he';

  useEffect(() => {
    document.body.className = `${isDarkMode ? 'dark' : ''} ${isRtl ? 'rtl' : 'ltr'}`;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [isDarkMode, isRtl, lang]);

  // Handle Music
  useEffect(() => {
    if (isMusicOn && gameState === GameState.PLAYING && !isPaused) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
      }
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [isMusicOn, gameState, isPaused]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'he' ? 'he-IL' : lang === 'zh' ? 'zh-CN' : lang === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const startNewGame = () => {
    setScore(0); setLevel(1); setBabiesSavedInLevel(0);
    setTimeLeft(LEVEL_DURATION); setIsPaused(false); setActiveEffects([]);
    setGameState(GameState.PLAYING);
  };

  const handleLevelComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveEffects([]); setGameState(GameState.LEVEL_END);
  }, []);

  const nextLevel = () => {
    setLevel(prev => prev + 1); setBabiesSavedInLevel(0);
    setTimeLeft(LEVEL_DURATION); setIsPaused(false); setActiveEffects([]);
    setGameState(GameState.PLAYING);
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleLevelComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, isPaused, handleLevelComplete]);

  const togglePause = () => { setIsPaused(!isPaused); speak(isPaused ? "Resumed" : "Paused"); };
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const toggleMusic = () => { setIsMusicOn(!isMusicOn); speak(isMusicOn ? "Music Off" : "Music On"); };

  const fontSizeClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';
  const currentLevelName = t.levelNames[(level - 1) % t.levelNames.length];

  return (
    <div className={`relative w-full h-screen overflow-hidden font-sans select-none transition-all duration-500 ${fontSizeClass} ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-sky-100 text-slate-900'}`}>
      
      {/* Top Controls Bar */}
      <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-[100] flex gap-2 items-center`}>
        {/* Language Switcher */}
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value as Language)}
          className="bg-white/20 backdrop-blur-md px-2 py-2 rounded-lg border border-white/30 text-xs font-bold appearance-none cursor-pointer hover:bg-white/40"
          aria-label="Change Language"
        >
          <option value="he">עברית</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="hi">हिन्दी</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>

        {/* Font Size Toggle */}
        <button 
          onClick={() => setFontSize(prev => prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'small')}
          className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold"
          title="Font Size"
          aria-label="Toggle Font Size"
        >
          {fontSize === 'small' ? 'A-' : fontSize === 'large' ? 'A+' : 'A'}
        </button>

        <button 
          onClick={toggleMusic}
          className={`p-3 rounded-full backdrop-blur-md shadow-lg border border-white/30 transition-all ${isMusicOn ? 'bg-pink-500/50' : 'bg-white/20'}`}
          title="Music"
          aria-label="Toggle Music"
        >
          {isMusicOn ? '🔊' : '🔈'}
        </button>

        <button 
          onClick={toggleTheme}
          className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40"
          title="Theme"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        {gameState === GameState.PLAYING && (
          <button 
            onClick={togglePause}
            className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40"
            aria-label={isPaused ? "Play" : "Pause"}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
        )}
      </div>

      {gameState === GameState.START && (
        <StartScreen onStart={startNewGame} highScore={highScore} lang={lang} speak={speak} />
      )}

      {gameState === GameState.PLAYING && (
        <>
          <div className={`absolute top-4 ${isRtl ? 'right-4' : 'left-4'} flex gap-4 z-50`}>
            <div className="bg-white/10 dark:bg-black/30 backdrop-blur-md px-6 py-2 rounded-full border-2 border-sky-400">
              <span className="font-bold">{t.score}: {score}</span>
            </div>
            <div className={`px-6 py-2 rounded-full border-2 transition-all ${timeLeft < 10 ? 'bg-red-500 text-white animate-pulse border-red-700' : 'bg-white/10 dark:bg-black/30 border-sky-400'}`}>
              <span className="font-bold">{t.time}: {timeLeft}</span>
            </div>
          </div>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 hidden md:flex">
             <div className="bg-white/10 dark:bg-black/30 backdrop-blur-md px-8 py-1 rounded-full border-2 border-pink-400">
                <span className="text-pink-500 font-black">{currentLevelName}</span>
              </div>
          </div>
          
          <GameCanvas 
            level={level} 
            isPaused={isPaused}
            onSaveBaby={(points) => setScore(s => s + points)} 
            onMiss={() => {}} 
            onEffectsChange={setActiveEffects}
          />
        </>
      )}

      {gameState === GameState.LEVEL_END && (
        <LevelEndScreen level={level} saved={babiesSavedInLevel} lang={lang} onNext={nextLevel} speak={speak} />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen score={score} highScore={highScore} lang={lang} onRestart={startNewGame} speak={speak} />
      )}

      <footer className={`absolute bottom-2 ${isRtl ? 'right-0 text-right' : 'left-0 text-left'} w-full px-4 flex justify-between items-center text-[10px] opacity-50 z-[100]`}>
        <div>(C) Noam Gold AI 2026</div>
        <div>
          <span>{t.feedback}: </span>
          <a href="mailto:goldnoamai@gmail.com" className="underline">goldnoamai@gmail.com</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
