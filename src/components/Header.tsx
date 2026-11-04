import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, LogOut, Coins, History, Music, Maximize, Minimize } from 'lucide-react';
import { Team, League } from '../types/baseball';
import { bgm } from '../utils/bgmEngine';

interface Props {
  team: Team;
  league: League;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onLogout: () => void;
  onOpenActivityLog?: () => void;
}

export const Header: React.FC<Props> = ({
  team,
  league,
  soundEnabled,
  setSoundEnabled,
  onLogout,
  onOpenActivityLog,
}) => {
  const [bgmActive, setBgmActive] = useState<boolean>(() => bgm.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    return typeof document !== 'undefined' && !!document.fullscreenElement;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  };

  const handleToggleBgm = () => {
    const next = !bgmActive;
    setBgmActive(next);
    bgm.setEnabled(next);
  };
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 app-header pb-2.5 z-30 sticky top-0 shadow-md">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Team & Season info */}
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-md flex items-center justify-center font-black text-white text-[11px] shadow-sm shrink-0"
              style={{ backgroundColor: team.color }}
            >
              {team.name.slice(0, 1)}
            </span>
            <span className="font-black text-amber-400 text-sm font-['M_PLUS_Rounded_1c'] truncate max-w-[140px]">
              {team.name}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono block">
            {league.playedGames >= league.totalGames ? (
              <span className="text-amber-400 font-bold animate-pulse">
                🏆 第{league.season}季 完走！表彰式・新シーズンへ
              </span>
            ) : (
              <>
                第{league.season}季 <span className="text-amber-400 font-bold">★{league.difficulty || 1}</span> · {league.playedGames}/{league.totalGames}試合
              </>
            )}
          </span>
        </div>

        {/* Currency & Scout Tickets */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-mono text-xs bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400">{team.gerda.toLocaleString()}</span>
          </div>

          {onOpenActivityLog && (
            <button
              onClick={onOpenActivityLog}
              className="relative p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="球団活動・獲得履歴ログ"
            >
              <History className="w-4 h-4" />
              {(team.activityLogs?.length || 0) > 0 && (
                <span className="absolute 1 top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}

          <button
            onClick={handleToggleBgm}
            className={`p-1.5 rounded-lg transition-colors ${
              soundEnabled && bgmActive
                ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
            title={soundEnabled && bgmActive ? 'BGM演奏中（クリックでBGMのみミュート）' : 'BGM停止中（クリックでパワプロ風BGM再生）'}
          >
            <div className="relative flex items-center justify-center">
              <Music className="w-4 h-4" />
              {(!soundEnabled || !bgmActive) && (
                <span className="absolute inset-0 flex items-center justify-center text-rose-500 font-bold text-xs pointer-events-none">
                  /
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title={soundEnabled ? 'マスターサウンドON' : 'マスターサウンドOFF'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
            title={isFullscreen ? '全画面表示を解除 (Esc)' : '全画面表示モード切替'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={onLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
            title="球団ログアウト"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
