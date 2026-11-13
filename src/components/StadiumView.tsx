import React, { useState, useEffect } from 'react';
import { League, Team, MatchState, Player, LEAGUE_DIFFICULTIES, Standing, ChampionshipRewardInfo, getLeagueDifficulty, getUnlockedDifficulties } from '../types/baseball';
import { createMatch, simulateFullMatch, formatInningsPitched } from '../utils/matchEngine';
import { calculateStandings, concludeSeason, getLeagueLeaders, createCpuTeam, formatWinRate, formatBattingAvg, calculateMagicNumber, MagicNumberInfo, generateLeagueCpuTeams } from '../utils/leagueManager';
import { addActivityLog } from '../utils/storage';
import { soundFx, bgm } from '../utils/audio';
import { MatchReportView } from './MatchReportView';
import { LiveMatchBroadcastModal } from './LiveMatchBroadcastModal';
import { AdVideoModal } from './AdVideoModal';
import { Play, Trophy, Award, ArrowRight, Sparkles, FileText, Star, Shield, AlertCircle, CheckCircle, Users, X, Zap, Lock, FastForward, ChevronRight, ListOrdered, Video, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  league: League;
  onUpdateLeague: (updated: League) => void;
  onSelectPlayer: (player: Player) => void;
}

const STORAGE_LAST_MATCH_KEY = 'gekipawa_last_match_result';
const STORAGE_MATCH_COOLDOWN_KEY = 'gekipawa_match_cooldown_until';
const MATCH_COOLDOWN_SECONDS = 10 * 60; // 10分 = 600秒

export const StadiumView: React.FC<Props> = ({ league, onUpdateLeague, onSelectPlayer }) => {
  const [subTab, setSubTab] = useState<'match' | 'standings' | 'leaders'>('match');
  const [viewMode, setViewMode] = useState<'schedule' | 'report'>('schedule');
  const [rankingModalCategory, setRankingModalCategory] = useState<'avg' | 'hr' | 'rbi' | 'steal' | 'era' | 'win' | 'so' | 'save' | null>(null);
  const [currentMatchResult, setCurrentMatchResult] = useState<MatchState | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_LAST_MATCH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // BGM切り替え: 試合結果画面（reportモード）ではパワプロ風リザルトBGM、それ以外（日程・順位表・記録室）ではメニューBGM
  useEffect(() => {
    if (viewMode === 'report' && currentMatchResult) {
      bgm.setTrack('result');
    } else {
      bgm.setTrack('menu');
    }
  }, [viewMode, currentMatchResult]);

  useEffect(() => {
    return () => {
      bgm.setTrack('menu');
    };
  }, []);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showLiveBroadcast, setShowLiveBroadcast] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showOpponentRoster, setShowOpponentRoster] = useState(false);
  const [showAdVideoModal, setShowAdVideoModal] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_MATCH_COOLDOWN_KEY);
      if (!raw) return 0;
      const until = parseInt(raw, 10);
      const diff = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      return isNaN(diff) ? 0 : diff;
    } catch {
      return 0;
    }
  });

  // 試合終了後10分間のクールダウン毎秒カウントダウン
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const timer = setInterval(() => {
      try {
        const raw = localStorage.getItem(STORAGE_MATCH_COOLDOWN_KEY);
        if (!raw) {
          setCooldownRemaining(0);
          return;
        }
        const until = parseInt(raw, 10);
        const diff = Math.max(0, Math.ceil((until - Date.now()) / 1000));
        if (diff <= 0) {
          setCooldownRemaining(0);
          localStorage.removeItem(STORAGE_MATCH_COOLDOWN_KEY);
        } else {
          setCooldownRemaining(diff);
        }
      } catch {
        setCooldownRemaining(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // mm:ss フォーマット
  const formatCooldownTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const [seasonConclusionModal, setSeasonConclusionModal] = useState<{
    historyItem: any;
    updatedLeague: League;
    unlockedNewDifficulty?: boolean;
    awardedChampionshipTitle?: string;
    championshipRewards?: ChampionshipRewardInfo;
  } | null>(null);

  const userTeam = league.teams.find(t => t.isUser) || league.teams[0];
  const cpuTeams = league.teams.filter(t => !t.isUser);

  const currentDiff = league.difficulty || 1;
  const currentDiffInfo = getLeagueDifficulty(currentDiff);
  const maxUnlocked = league.maxUnlockedDifficulty || userTeam.maxUnlockedDifficulty || 1;
  // リーグ途中判定（1試合以上消化中かつ未終了）
  const isMidSeason = league.playedGames > 0 && league.playedGames < league.totalGames;

  // 6球団バーガー方式対戦スケジュール (5試合で1巡、全14巡+2試合=72試合)
  // 全カードが72試合を通じて均等に14〜15試合ずつ対戦するNPB式完全日程
  const BERGER_ROUNDS: [number, number][][] = [
    [[0, 1], [2, 5], [3, 4]],
    [[0, 2], [3, 1], [4, 5]],
    [[0, 3], [4, 2], [5, 1]],
    [[0, 4], [5, 3], [1, 2]],
    [[0, 5], [1, 4], [2, 3]],
  ];

  const roundPairs = BERGER_ROUNDS[league.playedGames % BERGER_ROUNDS.length];
  // ユーザーの対戦相手（roundPairs[0][1] - 1）
  const nextOpponentIdx = Math.max(0, Math.min(cpuTeams.length - 1, roundPairs[0][1] - 1));
  const nextOpponent = cpuTeams[nextOpponentIdx] || cpuTeams[0];
  const isHomeMatch = Math.floor(league.playedGames / 5) % 2 === 0;

  // 予告先発スロット計算 (第一先発: 0, 第二先発: 1, 第三先発: 2)
  const scheduledSlotIdx = league.playedGames % 3;
  const slotLabels = ['第一先発', '第二先発', '第三先発'] as const;
  const scheduledSlotLabel = slotLabels[scheduledSlotIdx];

  const userStarterId = userTeam.pitcherRotation?.[scheduledSlotIdx] || userTeam.roster.find(p => p.position === '投')?.id;
  const userStarter = userTeam.roster.find(p => p.id === userStarterId);
  const userStarterRest = userStarter?.restGamesRemaining ?? 0;

  // 対戦相手の予告先発
  const oppStarterId = nextOpponent.pitcherRotation?.[scheduledSlotIdx] || nextOpponent.roster.find(p => p.position === '投')?.id;
  const oppStarter = nextOpponent.roster.find(p => p.id === oppStarterId);

  // 試合シミュレーション実行（結果即時スキップ／スコア速報）
  const handlePlayMatch = () => {
    if (league.playedGames >= league.totalGames) {
      handleOpenSeasonConclusion();
      return;
    }

    setIsSimulating(true);

    setTimeout(() => {
      try {
        const home = isHomeMatch ? userTeam : nextOpponent;
        const away = isHomeMatch ? nextOpponent : userTeam;

        // ユーザーの試合を実行
        const userMatchBase = createMatch(league.playedGames + 1, home, away);
        const finished = simulateFullMatch(userMatchBase);

        // 同節の他の球団の組み合わせもバーガー方式に準拠して同時に進行（全6球団が毎節1試合ずつ消化）
        const otherFinishedMatches: MatchState[] = [];
        for (let pIdx = 1; pIdx < roundPairs.length; pIdx++) {
          const [idxA, idxB] = roundPairs[pIdx];
          const teamA = idxA === 0 ? userTeam : cpuTeams[idxA - 1];
          const teamB = idxB === 0 ? userTeam : cpuTeams[idxB - 1];
          if (!teamA || !teamB) continue;

          // ホーム・アウェイの交互設定
          const isAHome = Math.floor(league.playedGames / 5) % 2 === (pIdx % 2);
          const mHome = isAHome ? teamA : teamB;
          const mAway = isAHome ? teamB : teamA;
          const m = simulateFullMatch(createMatch(league.playedGames + 1, mHome, mAway));
          otherFinishedMatches.push(m);
        }

        const allMatches = [finished, ...otherFinishedMatches];

        try {
          localStorage.setItem(STORAGE_LAST_MATCH_KEY, JSON.stringify(finished));
        } catch (e) {
          console.error('Failed to save last match result:', e);
        }
        setCurrentMatchResult(finished);

        // 試合終了から10分間のクールダウンを開始
        const cooldownUntil = Date.now() + MATCH_COOLDOWN_SECONDS * 1000;
        try {
          localStorage.setItem(STORAGE_MATCH_COOLDOWN_KEY, String(cooldownUntil));
        } catch (e) {
          console.error('Failed to save cooldown time:', e);
        }
        setCooldownRemaining(MATCH_COOLDOWN_SECONDS);

        // 成績反映
        const isUserWin = finished.winnerId === userTeam.id;
        let gerdaReward = 300;
        if (isUserWin) {
          gerdaReward = 1000;
        }

        setViewMode('report');
        if (isUserWin) {
          soundFx.playVictory();
          confetti({ particleCount: 70, spread: 60 });
        } else {
          soundFx.playOut();
        }

        const updatedTeamsMap = new Map<string, Team>();
        allMatches.forEach(m => {
          updatedTeamsMap.set(m.homeTeam.id, m.homeTeam);
          updatedTeamsMap.set(m.awayTeam.id, m.awayTeam);
        });

        let updatedTeams = league.teams.map(t => {
          const teamAfterMatch = updatedTeamsMap.get(t.id) || t;
          return {
            ...teamAfterMatch,
            gerda: t.isUser ? t.gerda + gerdaReward : teamAfterMatch.gerda,
          };
        });

        // ユーザー球団の活動ログ記録
        const playedGameNumber = league.playedGames + 1;
        const userStealsCount = finished.steals?.filter(s => s.success && s.teamName === userTeam.name).length || 0;
        const stealSuffix = userStealsCount > 0 ? ` ⚡【${userStealsCount}盗塁成功】` : '';

        updatedTeams = updatedTeams.map(t => {
          if (!t.isUser) return t;
          let logged = addActivityLog(
            t,
            `第${playedGameNumber}試合: vs ${nextOpponent.name} に ${isUserWin ? '勝利！' : '敗戦'} (${finished.scoreBottom}-${finished.scoreTop})${stealSuffix} 獲得: +${gerdaReward}G`,
            'match',
            `第${league.season}季 第${playedGameNumber}試合`
          );
          if (playedGameNumber >= league.totalGames) {
            logged = addActivityLog(
              logged,
              `第${league.season}季 ペナントレース全72試合を完走しました！シーズン表彰式へ進めます。`,
              'title',
              `第${league.season}季 最終節`
            );
          }
          return logged;
        });

        const updatedStandings = league.standings.map(s => {
          const matchForTeam = allMatches.find(m => m.homeTeam.id === s.teamId || m.awayTeam.id === s.teamId);
          if (!matchForTeam) return s;

          const isHome = matchForTeam.homeTeam.id === s.teamId;
          const myScore = isHome ? matchForTeam.scoreBottom : matchForTeam.scoreTop;
          const oppScore = isHome ? matchForTeam.scoreTop : matchForTeam.scoreBottom;
          const isWin = myScore > oppScore;
          const isDraw = myScore === oppScore;

          const newWins = s.wins + (isWin ? 1 : 0);
          const newLosses = s.losses + (!isWin && !isDraw ? 1 : 0);
          const newDraws = s.draws + (isDraw ? 1 : 0);
          const newGames = newWins + newLosses + newDraws;
          const decided = newWins + newLosses;
          const newWinRate = decided > 0 ? newWins / decided : 0;

          return {
            ...s,
            games: newGames,
            wins: newWins,
            losses: newLosses,
            draws: newDraws,
            winRate: newWinRate,
            runsScored: s.runsScored + myScore,
            runsAllowed: s.runsAllowed + oppScore,
          };
        });

        const nextLeague: League = {
          ...league,
          playedGames: league.playedGames + 1,
          teams: updatedTeams,
          standings: updatedStandings,
        };

        onUpdateLeague({
          ...nextLeague,
          standings: calculateStandings(nextLeague),
        });
      } catch (err) {
        console.error('Error during match execution:', err);
      } finally {
        setIsSimulating(false);
      }
    }, 450);
  };

  // シーズン終了処理モーダルを開く
  const handleOpenSeasonConclusion = () => {
    const { updatedLeague, historyItem, unlockedNewDifficulty, awardedChampionshipTitle, championshipRewards } = concludeSeason(league);
    soundFx.playHomeRun();
    confetti({ particleCount: 120, spread: 90 });
    setSeasonConclusionModal({
      historyItem,
      updatedLeague,
      unlockedNewDifficulty,
      awardedChampionshipTitle,
      championshipRewards,
    });
  };

  // 動画広告視聴完了による即時試合開始（10分のクールダウンをスキップ）
  const handleAdVideoCompleted = () => {
    setShowAdVideoModal(false);
    handlePlayMatch();
  };

  // 未消化試合の精算・早期シーズン終了処理（残り試合を全球団72試合まで完全消化シミュレート）
  const handleConcludeSeasonEarly = () => {
    setIsSimulating(true);

    setTimeout(() => {
      try {
        let currentLeague = { ...league };
        let currentTeams = [...currentLeague.teams];

        // 全球団が72試合になるまで同節進行を高速シミュレーション実行
        while (currentLeague.playedGames < currentLeague.totalGames) {
          const g = currentLeague.playedGames;
          const curUser = currentTeams.find(t => t.isUser) || currentTeams[0];
          const curCpus = currentTeams.filter(t => !t.isUser);
          const curRound = BERGER_ROUNDS[g % BERGER_ROUNDS.length];

          const roundMatches: MatchState[] = [];
          for (let pIdx = 0; pIdx < curRound.length; pIdx++) {
            const [idxA, idxB] = curRound[pIdx];
            const teamA = idxA === 0 ? curUser : curCpus[idxA - 1];
            const teamB = idxB === 0 ? curUser : curCpus[idxB - 1];
            if (!teamA || !teamB) continue;

            const isAHome = Math.floor(g / 5) % 2 === (pIdx % 2);
            const mHome = isAHome ? teamA : teamB;
            const mAway = isAHome ? teamB : teamA;
            const m = simulateFullMatch(createMatch(g + 1, mHome, mAway));
            roundMatches.push(m);
          }

          const teamsMap = new Map<string, Team>();
          roundMatches.forEach(m => {
            teamsMap.set(m.homeTeam.id, m.homeTeam);
            teamsMap.set(m.awayTeam.id, m.awayTeam);
          });

          currentTeams = currentTeams.map(t => teamsMap.get(t.id) || t);

          const updatedStandings = currentLeague.standings.map(s => {
            const m = roundMatches.find(rm => rm.homeTeam.id === s.teamId || rm.awayTeam.id === s.teamId);
            if (!m) return s;
            const isHome = m.homeTeam.id === s.teamId;
            const myScore = isHome ? m.scoreBottom : m.scoreTop;
            const oppScore = isHome ? m.scoreTop : m.scoreBottom;
            const isWin = myScore > oppScore;
            const isDraw = myScore === oppScore;

            const newWins = s.wins + (isWin ? 1 : 0);
            const newLosses = s.losses + (!isWin && !isDraw ? 1 : 0);
            const newDraws = s.draws + (isDraw ? 1 : 0);
            const newGames = newWins + newLosses + newDraws;
            const decided = newWins + newLosses;
            const newWinRate = decided > 0 ? newWins / decided : 0;

            return {
              ...s,
              games: newGames,
              wins: newWins,
              losses: newLosses,
              draws: newDraws,
              winRate: newWinRate,
              runsScored: s.runsScored + myScore,
              runsAllowed: s.runsAllowed + oppScore,
            };
          });

          currentLeague = {
            ...currentLeague,
            playedGames: g + 1,
            teams: currentTeams,
            standings: updatedStandings,
          };
        }

        const readyLeague: League = {
          ...currentLeague,
          playedGames: currentLeague.totalGames,
          standings: calculateStandings(currentLeague),
        };

        const { updatedLeague, historyItem, unlockedNewDifficulty, awardedChampionshipTitle, championshipRewards } = concludeSeason(readyLeague);
        soundFx.playHomeRun();
        confetti({ particleCount: 120, spread: 90 });
        setSeasonConclusionModal({
          historyItem,
          updatedLeague,
          unlockedNewDifficulty,
          awardedChampionshipTitle,
          championshipRewards,
        });
      } catch (err) {
        console.error('Failed to conclude season early:', err);
      } finally {
        setIsSimulating(false);
      }
    }, 100);
  };

  // 新シーズンへ移行
  const handleProceedToNextSeason = (selectedDiff: number) => {
    if (!seasonConclusionModal) return;
    const base = seasonConclusionModal.updatedLeague;
    let finalLeague = base;

    const baseUserTeam = base.teams.find(t => t.isUser) || base.teams[0];
    // 新シーズン移行時の自球団全選手・投手成績の完全リセット保証
    const resetUserTeam: Team = {
      ...baseUserTeam,
      isUser: true,
      roster: baseUserTeam.roster.map(p => ({
        ...p,
        restGamesRemaining: 0,
        record: {
          games: 0,
          atBats: 0,
          hits: 0,
          doubles: 0,
          triples: 0,
          homeRuns: 0,
          rbi: 0,
          walks: 0,
          strikeouts: 0,
          stolenBases: 0,
          pitchGames: 0,
          wins: 0,
          losses: 0,
          saves: 0,
          holds: 0,
          inningsPitched: 0,
          outsPitched: 0,
          earnedRuns: 0,
          pitchHits: 0,
          pitchHomeRuns: 0,
          pitchStrikeouts: 0,
          pitchWalks: 0,
        }
      }))
    };

    if (selectedDiff !== base.difficulty) {
      // 選択難易度でCPUチームと順位表を再編成（ユーザーチームの獲得報酬や昇格状態は確実に維持）
      const newCpuTeams = generateLeagueCpuTeams(selectedDiff, resetUserTeam.name);
      const nextTeams = [resetUserTeam, ...newCpuTeams];
      const nextStandings: Standing[] = nextTeams.map(t => ({
        teamId: t.id,
        teamName: t.name,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        winRate: 0,
        gamesBehind: 0,
        runsScored: 0,
        runsAllowed: 0,
      }));

      finalLeague = {
        ...base,
        difficulty: selectedDiff,
        teams: nextTeams,
        standings: nextStandings,
      };
    } else {
      finalLeague = {
        ...base,
        teams: [resetUserTeam, ...base.teams.filter(t => t.id !== resetUserTeam.id)],
      };
    }

    // 前シーズンの最終試合結果キャッシュを完全に破棄して新シーズン開幕状態へ
    try {
      localStorage.removeItem(STORAGE_LAST_MATCH_KEY);
    } catch (e) {
      console.error('Failed to clear match cache:', e);
    }
    setCurrentMatchResult(null);
    setViewMode('schedule');

    onUpdateLeague(finalLeague);
    setSeasonConclusionModal(null);
  };

  const leaders = getLeagueLeaders(league.teams);
  const magicInfo = calculateMagicNumber(league);

  // 試合詳報ページ表示モードの場合
  if (viewMode === 'report' && currentMatchResult) {
    return (
      <MatchReportView
        match={currentMatchResult}
        onBackToStadium={() => setViewMode('schedule')}
        onSelectPlayer={onSelectPlayer}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24">
      {/* Stadium Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center justify-between text-xs font-bold gap-1">
        <button
          onClick={() => {
            setSubTab('match');
            setViewMode('schedule');
          }}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            subTab === 'match' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          公式戦対戦
        </button>
        {currentMatchResult && (
          <button
            onClick={() => setViewMode('report')}
            className="flex-1 py-2 rounded-lg transition-colors bg-slate-950 text-amber-400 border border-amber-400/30 hover:bg-amber-400/10 flex items-center justify-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>試合詳報</span>
          </button>
        )}
        <button
          onClick={() => setSubTab('standings')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            subTab === 'standings' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          リーグ順位
        </button>
        <button
          onClick={() => setSubTab('leaders')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            subTab === 'leaders' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          タイトル争い
        </button>
      </div>

      {/* 1. Match Simulation Tab */}
      {subTab === 'match' && (
        <div className="space-y-4">
          {/* League Difficulty Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${currentDiffInfo.border} ${currentDiffInfo.bg} ${currentDiffInfo.color}`}>
                  {currentDiffInfo.badgeLabel}
                </span>
                <span className="font-bold text-xs text-slate-200">
                  {currentDiffInfo.name}
                </span>
                <span className="text-xs font-mono text-amber-400">
                  {currentDiffInfo.stars}
                </span>
              </div>
              {isMidSeason ? (
                <div
                  className="flex items-center gap-1 text-[10px] text-slate-400 font-bold bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 shadow-sm"
                  title="公式ペナントレース開催中のため、リーグ途中で難易度を変更することはできません"
                >
                  <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />
                  <span>公式戦開催中</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowDifficultyModal(true)}
                  className="text-[10px] text-amber-300 hover:text-amber-200 font-bold bg-amber-400/15 hover:bg-amber-400/25 px-2.5 py-1 rounded-full border border-amber-400/40 transition-colors shadow-sm flex items-center gap-1"
                >
                  <span>難易度変更</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {currentDiffInfo.description}
            </p>
            {isMidSeason && (
              <p className="text-[10px] text-slate-500 font-sans flex items-center gap-1.5 pt-1 border-t border-slate-800/50">
                <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                <span>公式戦進行中のため、リーグ途中の難易度変更はできません。新シーズン開幕時に変更できます。</span>
              </p>
            )}
          </div>

          {/* Progress Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                第{league.season}季 公式ペナントレース
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {league.playedGames} / {league.totalGames} 試合消化
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (league.playedGames / league.totalGames) * 100)}%` }}
              />
            </div>
          </div>

          {/* Match Schedule / Season Finished Card */}
          {league.playedGames >= league.totalGames ? (
            /* 72試合完了時のシーズン終了・結果発表カード (第73試合は表示しない) */
            <div className="bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 border border-amber-400/50 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 mx-auto">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  SEASON CONCLUDED
                </span>
                <h3 className="text-base font-black text-white font-['M_PLUS_Rounded_1c']">
                  第{league.season}季 公式ペナントレース終了！
                </h3>
                <p className="text-xs text-slate-300">
                  今シーズンの全日程が終了しました。各球団の最終順位と個人タイトルが確定しています。
                </p>
              </div>

              {/* 最終順位サマリー */}
              {(() => {
                const userStanding = league.standings.find(s => s.teamId === userTeam.id) || league.standings.find(s => s.teamName === userTeam.name) || league.standings[0];
                const userRank = Math.max(1, league.standings.findIndex(s => s.teamId === userTeam.id) + 1);
                return (
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800 pb-1.5">
                      <span className="text-slate-400">自球団 最終成績</span>
                      <span className={userRank === 1 ? 'text-amber-400 font-black text-sm' : 'text-slate-200 text-sm'}>
                        第{userRank}位 {userRank === 1 ? '🏆 リーグ優勝！' : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>勝敗: <strong>{userStanding?.wins ?? 0}勝 {userStanding?.losses ?? 0}敗 {userStanding?.draws ?? 0}分</strong> ({userStanding?.games ?? 0}試合)</span>
                      <span className="font-mono text-amber-400 font-bold">勝率: {formatWinRate(userStanding?.winRate ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                      <span>ペナント覇者: <strong className="text-amber-300">{league.standings[0]?.teamName}</strong></span>
                    </div>
                  </div>
                );
              })()}

              <button
                onClick={handleOpenSeasonConclusion}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5 fill-current" />
                <span>🏆 シーズン表彰式・タイトル発表へ</span>
              </button>
            </div>
          ) : (
            /* 通常のNEXT MATCHカード (第1〜72試合) */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">NEXT MATCH</span>
                <h3 className="text-sm font-black text-slate-100 font-['M_PLUS_Rounded_1c'] mt-0.5">
                  第{league.playedGames + 1}試合
                </h3>
              </div>

              <div className="flex items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                {/* Home */}
                <div className="text-center flex-1">
                  <span className="text-[9px] text-slate-500 font-mono block">HOME</span>
                  <span className={`font-black text-sm block truncate ${isHomeMatch ? 'text-amber-300' : 'text-slate-100'}`}>
                    {isHomeMatch ? userTeam.name : nextOpponent.name}
                  </span>
                </div>

                <div className="font-mono font-black text-amber-400 text-base">VS</div>

                {/* Away */}
                <div className="text-center flex-1">
                  <span className="text-[9px] text-slate-500 font-mono block">VISITOR</span>
                  <span className={`font-black text-sm block truncate ${!isHomeMatch ? 'text-amber-300' : 'text-slate-100'}`}>
                    {isHomeMatch ? nextOpponent.name : userTeam.name}
                  </span>
                </div>
              </div>

              {/* 本日の予告先発カード */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>本日の予告先発投手</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">
                    ローテ枠: {scheduledSlotLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {/* 自球団予告先発 */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[9px] text-amber-300 block font-bold truncate">{userTeam.name}</span>
                    {userStarter ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 truncate block text-[11px]">
                            #{userStarter.number} {userStarter.name}
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <div>
                            {userStarterRest === 0 ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                ⚡ 万全
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                💤 休養中（残{userStarterRest}試合）
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {userStarter.record.wins}勝{userStarter.record.losses}敗 · {formatInningsPitched(userStarter.record)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px]">未登録</span>
                    )}
                  </div>

                  {/* 相手球団予告先発 */}
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[9px] text-slate-400 block font-bold truncate">{nextOpponent.name}</span>
                    {oppStarter ? (
                      <div>
                        <span className="font-bold text-slate-100 truncate block text-[11px]">
                          #{oppStarter.number} {oppStarter.name}
                        </span>
                        <div className="mt-1">
                          <span className="text-[9px] text-slate-400 font-mono block">
                            {oppStarter.rarity} · {oppStarter.record.wins}勝{oppStarter.record.losses}敗 · {formatInningsPitched(oppStarter.record)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px]">未登録</span>
                    )}
                  </div>
                </div>

                {userStarterRest > 0 && (
                  <div className="text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 p-1.5 rounded flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>{scheduledSlotLabel}は休養中のため、ローテ枠内の万全な投手が自動登板します。</span>
                  </div>
                )}
              </div>

              {/* Opponent Roster Preview Button */}
              <button
                type="button"
                onClick={() => setShowOpponentRoster(true)}
                className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>対戦相手 {nextOpponent.name} のオーダー確認</span>
              </button>

              {/* Play Buttons: Standard Match Start (with 10-min cooldown) & Rewarded Video Start */}
              <div className="space-y-2.5">
                {/* 1. 通常の試合開始ボタン（試合終了後10分間カウントダウン＆無効化、10分経過で有効化） */}
                {cooldownRemaining > 0 ? (
                  <button
                    type="button"
                    disabled={true}
                    className="w-full py-3.5 bg-slate-900/90 border border-slate-800 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2 shadow-inner"
                  >
                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>試合開始まで {formatCooldownTime(cooldownRemaining)}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePlayMatch()}
                    disabled={isSimulating}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-sm rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border border-amber-300/80 game-btn"
                  >
                    <Play className="w-4 h-4 fill-current text-slate-950" />
                    <span>{isSimulating ? '試合シミュレーション中…' : '試合開始'}</span>
                  </button>
                )}

                {/* 2. 動画を見て今すぐ試合開始ボタン（広告動画を視聴して10分待ち時間を完全スキップ） */}
                <button
                  type="button"
                  onClick={() => setShowAdVideoModal(true)}
                  disabled={isSimulating}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 border border-emerald-400/50 game-btn group"
                >
                  <Video className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                  <span>動画を見て今すぐ試合開始</span>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-400/30">
                    待ち時間なし
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Last Match Result & Dedicated Link to Match Detailed Report Page */}
          {currentMatchResult && (
            <div className="bg-slate-900 border border-amber-400/40 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>第{currentMatchResult.matchNumber}試合 結果</span>
                </span>
                <span className="font-mono text-slate-300 font-bold">
                  {currentMatchResult.scoreTop} - {currentMatchResult.scoreBottom}
                </span>
              </div>

              {/* Quick Scoreboard line */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between py-0.5 border-b border-slate-800/80">
                  <span className="text-slate-300 truncate max-w-[150px]">{currentMatchResult.awayTeam.name}</span>
                  <span className="font-bold text-white text-sm">{currentMatchResult.scoreTop}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-300 truncate max-w-[150px]">{currentMatchResult.homeTeam.name}</span>
                  <span className="font-bold text-white text-sm">{currentMatchResult.scoreBottom}</span>
                </div>
              </div>

              {/* Quick Stolen Base & Home Run highlight */}
              {(() => {
                const steals = currentMatchResult.steals || [];
                const successfulSteals = steals.filter(s => s.success);
                const hrs = (currentMatchResult.atBatEvents || []).filter(e => e.type === 'homerun');
                if (steals.length === 0 && hrs.length === 0) return null;
                return (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                    {hrs.length > 0 && (
                      <div className="flex items-center gap-1.5 text-rose-300">
                        <span className="font-bold text-rose-400 shrink-0">［本塁打］</span>
                        <span className="truncate">{hrs.map(h => `${h.batterName}(${h.inning}回)`).join(', ')}</span>
                      </div>
                    )}
                    {successfulSteals.length > 0 && (
                      <div className="flex items-center gap-1.5 text-cyan-300">
                        <span className="font-bold text-cyan-400 shrink-0 flex items-center gap-0.5">
                          <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                          <span>［盗塁］</span>
                        </span>
                        <span className="truncate font-semibold">
                          {successfulSteals.map(s => `${s.runnerName}(${s.inning}回·${s.base})`).join(', ')}
                        </span>
                      </div>
                    )}
                    {steals.filter(s => !s.success).length > 0 && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                        <span className="font-bold text-slate-500 shrink-0">［盗塁刺］</span>
                        <span className="truncate">{steals.filter(s => !s.success).map(s => `${s.runnerName}(${s.inning}回)`).join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Button to go to 試合詳報ページ */}
              <button
                onClick={() => setViewMode('report')}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>試合詳報ページを開く</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. Standings Tab */}
      {subTab === 'standings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>第{league.season}季 リーグ順位表 ({currentDiffInfo.badgeLabel})</span>
            </div>
            {magicInfo?.isLit && (
              <span className="px-2 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-[10px] shadow animate-pulse font-mono">
                M{magicInfo.magicNumber} 点灯中
              </span>
            )}
          </div>

          {/* NPB公式優勝マジック点灯バナー */}
          {magicInfo?.isLit && (
            <div className="bg-gradient-to-r from-amber-500/20 via-slate-950 to-slate-900 border border-amber-400/50 rounded-xl p-3 flex items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-sm shadow-md animate-pulse font-mono tracking-wider shrink-0">
                  M{magicInfo.magicNumber}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1 truncate">
                    <span>優勝マジック点灯！</span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">
                    {league.standings[0]?.teamId === userTeam.id ? '自球団の優勝へのカウントダウン！' : `首位「${league.standings[0]?.teamName}」が自力優勝可能`}
                  </p>
                </div>
              </div>
              {magicInfo.targetTeamName && (
                <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                  対象: {magicInfo.targetTeamName}
                </span>
              )}
            </div>
          )}

          {magicInfo?.isClinched && (
            <div className="bg-gradient-to-r from-emerald-500/20 via-slate-950 to-slate-900 border border-emerald-400/50 rounded-xl p-3 flex items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-400 text-slate-950 font-black text-xs shadow-md font-mono shrink-0">
                  優勝
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1 truncate">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>今季ペナントレース制覇！</span>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate">
                    {league.standings[0]?.teamId === userTeam.id ? '祝！自球団のリーグ優勝が決定しました！' : `「${league.standings[0]?.teamName}」が優勝を決めました`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 text-[10px]">
                  <th className="py-2 text-left">順位 / 球団</th>
                  <th className="py-2">試合</th>
                  <th className="py-2">勝</th>
                  <th className="py-2">敗</th>
                  <th className="py-2">分</th>
                  <th className="py-2">勝率</th>
                  <th className="py-2">差</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {league.standings.map((s, idx) => {
                  const isUser = s.teamId === userTeam.id;
                  const isFirst = idx === 0;
                  return (
                    <tr key={s.teamId} className={isUser ? 'bg-amber-400/10 font-bold' : ''}>
                      <td className="py-2 text-left flex items-center gap-1.5">
                        <span className={`w-4 text-center font-bold ${isFirst ? 'text-amber-400' : 'text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <span className="truncate text-slate-200">{s.teamName}</span>
                      </td>
                      <td className="py-2 text-slate-400">{s.games}</td>
                      <td className="py-2 text-emerald-400 font-bold">{s.wins}</td>
                      <td className="py-2 text-rose-400 font-bold">{s.losses}</td>
                      <td className="py-2 text-slate-400">{s.draws}</td>
                      <td className="py-2 text-amber-300 font-bold">{formatWinRate(s.winRate)}</td>
                      <td className="py-2">
                        {isFirst ? (
                          magicInfo?.isClinched ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-[10px] font-mono">
                              優勝
                            </span>
                          ) : magicInfo?.isLit ? (
                            <span className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-300 text-slate-950 font-black text-[10px] font-mono shadow animate-pulse">
                              M{magicInfo.magicNumber}
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono">-</span>
                          )
                        ) : (
                          <span className="text-slate-400 font-mono">{s.gamesBehind.toFixed(1)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Leaders Tab */}
      {subTab === 'leaders' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl text-center">
            <span className="text-[11px] text-amber-300 font-bold flex items-center justify-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span>項目をタップすると各部門の上位10名詳細ランキングを表示できます</span>
            </span>
          </div>

          {/* Batting Title Leaders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>打撃個人タイトル争い</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">規定打席: {leaders.qualifyingAtBats}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* AVG */}
              <div
                onClick={() => setRankingModalCategory('avg')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>首位打者</span>
                  </span>
                  <span className="text-[9px] text-amber-400/80 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.avgLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">規定打席到達者なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.avgLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-amber-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-amber-300 bg-amber-950/60 border-amber-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                            {formatBattingAvg(item.avg)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* HR */}
              <div
                onClick={() => setRankingModalCategory('hr')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>本塁打王</span>
                  </span>
                  <span className="text-[9px] text-amber-400/80 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.hrLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">記録なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.hrLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-amber-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-amber-300 bg-amber-950/60 border-amber-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                            {item.player.record.homeRuns || 0} 本
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* RBI */}
              <div
                onClick={() => setRankingModalCategory('rbi')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>打点王</span>
                  </span>
                  <span className="text-[9px] text-amber-400/80 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.rbiLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">記録なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.rbiLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-amber-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-amber-300 bg-amber-950/60 border-amber-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                            {item.player.record.rbi || 0} 打点
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Steals */}
              <div
                onClick={() => setRankingModalCategory('steal')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-amber-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>盗塁王</span>
                  </span>
                  <span className="text-[9px] text-amber-400/80 group-hover:text-amber-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.stealLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">記録なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.stealLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-amber-400/10 border border-amber-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-amber-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-amber-300 bg-amber-950/60 border-amber-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-amber-400 font-black' : 'text-slate-300'}`}>
                            {item.player.record.stolenBases || 0} 盗塁
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pitching Title Leaders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span>投手個人タイトル争い</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">規定投球回: {leaders.qualifyingInnings}</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* ERA */}
              <div
                onClick={() => setRankingModalCategory('era')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>最優秀防御率</span>
                  </span>
                  <span className="text-[9px] text-cyan-400/80 group-hover:text-cyan-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.eraLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">規定投球回到達者なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.eraLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-cyan-400/10 border border-cyan-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-cyan-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-cyan-400 font-black' : 'text-slate-300'}`}>
                            {item.era.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* WINS */}
              <div
                onClick={() => setRankingModalCategory('win')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>最多勝</span>
                  </span>
                  <span className="text-[9px] text-cyan-400/80 group-hover:text-cyan-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.winLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">記録なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.winLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-cyan-400/10 border border-cyan-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-cyan-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-cyan-400 font-black' : 'text-slate-300'}`}>
                            {item.player.record.wins || 0} 勝
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SO */}
              <div
                onClick={() => setRankingModalCategory('so')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-cyan-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>最多奪三振</span>
                  </span>
                  <span className="text-[9px] text-cyan-400/80 group-hover:text-cyan-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.soLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">記録なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.soLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-cyan-400/10 border border-cyan-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-cyan-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-cyan-400 font-black' : 'text-slate-300'}`}>
                            {item.player.record.pitchStrikeouts || 0} 個
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SAVES */}
              <div
                onClick={() => setRankingModalCategory('save')}
                className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-rose-400/50 hover:bg-slate-900/80 cursor-pointer transition-all active:scale-[0.99] group space-y-1.5"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-rose-400" />
                    <span>最多セーブ</span>
                  </span>
                  <span className="text-[9px] text-rose-400/80 group-hover:text-rose-300 font-bold flex items-center gap-0.5">
                    上位10名 <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {leaders.saveLeaders.length === 0 ? (
                  <div className="text-[10px] text-slate-500 py-1 text-center">記録なし</div>
                ) : (
                  <div className="space-y-1">
                    {leaders.saveLeaders.slice(0, 3).map((item, idx) => {
                      const isUser = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                      const rankBadge = idx === 0 ? 'bg-amber-400 text-slate-950 font-black' : idx === 1 ? 'bg-slate-300 text-slate-950 font-bold' : 'bg-amber-700 text-amber-100 font-bold';
                      return (
                        <div key={item.player.id || idx} className={`flex items-center justify-between px-2 py-1 rounded-lg ${isUser ? 'bg-rose-400/10 border border-rose-400/30' : 'bg-slate-900/50 border border-slate-800/40'}`}>
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono shrink-0 ${rankBadge}`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold truncate text-[11px] ${isUser ? 'text-rose-300' : 'text-slate-200'}`}>
                              {item.player.name}
                            </span>
                            <span className={`text-[9px] font-mono px-1.5 rounded shrink-0 border ${isUser ? 'text-rose-300 bg-rose-950/60 border-rose-500/40' : 'text-slate-400 bg-slate-950 border-slate-800'}`}>
                              {item.teamName}
                            </span>
                          </div>
                          <span className={`font-mono font-bold text-xs shrink-0 ${idx === 0 ? 'text-rose-400 font-black' : 'text-slate-300'}`}>
                            {item.player.record.saves || 0} S
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 難易度選択モーダル */}
      {showDifficultyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pt-safe pb-safe pl-safe pr-safe">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">リーグ難易度の選択</h3>
              </div>
              <button
                onClick={() => setShowDifficultyModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {isMidSeason ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300 flex items-start gap-2">
                <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block text-rose-200">リーグ開催中</span>
                  公式ペナントレースが進行中のため、リーグ途中で難易度を変更することはできません。<br />
                  シーズン終了時または新シーズン開幕時に変更してください。
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                開幕前に挑戦するリーグ難易度を選択してください。各リーグで優勝を果たすと、より高難易度なリーグが順次解放されます。
              </p>
            )}

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {getUnlockedDifficulties(maxUnlocked).map(diff => {
                const isUnlocked = diff.level <= maxUnlocked;
                const isCurrent = diff.level === currentDiff;

                return (
                  <div
                    key={diff.level}
                    onClick={() => {
                      if (isMidSeason) return; // リーグ途中の変更を完全遮断
                      if (isUnlocked) {
                        let updatedTeams = league.teams;
                        if (diff.level !== league.difficulty) {
                          const userTeam = league.teams.find(t => t.isUser) || league.teams[0];
                          const newCpuTeams = generateLeagueCpuTeams(diff.level, userTeam.name);
                          updatedTeams = [userTeam, ...newCpuTeams];
                        }
                        onUpdateLeague({ ...league, difficulty: diff.level, teams: updatedTeams });
                        setShowDifficultyModal(false);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'bg-amber-400/10 border-amber-400 text-amber-300 ring-1 ring-amber-400/50'
                        : isMidSeason
                        ? 'bg-slate-950/40 border-slate-800/40 opacity-40 cursor-not-allowed'
                        : isUnlocked
                        ? 'bg-slate-950 border-slate-800 hover:border-slate-700 cursor-pointer'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${diff.border} ${diff.color}`}>
                          {diff.badgeLabel}
                        </span>
                        <span className="font-bold text-slate-100">{diff.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-400/30 font-bold">
                            参戦中
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {isMidSeason && !isCurrent && (
                          <Lock className="w-3 h-3 text-slate-500" />
                        )}
                        <span className="text-[10px] font-mono text-amber-400">{diff.stars}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                      {diff.description}
                    </p>
                    <div className="mt-1 text-[9px] text-amber-300 font-mono bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/20 flex flex-wrap gap-x-1.5 gap-y-0.5">
                      <span className="font-bold">🏆 優勝報酬: +{diff.rewards.gerda.toLocaleString()}G</span>
                      <span>スカウト券 投{diff.rewards.pitcherTickets}・野{diff.rewards.fielderTickets}</span>
                      <span className="text-amber-200 font-bold">限定レア装備or賞金</span>
                      <span>改名×{diff.rewards.renameTickets}</span>
                      <span className="text-amber-200">「{diff.rewards.awardedSkill}」</span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1.5">
                      <span>相手戦力: {diff.cpuStrengthText}</span>
                      {isMidSeason && !isCurrent ? (
                        <span className="text-slate-500">開催中・変更不可</span>
                      ) : !isUnlocked ? (
                        <span className="text-rose-400 font-bold">★{diff.level - 1}制覇で解放</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* シーズン終了・閉幕セレブレーションモーダル */}
      {seasonConclusionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 pt-safe pb-safe pl-safe pr-safe">
          <div className="bg-slate-900 border border-amber-400/60 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center animate-fade-in max-h-[92vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-amber-400 font-mono font-bold tracking-widest block">SEASON FINALE</span>
              <h2 className="text-lg font-black text-slate-100 font-['M_PLUS_Rounded_1c']">
                第{seasonConclusionModal.historyItem.season}季 閉幕！
              </h2>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">リーグ覇者:</span>
                <strong className="text-amber-400">{seasonConclusionModal.historyItem.championTeamName}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">自球団順位:</span>
                <strong className={seasonConclusionModal.historyItem.userRank === 1 ? 'text-amber-300 font-black text-sm' : 'text-slate-200'}>
                  {seasonConclusionModal.historyItem.userRank}位
                </strong>
              </div>
            </div>

            {/* 優勝特典＆獲得報酬 */}
            {seasonConclusionModal.historyItem.userRank === 1 && (
              <div className="p-3.5 bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-slate-950 border border-amber-400/60 rounded-2xl space-y-2.5 text-left shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    <span>🏆 祝・ペナント制覇！優勝報酬獲得！</span>
                  </div>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-black font-mono">
                    受取完了
                  </span>
                </div>

                {/* 獲得報酬グリッド */}
                {seasonConclusionModal.championshipRewards && (
                  <div className="space-y-2 text-[11px]">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-amber-400/30 flex items-center justify-between">
                        <span className="text-slate-400">賞金</span>
                        <strong className="text-amber-300 font-mono font-bold">
                          +{seasonConclusionModal.championshipRewards.gerda.toLocaleString()}G
                        </strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-amber-400/30 flex items-center justify-between">
                        <span className="text-slate-400">スカウト券</span>
                        <strong className="text-emerald-400 font-mono font-bold">
                          投{seasonConclusionModal.championshipRewards.pitcherTickets}/野{seasonConclusionModal.championshipRewards.fielderTickets}枚
                        </strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-amber-400/30 flex items-center justify-between">
                        <span className="text-slate-400">改名手形</span>
                        <strong className="text-sky-300 font-mono font-bold">
                          ×{seasonConclusionModal.championshipRewards.renameTickets}
                        </strong>
                      </div>
                      <div className="bg-slate-950/80 p-2 rounded-xl border border-amber-400/30 flex items-center justify-between">
                        <span className="text-slate-400">秘伝スキル</span>
                        <strong className="text-amber-300 font-black truncate max-w-[90px]">
                          「{seasonConclusionModal.championshipRewards.awardedSkill}」
                        </strong>
                      </div>
                    </div>

                    {/* ★優勝特別ボーナス: 優勝限定レア装備 or 特別ボーナス賞金★ */}
                    {seasonConclusionModal.championshipRewards.awardedEquipment ? (
                      <div className="bg-gradient-to-r from-amber-500/25 via-amber-400/10 to-slate-950 p-3 rounded-2xl border border-amber-400/60 shadow-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                            ★優勝限定レア装備 当選！★
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            {seasonConclusionModal.championshipRewards.awardedEquipment.effectLabel}
                          </span>
                        </div>
                        <div className="pt-0.5">
                          <span className="text-sm font-black text-amber-300 block">
                            {seasonConclusionModal.championshipRewards.awardedEquipment.name}
                          </span>
                          <p className="text-[10px] text-slate-300 leading-tight mt-0.5">
                            {seasonConclusionModal.championshipRewards.awardedEquipment.description}
                          </p>
                        </div>
                      </div>
                    ) : seasonConclusionModal.championshipRewards.bonusGerda ? (
                      <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-slate-950 p-2.5 rounded-2xl border border-amber-400/50 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.5 rounded font-bold block w-fit">
                            特別優勝ボーナス賞金 当選！
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">優勝追加賞金</span>
                        </div>
                        <strong className="text-amber-300 font-mono font-black text-sm">
                          +{(seasonConclusionModal.championshipRewards.bonusGerda || 0).toLocaleString()}G
                        </strong>
                      </div>
                    ) : null}
                  </div>
                )}

                {seasonConclusionModal.awardedChampionshipTitle && (
                  <div className="p-2 bg-slate-950 rounded-xl border border-amber-500/40 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">授与称号</span>
                    <span className="text-xs font-black text-amber-300">
                      {seasonConclusionModal.awardedChampionshipTitle}
                    </span>
                  </div>
                )}
                {seasonConclusionModal.unlockedNewDifficulty && (
                  <div className="p-1.5 bg-emerald-950/60 rounded-xl border border-emerald-800 text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>次難易度「★{league.difficulty + 1}」が解放されました！</span>
                  </div>
                )}
              </div>
            )}

            {/* 個人タイトル獲得者 & 授与スキル一覧 */}
            {seasonConclusionModal.historyItem.titles && seasonConclusionModal.historyItem.titles.length > 0 && (
              <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-3 text-left space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>個人タイトル表彰（⭐︎{league.difficulty || 1}スキル授与）</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">難易度★{league.difficulty || 1}</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {seasonConclusionModal.historyItem.titles.map((t: { title: string; playerName: string; teamName: string; value: string }, idx: number) => {
                    const diffStar = Math.min(6, Math.max(1, league.difficulty || 1));
                    const isTriple = t.title.includes('三冠王');
                    const isAaron = t.title.includes('ハンク・アーロン賞');
                    const isSawa = t.title.includes('沢村賞');
                    const isCyYoung = t.title.includes('サイ・ヤング賞');
                    const awardedSkillName = isAaron
                      ? `ハンク・アーロン賞⭐︎${diffStar}`
                      : isCyYoung
                      ? `サイ・ヤング賞⭐︎${diffStar}`
                      : isTriple
                      ? `三冠王⭐︎${diffStar}`
                      : isSawa
                      ? `沢村賞⭐︎${diffStar}`
                      : t.title === '最多奪三振'
                      ? `奪三振王⭐︎${diffStar}`
                      : `${t.title}⭐︎${diffStar}`;
                    const isUserPlayer = userTeam && userTeam.roster.some(p => p.name === t.playerName);

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border text-[11px] flex items-center justify-between gap-1.5 ${
                          isUserPlayer
                            ? 'bg-amber-400/10 border-amber-400/40 text-amber-200'
                            : 'bg-slate-900 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-amber-400 font-['M_PLUS_Rounded_1c']">
                              {t.title}
                            </span>
                            <span className="font-bold text-slate-100 truncate">
                              {t.playerName}
                            </span>
                            {isUserPlayer && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
                                自球団
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({t.value})
                            </span>
                          </div>
                          <div className="text-[10px] text-cyan-300 font-bold mt-0.5 flex items-center gap-1">
                            <span>秘伝スキル獲得:</span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-black font-mono">
                              「{awardedSkillName}」
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <span className="text-[10px] text-slate-400 font-bold block">新シーズンの難易度を選択:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {getUnlockedDifficulties(seasonConclusionModal.updatedLeague.maxUnlockedDifficulty).map(d => (
                  <button
                    key={d.level}
                    onClick={() => handleProceedToNextSeason(d.level)}
                    className="py-2 px-1 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 text-[10px] font-bold text-slate-200 hover:text-amber-300 transition-colors"
                  >
                    {d.badgeLabel}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleProceedToNextSeason(currentDiff)}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              新シーズン（第{seasonConclusionModal.updatedLeague.season}季）へ進む
            </button>
          </div>
        </div>
      )}

      {/* Opponent Roster Modal */}
      {showOpponentRoster && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in pt-safe pb-safe pl-safe pr-safe">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-slate-100">
                  {nextOpponent.name} 選手一覧
                </h3>
              </div>
              <button
                onClick={() => setShowOpponentRoster(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2 text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded-xl px-2.5 my-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>対戦相手の登録選手一覧です。タップして能力や成績を確認できます。</span>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {/* Lineup */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400 block">スタメンオーダー</span>
                <div className="space-y-1">
                  {nextOpponent.lineup.slice(0, 9).map((pId, idx) => {
                    const p = nextOpponent.roster.find(r => r.id === pId);
                    const pos = nextOpponent.lineupPositions?.[idx] || '野';
                    if (!p) return null;
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectPlayer(p)}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-slate-400 font-bold w-4 text-center">{idx + 1}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">{pos}</span>
                          <span className="font-bold text-slate-200 truncate">{p.name}</span>
                          <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-700">{p.rarity}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono shrink-0 pl-1">
                          巧:{p.stats.fielder?.meet} 長:{p.stats.fielder?.power} 走:{p.stats.fielder?.speed} 守:{p.stats.fielder?.defense}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pitchers */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-cyan-400 block">投手陣</span>
                <div className="space-y-1">
                  {nextOpponent.roster.filter(p => p.position === '投').map(p => (
                    <div
                      key={p.id}
                      onClick={() => onSelectPlayer(p)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400/60 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold text-[10px]">投</span>
                        <span className="font-bold text-slate-200 truncate">#{p.number} {p.name}</span>
                        <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-700">{p.rarity}</span>
                      </div>
                      <div className="text-[10px] text-cyan-300 font-mono shrink-0 pl-1">
                        最速{135 + (p.stats.pitcher?.speed || 5) * 3}km · 制:{p.stats.pitcher?.control} 変:{p.stats.pitcher?.breaking}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setShowOpponentRoster(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Top 10 Detailed Ranking Modal */}
      {rankingModalCategory && (() => {
        let titleLabel = '';
        let qualNote = '';
        let list: Array<{
          player: Player;
          teamName: string;
          mainVal: string;
          subVal: string;
        }> = [];

        if (rankingModalCategory === 'avg') {
          titleLabel = '【首位打者】打率ランキング 上位10名';
          qualNote = `規定打席: ${leaders.qualifyingAtBats}打席 (到達者を優先表示)`;
          list = leaders.avgLeaders.slice(0, 10).map(item => ({
            player: item.player,
            teamName: item.teamName,
            mainVal: formatBattingAvg(item.avg),
            subVal: `${item.player.record.atBats}打数 ${item.player.record.hits}安打 ${item.player.record.homeRuns}本 ${item.player.record.rbi}点`,
          }));
        } else if (rankingModalCategory === 'hr') {
          titleLabel = '【本塁打王】本塁打ランキング 上位10名';
          qualNote = '全野手・投手対象';
          list = leaders.hrLeaders.slice(0, 10).map(item => {
            const ab = item.player.record.atBats;
            const avg = ab > 0 ? item.player.record.hits / ab : 0;
            return {
              player: item.player,
              teamName: item.teamName,
              mainVal: `${item.player.record.homeRuns} 本`,
              subVal: `打率 ${formatBattingAvg(avg)} / ${item.player.record.rbi}打点 (${item.player.record.hits}安打)`,
            };
          });
        } else if (rankingModalCategory === 'rbi') {
          titleLabel = '【打点王】打点ランキング 上位10名';
          qualNote = '全野手・投手対象';
          list = leaders.rbiLeaders.slice(0, 10).map(item => {
            const ab = item.player.record.atBats;
            const avg = ab > 0 ? item.player.record.hits / ab : 0;
            return {
              player: item.player,
              teamName: item.teamName,
              mainVal: `${item.player.record.rbi} 点`,
              subVal: `打率 ${formatBattingAvg(avg)} / ${item.player.record.homeRuns}本塁打`,
            };
          });
        } else if (rankingModalCategory === 'steal') {
          titleLabel = '【盗塁王】盗塁ランキング 上位10名';
          qualNote = '全野手・投手対象';
          list = leaders.stealLeaders.slice(0, 10).map(item => ({
            player: item.player,
            teamName: item.teamName,
            mainVal: `${item.player.record.stolenBases} 盗塁`,
            subVal: `${item.player.record.games}試合出場 / ${item.player.record.hits}安打`,
          }));
        } else if (rankingModalCategory === 'era') {
          titleLabel = '【最優秀防御率】防御率ランキング 上位10名';
          qualNote = `規定投球回: ${leaders.qualifyingInnings}回 (到達者を優先表示)`;
          list = leaders.eraLeaders.slice(0, 10).map(item => ({
            player: item.player,
            teamName: item.teamName,
            mainVal: item.era.toFixed(2),
            subVal: `${formatInningsPitched(item.totalOuts)} ${item.player.record.wins}勝${item.player.record.losses}敗 自責${item.player.record.earnedRuns}`,
          }));
        } else if (rankingModalCategory === 'win') {
          titleLabel = '【最多勝】勝利数ランキング 上位10名';
          qualNote = '全投手対象 (同数は防御率順)';
          list = leaders.winLeaders.slice(0, 10).map(item => ({
            player: item.player,
            teamName: item.teamName,
            mainVal: `${item.player.record.wins} 勝`,
            subVal: `${item.player.record.losses}敗 / 防御率 ${item.era.toFixed(2)} / ${formatInningsPitched(item.totalOuts)}`,
          }));
        } else if (rankingModalCategory === 'so') {
          titleLabel = '【最多奪三振】奪三振ランキング 上位10名';
          qualNote = '全投手対象 (同数は防御率順)';
          list = leaders.soLeaders.slice(0, 10).map(item => ({
            player: item.player,
            teamName: item.teamName,
            mainVal: `${item.player.record.pitchStrikeouts} 個`,
            subVal: `防御率 ${item.era.toFixed(2)} / ${formatInningsPitched(item.totalOuts)} / ${item.player.record.wins}勝`,
          }));
        } else if (rankingModalCategory === 'save') {
          titleLabel = '【最多セーブ】セーブランキング 上位10名';
          qualNote = '全投手対象 (同数は防御率順)';
          list = leaders.saveLeaders.slice(0, 10).map(item => ({
            player: item.player,
            teamName: item.teamName,
            mainVal: `${item.player.record.saves} S`,
            subVal: `登板${item.player.record.pitchGames}試合 / 防御率 ${item.era.toFixed(2)}`,
          }));
        }

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center animate-fade-in pt-safe pb-safe pl-safe pr-safe">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-slate-100 font-['M_PLUS_Rounded_1c']">
                      {titleLabel}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">
                    {qualNote}
                  </span>
                </div>
                <button
                  onClick={() => setRankingModalCategory(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 overflow-y-auto space-y-1.5 flex-1 divide-y divide-slate-800/40">
                {list.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    対象データがまだありません
                  </div>
                ) : (
                  list.map((item, rankIdx) => {
                    const isUserPlayer = userTeam && userTeam.roster.some(p => p.id === item.player.id);
                    const rankNum = rankIdx + 1;
                    const rankBadgeClass =
                      rankNum === 1
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : rankNum === 2
                        ? 'bg-slate-300 text-slate-950 font-black'
                        : rankNum === 3
                        ? 'bg-amber-700 text-amber-100 font-black'
                        : 'bg-slate-800 text-slate-400 font-bold';

                    return (
                      <div
                        key={item.player.id || rankIdx}
                        onClick={() => {
                          onSelectPlayer(item.player);
                        }}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 transition-all ${
                          isUserPlayer
                            ? 'bg-amber-400/10 border-amber-400/40 hover:bg-amber-400/20'
                            : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 shadow-sm ${rankBadgeClass}`}>
                            {rankNum}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-bold truncate ${isUserPlayer ? 'text-amber-300' : 'text-slate-100'}`}>
                                {item.player.name}
                              </span>
                              <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                                {item.player.position}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 rounded shrink-0 border border-slate-800">
                                {item.teamName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate pt-0.5">
                              {item.subVal}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-black text-amber-400 block">
                            {item.mainVal}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-center">
                <span className="text-[10px] text-slate-500">
                  ※選手をタップすると選手カード・能力詳細を確認できます
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Live Match Broadcast Modal */}
      {showLiveBroadcast && currentMatchResult && (
        <LiveMatchBroadcastModal
          match={currentMatchResult}
          userTeamId={userTeam.id}
          onFinish={() => {
            setShowLiveBroadcast(false);
            setViewMode('report');
          }}
          onSelectPlayer={onSelectPlayer}
        />
      )}

      {/* Rewarded Video Ad Modal */}
      {showAdVideoModal && (
        <AdVideoModal
          isOpen={showAdVideoModal}
          onClose={() => setShowAdVideoModal(false)}
          onAdCompleted={handleAdVideoCompleted}
        />
      )}
    </div>
  );
};
