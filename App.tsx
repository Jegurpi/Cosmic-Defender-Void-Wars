
import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ShipClass, SHIP_STATS, GameStats, GlobalStats, Achievement } from './types';
import { ACHIEVEMENTS_LIST } from './constants';
import { Language, t } from './translations';

enum AppState {
  MENU,
  PLAYING,
  GAME_OVER
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.MENU);
  const [selectedClass, setSelectedClass] = useState<ShipClass>(ShipClass.INTERCEPTOR);
  const [gameMode, setGameMode] = useState<'SINGLE' | 'COOP'>('SINGLE');
  const [lastScore, setLastScore] = useState(0);
  const [showAchievements, setShowAchievements] = useState(false);
  const [lang, setLang] = useState<Language>('RU');
  
  // Persisted Stats
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_LIST);
  const [globalStats, setGlobalStats] = useState<GlobalStats>({ totalKills: 0 });

  // Load from local storage
  useEffect(() => {
    const savedAch = localStorage.getItem('void_wars_achievements');
    const savedStats = localStorage.getItem('void_wars_stats');
    
    if (savedAch) {
        const parsed: {id: string, isUnlocked: boolean}[] = JSON.parse(savedAch);
        setAchievements(prev => prev.map(a => {
            const saved = parsed.find(p => p.id === a.id);
            return saved ? { ...a, isUnlocked: saved.isUnlocked } : a;
        }));
    }
    if (savedStats) {
        setGlobalStats(JSON.parse(savedStats));
    }
  }, []);

  // Initialize Yandex SDK
  useEffect(() => {
    const initSDK = async () => {
      if ((window as any).YaGames) {
        try {
          const ysdk = await (window as any).YaGames.init();
          console.log('Yandex SDK initialized');
          // Inform the SDK that the game has loaded and is ready to play
          ysdk.features.LoadingAPI?.ready();
        } catch (e) {
          console.error('Yandex SDK initialization failed:', e);
        }
      }
    };
    initSDK();
  }, []);

  const handleUnlockAchievement = (id: string) => {
      setAchievements(prev => {
          const updated = prev.map(a => a.id === id ? { ...a, isUnlocked: true } : a);
          // Save simplified version
          localStorage.setItem('void_wars_achievements', JSON.stringify(updated.map(a => ({ id: a.id, isUnlocked: a.isUnlocked }))));
          return updated;
      });
  };

  const handleUpdateStats = (newKills: number) => {
      setGlobalStats(prev => {
          const newState = { totalKills: prev.totalKills + newKills };
          localStorage.setItem('void_wars_stats', JSON.stringify(newState));
          return newState;
      });
  };

  const startGame = (mode: 'SINGLE' | 'COOP') => {
    setGameMode(mode);
    setAppState(AppState.PLAYING);
  };

  const handleGameOver = (score: number) => {
    setLastScore(score);
    setAppState(AppState.GAME_OVER);
  };

  const handleExit = () => {
    setAppState(AppState.MENU);
  };

  const toggleLanguage = () => {
      setLang(prev => prev === 'RU' ? 'EN' : 'RU');
  };

  // --- Screens ---

  const renderMenu = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/70"></div>
      
      {/* Language Toggle */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-6 right-6 z-50 bg-slate-800 border border-slate-600 px-4 py-2 rounded-full text-white font-bold hover:bg-slate-700 transition"
      >
          {lang === 'RU' ? '🇷🇺 RU' : '🇬🇧 EN'}
      </button>

      <div className="relative z-10 max-w-6xl w-full flex flex-col h-[90vh]">
        <div className="text-center mb-6">
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-center mb-2 tracking-tighter drop-shadow-lg">
            {t('GAME_TITLE', lang)}
            </h1>
            <p className="text-slate-300 text-sm tracking-widest uppercase opacity-70">{t('GAME_SUBTITLE', lang)}</p>
        </div>

        <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-4 px-2">
                <p className="text-white text-lg font-bold">{t('SELECT_CLASS', lang)}</p>
                <button 
                    onClick={() => setShowAchievements(true)}
                    className="text-yellow-400 text-sm font-bold border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 rounded hover:bg-yellow-400/20 transition flex items-center gap-2"
                >
                    🏆 {t('BTN_ACHIEVEMENTS', lang)}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {(Object.keys(SHIP_STATS) as ShipClass[]).map((cls) => {
                const stats = SHIP_STATS[cls];
                const isSelected = selectedClass === cls;
                return (
                <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 flex flex-col justify-between ${
                    isSelected 
                        ? 'border-cyan-500 bg-slate-800/90 shadow-[0_0_30px_rgba(6,182,212,0.3)] transform scale-105' 
                        : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                    }`}
                >
                    <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className={`text-lg font-bold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{t(stats.nameKey, lang)}</h3>
                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: stats.color }}></div>
                    </div>
                    
                    <p className="text-slate-400 text-xs mb-3 h-10 overflow-hidden">{t(stats.descKey, lang)}</p>
                    
                    <div className="space-y-1">
                        <StatBar label={t('STAT_ARMOR', lang)} value={stats.hp} max={300} color="bg-green-500" />
                        <StatBar label={t('STAT_SPEED', lang)} value={stats.speed} max={10} color="bg-blue-500" />
                        <StatBar label={t('STAT_DMG', lang)} value={stats.damage} max={80} color="bg-red-500" />
                    </div>
                    </div>

                    {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-black font-bold">
                        ✓
                    </div>
                    )}
                </button>
                );
            })}
            </div>

            <div className="flex justify-center gap-6 mb-12">
            <button
                onClick={() => startGame('SINGLE')}
                className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xl font-bold rounded-lg shadow-lg transform transition active:scale-95 tracking-widest min-w-[250px] border border-cyan-400/30"
            >
                {t('BTN_SINGLE', lang)}
            </button>
            
            <button
                onClick={() => startGame('COOP')}
                className="px-12 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xl font-bold rounded-lg shadow-lg transform transition active:scale-95 tracking-widest min-w-[250px] border border-fuchsia-400/30"
            >
                {t('BTN_COOP', lang)}
            </button>
            </div>
        </div>
        
        {/* Controls Section */}
        <div className="bg-slate-900/80 border-t border-slate-700 p-6 rounded-t-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                
                {/* P1 Controls */}
                <div className="space-y-2">
                    <h3 className="text-cyan-400 font-bold text-sm tracking-widest mb-3">{t('HOW_TO_PLAY_P1', lang)}</h3>
                    <div className="flex justify-center gap-2 mb-2">
                        <KeyCap>W</KeyCap><KeyCap>A</KeyCap><KeyCap>S</KeyCap><KeyCap>D</KeyCap>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{t('MOVE', lang)}</div>
                    <div className="flex justify-center gap-4">
                        <div className="flex flex-col items-center">
                            <KeyCap wide>SPACE</KeyCap>
                            <span className="text-[10px] text-slate-500 mt-1">{t('FIRE', lang)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <KeyCap>E</KeyCap>
                            <span className="text-[10px] text-slate-500 mt-1">{t('SKILL', lang)}</span>
                        </div>
                    </div>
                </div>

                {/* Common Info */}
                <div className="flex flex-col items-center justify-center border-x border-slate-800 px-4">
                    <div className="text-xs text-slate-400 mb-2 font-mono">{t('PAUSE_INFO', lang)}</div>
                    <div className="flex gap-2 mb-4">
                        <KeyCap>P</KeyCap>
                        <span className="text-slate-600 text-sm py-1">{t('OR', lang)}</span>
                        <KeyCap>ESC</KeyCap>
                    </div>
                    <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">
                        {t('TIP', lang)}
                    </p>
                </div>

                {/* P2 Controls */}
                <div className="space-y-2">
                    <h3 className="text-fuchsia-400 font-bold text-sm tracking-widest mb-3">{t('HOW_TO_PLAY_P2', lang)}</h3>
                    <div className="flex justify-center gap-2 mb-2">
                        <KeyCap>▲</KeyCap><KeyCap>◄</KeyCap><KeyCap>▼</KeyCap><KeyCap>►</KeyCap>
                    </div>
                    <div className="text-xs text-slate-500 mb-2">{t('MOVE', lang)}</div>
                    <div className="flex justify-center gap-4">
                        <div className="flex flex-col items-center">
                            <KeyCap wide>ENTER</KeyCap>
                            <span className="text-[10px] text-slate-500 mt-1">{t('FIRE', lang)}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <KeyCap wide>SHIFT</KeyCap>
                            <span className="text-[10px] text-slate-500 mt-1">{t('SKILL', lang)}</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>

       {/* Achievements Modal */}
       {showAchievements && (
           <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowAchievements(false)}>
               <div className="bg-slate-900 border border-slate-600 p-8 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-3xl font-bold text-white">{t('BTN_ACHIEVEMENTS', lang)}</h2>
                       <button onClick={() => setShowAchievements(false)} className="text-slate-400 hover:text-white">✕</button>
                   </div>
                   
                   <div className="space-y-4">
                       {achievements.map(ach => (
                           <div key={ach.id} className={`p-4 rounded-lg border flex items-center gap-4 ${ach.isUnlocked ? 'bg-yellow-900/20 border-yellow-500/50' : 'bg-slate-800 border-slate-700 opacity-60'}`}>
                               <div className={`text-4xl ${ach.isUnlocked ? '' : 'grayscale'}`}>
                                   {ach.isUnlocked ? '🏆' : '🔒'}
                               </div>
                               <div>
                                   <div className={`font-bold text-lg ${ach.isUnlocked ? 'text-yellow-400' : 'text-slate-400'}`}>
                                       {t(ach.nameKey, lang)}
                                   </div>
                                   <div className="text-slate-400 text-sm">
                                        {t(ach.descKey, lang)}
                                   </div>
                               </div>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}
    </div>
  );

  const renderGameOver = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-5xl font-black text-red-500 mb-2 tracking-widest">{t('GAME_OVER_TITLE', lang)}</h1>
        <div className="p-8 border border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur">
          <p className="text-slate-400 mb-2 uppercase text-sm">{t('SCORE_FINAL', lang)}</p>
          <p className="text-6xl font-mono font-bold text-white mb-6">{lastScore}</p>
          
          <div className="space-y-3">
             <button
              onClick={() => setAppState(AppState.PLAYING)}
              className="w-full py-3 bg-white text-black font-bold rounded hover:bg-slate-200 transition"
            >
              {t('BTN_RETRY', lang)}
            </button>
            <button
              onClick={() => setAppState(AppState.MENU)}
              className="w-full py-3 border border-slate-600 text-white font-bold rounded hover:bg-slate-800 transition"
            >
              {t('BTN_MENU', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {appState === AppState.MENU && renderMenu()}
      {appState === AppState.PLAYING && (
        <GameCanvas 
          selectedClass={selectedClass} 
          gameMode={gameMode}
          lang={lang}
          onGameOver={handleGameOver}
          onExit={handleExit}
          achievements={achievements}
          globalStats={globalStats}
          onUnlockAchievement={handleUnlockAchievement}
          onUpdateStats={handleUpdateStats}
        />
      )}
      {appState === AppState.GAME_OVER && renderGameOver()}
    </>
  );
}

// Helper component for stat bars
const StatBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => (
  <div className="flex items-center text-[10px]">
    <span className="w-10 text-slate-500">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${(value / max) * 100}%` }}></div>
    </div>
  </div>
);

const KeyCap = ({ children, wide = false }: { children: React.ReactNode, wide?: boolean }) => (
    <div className={`
        ${wide ? 'px-3 min-w-[60px]' : 'w-8'} 
        h-8 bg-slate-800 border-b-4 border-slate-950 rounded flex items-center justify-center text-xs font-bold text-slate-300 shadow-sm
    `}>
        {children}
    </div>
);
