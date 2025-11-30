import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ShipClass, SHIP_STATS } from './types';

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

  // --- Screens ---

  const renderMenu = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div className="relative z-10 max-w-6xl w-full">
        <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-center mb-4 tracking-tighter drop-shadow-lg">
          VOID WARS
        </h1>
        <p className="text-slate-300 text-center mb-12 text-lg tracking-widest uppercase">Выберите класс корабля</p>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {(Object.keys(SHIP_STATS) as ShipClass[]).map((cls) => {
            const stats = SHIP_STATS[cls];
            const isSelected = selectedClass === cls;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left hover:scale-105 flex flex-col justify-between ${
                  isSelected 
                    ? 'border-cyan-500 bg-slate-800/90 shadow-[0_0_30px_rgba(6,182,212,0.3)]' 
                    : 'border-slate-700 bg-slate-900/80 hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className={`text-lg font-bold ${isSelected ? 'text-cyan-400' : 'text-white'}`}>{stats.name}</h3>
                    <div className="w-3 h-3 rounded-full shadow-[0_0_10px]" style={{ backgroundColor: stats.color }}></div>
                  </div>
                  
                  <p className="text-slate-400 text-xs mb-3 h-10 overflow-hidden">{stats.description}</p>
                  
                  <div className="space-y-1">
                    <StatBar label="Броня" value={stats.hp} max={300} color="bg-green-500" />
                    <StatBar label="Скор." value={stats.speed} max={10} color="bg-blue-500" />
                    <StatBar label="Урон" value={stats.damage} max={80} color="bg-red-500" />
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

        <div className="flex justify-center gap-6">
          <button
            onClick={() => startGame('SINGLE')}
            className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xl font-bold rounded-lg shadow-lg transform transition active:scale-95 tracking-widest min-w-[250px]"
          >
            ОДИНОЧНАЯ
          </button>
          
          <button
            onClick={() => startGame('COOP')}
            className="px-12 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white text-xl font-bold rounded-lg shadow-lg transform transition active:scale-95 tracking-widest min-w-[250px]"
          >
            2 ИГРОКА (CO-OP)
          </button>
        </div>
        
        <div className="text-center mt-6 text-xs text-slate-500 font-mono">
            CO-OP: ИГРОК 1 (WASD+E) | ИГРОК 2 (СТРЕЛКИ+SHIFT)
        </div>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <h1 className="text-5xl font-black text-red-500 mb-2 tracking-widest">МИССИЯ ПРОВАЛЕНА</h1>
        <div className="p-8 border border-slate-800 rounded-2xl bg-slate-900/50 backdrop-blur">
          <p className="text-slate-400 mb-2 uppercase text-sm">Итоговый счет</p>
          <p className="text-6xl font-mono font-bold text-white mb-6">{lastScore}</p>
          
          <div className="space-y-3">
             <button
              onClick={() => setAppState(AppState.PLAYING)}
              className="w-full py-3 bg-white text-black font-bold rounded hover:bg-slate-200 transition"
            >
              ПОВТОРИТЬ
            </button>
            <button
              onClick={() => setAppState(AppState.MENU)}
              className="w-full py-3 border border-slate-600 text-white font-bold rounded hover:bg-slate-800 transition"
            >
              В МЕНЮ
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
          onGameOver={handleGameOver}
          onExit={handleExit}
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