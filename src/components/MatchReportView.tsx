import React, { useState } from 'react';
import { MatchState, Player, Position } from '../types/baseball';
import { ArrowLeft, Trophy, Award, Sparkles, Filter, ChevronRight, Shield, Flame, Activity, Zap } from 'lucide-react';
import { formatInningsPitched } from '../utils/matchEngine';

interface Props {
  match: MatchState;
  onBackToStadium: () => void;
  onSelectPlayer?: (player: Player) => void;
  backButtonLabel?: string;
  reportTitle?: string;
}

const getRunnerBadgeInfo = (state?: string) => {
  if (!state || state === '走者なし') {
    return {
      text: '走者なし',
      first: false,
      second: false,
      third: false,
      isLoaded: false,
    };
  }
  if (state === '満塁' || state === '走者満塁') {
    return {
      text: '満塁',
      first: true,
      second: true,
      third: true,
      isLoaded: true,
    };
  }
  const clean = state.replace(/^走者/, '');
  const first = clean.includes('一');
  const second = clean.includes('二');
  const third = clean.includes('三');

  let label = '走者なし';
  if (first && second && third) label = '満塁';
  else if (first && second) label = '一・二塁';
  else if (first && third) label = '一・三塁';
  else if (second && third) label = '二・三塁';
  else if (first) label = '一塁';
  else if (second) label = '二塁';
  else if (third) label = '三塁';

  return {
    text: label,
    first,
    second,
    third,
    isLoaded: first && second && third,
  };
};

const MiniBasesDiamond: React.FC<{ first: boolean; second: boolean; third: boolean; isLoaded?: boolean }> = ({
  first,
  second,
  third,
  isLoaded,
}) => {
  const activeColor = isLoaded ? 'bg-rose-400 border-rose-300 shadow-rose-500/50' : 'bg-amber-400 border-amber-300 shadow-amber-500/50';
  const inactiveColor = 'bg-slate-800/90 border-slate-700/80';

  return (
    <div
      className="relative w-4 h-4 shrink-0 flex items-center justify-center"
      title={isLoaded ? '満塁' : `${third ? '三塁 ' : ''}${second ? '二塁 ' : ''}${first ? '一塁' : ''}`.trim() || '走者なし'}
    >
      {/* 2nd Base (Top) */}
      <span
        className={`absolute top-0 w-1.5 h-1.5 rotate-45 border-[0.5px] rounded-[1px] transition-colors ${
          second ? activeColor : inactiveColor
        }`}
      />
      {/* 3rd Base (Left) */}
      <span
        className={`absolute left-0 top-[5px] w-1.5 h-1.5 rotate-45 border-[0.5px] rounded-[1px] transition-colors ${
          third ? activeColor : inactiveColor
        }`}
      />
      {/* 1st Base (Right) */}
      <span
        className={`absolute right-0 top-[5px] w-1.5 h-1.5 rotate-45 border-[0.5px] rounded-[1px] transition-colors ${
          first ? activeColor : inactiveColor
        }`}
      />
    </div>
  );
};

export const MatchReportView: React.FC<Props> = ({
  match,
  onBackToStadium,
  onSelectPlayer,
  backButtonLabel,
  reportTitle,
}) => {
  const [battingTab, setBattingTab] = useState<'home' | 'away'>('home');
  const [pitchingTab, setPitchingTab] = useState<'home' | 'away'>('home');
  const [atBatFilter, setAtBatFilter] = useState<'all' | 'scoring' | 'hits' | 'user' | 'steals'>('all');

  const home = match.homeTeam;
  const away = match.awayTeam;

  const isHomeWinner = match.winnerId === home.id;
  const isAwayWinner = match.winnerId === away.id;
  const isDraw = match.winnerId === null;

  // Filter at-bat events
  const filteredAtBats = match.atBatEvents.filter(ev => {
    if (atBatFilter === 'steals') return ev.type === 'steal';
    if (atBatFilter === 'scoring') return ev.rbi > 0;
    if (atBatFilter === 'hits') return ev.type === 'hit' || ev.type === 'homerun';
    if (atBatFilter === 'user') {
      const isUserBatter = home.isUser ? ev.isBottom : !ev.isBottom;
      return isUserBatter;
    }
    return true;
  });

  const activeBattingStats = battingTab === 'home' ? match.homeBattingStats : match.awayBattingStats;
  const activeBattingTeam = battingTab === 'home' ? home : away;

  const activePitchingStats = pitchingTab === 'home' ? match.homePitchingStats : match.awayPitchingStats;
  const activePitchingTeam = pitchingTab === 'home' ? home : away;

  // Calculate totals for active batting
  const battingTotals = activeBattingStats.reduce(
    (acc, b) => {
      acc.atBats += b.atBats;
      acc.hits += b.hits;
      acc.doubles += b.doubles;
      acc.triples += b.triples;
      acc.homeRuns += b.homeRuns;
      acc.rbi += b.rbi;
      acc.walks += b.walks;
      acc.strikeouts += b.strikeouts;
      acc.stolenBases += b.stolenBases || 0;
      return acc;
    },
    { atBats: 0, hits: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0, walks: 0, strikeouts: 0, stolenBases: 0 }
  );

  const gameMvp = React.useMemo(() => {
    const winnerTeam = match.winnerId === home.id ? home : away;
    const winnerBatting = match.winnerId === home.id ? match.homeBattingStats : match.awayBattingStats;
    const winnerPitching = match.winnerId === home.id ? match.homePitchingStats : match.awayPitchingStats;

    const topBatter = winnerBatting.slice().sort((a, b) => (b.rbi * 2 + b.hits + b.homeRuns * 3) - (a.rbi * 2 + a.hits + a.homeRuns * 3))[0];
    const topPitcher = winnerPitching.find(p => p.isWin) || winnerPitching[0];

    if (topBatter && (topBatter.rbi >= 2 || topBatter.homeRuns >= 1 || topBatter.hits >= 3)) {
      const p = winnerTeam.roster.find(r => r.id === topBatter?.playerId);
      if (p) return { player: p, reason: `${topBatter.hits}安打${topBatter.homeRuns > 0 ? ` ${topBatter.homeRuns}本塁打` : ''} ${topBatter.rbi}打点の殊勲打！` };
    }
    if (topPitcher) {
      const p = winnerTeam.roster.find(r => r.id === topPitcher?.playerId);
      if (p) return { player: p, reason: `見事な好投で勝利をもたらす！` };
    }
    const defaultP = winnerTeam.roster[0];
    return { player: defaultP, reason: '勝利に大きく貢献！' };
  }, [match, home, away]);

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 animate-fade-in text-slate-100">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-3 py-2.5 rounded-2xl shadow-md">
        <button
          onClick={onBackToStadium}
          className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 py-1 px-2.5 rounded-lg bg-amber-400/10 border border-amber-400/20 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backButtonLabel || '球場へ戻る'}</span>
        </button>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 font-mono block">
            {reportTitle || `第${match.matchNumber}試合 公式戦詳報`}
          </span>
          <span className="text-xs font-bold text-slate-200">
            {isDraw ? '引き分け' : isHomeWinner ? `${home.name} 勝利` : `${away.name} 勝利`}
          </span>
        </div>
      </div>

      {/* 2. Headline Match Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">GAME SET</span>
          <h2 className="text-sm font-black text-amber-400 font-['M_PLUS_Rounded_1c']">
            第{match.matchNumber}試合 結果
          </h2>
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-7 items-center bg-slate-950 p-3 rounded-xl border border-slate-800">
          {/* Away Team */}
          <div className="col-span-3 text-center">
            <span className="text-[9px] text-slate-500 font-mono block">VISITOR</span>
            <span className="font-bold text-xs text-slate-200 block truncate">
              {away.name}
            </span>
            <span
              className={`font-mono text-2xl font-black block mt-0.5 ${
                match.scoreTop > match.scoreBottom ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {match.scoreTop}
            </span>
          </div>

          {/* VS */}
          <div className="col-span-1 text-center font-mono font-bold text-slate-600 text-xs">
            -
          </div>

          {/* Home Team */}
          <div className="col-span-3 text-center">
            <span className="text-[9px] text-slate-500 font-mono block">HOME</span>
            <span className="font-bold text-xs text-slate-200 block truncate">
              {home.name}
            </span>
            <span
              className={`font-mono text-2xl font-black block mt-0.5 ${
                match.scoreBottom > match.scoreTop ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {match.scoreBottom}
            </span>
          </div>
        </div>

        {/* Decision Pitchers */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 text-[11px] font-mono grid grid-cols-3 gap-1 text-center">
          <div>
            <span className="text-slate-500 text-[9px] block">［勝］</span>
            <span className="font-bold text-emerald-400 truncate block">
              {match.winningPitcher || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] block">［敗］</span>
            <span className="font-bold text-rose-400 truncate block">
              {match.losingPitcher || '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] block">［S］</span>
            <span className="font-bold text-cyan-400 truncate block">
              {match.savePitcher || '—'}
            </span>
          </div>
        </div>

        {/* Hero of the Game MVP */}
        {gameMvp && gameMvp.player && (
          <div className="bg-gradient-to-r from-amber-500/15 via-slate-950 to-amber-500/15 border border-amber-400/40 rounded-xl p-3 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>本日のお立ち台 · HERO OF THE GAME</span>
                </span>
                <strong
                  onClick={() => onSelectPlayer && onSelectPlayer(gameMvp.player)}
                  className="text-slate-100 font-black text-xs block cursor-pointer hover:text-amber-400 transition-colors font-['M_PLUS_Rounded_1c'] truncate"
                >
                  #{gameMvp.player.number} {gameMvp.player.name}
                </strong>
                <span className="text-[10px] text-slate-400 block truncate">{gameMvp.reason}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-slate-900 border border-amber-400/40 shrink-0 ml-2">
              MVP
            </span>
          </div>
        )}
      </div>

      {/* 3. 電光掲示板 スコアボード (Full Inning Box Score) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>スコアボード</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {match.currentInning}回{match.isBottom ? '裏' : '表'} 終了
          </span>
        </div>

        <div className="overflow-x-auto pb-1 scrollbar-thin">
          <table className="w-full text-center border-collapse text-xs font-mono select-none">
            <thead>
              <tr className="text-slate-500 text-[10px] border-b border-slate-800">
                <th className="py-1 px-2 text-left font-sans min-w-[70px]">チーム</th>
                {match.inningScores.map((_, idx) => (
                  <th key={idx} className="py-1 px-1.5 min-w-[20px]">
                    {idx + 1}
                  </th>
                ))}
                <th className="py-1 px-2 font-bold text-amber-400 border-l border-slate-800">R</th>
                <th className="py-1 px-1.5 text-slate-300">H</th>
                <th className="py-1 px-1.5 text-slate-500">E</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {/* Away Row */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-1.5 px-2 text-left font-sans font-bold text-slate-200 truncate max-w-[80px]">
                  {away.name}
                </td>
                {match.inningScores.map((sc, idx) => (
                  <td
                    key={idx}
                    className={`py-1.5 px-1 ${
                      sc.top !== null && sc.top > 0 ? 'text-amber-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {sc.top !== null ? sc.top : 'X'}
                  </td>
                ))}
                <td className="py-1.5 px-2 font-black text-amber-400 text-sm border-l border-slate-800 bg-amber-400/5">
                  {match.scoreTop}
                </td>
                <td className="py-1.5 px-1.5 text-slate-200">{match.hitsTop}</td>
                <td className="py-1.5 px-1.5 text-slate-500">{match.errorsTop}</td>
              </tr>

              {/* Home Row */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-1.5 px-2 text-left font-sans font-bold text-slate-200 truncate max-w-[80px]">
                  {home.name}
                </td>
                {match.inningScores.map((sc, idx) => (
                  <td
                    key={idx}
                    className={`py-1.5 px-1 ${
                      sc.bottom !== null && sc.bottom > 0 ? 'text-amber-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {sc.bottom !== null ? sc.bottom : 'X'}
                  </td>
                ))}
                <td className="py-1.5 px-2 font-black text-amber-400 text-sm border-l border-slate-800 bg-amber-400/5">
                  {match.scoreBottom}
                </td>
                <td className="py-1.5 px-1.5 text-slate-200">{match.hitsBottom}</td>
                <td className="py-1.5 px-1.5 text-slate-500">{match.errorsBottom}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 一打席ごとの打席結果 (Play-by-play Complete At-Bat Log) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>一打席・走塁速報 ({filteredAtBats.length}プレー)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">速報ログ</span>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
          <button
            onClick={() => setAtBatFilter('all')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition-colors ${
              atBatFilter === 'all'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            全プレー ({match.atBatEvents.length})
          </button>
          <button
            onClick={() => setAtBatFilter('steals')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition-colors flex items-center gap-1 ${
              atBatFilter === 'steals'
                ? 'bg-cyan-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-950 text-cyan-300 hover:text-white border border-cyan-500/30'
            }`}
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>盗塁・走塁 ({match.atBatEvents.filter(e => e.type === 'steal').length})</span>
          </button>
          <button
            onClick={() => setAtBatFilter('scoring')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition-colors ${
              atBatFilter === 'scoring'
                ? 'bg-rose-500 text-white font-black'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            得点打席 ({match.atBatEvents.filter(e => e.rbi > 0).length})
          </button>
          <button
            onClick={() => setAtBatFilter('hits')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition-colors ${
              atBatFilter === 'hits'
                ? 'bg-emerald-500 text-white font-black'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            安打・本塁打のみ
          </button>
          <button
            onClick={() => setAtBatFilter('user')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap font-bold transition-colors ${
              atBatFilter === 'user'
                ? 'bg-cyan-500 text-white font-black'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            自球団の打席のみ
          </button>
        </div>

        {/* At-bat items */}
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredAtBats.map((ab, idx) => {
            const runnerInfo = getRunnerBadgeInfo(ab.runnersState);

            // 盗塁イベントの特別な表示スタイル
            if (ab.type === 'steal') {
              const isSuccess = ab.stealDetails?.success ?? true;
              return (
                <div
                  key={ab.id || idx}
                  className={`p-3 rounded-xl border text-xs transition-all shadow-md ${
                    isSuccess
                      ? 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border-cyan-400/60 shadow-cyan-500/10'
                      : 'bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border-rose-500/50'
                  }`}
                >
                  {/* Top line: Inning, outs, steal indicator */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-200 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {ab.inning}回{ab.isBottom ? '裏' : '表'}
                      </span>
                      <span>·</span>
                      <span>{ab.outs}死</span>
                      <span>·</span>
                      <div className="flex items-center gap-1 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800">
                        <MiniBasesDiamond
                          first={runnerInfo.first}
                          second={runnerInfo.second}
                          third={runnerInfo.third}
                          isLoaded={runnerInfo.isLoaded}
                        />
                        <span
                          className={`font-medium ${
                            runnerInfo.isLoaded
                              ? 'text-rose-300 font-bold'
                              : runnerInfo.text === '走者なし'
                              ? 'text-slate-500'
                              : 'text-amber-300'
                          }`}
                        >
                          {runnerInfo.text}
                        </span>
                      </div>
                      <span>·</span>
                      <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                        <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                        <span>走塁速報</span>
                      </span>
                    </div>

                    <span
                      className={`font-black px-2 py-0.5 rounded text-[11px] ${
                        isSuccess
                          ? 'bg-cyan-400 text-slate-950 shadow'
                          : 'bg-rose-500 text-white shadow'
                      }`}
                    >
                      {isSuccess ? `⚡ ${ab.stealDetails?.base || '盗塁'}成功！` : `🚫 盗塁失敗`}
                    </span>
                  </div>

                  {/* Runner and match details */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/60">
                          走者
                        </span>
                        <span className="font-black text-sm text-white">{ab.batterName}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] font-sans leading-relaxed">
                        {ab.result}
                      </p>
                    </div>

                    {ab.stealDetails?.catcherName && (
                      <div className="text-right text-[10px] text-slate-400 shrink-0">
                        <span className="block text-slate-500">守備捕手</span>
                        <span className="font-bold text-slate-200">{ab.stealDetails.catcherName}</span>
                      </div>
                    )}
                  </div>

                  {/* Skill triggered badge */}
                  {ab.skillUsed && (
                    <div className="mt-1.5 pt-1 border-t border-cyan-500/20 flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>【スキル発動: {ab.skillUsed}】</span>
                    </div>
                  )}
                </div>
              );
            }

            const isHr = ab.type === 'homerun';
            const isHit = ab.type === 'hit';
            const isWalk = ab.type === 'walk';
            const isSo = ab.type === 'strikeout';
            const hasRbi = ab.rbi > 0;

            return (
              <div
                key={ab.id || idx}
                className={`p-2.5 rounded-xl border text-xs transition-colors ${
                  isHr
                    ? 'bg-rose-500/10 border-rose-500/40'
                    : hasRbi
                    ? 'bg-amber-400/10 border-amber-400/40'
                    : isHit
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800/80'
                }`}
              >
                {/* Top line: Inning, outs, runners */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-300">
                      {ab.inning}回{ab.isBottom ? '裏' : '表'}
                    </span>
                    <span>·</span>
                    <span>{ab.outs}死</span>
                    <span>·</span>
                    <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                      <MiniBasesDiamond
                        first={runnerInfo.first}
                        second={runnerInfo.second}
                        third={runnerInfo.third}
                        isLoaded={runnerInfo.isLoaded}
                      />
                      <span
                        className={`font-medium ${
                          runnerInfo.isLoaded
                            ? 'text-rose-300 font-bold'
                            : runnerInfo.text === '走者なし'
                            ? 'text-slate-500'
                            : 'text-amber-300'
                        }`}
                      >
                        {runnerInfo.text}
                      </span>
                    </div>
                  </div>

                  {hasRbi && (
                    <span className="font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">
                      +{ab.rbi}打点
                    </span>
                  )}
                </div>

                {/* Matchup: Batter vs Pitcher */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-slate-800 text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center shrink-0">
                      {ab.order}
                    </span>
                    <span className="font-bold text-slate-100">{ab.batterName}</span>
                    <span className="text-[10px] text-slate-500">vs</span>
                    <span className="text-slate-400 text-[11px] truncate">{ab.pitcherName}</span>
                  </div>

                  {/* Result pill */}
                  <div className="flex items-center gap-1 shrink-0">
                    {ab.isWalkOff && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 shadow animate-pulse">
                        サヨナラ
                      </span>
                    )}
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] shrink-0 ${
                        ab.isWalkOff
                          ? 'bg-rose-500 text-white font-black'
                          : isHr
                          ? 'bg-rose-500 text-white font-black animate-pulse'
                          : isHit
                          ? 'bg-amber-400 text-slate-950'
                          : isWalk
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : isSo
                          ? 'bg-slate-800 text-purple-300 border border-purple-500/20'
                          : 'bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      {ab.result}
                    </span>
                  </div>
                </div>

                {/* Skill triggered badge */}
                {ab.skillUsed && (
                  <div className="mt-1 pt-1 border-t border-slate-800/50 flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>【スキル発動: {ab.skillUsed}】</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. 得点シーンの解説 (Scoring Plays Commentary) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>得点シーン解説 ({match.scoringPlays.length}シーン)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">ハイライト</span>
        </div>

        {match.scoringPlays.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1">
            <Shield className="w-6 h-6 mx-auto text-slate-600" />
            <p className="font-bold text-slate-400">息詰まる投手戦！</p>
            <p className="text-[11px]">両軍投手の好投が続き、9回終了まで得点シーンはありませんでした。</p>
          </div>
        ) : (
          <div className="space-y-2">
            {match.scoringPlays.map((sp, idx) => (
              <div
                key={idx}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px] border border-amber-400/30 font-mono">
                      {sp.inning}回{sp.isBottom ? '裏' : '表'}
                    </span>
                    <span className="font-bold text-slate-200">{sp.batterName}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                      +{sp.rbi}点
                    </span>
                    <span className="text-slate-400">
                      ({sp.scoreTop} - {sp.scoreBottom})
                    </span>
                  </div>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {sp.description}
                </p>

                {sp.skillUsed && (
                  <div className="pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                      <Sparkles className="w-3 h-3" />
                      <span>【スキル発動: {sp.skillUsed}】</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. 打撃成績一覧 (Batting Box Score Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>打撃成績一覧</span>
          </span>

          {/* Tab switcher: Home / Away */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
            <button
              onClick={() => setBattingTab('home')}
              className={`px-2.5 py-1 rounded transition-colors ${
                battingTab === 'home' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {home.name}
            </button>
            <button
              onClick={() => setBattingTab('away')}
              className={`px-2.5 py-1 rounded transition-colors ${
                battingTab === 'away' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {away.name}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-1 scrollbar-thin">
          <table className="w-full min-w-[560px] text-center border-collapse text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 text-[10px] border-b border-slate-800 bg-slate-950/60">
                <th className="py-2 px-1 text-center font-sans w-9">打順</th>
                <th className="py-2 px-1 text-center font-sans w-8">守</th>
                <th className="py-2 px-2 text-left font-sans min-w-[100px]">選手名</th>
                <th className="py-2 px-1 text-center w-10">打数</th>
                <th className="py-2 px-1 text-center font-bold text-amber-400 w-10">安打</th>
                <th className="py-2 px-1 text-center text-slate-400 w-9">2B</th>
                <th className="py-2 px-1 text-center text-slate-400 w-9">3B</th>
                <th className="py-2 px-1 text-center font-bold text-rose-400 w-10">本</th>
                <th className="py-2 px-1 text-center font-bold text-emerald-400 w-10">打点</th>
                <th className="py-2 px-1 text-center text-cyan-400 font-bold w-10">盗</th>
                <th className="py-2 px-1 text-center w-10">四球</th>
                <th className="py-2 px-1 text-center w-10">三振</th>
                <th className="py-2 px-2 text-center text-slate-400 w-14">打率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeBattingStats.map((b, idx) => {
                const targetPlayer = activeBattingTeam.roster.find(p => p.id === b.playerId);
                const avgText =
                  b.seasonAvg >= 1
                    ? b.seasonAvg.toFixed(3)
                    : `.${b.seasonAvg.toFixed(3).split('.')[1] || '000'}`;
                return (
                  <tr
                    key={b.playerId || idx}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2 px-1 text-center text-slate-400 font-bold">{b.order}</td>
                    <td className="py-2 px-1 text-center text-slate-400 font-sans">{b.position}</td>
                    <td className="py-2 px-2 text-left font-sans">
                      <button
                        onClick={() => targetPlayer && onSelectPlayer && onSelectPlayer(targetPlayer)}
                        className="text-slate-200 hover:text-amber-400 font-bold truncate max-w-[120px] text-left block"
                      >
                        {b.name}
                      </button>
                    </td>
                    <td className="py-2 px-1 text-center text-slate-300">{b.atBats}</td>
                    <td className="py-2 px-1 text-center font-bold text-amber-300">{b.hits}</td>
                    <td className="py-2 px-1 text-center text-slate-400">{b.doubles}</td>
                    <td className="py-2 px-1 text-center text-slate-400">{b.triples}</td>
                    <td className="py-2 px-1 text-center font-bold text-rose-400">{b.homeRuns}</td>
                    <td className="py-2 px-1 text-center font-bold text-emerald-400">{b.rbi}</td>
                    <td className="py-2 px-1 text-center font-bold">
                      {b.stolenBases && b.stolenBases > 0 ? (
                        <span className="text-cyan-300 font-black">⚡{b.stolenBases}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-2 px-1 text-center text-slate-400">{b.walks}</td>
                    <td className="py-2 px-1 text-center text-slate-400">{b.strikeouts}</td>
                    <td className="py-2 px-2 text-center text-slate-300 font-bold">
                      {avgText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-700 bg-slate-950 font-bold text-[11px]">
                <td colSpan={3} className="py-2 px-2 text-left font-sans text-slate-400">
                  チーム計
                </td>
                <td className="py-2 px-1 text-center text-slate-200">{battingTotals.atBats}</td>
                <td className="py-2 px-1 text-center text-amber-400 font-black">{battingTotals.hits}</td>
                <td className="py-2 px-1 text-center text-slate-400">{battingTotals.doubles}</td>
                <td className="py-2 px-1 text-center text-slate-400">{battingTotals.triples}</td>
                <td className="py-2 px-1 text-center text-rose-400">{battingTotals.homeRuns}</td>
                <td className="py-2 px-1 text-center text-emerald-400">{battingTotals.rbi}</td>
                <td className="py-2 px-1 text-center font-black">
                  {battingTotals.stolenBases > 0 ? (
                    <span className="text-cyan-300 font-black">⚡{battingTotals.stolenBases}</span>
                  ) : (
                    <span className="text-slate-500">0</span>
                  )}
                </td>
                <td className="py-2 px-1 text-center text-slate-400">{battingTotals.walks}</td>
                <td className="py-2 px-1 text-center text-slate-400">{battingTotals.strikeouts}</td>
                <td className="py-2 px-2 text-center text-slate-500">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 7. 投球成績一覧 (Pitching Box Score Table) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-xs">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>投球成績一覧</span>
          </span>

          {/* Tab switcher: Home / Away */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
            <button
              onClick={() => setPitchingTab('home')}
              className={`px-2.5 py-1 rounded transition-colors ${
                pitchingTab === 'home' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {home.name}
            </button>
            <button
              onClick={() => setPitchingTab('away')}
              className={`px-2.5 py-1 rounded transition-colors ${
                pitchingTab === 'away' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              {away.name}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-1 scrollbar-thin">
          <table className="w-full min-w-[560px] text-center border-collapse text-xs font-mono whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 text-[10px] border-b border-slate-800 bg-slate-950/60">
                <th className="py-2 px-2 text-left font-sans min-w-[100px]">投手名</th>
                <th className="py-2 px-1 text-center font-sans w-12">役割</th>
                <th className="py-2 px-1 text-center font-sans w-10">結果</th>
                <th className="py-2 px-1 text-center w-16">投球回</th>
                <th className="py-2 px-1 text-center w-10">被安</th>
                <th className="py-2 px-1 text-center text-slate-400 w-10">被本</th>
                <th className="py-2 px-1 text-center font-bold text-cyan-400 w-12">奪三振</th>
                <th className="py-2 px-1 text-center w-10">与四球</th>
                <th className="py-2 px-1 text-center text-rose-400 w-10">失点</th>
                <th className="py-2 px-1 text-center text-rose-300 w-10">自責</th>
                <th className="py-2 px-2 text-center text-slate-400 w-14">防御率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activePitchingStats.map((p, idx) => {
                const targetPlayer = activePitchingTeam.roster.find(r => r.id === p.playerId);
                return (
                  <tr
                    key={p.playerId || idx}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2 px-2 text-left font-sans">
                      <button
                        onClick={() => targetPlayer && onSelectPlayer && onSelectPlayer(targetPlayer)}
                        className="text-slate-200 hover:text-amber-400 font-bold truncate max-w-[120px] text-left block"
                      >
                        {p.name}
                      </button>
                    </td>
                    <td className="py-2 px-1 text-center font-sans text-slate-400 text-[10px]">{p.role}</td>
                    <td className="py-2 px-1 text-center font-sans text-[10px]">
                      {p.isWin && <span className="text-emerald-400 font-bold">勝</span>}
                      {p.isLoss && <span className="text-rose-400 font-bold">敗</span>}
                      {p.isSave && <span className="text-cyan-400 font-bold">S</span>}
                      {!p.isWin && !p.isLoss && !p.isSave && <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-2 px-1 text-center text-slate-200 font-semibold">{formatInningsPitched(p)}</td>
                    <td className="py-2 px-1 text-center text-slate-300">{p.hits}</td>
                    <td className="py-2 px-1 text-center text-slate-400">{p.homeRuns}</td>
                    <td className="py-2 px-1 text-center font-bold text-cyan-300">{p.strikeouts}</td>
                    <td className="py-2 px-1 text-center text-slate-400">{p.walks}</td>
                    <td className="py-2 px-1 text-center font-bold text-rose-400">{p.runs}</td>
                    <td className="py-2 px-1 text-center text-rose-300">{p.earnedRuns}</td>
                    <td className="py-2 px-2 text-center text-slate-300 font-bold">{p.seasonEra.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Bottom Action Buttons */}
      <div className="pt-2 space-y-2">
        <button
          onClick={onBackToStadium}
          className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>球場へ戻る</span>
        </button>
      </div>
    </div>
  );
};
