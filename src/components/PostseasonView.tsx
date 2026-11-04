import React, { useState, useEffect } from 'react';
import {
  Team,
  Player,
  MatchState,
  PostseasonProgress,
} from '../types/baseball';
import {
  getStageInfo,
  initPostseason,
  generatePostseasonOpponent,
  claimPostseasonReward,
  reconcilePostseasonRewards,
  TOTAL_POSTSEASON_STAGES,
  PostseasonStageInfo,
} from '../utils/postseasonManager';
import { createMatch, simulateFullMatch } from '../utils/matchEngine';
import { addActivityLog } from '../utils/storage';
import { soundFx, bgm } from '../utils/audio';
import { LiveMatchBroadcastModal } from './LiveMatchBroadcastModal';
import { MatchReportView } from './MatchReportView';
import confetti from 'canvas-confetti';
import {
  Swords,
  Trophy,
  Award,
  Sparkles,
  Shield,
  Star,
  Users,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Play,
  Zap,
  Info,
  ChevronRight,
  Flame,
  FileText,
  X,
} from 'lucide-react';

const STORAGE_PS_LAST_MATCH_KEY = 'gekipawa_ps_last_match_result';

interface Props {
  team: Team;
  onUpdateTeam: (team: Team) => void;
  onSelectPlayer: (player: Player) => void;
}

export const PostseasonView: React.FC<Props> = ({ team, onUpdateTeam, onSelectPlayer }) => {
  const ps: PostseasonProgress = initPostseason(team);
  const currentStage = Math.min(ps.currentRound || 1, TOTAL_POSTSEASON_STAGES);
  const stageInfo: PostseasonStageInfo = getStageInfo(currentStage);

  const [selectedStarterId, setSelectedStarterId] = useState<string>(() => {
    return team.pitcherRotation?.[0] || team.roster.find(p => p.position === '投')?.id || '';
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [viewMode, setViewMode] = useState<'tournament' | 'report'>('tournament');
  const [currentMatchResult, setCurrentMatchResult] = useState<MatchState | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PS_LAST_MATCH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [activeMatch, setActiveMatch] = useState<MatchState | null>(null);
  const [showLiveBroadcast, setShowLiveBroadcast] = useState(false);
  const [showOpponentRoster, setShowOpponentRoster] = useState(false);
  const [showRetireConfirm, setShowRetireConfirm] = useState(false);
  const [cachedOpponent, setCachedOpponent] = useState<Team | null>(null);

  // BGM sync: 試合詳報モードではリザルトBGM、トーナメント画面ではメニューBGM
  useEffect(() => {
    if (viewMode === 'report' && currentMatchResult) {
      bgm.setTrack('result');
    } else {
      bgm.setTrack('menu');
    }
  }, [viewMode, currentMatchResult]);

  // 初回制覇報酬の自動補填（過去に獲得したものの反映されていなかったゲルダ等を自動付与）
  useEffect(() => {
    const { updatedTeam, recoveredAmount } = reconcilePostseasonRewards(team);
    if (recoveredAmount > 0) {
      onUpdateTeam(updatedTeam);
    }
  }, []);

  useEffect(() => {
    return () => {
      bgm.setTrack('menu');
    };
  }, []);

  // Match Outcome Modal State
  const [outcomeModal, setOutcomeModal] = useState<{
    type: 'win' | 'final_win' | 'loss';
    match: MatchState;
    stage: number;
    stageName: string;
    rewardText?: string;
  } | null>(null);

  // Lazy generate / cache opponent for current stage
  const currentOpponent = React.useMemo(() => {
    if (cachedOpponent && cachedOpponent.id.startsWith(`postseason_opp_${currentStage}_`)) {
      return cachedOpponent;
    }
    const opp = generatePostseasonOpponent(currentStage);
    setCachedOpponent(opp);
    return opp;
  }, [currentStage, cachedOpponent]);

  // Check if player has the supreme skill
  const hasSupremeSkill =
    ps.hasClaimedFinalSkill ||
    (team.inventory?.ownedSkills || []).includes('完全試合') ||
    team.roster.some(p => p.skills.includes('完全試合'));

  // Entry handler
  const handleEnterTournament = () => {
    soundFx.playScore();
    const updatedTeam: Team = {
      ...team,
      postseason: {
        ...ps,
        isEntered: true,
        totalAttempts: (ps.totalAttempts || 0) + (ps.currentRound === 1 ? 1 : 0),
      },
    };
    onUpdateTeam(updatedTeam);
  };

  // Retire / Reset to round 1
  const handleRetire = () => {
    setShowRetireConfirm(false);
    soundFx.playOut();
    let updatedTeam: Team = {
      ...team,
      postseason: {
        ...ps,
        currentRound: 1,
        isEntered: false,
      },
    };
    updatedTeam = addActivityLog(
      updatedTeam,
      `ポストシーズン: ${stageInfo.name}にてリタイア。1回戦から再スタート。`,
      'match'
    );
    onUpdateTeam(updatedTeam);
  };

  // Prepare user team for tournament match (refresh rest for the selected tournament starter)
  const prepareUserTeamForMatch = (): Team => {
    const refreshedRoster = team.roster.map(p => {
      if (p.id === selectedStarterId) {
        return { ...p, restGamesRemaining: 0 };
      }
      return p;
    });

    const currentRotation = team.pitcherRotation ? [...team.pitcherRotation] : [];
    // Ensure selected starter is at rotation[0] for the match engine
    if (selectedStarterId && currentRotation.includes(selectedStarterId)) {
      const idx = currentRotation.indexOf(selectedStarterId);
      currentRotation.splice(idx, 1);
      currentRotation.unshift(selectedStarterId);
    }

    return {
      ...team,
      roster: refreshedRoster,
      pitcherRotation: currentRotation,
    };
  };

  // Execute Match
  const executeMatch = (mode: 'live' | 'instant') => {
    setIsSimulating(true);

    setTimeout(() => {
      const matchUserTeam = prepareUserTeamForMatch();
      const opp = currentOpponent;

      // User plays Home on odd stages, Away on even stages
      const isUserHome = currentStage % 2 === 1;
      const home = isUserHome ? matchUserTeam : opp;
      const away = isUserHome ? opp : matchUserTeam;

      const rawMatch = createMatch(currentStage, home, away);
      const finishedMatch = simulateFullMatch(rawMatch);

      setActiveMatch(finishedMatch);
      setIsSimulating(false);

      if (mode === 'live') {
        setShowLiveBroadcast(true);
      } else {
        processMatchOutcome(finishedMatch);
      }
    }, 200);
  };

  // Process Match Outcome after simulation finishes
  const processMatchOutcome = (match: MatchState) => {
    setCurrentMatchResult(match);
    try {
      localStorage.setItem(STORAGE_PS_LAST_MATCH_KEY, JSON.stringify(match));
    } catch (e) {
      console.error('Failed to save postseason match cache:', e);
    }

    const isUserHome = match.homeTeam.id === team.id;
    const userScore = isUserHome ? match.scoreBottom : match.scoreTop;
    const oppScore = isUserHome ? match.scoreTop : match.scoreBottom;
    const isWin = userScore > oppScore;

    if (isWin) {
      soundFx.playVictory();
      const isAlreadyCleared = (ps.clearedStages || []).includes(currentStage);
      let rewardText: string | undefined = undefined;
      let nextTeam: Team = { ...team };

      // 1. 初回クリア報酬の付与（ゲルダ・チケット・スキル等）
      if (!isAlreadyCleared) {
        const claimResult = claimPostseasonReward(team, currentStage);
        nextTeam = claimResult.updatedTeam;
        rewardText = claimResult.rewardSummary;
      }

      // 2. トーナメント進行度の更新と保存（即座にチームと所持ゲルダへ反映）
      if (currentStage === TOTAL_POSTSEASON_STAGES) {
        // 決勝制覇！優勝達成
        confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
        const curPs = nextTeam.postseason || ps;
        const nextCleared = (curPs.clearedStages || []).includes(TOTAL_POSTSEASON_STAGES)
          ? curPs.clearedStages
          : [...(curPs.clearedStages || []), TOTAL_POSTSEASON_STAGES];
        const nextClaimed = (curPs.claimedRewardStages || []).includes(TOTAL_POSTSEASON_STAGES)
          ? curPs.claimedRewardStages
          : [...(curPs.claimedRewardStages || []), TOTAL_POSTSEASON_STAGES];

        let finalTeam: Team = {
          ...nextTeam,
          postseason: {
            ...curPs,
            currentRound: 1,
            isEntered: false,
            highestClearedStage: TOTAL_POSTSEASON_STAGES,
            clearedStages: nextCleared,
            claimedRewardStages: nextClaimed,
            championshipCount: (curPs.championshipCount || 0) + (isAlreadyCleared ? 1 : 0),
            hasClaimedFinalSkill: true,
          },
        };

        finalTeam = addActivityLog(
          finalTeam,
          `🏆 ポストシーズン【決勝】完全制覇達成！最高峰スキル「完全試合」を獲得し初代王者に輝く！`,
          'match'
        );

        onUpdateTeam(finalTeam);

        setOutcomeModal({
          type: 'final_win',
          match,
          stage: currentStage,
          stageName: stageInfo.name,
          rewardText,
        });
      } else {
        // 通常回戦 勝利突破
        confetti({ particleCount: 70, spread: 70 });
        const curPs = nextTeam.postseason || ps;
        const nextRound = currentStage + 1;
        const nextHighest = Math.max(curPs.highestClearedStage || 0, currentStage);
        const nextCleared = (curPs.clearedStages || []).includes(currentStage)
          ? curPs.clearedStages
          : [...(curPs.clearedStages || []), currentStage];
        const nextClaimed = (curPs.claimedRewardStages || []).includes(currentStage)
          ? curPs.claimedRewardStages
          : (isAlreadyCleared ? curPs.claimedRewardStages || [] : [...(curPs.claimedRewardStages || []), currentStage]);

        let stageWonTeam: Team = {
          ...nextTeam,
          postseason: {
            ...curPs,
            currentRound: nextRound,
            highestClearedStage: nextHighest,
            clearedStages: nextCleared,
            claimedRewardStages: nextClaimed,
            isEntered: true,
          },
        };

        stageWonTeam = addActivityLog(
          stageWonTeam,
          `ポストシーズン: ${stageInfo.name}を突破！次は第${nextRound}回戦へ進出。`,
          'match'
        );

        onUpdateTeam(stageWonTeam);

        setOutcomeModal({
          type: 'win',
          match,
          stage: currentStage,
          stageName: stageInfo.name,
          rewardText,
        });
      }
    } else {
      // 敗退：1回戦から再スタート
      soundFx.playOut();
      let lostTeam: Team = {
        ...team,
        postseason: {
          ...ps,
          currentRound: 1,
          isEntered: false,
        },
      };

      lostTeam = addActivityLog(
        lostTeam,
        `ポストシーズン: ${stageInfo.name}で無念の敗退。1回戦から再スタート。`,
        'match'
      );

      onUpdateTeam(lostTeam);

      setOutcomeModal({
        type: 'loss',
        match,
        stage: currentStage,
        stageName: stageInfo.name,
      });
    }
  };

  // Close Outcome Modal
  const handleProceedAfterOutcome = () => {
    setOutcomeModal(null);
    setActiveMatch(null);
  };

  const isAlreadyCleared = (ps.clearedStages || []).includes(currentStage);

  // Key milestones ladder points for display
  const milestones = [
    { stage: 1, label: '1回戦 開幕' },
    { stage: 25, label: '25回戦' },
    { stage: 50, label: '50回戦' },
    { stage: 75, label: '75回戦' },
    { stage: 90, label: '90回戦' },
    { stage: 100, label: '100回戦 最上階層' },
    { stage: 101, label: '準々決勝' },
    { stage: 102, label: '準決勝' },
    { stage: 103, label: '決勝' },
  ];

  // 試合詳報ページ表示モード
  if (viewMode === 'report' && currentMatchResult) {
    return (
      <MatchReportView
        match={currentMatchResult}
        onBackToStadium={() => setViewMode('tournament')}
        onSelectPlayer={onSelectPlayer}
        backButtonLabel="トーナメントへ戻る"
        reportTitle={`ポストシーズン ${stageInfo.name} 試合詳報`}
      />
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      {/* 1. Header Banner & Tournament Stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-4 shadow-xl">
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Swords className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base font-black tracking-wide text-slate-100 flex items-center gap-2">
                  ポストシーズン
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700/50">
                    TOURNAMENT
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">
                  負けたら即終了のサバイバルトーナメント（全103戦）
                </p>
              </div>
            </div>

            {hasSupremeSkill && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>完全試合 保持</span>
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-center">
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-bold">現在地</div>
              <div className="text-xs font-black text-amber-400 truncate">
                {ps.isEntered ? stageInfo.name : '未参戦'}
              </div>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-bold">最高到達</div>
              <div className="text-xs font-black text-indigo-300 truncate">
                {ps.highestClearedStage === 103
                  ? '決勝制覇'
                  : ps.highestClearedStage > 0
                  ? `${ps.highestClearedStage}戦`
                  : '—'}
              </div>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-bold">挑戦回数</div>
              <div className="text-xs font-black text-slate-200">
                {ps.totalAttempts || 0}回
              </div>
            </div>
            <div className="bg-slate-950/60 rounded-xl p-2 border border-slate-800/60">
              <div className="text-[10px] text-slate-400 font-bold">決勝制覇</div>
              <div className="text-xs font-black text-amber-400">
                {ps.championshipCount || 0}回
              </div>
            </div>
          </div>

          {/* 直前の試合詳報ボタン */}
          {currentMatchResult && (
            <button
              onClick={() => setViewMode('report')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-amber-400/10 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>直前の試合詳報（ボックススコア・全打席速報）を見る</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Tournament Stage Area */}
      {!ps.isEntered ? (
        /* ================= UNENTERED STATE ================= */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/50">
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>

          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 uppercase tracking-wider">
              {stageInfo.tierLabel}
            </span>
            <h3 className="text-lg font-black text-slate-100 mt-1.5">
              第{currentStage}回戦へのエントリー
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {currentStage === 1
                ? 'トーナメントにエントリーして第1回戦から103戦の頂点を目指します。'
                : `現在、第${currentStage}回戦の挑戦資格を保持しています。`}
            </p>
          </div>

          {/* Rules Summary Box */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-left space-y-1.5 text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-800/80 pb-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              トーナメントの掟
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              負けたら即1回戦からやり直しの一発勝負。<br />
              最上階層100回戦を突破し、決勝を制覇して最高峰の極秘スキルを掴み取れ！
            </p>
          </div>

          <button
            onClick={handleEnterTournament}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Swords className="w-5 h-5 text-slate-950" />
            エントリーして第{currentStage}回戦に挑戦！
          </button>
        </div>
      ) : (
        /* ================= ENTERED STATE (Active Stage) ================= */
        <div className="space-y-4">
          {/* Active Stage Card */}
          <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            {/* Top Stage Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    stageInfo.isBoss
                      ? 'bg-rose-950 text-rose-300 border border-rose-700/60 animate-pulse'
                      : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  }`}
                >
                  {stageInfo.tierLabel}
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  Stage {currentStage} / {TOTAL_POSTSEASON_STAGES}
                </span>
              </div>

              {isAlreadyCleared ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  <CheckCircle className="w-3 h-3" />
                  報酬受取済
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40 animate-pulse">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  初回制覇報酬あり
                </span>
              )}
            </div>

            {/* Stage Title & Opponent Information */}
            <div className="py-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xl font-black text-slate-100 flex items-center gap-2">
                    {stageInfo.name}
                    {stageInfo.isBoss && (
                      <span className="text-xs px-2 py-0.5 rounded bg-rose-600 text-white font-bold tracking-wider">
                        BOSS
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    対戦相手: <strong className="text-slate-200 text-sm">{stageInfo.opponentName}</strong>
                    <span className="text-slate-500 ml-1.5">({stageInfo.opponentManager}監督)</span>
                  </div>
                </div>

                {/* Difficulty Rating */}
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400">難易度</div>
                  <div className="flex items-center gap-0.5 justify-end mt-0.5">
                    {Array.from({ length: Math.min(stageInfo.difficultyRating, 10) }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          currentStage >= 100
                            ? 'text-rose-400 fill-rose-400'
                            : currentStage >= 70
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-indigo-400 fill-indigo-400'
                        }`}
                      />
                    ))}
                    {stageInfo.difficultyRating > 10 && (
                      <span className="text-[10px] font-black text-rose-400 ml-1">MAX</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Opponent Preview Highlights */}
              <div
                className="rounded-xl p-3 border relative overflow-hidden"
                style={{
                  backgroundColor: `${stageInfo.opponentColor}15`,
                  borderColor: `${stageInfo.opponentColor}40`,
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: stageInfo.opponentColor }}
                    />
                    <span className="font-bold text-slate-200">
                      {currentOpponent.roster.filter(p => p.position === '投')[0]?.name || 'エース'} (先発)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowOpponentRoster(true)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline"
                  >
                    <Users className="w-3.5 h-3.5" />
                    敵の戦力・名鑑を見る
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/40 text-[11px]">
                  <div>
                    <span className="text-slate-400">球速/制球: </span>
                    <span className="font-mono font-bold text-cyan-300">
                      最速{135 + (currentOpponent.roster[0]?.stats.pitcher?.speed || 5) * 3}km · 制{currentOpponent.roster[0]?.stats.pitcher?.control}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">打線主力: </span>
                    <span className="font-bold text-amber-300">
                      {currentOpponent.roster[3]?.name} ({currentOpponent.roster[3]?.rarity})
                    </span>
                  </div>
                </div>
              </div>

              {/* First Clear Reward Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    初回制覇報酬
                  </span>
                  {isAlreadyCleared ? (
                    <span className="text-[10px] text-slate-500 font-bold">受取済み</span>
                  ) : (
                    <span className="text-[10px] text-amber-400 font-bold">初回勝利で贈呈</span>
                  )}
                </div>
                <div className="text-xs font-black text-amber-300 mt-1">
                  {stageInfo.firstClearReward.description}
                </div>
              </div>

              {/* User Starter Selection */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>登板先発投手の指名</span>
                  <span className="text-[10px] text-slate-500">※トーナメント専用登板</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {team.roster
                    .filter(p => p.position === '投')
                    .slice(0, 3)
                    .map(p => {
                      const isSelected = p.id === selectedStarterId;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedStarterId(p.id)}
                          className={`p-2 rounded-lg text-left border transition-all ${
                            isSelected
                              ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 shadow'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="text-[11px] font-bold truncate">#{p.number} {p.name}</div>
                          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                            最速{135 + (p.stats.pitcher?.speed || 5) * 3}km
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Launch Match Controls */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                disabled={isSimulating}
                onClick={() => executeMatch('live')}
                className="py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 text-white fill-white" />
                実況生中継で挑戦
              </button>

              <button
                disabled={isSimulating}
                onClick={() => executeMatch('instant')}
                className="py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
                結果即時判定
              </button>
            </div>

            {/* Retire Option */}
            <div className="text-center pt-3">
              <button
                onClick={() => setShowRetireConfirm(true)}
                className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors inline-flex items-center gap-1 underline"
              >
                <RotateCcw className="w-3 h-3" />
                トーナメントをリタイア (1回戦へリセット)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Milestone Ladder & Tournament Structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            トーナメント階層ロードマップ (全103戦)
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {ps.clearedStages.length} / {TOTAL_POSTSEASON_STAGES} 制覇
          </span>
        </div>

        <div className="space-y-1.5">
          {milestones.map(m => {
            const isCleared = (ps.clearedStages || []).includes(m.stage);
            const isCurrent = ps.isEntered && currentStage === m.stage;
            const isPassed = currentStage > m.stage;

            return (
              <div
                key={m.stage}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  isCurrent
                    ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 shadow-md shadow-amber-950/30 ring-1 ring-amber-500/40'
                    : isCleared
                    ? 'bg-slate-950/70 border-emerald-900/50 text-slate-300'
                    : isPassed
                    ? 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                    : 'bg-slate-950/30 border-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950'
                        : isCleared
                        ? 'bg-emerald-900 text-emerald-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {m.stage}
                  </span>
                  <div>
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{m.label}</span>
                      {m.stage >= 100 && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          {m.stage === 103 ? 'FINAL' : 'BOSS'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {getStageInfo(m.stage).firstClearReward.description}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isCurrent ? (
                    <span className="text-[10px] font-black text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-600/60 animate-pulse">
                      挑戦中
                    </span>
                  ) : isCleared ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      突破
                    </span>
                  ) : isPassed ? (
                    <span className="text-[10px] font-bold text-slate-400">通過済</span>
                  ) : (
                    <span className="text-[10px] text-slate-600">未到達</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Opponent Roster Modal */}
      {showOpponentRoster && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: stageInfo.opponentColor }}
                />
                <h3 className="font-bold text-sm text-slate-100">
                  {stageInfo.opponentName} 戦力名鑑
                </h3>
              </div>
              <button
                onClick={() => setShowOpponentRoster(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {/* Pitchers */}
              <div>
                <div className="text-[11px] font-bold text-cyan-400 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> 投手陣
                </div>
                <div className="space-y-1">
                  {currentOpponent.roster
                    .filter(p => p.position === '投')
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => onSelectPlayer(p)}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-bold text-[10px]">
                            投
                          </span>
                          <span className="font-bold text-slate-200 truncate">
                            #{p.number} {p.name}
                          </span>
                          <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-700">
                            {p.rarity}
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-300 font-mono shrink-0 pl-1">
                          最速{135 + (p.stats.pitcher?.speed || 5) * 3}km · 制{p.stats.pitcher?.control} 変{p.stats.pitcher?.breaking}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Batters */}
              <div>
                <div className="text-[11px] font-bold text-amber-400 mb-1.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> 打撃陣
                </div>
                <div className="space-y-1">
                  {currentOpponent.roster
                    .filter(p => p.position !== '投')
                    .map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectPlayer(p)}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-4 text-center font-bold text-slate-500 text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-bold text-[10px]">
                            {p.position}
                          </span>
                          <span className="font-bold text-slate-200 truncate">
                            #{p.number} {p.name}
                          </span>
                          <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-700">
                            {p.rarity}
                          </span>
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono shrink-0 pl-1">
                          ミ{p.stats.fielder?.meet} パ{p.stats.fielder?.power} 走{p.stats.fielder?.speed}
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

      {/* 5. Live Match Broadcast Modal */}
      {showLiveBroadcast && activeMatch && (
        <LiveMatchBroadcastModal
          match={activeMatch}
          userTeamId={team.id}
          onFinish={() => {
            setShowLiveBroadcast(false);
            processMatchOutcome(activeMatch);
          }}
          onSelectPlayer={onSelectPlayer}
        />
      )}

      {/* 6. Retire Confirmation Modal */}
      {showRetireConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              トーナメントをリタイアしますか？
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              リタイアすると現在のトーナメント進行度は失われ、<strong>第1回戦からの再スタート</strong>となります。本当によろしいですか？
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowRetireConfirm(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleRetire}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition-transform active:scale-95"
              >
                リタイアする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Match Outcome Modal (Win / Final Win / Loss) */}
      {outcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
            {outcomeModal.type === 'final_win' ? (
              /* CHAMPIONSHIP GRAND FINALS WIN */
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-xl shadow-amber-500/30 animate-bounce">
                  <Trophy className="w-9 h-9 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-600 tracking-wider">
                    GRAND CHAMPION
                  </span>
                  <h3 className="text-xl font-black text-amber-300 mt-2">
                    ポストシーズン完全制覇！
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    全103戦の死闘を制し、トーナメントの頂点に君臨しました！
                  </p>
                </div>

                <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 text-left space-y-2">
                  <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    最高峰スキル授与！
                  </div>
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30">
                    <div className="text-xs font-black text-amber-200">
                      ★ 最高峰金特【完全試合】
                    </div>
                    <div className="text-[10px] text-amber-300/80 mt-0.5">
                      一人の走者も許さぬ絶対的支配力。球速+4 / 制球+5 / 変化+4 / 被安打・被本塁打率極小化
                    </div>
                  </div>
                  {outcomeModal.rewardText && (
                    <div className="text-[11px] text-slate-300 pt-1">
                      {outcomeModal.rewardText}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleProceedAfterOutcome();
                      setViewMode('report');
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-amber-400/40 transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    決勝の試合詳報（全打席速報・スコア）を見る
                  </button>

                  <button
                    onClick={handleProceedAfterOutcome}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-amber-500/30"
                  >
                    栄光を受け取る
                  </button>
                </div>
              </>
            ) : outcomeModal.type === 'win' ? (
              /* REGULAR STAGE WIN */
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                    STAGE CLEARED
                  </span>
                  <h3 className="text-lg font-black text-slate-100 mt-1.5">
                    {outcomeModal.stageName} 突破！
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    スコア: {outcomeModal.match.scoreBottom} - {outcomeModal.match.scoreTop}
                  </div>
                </div>

                {outcomeModal.rewardText ? (
                  <div className="bg-slate-950/90 border border-amber-500/40 rounded-xl p-3 text-left space-y-1">
                    <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      初回制覇報酬を獲得！
                    </div>
                    <div className="text-xs font-black text-amber-300">
                      {outcomeModal.rewardText}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-400">
                    ※この回戦の初回クリア報酬はすでに獲得済みです。
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleProceedAfterOutcome();
                      setViewMode('report');
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-amber-400/40 transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    この試合の詳報（全打席速報・ボックススコア）を見る
                  </button>

                  <button
                    onClick={handleProceedAfterOutcome}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                  >
                    次の回戦へ進む
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* LOSS (ELIMINATED) */
              <>
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-rose-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                    ELIMINATED
                  </span>
                  <h3 className="text-lg font-black text-rose-300 mt-1.5">
                    {outcomeModal.stageName}にて無念の敗退…
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">
                    スコア: {outcomeModal.match.scoreBottom} - {outcomeModal.match.scoreTop}
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-rose-900/60 rounded-xl p-3 text-xs text-slate-300 leading-relaxed text-left">
                  一発勝負の掟により、トーナメントは終了となります。
                  <div className="font-bold text-rose-400 mt-1">
                    次回は「第1回戦」からの再挑戦となります。
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleProceedAfterOutcome();
                      setViewMode('report');
                    }}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-amber-400/40 transition-colors shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    敗退試合の詳報（敗因・スコア分析）を見る
                  </button>

                  <button
                    onClick={handleProceedAfterOutcome}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                  >
                    確認して1回戦へ戻る
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
