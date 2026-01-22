import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, PowerUpType, Language, FontSize, GameSettings } from './types';
import { translations } from './translations';
import GameCanvas from './components/GameCanvas';
import StartScreen from './components/StartScreen';
import LevelEndScreen from './components/LevelEndScreen';
import GameOverScreen from './components/GameOverScreen';

const LEVEL_DURATION = 30;

const langMap: Record<Language, string> = {
  he: 'he-IL',
  en: 'en-US',
  zh: 'zh-CN',
  hi: 'hi-IN',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR'
};

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
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    musicVolume: 0.5,
    sfxVolume: 0.7,
    sensitivity: 3
  });
  
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const moveIntervalRef = useRef<number | null>(null);

  const t = translations[lang];
  const isRtl = lang === 'he';

  useEffect(() => {
    document.body.className = `${isDarkMode ? 'dark' : ''} ${isRtl ? 'rtl' : 'ltr'}`;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode, isRtl, lang]);

  // Load High Score and Settings from Local Storage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('stork_mission_highscore');
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10));

    const savedSettings = localStorage.getItem('stork_mission_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('stork_mission_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('stork_mission_highscore', score.toString());
    }
  }, [score, highScore]);

  // Handle Music
  useEffect(() => {
    if (isMusicOn && gameState === GameState.PLAYING && !isPaused) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.volume = settings.musicVolume * 0.4; // Soften music base
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current?.pause();
    }
  }, [isMusicOn, gameState, isPaused, settings.musicVolume]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langMap[lang] || 'en-US';
      utterance.volume = settings.sfxVolume;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [lang, settings.sfxVolume]);

  const startNewGame = useCallback(() => {
    setScore(0); setLevel(1); setBabiesSavedInLevel(0);
    setTimeLeft(LEVEL_DURATION); setIsPaused(false); setActiveEffects([]);
    setGameState(GameState.PLAYING);
    speak(t.start);
  }, [speak, t.start]);

  const handleReset = useCallback(() => {
    if (window.confirm(isRtl ? "האם אתה בטוח שברצונך לאתחל את המשחק?" : "Are you sure you want to reset the game?")) {
      startNewGame();
    }
  }, [isRtl, startNewGame, startNewGame]);

  const handleLevelComplete = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveEffects([]); setGameState(GameState.LEVEL_END);
    speak(t.levelComplete);
  }, [speak, t.levelComplete]);

  const nextLevel = () => {
    setLevel(prev => prev + 1); setBabiesSavedInLevel(0);
    setTimeLeft(LEVEL_DURATION); setIsPaused(false); setActiveEffects([]);
    setGameState(GameState.PLAYING);
    speak(t.nextLevel);
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

  const togglePause = useCallback(() => { 
    const nextPaused = !isPaused;
    setIsPaused(nextPaused); 
    speak(nextPaused ? t.pause : t.resume); 
  }, [isPaused, speak, t.pause, t.resume]);

  const handleMove = useCallback((delta: number) => {
    const sensMult = 0.5 + (settings.sensitivity * 0.2);
    window.dispatchEvent(new CustomEvent('move-basket', { detail: delta * sensMult }));
  }, [settings.sensitivity]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING || showSettings) return;
      const key = e.key.toLowerCase();
      if (!isPaused) {
        if (key === 'a' || key === 'arrowleft') handleMove(-50);
        else if (key === 'd' || key === 'arrowright') handleMove(50);
      }
      if (['p', 'escape', 'w', 's'].includes(key)) togglePause();
      if (key === 'r') handleReset();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isPaused, handleMove, togglePause, handleReset, showSettings]);

  const startContinuousMove = (delta: number) => {
    if (moveIntervalRef.current) return;
    moveIntervalRef.current = window.setInterval(() => handleMove(delta), 16);
  };

  const stopContinuousMove = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    speak(t.toggleTheme);
  };
  
  const toggleMusic = () => { 
    const nextOn = !isMusicOn;
    setIsMusicOn(nextOn); 
    speak(nextOn ? "Music On" : "Music Off"); 
  };

  const cycleFontSize = () => {
    setFontSize(prev => prev === 'small' ? 'medium' : prev === 'medium' ? 'large' : 'small');
    speak(t.toggleFontSize);
  };

  const fontSizeClass = fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-xl' : 'text-base';
  const currentLevelName = t.levelNames[(level - 1) % t.levelNames.length];

  return (
    <div className={`relative w-full h-screen overflow-hidden font-sans select-none transition-all duration-500 ${fontSizeClass} ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-sky-100 text-slate-900'}`}>
      
      {/* Top Controls Bar */}
      <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} z-[100] flex gap-2 items-center`}>
        <select 
          value={lang} 
          onChange={(e) => {
            const newLang = e.target.value as Language;
            setLang(newLang);
            setTimeout(() => speak(translations[newLang].langSelect), 50);
          }}
          className="bg-white/20 backdrop-blur-md px-2 py-2 rounded-lg border border-white/30 text-xs font-bold appearance-none cursor-pointer hover:bg-white/40 focus:ring-4 focus:ring-sky-500 text-slate-900 dark:text-white dark:bg-slate-800"
          aria-label={t.langSelect}
        >
          <option value="he">עברית</option>
          <option value="en">English</option>
          <option value="zh">中文</option>
          <option value="hi">हिन्दी</option>
          <option value="de">Deutsch</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </select>

        <button onClick={cycleFontSize} className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold hover:bg-white/40" title={t.toggleFontSize} aria-label={t.toggleFontSize}>
          {fontSize === 'small' ? 'A-' : fontSize === 'large' ? 'A+' : 'A'}
        </button>

        <button onClick={() => setShowSettings(true)} className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40" title={t.settings} aria-label={t.settings}>⚙️</button>
        <button onClick={toggleTheme} className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40" title={t.toggleTheme}>{isDarkMode ? '☀️' : '🌙'}</button>

        {gameState === GameState.PLAYING && (
          <>
            <button onClick={togglePause} className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40">{isPaused ? '▶️' : '⏸️'}</button>
            <button onClick={handleReset} className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/40 text-xl font-bold">↺</button>
          </>
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

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center z-40">
             <div className="bg-white/10 dark:bg-black/30 backdrop-blur-md px-8 py-1 rounded-full border-2 border-pink-400">
                <span className="text-pink-500 font-black">{currentLevelName}</span>
              </div>
          </div>
          
          <GameCanvas 
            level={level} isPaused={isPaused}
            onSaveBaby={(points) => { setScore(s => s + points); setBabiesSavedInLevel(prev => prev + 1); }} 
            onMiss={() => { setGameState(GameState.GAME_OVER); speak(t.gameOver); }} 
            onEffectsChange={setActiveEffects} settings={settings} lang={lang}
          />

          {/* WASD Mobile Layout */}
          <div className="absolute bottom-16 left-0 w-full flex justify-center items-center z-50 md:hidden pointer-events-none px-4">
            <div className="grid grid-cols-3 grid-rows-2 gap-4">
              <div />
              <button 
                onMouseDown={togglePause} onTouchStart={(e) => { e.preventDefault(); togglePause(); }}
                className="pointer-events-auto w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white/40 shadow-xl"
              >W</button>
              <div />
              <button 
                onMouseDown={() => startContinuousMove(-20)} onMouseUp={stopContinuousMove} onTouchStart={(e) => { e.preventDefault(); startContinuousMove(-20); }} onTouchEnd={stopContinuousMove}
                className="pointer-events-auto w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white/40 shadow-xl"
              >A</button>
              <button 
                onMouseDown={togglePause} onTouchStart={(e) => { e.preventDefault(); togglePause(); }}
                className="pointer-events-auto w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white/40 shadow-xl"
              >S</button>
              <button 
                onMouseDown={() => startContinuousMove(20)} onMouseUp={stopContinuousMove} onTouchStart={(e) => { e.preventDefault(); startContinuousMove(20); }} onTouchEnd={stopContinuousMove}
                className="pointer-events-auto w-16 h-16 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-black border-2 border-white/40 shadow-xl"
              >D</button>
            </div>
          </div>
        </>
      )}

      {gameState === GameState.LEVEL_END && (
        <LevelEndScreen level={level} saved={babiesSavedInLevel} lang={lang} onNext={nextLevel} speak={speak} />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen score={score} highScore={highScore} lang={lang} onRestart={startNewGame} speak={speak} />
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-8 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-black mb-6 text-sky-600 dark:text-sky-400">{t.settings}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 flex justify-between">
                  <span>{t.musicVolume}</span><span>{Math.round(settings.musicVolume * 100)}%</span>
                </label>
                <div className="flex items-center gap-4">
                  <button onClick={toggleMusic} className="text-2xl">{isMusicOn ? '🔊' : '🔈'}</button>
                  <input type="range" min="0" max="1" step="0.1" value={settings.musicVolume} onChange={(e) => setSettings({...settings, musicVolume: parseFloat(e.target.value)})} className="flex-1 accent-sky-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 flex justify-between">
                  <span>{t.sfxVolume}</span><span>{Math.round(settings.sfxVolume * 100)}%</span>
                </label>
                <input type="range" min="0" max="1" step="0.1" value={settings.sfxVolume} onChange={(e) => setSettings({...settings, sfxVolume: parseFloat(e.target.value)})} className="w-full accent-pink-500" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 flex justify-between">
                  <span>{t.sensitivity}</span><span>{settings.sensitivity}</span>
                </label>
                <input type="range" min="1" max="5" step="1" value={settings.sensitivity} onChange={(e) => setSettings({...settings, sensitivity: parseInt(e.target.value)})} className="w-full accent-yellow-500" />
              </div>
            </div>
            <button onClick={() => setShowSettings(false)} className="mt-8 w-full bg-sky-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-sky-400 transition-colors">{t.close}</button>
          </div>
        </div>
      )}

      <footer className={`fixed bottom-2 left-0 w-full px-4 flex justify-between items-center text-[10px] opacity-50 z-[100] ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div>(C) Noam Gold AI 2026</div>
        <div className={`flex gap-4 items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
          <a href="#" className="hover:underline" onClick={(e) => { e.preventDefault(); speak(t.feedback); }}>{t.feedback}</a>
          <a href="mailto:goldnoamai@gmail.com" className="underline focus:ring-2 focus:ring-sky-500">goldnoamai@gmail.com</a>
        </div>
      </footer>
    </div>
  );
};

export default App;