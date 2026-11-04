import React, { useState, useEffect } from 'react';
import { Player, Team, Position, Rarity } from '../types/baseball';
import { RARITY_BUDGET, ALL_SKILLS, getPitcherKmh } from '../utils/playerGenerator';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Crown,
  FileCheck2,
  X,
  FastForward,
  RotateCcw,
  Sliders,
  Check,
  Award,
  Zap,
  Shield,
  Plus,
  Minus,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  scoutType: 'pitcher' | 'fielder';
  isSSR: boolean;
  player: Player | null;
  team: Team;
  onConfirmSign: (player: Player) => void;
  onSignAndScoutAgain: (player: Player, type: 'pitcher' | 'fielder', isSSR: boolean) => void;
  onClose: () => void;
}

export const ScoutCutsceneModal: React.FC<Props> = ({
  isOpen,
  scoutType,
  isSSR,
  player,
  team,
  onConfirmSign,
  onSignAndScoutAgain,
  onClose,
}) => {
  const [phase, setPhase] = useState<'negotiating' | 'revealed'>('negotiating');
  const [customName, setCustomName] = useState('');
  const [customStats, setCustomStats] = useState({ s1: 4, s2: 4, s3: 4, s4: 4 });
  const [isSignedEffect, setIsSignedEffect] = useState(false);

  // 選手データが新しく来たら初期化
  useEffect(() => {
    if (player) {
      setCustomName(player.name);
      if (player.position === '投') {
        setCustomStats({
          s1: player.stats.pitcher?.speed || 4,
          s2: player.stats.pitcher?.control || 4,
          s3: player.stats.pitcher?.stamina || 4,
          s4: player.stats.pitcher?.breaking || 4,
        });
      } else {
        setCustomStats({
          s1: player.stats.fielder?.meet || 4,
          s2: player.stats.fielder?.power || 4,
          s3: player.stats.fielder?.speed || 4,
          s4: player.stats.fielder?.defense || 4,
        });
      }
      setPhase('negotiating');
      setIsSignedEffect(false);

      // 自動で一定時間後に開封（演出時間：1.4秒）
      const timer = setTimeout(() => {
        handleTriggerReveal(player);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [player]);

  if (!isOpen || !player) return null;

  const maxBudget = RARITY_BUDGET[player.rarity]?.budget || 16;
  const currentTotal = customStats.s1 + customStats.s2 + customStats.s3 + customStats.s4;
  const isOverBudget = currentTotal > maxBudget;
  const isPitcher = player.position === '投';

  // 開封演出トリガー
  const handleTriggerReveal = (targetPlayer: Player) => {
    setPhase('revealed');

    if (targetPlayer.rarity === '伝説ユニーク') {
      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#38BDF8', '#F43F5E', '#FBBF24', '#A855F7', '#34D399'],
      });
      soundFx.playVictory();
    } else if (targetPlayer.rarity === 'UR') {
      confetti({
        particleCount: 95,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#FBBF24', '#FFFFFF'],
      });
      soundFx.playHomeRun();
    } else if (targetPlayer.rarity === 'SSR') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FBBF24', '#F59E0B', '#FDE68A'],
      });
      soundFx.playScore();
    } else {
      soundFx.playBatHit(true);
    }
  };

  // スキップ
  const handleSkip = () => {
    handleTriggerReveal(player);
  };

  // ステータス調整
  const handleUpdateStat = (key: 's1' | 's2' | 's3' | 's4', newVal: number) => {
    const clamped = Math.max(1, Math.min(10, newVal));
    setCustomStats(prev => ({ ...prev, [key]: clamped }));
  };

  const handleRandomizeStats = () => {
    const budget = maxBudget;
    const vals = [1, 1, 1, 1];
    let remaining = budget - 4;
    while (remaining > 0) {
      const idx = Math.floor(Math.random() * 4);
      if (vals[idx] < 10) {
        vals[idx] += 1;
        remaining -= 1;
      }
    }
    setCustomStats({ s1: vals[0], s2: vals[1], s3: vals[2], s4: vals[3] });
  };

  const handleEqualizeStats = () => {
    const budget = maxBudget;
    const base = Math.floor(budget / 4);
    const rem = budget % 4;
    const vals = [base, base, base, base];
    for (let i = 0; i < rem; i++) {
      vals[i] += 1;
    }
    setCustomStats({
      s1: Math.min(10, vals[0]),
      s2: Math.min(10, vals[1]),
      s3: Math.min(10, vals[2]),
      s4: Math.min(10, vals[3]),
    });
  };

  // 契約成立処理
  const getFinalPlayer = (): Player => {
    const updatedStats = isPitcher
      ? {
          pitcher: {
            speed: customStats.s1,
            control: customStats.s2,
            stamina: customStats.s3,
            breaking: customStats.s4,
          },
        }
      : {
          fielder: {
            meet: customStats.s1,
            power: customStats.s2,
            speed: customStats.s3,
            defense: customStats.s4,
            trajectory: player.stats.fielder?.trajectory ?? 2,
          },
        };

    return {
      ...player,
      name: customName.trim() || player.name,
      stats: updatedStats,
    };
  };

  const handleSign = () => {
    if (isOverBudget) return;
    setIsSignedEffect(true);
    soundFx.playScore();
    const finalP = getFinalPlayer();
    setTimeout(() => {
      onConfirmSign(finalP);
    }, 450);
  };

  // もう一度スカウト可能かチェック
  const cost = isSSR ? 20000 : 1000;
  const hasTicket = !isSSR && (scoutType === 'pitcher' ? team.pitcherScoutTickets > 0 : team.fielderScoutTickets > 0);
  const canScoutAgain = hasTicket || team.gerda >= cost;

  const handleScoutAgainClick = () => {
    if (isOverBudget || !canScoutAgain || isSignedEffect) return;
    setIsSignedEffect(true);
    soundFx.playScore();
    const finalP = getFinalPlayer();
    onSignAndScoutAgain(finalP, scoutType, isSSR);
  };

  // グレード評価文字
  const getGrade = (val: number) => {
    if (val >= 9) return { letter: 'S', color: 'text-cyan-400 border-cyan-400 bg-cyan-950/60' };
    if (val === 8) return { letter: 'A', color: 'text-rose-400 border-rose-400 bg-rose-950/60' };
    if (val === 7) return { letter: 'B', color: 'text-amber-400 border-amber-400 bg-amber-950/60' };
    if (val === 6) return { letter: 'C', color: 'text-emerald-400 border-emerald-400 bg-emerald-950/60' };
    if (val === 5) return { letter: 'D', color: 'text-blue-400 border-blue-400 bg-blue-950/60' };
    if (val === 4) return { letter: 'E', color: 'text-slate-300 border-slate-500 bg-slate-800' };
    return { letter: 'F', color: 'text-slate-400 border-slate-600 bg-slate-800/60' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* 背景の光彩エフェクト */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        {isSSR || player.rarity === '伝説ユニーク' || player.rarity === 'UR' ? (
          <>
            <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-500/15 via-rose-500/15 to-cyan-500/15 blur-3xl animate-pulse" />
            <div className="absolute w-[350px] h-[350px] rounded-full bg-amber-400/20 blur-2xl animate-spin" style={{ animationDuration: '12s' }} />
          </>
        ) : (
          <div className="w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-3xl" />
        )}
      </div>

      {/* スキップボタン / 閉じるボタン（右上） */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {phase === 'negotiating' && (
          <button
            onClick={handleSkip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 transition-colors shadow-lg"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>スキップ</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* PHASE 1: 交渉・視察シークエンス (Cutscene Buildup) */}
      {/* ============================================================== */}
      {phase === 'negotiating' && (
        <div className="relative max-w-sm w-full text-center space-y-6 z-10 p-6">
          {/* 上部バナー */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-black shadow-md bg-slate-900/90 border-amber-400/50 text-amber-300">
            {isSSR ? (
              <>
                <Crown className="w-4 h-4 text-amber-400 animate-bounce" />
                <span>極・名門スカウト発動</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>全国ドラフト特選スカウト視察中</span>
              </>
            )}
          </div>

          {/* ドラフト契約書・封筒のビジュアル */}
          <div
            onClick={() => handleTriggerReveal(player)}
            className="cursor-pointer group relative mx-auto w-56 h-72 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 transition-all duration-300 transform group-hover:scale-105 flex flex-col items-center justify-between p-6 shadow-2xl"
            style={{
              borderColor: isSSR ? '#F59E0B' : '#0284C7',
              boxShadow: isSSR ? '0 0 35px rgba(245, 158, 11, 0.35)' : '0 0 25px rgba(2, 132, 199, 0.25)',
            }}
          >
            {/* 封筒の飾りスタンプ */}
            <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-400/80 flex items-center justify-center shadow-inner">
              {isSSR ? (
                <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
              ) : (
                <Award className="w-8 h-8 text-cyan-400 animate-pulse" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase block">
                SCOUT DOSSIER
              </span>
              <p className="text-base font-black text-slate-100 font-['M_PLUS_Rounded_1c']">
                {isSSR ? '特A級 独占交渉契約書' : '公式スカウトレポート'}
              </p>
              <span className="text-[10px] text-amber-300 font-mono block">
                ポジション: {scoutType === 'pitcher' ? '投手' : '野手'}
              </span>
            </div>

            {/* 開封プログレス */}
            <div className="w-full space-y-1">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-rose-400 animate-[pulse_1s_infinite] w-full" />
              </div>
              <span className="text-[9px] text-slate-400 font-mono">タップして即時開封</span>
            </div>
          </div>

          {/* メッセージ */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white font-['M_PLUS_Rounded_1c']">
              {isSSR ? 'ドラフト超一流の怪物を視察中…！' : '全国の有望選手と接触中…'}
            </h3>
            <p className="text-xs text-slate-400">
              {isSSR
                ? 'SSR・UR・伝説ユニークのみ厳選抽出された特別スカウトです。'
                : 'スカウト陣からの最終レポートが届き次第、獲得選手が判明します。'}
            </p>
          </div>

          <button
            onClick={() => handleTriggerReveal(player)}
            className="w-full py-3 px-4 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-600 shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>契約書を開封する</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* PHASE 2: 衝撃の獲得発表＆入団交渉 (Revealed Baseball Card) */}
      {/* ============================================================== */}
      {phase === 'revealed' && (
        <div className="relative max-w-md w-full z-10 animate-fade-in my-auto">
          {/* レアリティインパクトバナー */}
          <div className="text-center mb-3 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-700 shadow-lg text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-300">スカウト獲得成功！</span>
            </div>
            <h2
              className={`text-2xl font-black font-['M_PLUS_Rounded_1c'] drop-shadow-md ${
                player.rarity === '伝説ユニーク'
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 animate-pulse'
                  : player.rarity === 'UR'
                  ? 'text-rose-400'
                  : player.rarity === 'SSR'
                  ? 'text-amber-400'
                  : player.rarity === 'SR'
                  ? 'text-emerald-400'
                  : 'text-blue-400'
              }`}
            >
              ★ {player.rarity} 選手獲得！ ★
            </h2>
          </div>

          {/* ベースボールカード本体 */}
          <div
            className={`rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 border-2 transition-all bg-slate-900 ${
              player.rarity === '伝説ユニーク'
                ? 'border-cyan-400/80 shadow-[0_0_40px_rgba(56,189,248,0.3)] bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900'
                : player.rarity === 'UR'
                ? 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.3)]'
                : player.rarity === 'SSR'
                ? 'border-amber-400/80 shadow-[0_0_30px_rgba(251,191,36,0.25)]'
                : 'border-slate-800'
            }`}
          >
            {/* カード上部：背番号・ポジション・利き腕・レアリティ */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex flex-col items-center justify-center font-bold shadow-inner">
                  <span className="text-[9px] text-amber-400 font-mono">#{player.number}</span>
                  <span className="text-sm font-black text-white">{isPitcher ? '投' : '野'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="font-bold">{isPitcher ? '投手' : '野手'}</span>
                    <span>·</span>
                    <span className="font-mono text-slate-400">
                      {player.throwingHand}{player.battingHand}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    プロ1年目 · ドラフト特選
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-2.5 py-0.5 rounded text-xs font-black border ${RARITY_BUDGET[player.rarity].color}`}>
                  {player.rarity}
                </span>
                <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                  能力枠: {maxBudget}pt
                </span>
              </div>
            </div>

            {/* 選手名 命名フィールド */}
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-1">
              <label className="text-[10px] text-slate-400 flex items-center justify-between">
                <span className="font-bold text-amber-300 flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>選手名:</span>
                </span>
                <span className="text-[9px] text-slate-500">※加入後は改名手形が必要</span>
              </label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                maxLength={10}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                placeholder="選手名を入力"
              />
            </div>

            {/* 能力パラメータマトリクス */}
            <div className="space-y-2.5 bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  <span>能力パラメータ配分</span>
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isOverBudget ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    合計 {currentTotal} / {maxBudget} pt
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleRandomizeStats}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>おまかせ</span>
                    </button>
                    <button
                      onClick={handleEqualizeStats}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      均等
                    </button>
                  </div>
                </div>
              </div>

              {/* パラメータスライダー・数値 */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {isPitcher ? (
                  <>
                    {/* 球速 */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">球速</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s1).color}`}>
                            {getGrade(customStats.s1).letter}
                          </span>
                          <span className="font-mono font-bold text-amber-300">
                            {getPitcherKmh(customStats.s1)} km/h
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s1', customStats.s1 - 1)}
                          disabled={customStats.s1 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${(customStats.s1 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s1', customStats.s1 + 1)}
                          disabled={customStats.s1 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 制球 */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">制球</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s2).color}`}>
                            {getGrade(customStats.s2).letter}
                          </span>
                          <span className="font-mono font-bold text-white">{customStats.s2}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s2', customStats.s2 - 1)}
                          disabled={customStats.s2 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${(customStats.s2 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s2', customStats.s2 + 1)}
                          disabled={customStats.s2 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* スタミナ */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">スタミナ</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s3).color}`}>
                            {getGrade(customStats.s3).letter}
                          </span>
                          <span className="font-mono font-bold text-white">{customStats.s3}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s3', customStats.s3 - 1)}
                          disabled={customStats.s3 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${(customStats.s3 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s3', customStats.s3 + 1)}
                          disabled={customStats.s3 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 変化球 */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">変化球</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s4).color}`}>
                            {getGrade(customStats.s4).letter}
                          </span>
                          <span className="font-mono font-bold text-white">{customStats.s4}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s4', customStats.s4 - 1)}
                          disabled={customStats.s4 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-400 rounded-full"
                            style={{ width: `${(customStats.s4 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s4', customStats.s4 + 1)}
                          disabled={customStats.s4 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* ミート */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">ミート</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s1).color}`}>
                            {getGrade(customStats.s1).letter}
                          </span>
                          <span className="font-mono font-bold text-white">{customStats.s1}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s1', customStats.s1 - 1)}
                          disabled={customStats.s1 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${(customStats.s1 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s1', customStats.s1 + 1)}
                          disabled={customStats.s1 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* パワー */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">パワー</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s2).color}`}>
                            {getGrade(customStats.s2).letter}
                          </span>
                          <span className="font-mono font-bold text-white">{customStats.s2}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s2', customStats.s2 - 1)}
                          disabled={customStats.s2 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-400 rounded-full"
                            style={{ width: `${(customStats.s2 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s2', customStats.s2 + 1)}
                          disabled={customStats.s2 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 走力 */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">走力</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s3).color}`}>
                            {getGrade(customStats.s3).letter}
                          </span>
                          <span className="font-mono font-bold text-white">{customStats.s3}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s3', customStats.s3 - 1)}
                          disabled={customStats.s3 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-400 rounded-full"
                            style={{ width: `${(customStats.s3 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s3', customStats.s3 + 1)}
                          disabled={customStats.s3 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 守備 */}
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">守備</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] px-1 rounded font-bold border ${getGrade(customStats.s4).color}`}>
                            {getGrade(customStats.s4).letter}
                          </span>
                          <span className="font-mono font-bold text-white">{customStats.s4}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateStat('s4', customStats.s4 - 1)}
                          disabled={customStats.s4 <= 1}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full"
                            style={{ width: `${(customStats.s4 / 10) * 100}%` }}
                          />
                        </div>
                        <button
                          onClick={() => handleUpdateStat('s4', customStats.s4 + 1)}
                          disabled={customStats.s4 >= 10 || currentTotal >= maxBudget}
                          className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 flex items-center justify-center font-bold text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 野手の弾道表示 */}
              {!isPitcher && player.stats.fielder?.trajectory && (
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80 px-1">
                  <span>弾道</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map(t => (
                      <span
                        key={t}
                        className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center font-mono ${
                          t <= (player.stats.fielder?.trajectory || 2)
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* スキル・特殊能力 */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>習得スキル</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  スロット枠: {player.skillSlots}枠
                </span>
              </div>
              {player.skills.length === 0 ? (
                <span className="text-[10px] text-slate-500 block">習得スキルなし</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {player.skills.map(skId => {
                    const skDef = ALL_SKILLS.find(s => s.id === skId);
                    return (
                      <div
                        key={skId}
                        className="px-2 py-1 rounded bg-slate-900 border border-amber-400/30 text-[10px] flex items-center gap-1 shadow-sm"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-400" />
                        <span className="font-bold text-amber-300">{skDef?.name || skId}</span>
                        <span className="text-[9px] text-slate-400">({skDef?.description})</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* アクションボタン */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleSign}
                disabled={isOverBudget || isSignedEffect}
                className="w-full py-3 px-4 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-emerald-500 shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                <span>{isSignedEffect ? '正式契約成立中…！' : 'この選手と正式契約を結ぶ'}</span>
              </button>

              <div className="flex items-center gap-2">
                {canScoutAgain && (
                  <button
                    onClick={handleScoutAgainClick}
                    disabled={isOverBudget || isSignedEffect}
                    className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>{isSignedEffect ? '入団処理中…' : '入団させて続けてスカウト'}</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  disabled={isSignedEffect}
                  className={`${canScoutAgain ? 'py-2.5 px-3' : 'w-full py-2.5 px-3'} rounded-xl text-xs font-bold text-slate-400 hover:text-rose-300 hover:border-rose-500/40 bg-slate-950 border border-slate-800 transition-colors flex items-center justify-center gap-1`}
                >
                  <X className="w-3.5 h-3.5" />
                  <span>契約しない</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
