import React, { useState, useEffect, useMemo } from 'react';
import { MatchState, Player, AtBatEvent } from '../types/baseball';
import { soundFx, bgm } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  FastForward,
  SkipForward,
  Award,
  Trophy,
  Zap,
  Sparkles,
} from 'lucide-react';

interface Props {
  match: MatchState;
  userTeamId: string;
  onFinish: () => void;
  onSelectPlayer?: (player: Player) => void;
}

const BALLPARKS = [
  '明治神宮野球場',
  '阪神甲子園球場',
  '東京ドーム',
  '福岡PayPayドーム',
  'MAZDA Zoom-Zoomスタジアム',
  'ES CON FIELD HOKKAIDO',
  '横浜スタジアム',
  'バンテリンドーム ナゴヤ',
  '京セラドーム大阪',
  '楽天モバイルパーク宮城',
];

export const LiveMatchBroadcastModal: React.FC<Props> = ({
  match,
  userTeamId,
  onFinish,
  onSelectPlayer,
}) => {
  const [currentEventIdx, setCurrentEventIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 2 | 4>(2);
  const [isGameEnded, setIsGameEnded] = useState(false);

  const home = match.homeTeam;
  const away = match.awayTeam;

  const totalEvents = match.atBatEvents.length;
  const ballparkName = useMemo(() => {
    const idx = Math.abs(match.matchNumber * 7) % BALLPARKS.length;
    return BALLPARKS[idx];
  }, [match.matchNumber]);

  // BGM切り替え: 試合生中継時は白熱のmatch BGM
  useEffect(() => {
    bgm.setTrack('match');
    soundFx.playWhistle();
    return () => {
      bgm.setTrack('menu');
    };
  }, []);

  const currentEvent: AtBatEvent | undefined = match.atBatEvents[currentEventIdx];

  // Dynamic state calculated from events up to current index
  const dynamicState = useMemo(() => {
    if (!match.atBatEvents || match.atBatEvents.length === 0) {
      return {
        inning: 1,
        isBottom: false,
        outs: 0,
        scoreTop: 0,
        scoreBottom: 0,
        hitsTop: 0,
        hitsBottom: 0,
        errorsTop: 0,
        errorsBottom: 0,
        inningScoresTop: Array(9).fill(null),
        inningScoresBottom: Array(9).fill(null),
        runners: { first: false, second: false, third: false },
      };
    }

    const targetIdx = Math.min(currentEventIdx, totalEvents - 1);
    let sTop = 0;
    let sBottom = 0;
    let hTop = 0;
    let hBottom = 0;
    const innTop: (number | null)[] = Array(9).fill(null);
    const innBottom: (number | null)[] = Array(9).fill(null);

    for (let i = 0; i <= targetIdx; i++) {
      const ev = match.atBatEvents[i];
      if (!ev) continue;
      const innIdx = Math.min(8, ev.inning - 1);

      // Inning score initialization
      if (!ev.isBottom) {
        if (innTop[innIdx] === null) innTop[innIdx] = 0;
      } else {
        if (innBottom[innIdx] === null) innBottom[innIdx] = 0;
      }

      // Check runs in event
      if (ev.rbi && ev.rbi > 0) {
        if (!ev.isBottom) {
          sTop += ev.rbi;
          innTop[innIdx] = (innTop[innIdx] || 0) + ev.rbi;
        } else {
          sBottom += ev.rbi;
          innBottom[innIdx] = (innBottom[innIdx] || 0) + ev.rbi;
        }
      }

      // Hits
      if (['hit', 'homerun'].includes(ev.type)) {
        if (!ev.isBottom) hTop++;
        else hBottom++;
      }
    }

    const latest = match.atBatEvents[targetIdx];
    const rState = latest?.runnersState || '走者なし';
    const cleanR = rState.replace(/^走者/, '');
    const runners = {
      first: cleanR.includes('一') || cleanR === '満塁' || cleanR === '走者満塁',
      second: cleanR.includes('二') || cleanR === '満塁' || cleanR === '走者満塁',
      third: cleanR.includes('三') || cleanR === '満塁' || cleanR === '走者満塁',
    };

    return {
      inning: latest?.inning || 1,
      isBottom: latest?.isBottom || false,
      outs: latest?.outs || 0,
      scoreTop: sTop,
      scoreBottom: sBottom,
      hitsTop: hTop,
      hitsBottom: hBottom,
      errorsTop: match.errorsTop || 0,
      errorsBottom: match.errorsBottom || 0,
      inningScoresTop: innTop,
      inningScoresBottom: innBottom,
      runners,
    };
  }, [currentEventIdx, totalEvents, match]);

  // Step advancement timer
  useEffect(() => {
    if (!isPlaying || isGameEnded) return;

    const baseDelay = speed === 1 ? 2200 : speed === 2 ? 1100 : 500;

    const timer = setTimeout(() => {
      if (currentEventIdx < totalEvents - 1) {
        const nextIdx = currentEventIdx + 1;
        setCurrentEventIdx(nextIdx);

        // Sound trigger for new event
        const nextEv = match.atBatEvents[nextIdx];
        if (nextEv) {
          if (nextEv.type === 'homerun') {
            soundFx.playHomeRun();
            soundFx.playCrowdCheer();
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
          } else if (nextEv.type === 'hit') {
            soundFx.playBatHit(true);
            if (nextEv.rbi && nextEv.rbi > 0) {
              soundFx.playScore();
            }
          } else if (nextEv.type === 'strikeout') {
            soundFx.playOut();
          } else if (nextEv.type === 'steal') {
            soundFx.playCatch();
          } else if (nextEv.type === 'walk') {
            soundFx.playCatch();
          } else {
            soundFx.playCatch();
          }
        }
      } else {
        // Game has finished all events
        setIsGameEnded(true);
        setIsPlaying(false);
        soundFx.playWhistle();

        const isUserWinner = match.winnerId === userTeamId;
        if (isUserWinner) {
          soundFx.playVictory();
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } else {
          soundFx.playOut();
        }
      }
    }, baseDelay);

    return () => clearTimeout(timer);
  }, [currentEventIdx, isPlaying, speed, totalEvents, isGameEnded, match, userTeamId]);

  // Jump to end immediately
  const handleSkipToEnd = () => {
    setCurrentEventIdx(totalEvents - 1);
    setIsGameEnded(true);
    setIsPlaying(false);
    soundFx.playWhistle();

    if (match.winnerId === userTeamId) {
      soundFx.playVictory();
      confetti({ particleCount: 90, spread: 80 });
    }
  };

  // Find batter & pitcher by name
  const currentBatter = useMemo(() => {
    if (!currentEvent) return null;
    const battingTeam = currentEvent.isBottom ? home : away;
    return battingTeam.roster.find(p => p.name === currentEvent.batterName) || null;
  }, [currentEvent, home, away]);

  const currentPitcher = useMemo(() => {
    if (!currentEvent) return null;
    const fieldingTeam = currentEvent.isBottom ? away : home;
    return fieldingTeam.roster.find(p => p.name === currentEvent.pitcherName) || null;
  }, [currentEvent, home, away]);

  // Game MVP determination
  const gameMvp = useMemo(() => {
    const winnerTeam = match.winnerId === home.id ? home : away;
    const winnerBatting = match.winnerId === home.id ? match.homeBattingStats : match.awayBattingStats;
    const winnerPitching = match.winnerId === home.id ? match.homePitchingStats : match.awayPitchingStats;

    const topBatter = winnerBatting.slice().sort((a, b) => b.rbi * 2 + b.hits - (a.rbi * 2 + a.hits))[0];
    const topPitcher = winnerPitching.find(p => p.isWin) || winnerPitching[0];

    if (topBatter && (topBatter.rbi >= 2 || topBatter.homeRuns >= 1)) {
      const p = winnerTeam.roster.find(r => r.id === topBatter?.playerId);
      if (p) return { player: p, reason: `${topBatter.hits}安打${topBatter.homeRuns > 0 ? ` ${topBatter.homeRuns}本塁打` : ''} ${topBatter.rbi}打点の猛打！` };
    }
    if (topPitcher) {
      const p = winnerTeam.roster.find(r => r.id === topPitcher?.playerId);
      if (p) return { player: p, reason: `力投で試合を引き締める快投！` };
    }
    const defaultP = winnerTeam.roster[0];
    return { player: defaultP, reason: '勝利に大きく貢献！' };
  }, [match, home, away]);

  // Simulated count for display authenticity
  const ballsCount = currentEvent?.type === 'walk' ? 3 : (currentEvent ? currentEvent.order % 3 : 1);
  const strikesCount = currentEvent?.type === 'strikeout' ? 2 : (currentEvent ? currentEvent.order % 2 : 1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col text-slate-100 animate-fade-in overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0 app-header">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
          <span className="text-xs font-black text-amber-400 font-['M_PLUS_Rounded_1c'] uppercase tracking-wider">
            実況生中継
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            · {ballparkName}
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {!isGameEnded && (
            <>
              {/* Speed Buttons */}
              <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono font-bold">
                {([1, 2, 4] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 rounded transition-colors ${
                      speed === s ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Pause / Resume */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg game-btn"
                title={isPlaying ? '一時停止' : '再生'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>

              {/* Fast Skip to End */}
              <button
                onClick={handleSkipToEnd}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold game-btn"
                title="結果へスキップ"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">結果へ直行</span>
              </button>
            </>
          )}

          {isGameEnded && (
            <button
              onClick={onFinish}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-lg game-btn animate-bounce"
            >
              <span>試合結果・詳報へ</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 max-w-md w-full mx-auto space-y-3 flex flex-col justify-between">
        {/* 1. Electronic LED Line Scoreboard */}
        <div className="led-scoreboard rounded-2xl p-3 border border-slate-800 shadow-2xl space-y-2">
          <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{dynamicState.inning}回{dynamicState.isBottom ? '裏' : '表'}</span>
              <span className="text-slate-400 font-mono">
                {dynamicState.outs}死
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
              第{match.matchNumber}試合 · 公式戦
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono border-collapse">
              <thead>
                <tr className="text-slate-500 text-[10px] border-b border-slate-800">
                  <th className="py-1 text-left pl-1">TEAM</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                    <th key={i} className="py-1 px-1">{i}</th>
                  ))}
                  <th className="py-1 px-1.5 text-amber-300 font-bold border-l border-slate-800">R</th>
                  <th className="py-1 px-1 text-slate-400">H</th>
                  <th className="py-1 px-1 text-slate-400">E</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-bold">
                {/* Away Team */}
                <tr className={!dynamicState.isBottom && !isGameEnded ? 'bg-amber-400/5' : ''}>
                  <td className="py-1 text-left pl-1 truncate max-w-[75px] text-slate-200">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: away.color }} />
                      <span className="truncate">{away.name}</span>
                    </span>
                  </td>
                  {dynamicState.inningScoresTop.map((sc, idx) => (
                    <td
                      key={idx}
                      className={`py-1 text-[11px] ${
                        dynamicState.inning === idx + 1 && !dynamicState.isBottom
                          ? 'text-amber-300 font-black'
                          : 'text-slate-300'
                      }`}
                    >
                      {sc !== null ? sc : '-'}
                    </td>
                  ))}
                  <td className="py-1 px-1.5 text-amber-400 font-black text-sm border-l border-slate-800">
                    {dynamicState.scoreTop}
                  </td>
                  <td className="py-1 px-1 text-slate-300 text-[11px]">{dynamicState.hitsTop}</td>
                  <td className="py-1 px-1 text-slate-400 text-[11px]">{dynamicState.errorsTop}</td>
                </tr>

                {/* Home Team */}
                <tr className={dynamicState.isBottom && !isGameEnded ? 'bg-amber-400/5' : ''}>
                  <td className="py-1 text-left pl-1 truncate max-w-[75px] text-slate-200">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: home.color }} />
                      <span className="truncate">{home.name}</span>
                    </span>
                  </td>
                  {dynamicState.inningScoresBottom.map((sc, idx) => (
                    <td
                      key={idx}
                      className={`py-1 text-[11px] ${
                        dynamicState.inning === idx + 1 && dynamicState.isBottom
                          ? 'text-amber-300 font-black'
                          : 'text-slate-300'
                      }`}
                    >
                      {sc !== null ? sc : '-'}
                    </td>
                  ))}
                  <td className="py-1 px-1.5 text-amber-400 font-black text-sm border-l border-slate-800">
                    {dynamicState.scoreBottom}
                  </td>
                  <td className="py-1 px-1 text-slate-300 text-[11px]">{dynamicState.hitsBottom}</td>
                  <td className="py-1 px-1 text-slate-400 text-[11px]">{dynamicState.errorsBottom}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Visual Diamond & BSO Indicator Center */}
        <div className="baseball-turf rounded-2xl p-4 border border-emerald-900/60 shadow-xl relative overflow-hidden flex items-center justify-between">
          {/* BSO Indicator Box (Authentic Japanese Stadium Display) */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 space-y-1.5 shrink-0 shadow-lg font-mono">
            {/* Balls (Green) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 w-2.5">B</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map(b => {
                  const isOn = ballsCount > b;
                  return (
                    <div
                      key={b}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        isOn
                          ? 'bg-emerald-400 border-emerald-300 led-lamp-green'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Strikes (Yellow) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-400 w-2.5">S</span>
              <div className="flex items-center gap-1">
                {[0, 1].map(s => {
                  const isOn = strikesCount > s;
                  return (
                    <div
                      key={s}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        isOn
                          ? 'bg-amber-400 border-amber-300 led-lamp-yellow'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Outs (Red) */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-rose-500 w-2.5">O</span>
              <div className="flex items-center gap-1">
                {[0, 1].map(o => {
                  const isOn = dynamicState.outs > o;
                  return (
                    <div
                      key={o}
                      className={`w-3.5 h-3.5 rounded-full border transition-all ${
                        isOn
                          ? 'bg-rose-500 border-rose-400 led-lamp-red'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Diamond Graphic */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            {/* Diamond chalk outline */}
            <div className="absolute w-20 h-20 border-2 border-white/20 rotate-45 transform" />

            {/* 2nd Base (Top) */}
            <div
              className={`absolute top-2 w-7 h-7 rotate-45 border-2 rounded-sm flex items-center justify-center transition-all ${
                dynamicState.runners.second
                  ? 'bg-amber-400 border-amber-200 led-lamp-yellow scale-110 shadow-lg'
                  : 'bg-slate-900/90 border-white/30'
              }`}
            >
              <span className="-rotate-45 text-[9px] font-black text-slate-950">2</span>
            </div>

            {/* 3rd Base (Left) */}
            <div
              className={`absolute left-2 w-7 h-7 rotate-45 border-2 rounded-sm flex items-center justify-center transition-all ${
                dynamicState.runners.third
                  ? 'bg-amber-400 border-amber-200 led-lamp-yellow scale-110 shadow-lg'
                  : 'bg-slate-900/90 border-white/30'
              }`}
            >
              <span className="-rotate-45 text-[9px] font-black text-slate-950">3</span>
            </div>

            {/* 1st Base (Right) */}
            <div
              className={`absolute right-2 w-7 h-7 rotate-45 border-2 rounded-sm flex items-center justify-center transition-all ${
                dynamicState.runners.first
                  ? 'bg-amber-400 border-amber-200 led-lamp-yellow scale-110 shadow-lg'
                  : 'bg-slate-900/90 border-white/30'
              }`}
            >
              <span className="-rotate-45 text-[9px] font-black text-slate-950">1</span>
            </div>

            {/* Home Plate (Bottom) */}
            <div className="absolute bottom-2 w-6 h-6 bg-white/90 border border-slate-400 clip-home-plate flex items-center justify-center shadow">
              <span className="text-[8px] font-black text-slate-900">本</span>
            </div>

            {/* Pitcher Mound Center */}
            <div className="absolute w-5 h-5 rounded-full bg-amber-900/80 border border-amber-600/60 flex items-center justify-center shadow-inner">
              <div className="w-2.5 h-1 bg-white/90 rounded-sm" />
            </div>
          </div>
        </div>

        {/* 3. Pitcher vs Batter Matchup Card */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Pitcher */}
          <div
            onClick={() => currentPitcher && onSelectPlayer && onSelectPlayer(currentPitcher)}
            className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 cursor-pointer hover:border-cyan-500/50 transition-colors shadow"
          >
            <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold">
              <span>投 手</span>
              <span className="font-mono text-slate-400">
                {currentPitcher ? `${currentPitcher.throwingHand}` : ''}
              </span>
            </div>
            <div className="truncate font-black text-sm text-slate-100 font-['M_PLUS_Rounded_1c']">
              {currentPitcher?.name || currentEvent?.pitcherName || '投手'}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>球速 {135 + (currentPitcher?.stats.pitcher?.speed || 5) * 3}km</span>
              <span className="text-cyan-300 font-bold">制:{currentPitcher?.stats.pitcher?.control || 5} 変:{currentPitcher?.stats.pitcher?.breaking || 5}</span>
            </div>
          </div>

          {/* Batter */}
          <div
            onClick={() => currentBatter && onSelectPlayer && onSelectPlayer(currentBatter)}
            className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 cursor-pointer hover:border-amber-400/50 transition-colors shadow"
          >
            <div className="flex items-center justify-between text-[10px] text-amber-400 font-bold">
              <span>打 者</span>
              <span className="font-mono text-slate-400">
                {currentBatter ? `${currentBatter.battingHand}` : ''}
              </span>
            </div>
            <div className="truncate font-black text-sm text-slate-100 font-['M_PLUS_Rounded_1c']">
              {currentBatter?.name || currentEvent?.batterName || '打者'}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>巧:{currentBatter?.stats.fielder?.meet || 5} 長:{currentBatter?.stats.fielder?.power || 5}</span>
              <span className="text-amber-300 font-bold">走:{currentBatter?.stats.fielder?.speed || 5}</span>
            </div>
          </div>
        </div>

        {/* 4. Live Play-by-Play Stadium Commentary Ticker */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 relative">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>実況テキスト速報</span>
            </div>
            <span>
              {currentEventIdx + 1} / {totalEvents} 打席
            </span>
          </div>

          <div className="min-h-[56px] flex items-center justify-center p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
            {currentEvent ? (
              <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed animate-fade-in font-['M_PLUS_Rounded_1c']">
                {currentEvent.skillUsed && (
                  <span className="text-amber-300 font-black block mb-0.5">
                    【秘技発動: {currentEvent.skillUsed}】
                  </span>
                )}
                {currentEvent.batterName}: {currentEvent.result}
              </p>
            ) : (
              <p className="text-xs text-slate-500 animate-pulse">試合速報を受信中...</p>
            )}
          </div>

          {/* Event Result Highlight Pill */}
          {currentEvent && (
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
              <span className="text-slate-500">
                走者状況: <strong className="text-slate-300">{currentEvent.runnersState}</strong>
              </span>
              {currentEvent.rbi ? (
                <span className="text-amber-400 font-bold flex items-center gap-1 animate-bounce">
                  <Sparkles className="w-3 h-3" />
                  <span>+{currentEvent.rbi} 得点！</span>
                </span>
              ) : (
                <span className="text-slate-500">得点変動なし</span>
              )}
            </div>
          )}
        </div>

        {/* 5. Game Set Modal Overlay if Ended */}
        {isGameEnded && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 border border-amber-400/50 shadow-2xl space-y-3 text-center animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow">
              <Trophy className="w-3.5 h-3.5" />
              <span>GAME SET · 試合終了</span>
            </div>

            <div className="text-sm font-black text-slate-100 font-['M_PLUS_Rounded_1c']">
              {dynamicState.scoreTop === dynamicState.scoreBottom
                ? `引き分け (${dynamicState.scoreTop} - ${dynamicState.scoreBottom})`
                : dynamicState.scoreBottom > dynamicState.scoreTop
                ? `【${home.name}】が ${dynamicState.scoreBottom} - ${dynamicState.scoreTop} で勝利！`
                : `【${away.name}】が ${dynamicState.scoreTop} - ${dynamicState.scoreBottom} で勝利！`}
            </div>

            {/* Hero MVP */}
            {gameMvp && gameMvp.player && (
              <div className="bg-slate-950/90 rounded-xl p-2.5 border border-amber-400/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-400/20 text-amber-300">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-amber-400 font-bold block">★ 本日のお立ち台 MVP</span>
                    <strong className="text-slate-100 font-black">{gameMvp.player.name}</strong>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 max-w-[140px] truncate">{gameMvp.reason}</span>
              </div>
            )}

            <button
              onClick={onFinish}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>公式試合詳報・記録室へ進む</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
