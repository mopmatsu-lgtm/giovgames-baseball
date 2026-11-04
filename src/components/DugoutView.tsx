import React, { useState } from 'react';
import { Team, Player, Position, EquipmentItem, SkillId } from '../types/baseball';
import { RARITY_BUDGET, ALL_SKILLS, getPitcherKmh } from '../utils/playerGenerator';
import { formatInningsPitched } from '../utils/matchEngine';
import { soundFx } from '../utils/audio';
import { ArrowUp, ArrowDown, Shield, Users, Sliders, ChevronRight, Zap, Award, History, LayoutGrid, MapPin } from 'lucide-react';
import { TacticalFieldView } from './TacticalFieldView';

interface Props {
  team: Team;
  onUpdateTeam: (updated: Team) => void;
  onSelectPlayer: (player: Player) => void;
  onOpenActivityLog?: () => void;
}

export const DugoutView: React.FC<Props> = ({ team, onUpdateTeam, onSelectPlayer, onOpenActivityLog }) => {
  const [subTab, setSubTab] = useState<'lineup' | 'pitchers' | 'tactics'>('lineup');
  const [lineupViewMode, setLineupViewMode] = useState<'list' | 'field'>('list');
  const [swapTargetIdx, setSwapTargetIdx] = useState<number | null>(null);

  const fieldingPositions: { value: Position; label: string }[] = [
    { value: '捕', label: '捕' },
    { value: '一', label: '一' },
    { value: '二', label: '二' },
    { value: '三', label: '三' },
    { value: '遊', label: '遊' },
    { value: '左', label: '左' },
    { value: '中', label: '中' },
    { value: '右', label: '右' },
    { value: '指', label: '指' },
    { value: '投', label: '投' },
  ];
  const DEFAULT_LINEUP_POSITIONS: Position[] = ['捕', '一', '二', '三', '遊', '左', '中', '右', '指'];

  const getCleanLineupPositions = (): Position[] => {
    if (team.lineupPositions && team.lineupPositions.length === 9) {
      return [...team.lineupPositions];
    }
    return [...DEFAULT_LINEUP_POSITIONS];
  };

  // 打順入替
  const handleMoveOrder = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= 9) return;
    const newLineup = [...team.lineup];
    const newPositions = getCleanLineupPositions();

    const tempP = newLineup[fromIdx];
    newLineup[fromIdx] = newLineup[toIdx];
    newLineup[toIdx] = tempP;

    const tempPos = newPositions[fromIdx];
    newPositions[fromIdx] = newPositions[toIdx];
    newPositions[toIdx] = tempPos;

    onUpdateTeam({
      ...team,
      lineup: newLineup,
      lineupPositions: newPositions,
    });
  };

  // 守備位置変更 (野手はどこでも守備可能)
  const handleChangePosition = (idx: number, pos: Position) => {
    const newPositions = getCleanLineupPositions();
    newPositions[idx] = pos;
    onUpdateTeam({
      ...team,
      lineupPositions: newPositions,
    });
  };

  // ベンチ選手とスタメン交代 (どの野手でもどこでも守らせられる)
  const handleSwapWithBench = (lineupIdx: number, benchPlayerId: string) => {
    const newLineup = [...team.lineup];
    newLineup[lineupIdx] = benchPlayerId;
    const newPositions = getCleanLineupPositions();
    const nextBenchFielders = (team.benchFielders || []).filter(id => id !== benchPlayerId);
    onUpdateTeam({
      ...team,
      lineup: newLineup,
      lineupPositions: newPositions,
      benchFielders: nextBenchFielders,
    });
    setSwapTargetIdx(null);
  };

  // ベンチ入り控え野手（最大5名）の登録・解除トグル
  const handleToggleBenchFielder = (fielderId: string) => {
    const current = team.benchFielders ? [...team.benchFielders] : [];
    let next: string[];
    if (current.includes(fielderId)) {
      next = current.filter(id => id !== fielderId);
      soundFx.playOut();
    } else {
      if (current.length >= 5) return;
      next = [...current, fielderId];
      soundFx.playScore();
    }
    onUpdateTeam({
      ...team,
      benchFielders: next,
    });
  };

  // 先発ローテーション枠（第一先発、第二先発、第三先発）の設定
  const handleSetRotationSlot = (slotIdx: number, pitcherId: string) => {
    const currentRot = [...(team.pitcherRotation || [])];
    while (currentRot.length < 3) {
      currentRot.push('');
    }
    // もし別の枠にすでにいる場合は入替
    const existingIdx = currentRot.indexOf(pitcherId);
    if (existingIdx !== -1 && existingIdx !== slotIdx) {
      currentRot[existingIdx] = currentRot[slotIdx] || '';
    }
    currentRot[slotIdx] = pitcherId;
    const cleanRot = currentRot.filter(Boolean);

    const newBullpen = team.bullpen.filter(id => id !== pitcherId);
    const newCloser = team.closerId === pitcherId ? '' : team.closerId;

    onUpdateTeam({
      ...team,
      pitcherRotation: cleanRot,
      bullpen: newBullpen,
      closerId: newCloser,
    });
  };

  // 抑え役割変更
  const handleSetCloser = (id: string) => {
    const newBullpen = team.bullpen.filter(pId => pId !== id);
    const newRot = team.pitcherRotation.filter(pId => pId !== id);
    onUpdateTeam({
      ...team,
      closerId: id,
      bullpen: newBullpen,
      pitcherRotation: newRot,
    });
  };

  // 中継ぎ登録・解除トグル
  const handleToggleBullpen = (pitcherId: string) => {
    let newBullpen = [...team.bullpen];
    let newRot = [...team.pitcherRotation];
    if (newBullpen.includes(pitcherId)) {
      newBullpen = newBullpen.filter(id => id !== pitcherId);
    } else {
      newBullpen.push(pitcherId);
      newRot = newRot.filter(id => id !== pitcherId);
    }
    const newCloser = team.closerId === pitcherId ? '' : team.closerId;
    onUpdateTeam({
      ...team,
      bullpen: newBullpen,
      pitcherRotation: newRot,
      closerId: newCloser,
    });
  };

  // 疲労度バッジ表示（省スペース・はみ出し防止対応）
  const renderFatigueBadge = (p: Player) => {
    const rest = p.restGamesRemaining ?? 0;
    if (rest === 0) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span>⚡</span>
          <span>万全</span>
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 animate-pulse shrink-0 whitespace-nowrap">
        <span>💤</span>
        <span>休養(残{rest}試合)</span>
      </span>
    );
  };

  const benchPlayers = team.roster.filter(p => !team.lineup.includes(p.id));
  const nonStarterFielders = team.roster.filter(p => p.position !== '投' && !team.lineup.includes(p.id));
  const nonStarterPitchers = team.roster.filter(p => p.position === '投' && !team.pitcherRotation.includes(p.id) && !team.bullpen.includes(p.id) && p.id !== team.closerId);

  return (
    <div className="space-y-4 max-w-md w-full mx-auto pb-24 overflow-x-hidden">
      {/* 最近の球団活動ログ概要カード */}
      {team.activityLogs && team.activityLogs.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>球団活動・獲得ログ</span>
            </div>
            {onOpenActivityLog && (
              <button
                onClick={onOpenActivityLog}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-0.5 transition-colors shrink-0"
              >
                <span>全履歴 ({team.activityLogs.length}件)</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {team.activityLogs.slice(0, 2).map(log => (
              <div
                key={log.id}
                onClick={onOpenActivityLog}
                className="bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2 text-[11px] cursor-pointer hover:border-slate-700 transition-colors"
              >
                <span className="text-slate-300 truncate flex-1 min-w-0 font-medium">
                  {log.message}
                </span>
                <span className="text-[9px] text-slate-500 font-mono shrink-0">
                  {log.timestampLabel || '最近'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dugout Segmented Switcher */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
        <button
          onClick={() => setSubTab('lineup')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            subTab === 'lineup' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          スタメン打順
        </button>
        <button
          onClick={() => setSubTab('pitchers')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            subTab === 'pitchers' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          投手管理
        </button>
        <button
          onClick={() => setSubTab('tactics')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            subTab === 'tactics' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          作戦方針
        </button>
      </div>

      {/* 1. Lineup Tab */}
      {subTab === 'lineup' && (
        <div className="space-y-4">
          {/* 先発ローテーション枠 (第一先発・第二先発・第三先発) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>先発ローテーション陣</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-bold">登板後2試合休養</span>
            </div>

            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-[10px] text-cyan-300 leading-relaxed">
              先発投手は1試合登板すると疲労により<strong>登板後2試合は休養</strong>となります。第一〜第三先発の3枠に投手を配置し、万全な状態でローテーションを回しましょう！
            </div>

            {(() => {
              const allPitchers = team.roster.filter(p => p.position === '投');
              const rotationSlots = [
                { label: '第一先発', color: 'border-amber-400 text-amber-300', bg: 'bg-amber-950/40' },
                { label: '第二先発', color: 'border-cyan-400 text-cyan-300', bg: 'bg-cyan-950/40' },
                { label: '第三先発', color: 'border-purple-400 text-purple-300', bg: 'bg-purple-950/40' },
              ];

              return (
                <div className="space-y-3">
                  {rotationSlots.map((slot, sIdx) => {
                    const pId = team.pitcherRotation[sIdx] || allPitchers[sIdx]?.id;
                    const pitcher = team.roster.find(p => p.id === pId) || allPitchers[sIdx];

                    return (
                      <div key={sIdx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${slot.color} ${slot.bg}`}>
                            {slot.label}
                          </span>
                          {pitcher ? renderFatigueBadge(pitcher) : <span className="text-[10px] text-slate-500">未設定</span>}
                        </div>

                        {pitcher ? (
                          <div
                            onClick={() => onSelectPlayer(pitcher)}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                              <span className="text-[10px] font-mono font-bold text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                #{pitcher.number}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-bold text-slate-100 text-xs truncate">{pitcher.name}</span>
                                  <span className={`text-[9px] px-1 rounded font-bold border shrink-0 ${RARITY_BUDGET[pitcher.rarity].color}`}>
                                    {pitcher.rarity}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">
                                  最速{getPitcherKmh(pitcher.stats.pitcher?.speed || 5)}km · 制{pitcher.stats.pitcher?.control} · 変{pitcher.stats.pitcher?.breaking} · ス{pitcher.stats.pitcher?.stamina}
                                </span>
                              </div>
                            </div>
                            <div className="text-right font-mono text-xs shrink-0 pl-1">
                              <span className="font-bold text-cyan-400 block whitespace-nowrap">{pitcher.record.wins}勝{pitcher.record.losses}敗</span>
                              <span className="text-[10px] text-slate-400 block whitespace-nowrap">
                                防 {(() => {
                                  const outs = pitcher.record.outsPitched ?? Math.round((pitcher.record.inningsPitched || 0) * 3);
                                  return outs > 0 ? ((pitcher.record.earnedRuns * 27) / outs).toFixed(2) : '0.00';
                                })()}
                              </span>
                              <span className="text-[9px] text-slate-500 block whitespace-nowrap">
                                {formatInningsPitched(pitcher.record)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 py-1">投手が指名されていません</p>
                        )}

                        {/* ローテ枠の指名セレクト */}
                        <div className="flex items-center justify-between gap-2 text-xs pt-0.5">
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">{slot.label}指名:</span>
                          <select
                            value={pitcher?.id || ''}
                            onChange={e => handleSetRotationSlot(sIdx, e.target.value)}
                            className="flex-1 min-w-0 w-full bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none truncate"
                          >
                            <option value="">投手を選択</option>
                            {allPitchers.map(p => {
                              const rest = p.restGamesRemaining ?? 0;
                              const statusText = rest > 0 ? `(休養残${rest})` : '(万全)';
                              return (
                                <option key={p.id} value={p.id}>
                                  #{p.number} {p.name} {statusText} [{p.rarity} · {getPitcherKmh(p.stats.pitcher?.speed || 5)}km]
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })}

                  {/* 救援陣・守護神のミニステータス */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">中継ぎ: <strong className="text-cyan-400">{team.bullpen.length}名</strong></span>
                      <span className="text-[10px] text-slate-400">抑え: <strong className="text-rose-400">{team.roster.find(p => p.id === team.closerId)?.name || '未指名'}</strong></span>
                    </div>
                    <button
                      onClick={() => setSubTab('pitchers')}
                      className="text-[10px] text-amber-400 hover:underline font-bold"
                    >
                      救援陣の変更 ➔
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">スターティングメンバー (1〜9番)</span>
              {/* List vs Ground Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setLineupViewMode('list')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    lineupViewMode === 'list' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  打順リスト
                </button>
                <button
                  type="button"
                  onClick={() => setLineupViewMode('field')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    lineupViewMode === 'field' ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  守備グラウンド
                </button>
              </div>
            </div>

            {lineupViewMode === 'field' ? (
              <TacticalFieldView
                team={team}
                onSelectPlayer={onSelectPlayer}
                onChangePosition={handleChangePosition}
              />
            ) : (
              <>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 flex items-start gap-2">
                  <span className="shrink-0 font-bold">⚡ 野手全適性:</span>
                  <span className="text-slate-300 text-[10px] leading-relaxed">
                    野手は全ポジションを守備可能！各打順の守備位置（捕・一・二・三・遊・外・指など）を自由に設定できます。
                  </span>
                </div>

            {team.lineup.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                スタメンが設定されていません。スカウトで選手を獲得してください。
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {team.lineup.map((pId, idx) => {
                  const player = team.roster.find(p => p.id === pId);
                  if (!player) return null;
                  const currentPos = team.lineupPositions?.[idx];
                  const pos = (currentPos && currentPos !== '野' && currentPos !== '野手')
                    ? currentPos
                    : (DEFAULT_LINEUP_POSITIONS[idx] || '指');

                  return (
                    <div key={player.id} className="py-2.5 flex items-center justify-between gap-2">
                      {/* Order and Pos */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <select
                          value={pos}
                          onChange={e => handleChangePosition(idx, e.target.value as Position)}
                          title="守備位置を変更"
                          className="bg-slate-950 border border-slate-700 hover:border-amber-400 rounded px-1.5 py-0.5 text-[11px] font-bold text-amber-300 cursor-pointer focus:outline-none"
                        >
                          {fieldingPositions.map(fp => (
                            <option key={fp.value} value={fp.value}>{fp.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Player Profile */}
                      <div
                        onClick={() => onSelectPlayer(player)}
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer overflow-hidden"
                      >
                        <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-slate-900 px-1 py-0.5 rounded border border-slate-800 shrink-0">
                          #{player.number}
                        </span>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="font-bold text-slate-100 text-xs truncate hover:text-amber-400">
                              {player.name}
                            </span>
                            <span className={`text-[9px] px-1 rounded font-bold border shrink-0 ${RARITY_BUDGET[player.rarity].color}`}>
                              {player.rarity}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {player.position === '投' ? (
                              <span>最速{getPitcherKmh(player.stats.pitcher?.speed || 5)}km</span>
                            ) : (
                              <span>弾:{player.stats.fielder?.trajectory ?? 2} 巧:{player.stats.fielder?.meet} 長:{player.stats.fielder?.power} 走:{player.stats.fielder?.speed} 守:{player.stats.fielder?.defense}</span>
                            )}
                            {player.equipment && (
                              <span className="text-amber-300 ml-1">[{player.equipment.name.slice(0, 4)}]</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls (Move Up/Down / Swap) */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleMoveOrder(idx, idx - 1)}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, idx + 1)}
                          disabled={idx === 8}
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-20 hover:bg-slate-800"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSwapTargetIdx(swapTargetIdx === idx ? null : idx)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            swapTargetIdx === idx ? 'bg-amber-400 text-slate-950 border-amber-400' : 'border-slate-700 text-slate-400'
                          }`}
                        >
                          入替
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </div>

          {/* ベンチ入り野手登録 (最大5名 / 代打・守備固め用) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs text-slate-100">
                  ベンチ入り野手（代打・守備固め枠）
                </span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                (team.benchFielders?.length || 0) > 0
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                登録: {team.benchFielders?.length || 0} / 5名
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300 leading-relaxed">
              スタメン外の野手から<strong>最大5人まで</strong>ベンチ入り選手を登録できます（0名でも試合進行可能）。登録選手は試合終盤に<strong>代打や守備固め</strong>として途中出場します！
            </div>

            {/* 登録スロット 5枠 */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-slate-400">現在登録中のベンチ野手 (最大5名)</div>
              {Array.from({ length: 5 }).map((_, slotIdx) => {
                const pId = team.benchFielders?.[slotIdx];
                const p = pId ? team.roster.find(pl => pl.id === pId) : null;

                if (!p) {
                  return (
                    <div
                      key={slotIdx}
                      className="p-2 rounded-xl bg-slate-950/40 border border-dashed border-slate-800/80 flex items-center justify-between text-xs text-slate-500"
                    >
                      <span className="text-[10px] font-mono">枠{slotIdx + 1}: 空き枠（未指名）</span>
                      <span className="text-[9px] text-slate-600">※未登録でも進行可能</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={p.id}
                    className="p-2 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between text-xs transition-colors"
                  >
                    <div
                      onClick={() => onSelectPlayer(p)}
                      className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer overflow-hidden"
                    >
                      <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-amber-600/50">
                        {slotIdx + 1}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-slate-900 px-1 py-0.5 rounded border border-slate-800 shrink-0">
                        #{p.number}
                      </span>
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-bold text-slate-100 hover:text-amber-400 mr-1.5">
                          {p.name}
                        </span>
                        <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {p.rarity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">
                          巧:{p.stats.fielder?.meet} 長:{p.stats.fielder?.power} 守:{p.stats.fielder?.defense}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBenchFielder(p.id)}
                      className="ml-2 px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-[10px] font-bold shrink-0 transition-colors"
                    >
                      解除
                    </button>
                  </div>
                );
              })}
            </div>

            {/* スタメン外の控え野手一覧 (登録候補) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 text-[11px]">
                  スタメン外の野手一覧 ({nonStarterFielders.length}名)
                </span>
                {swapTargetIdx !== null && (
                  <span className="text-amber-400 text-[10px] font-bold truncate">
                    {swapTargetIdx + 1}番スタメンと交代
                  </span>
                )}
              </div>

              {nonStarterFielders.length === 0 ? (
                <p className="text-[11px] text-slate-500 py-2 text-center">
                  控え野手はいません。スカウトで野手を獲得するとベンチ入り枠に登録できます。
                </p>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {nonStarterFielders.map(p => {
                    const isBench = (team.benchFielders || []).includes(p.id);
                    const canAdd = (team.benchFielders?.length || 0) < 5;

                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors gap-2 ${
                          swapTargetIdx !== null
                            ? 'bg-amber-400/10 border-amber-400/50 hover:bg-amber-400/20 cursor-pointer'
                            : isBench
                            ? 'bg-slate-950/90 border-amber-500/40'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (swapTargetIdx !== null) handleSwapWithBench(swapTargetIdx, p.id);
                            else onSelectPlayer(p);
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer overflow-hidden"
                        >
                          <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-slate-900 px-1 py-0.5 rounded border border-slate-800 shrink-0">
                            #{p.number}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-slate-100 truncate hover:text-amber-400">
                                {p.name}
                              </span>
                              <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                                {p.rarity}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              巧:{p.stats.fielder?.meet} 長:{p.stats.fielder?.power} 走:{p.stats.fielder?.speed} 守:{p.stats.fielder?.defense}
                              {p.skills.length > 0 && (
                                <span className="text-amber-300 ml-1.5">[{p.skills[0]}]</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {swapTargetIdx !== null ? (
                          <button
                            onClick={() => handleSwapWithBench(swapTargetIdx, p.id)}
                            className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] shrink-0"
                          >
                            スタメン入替
                          </button>
                        ) : isBench ? (
                          <button
                            onClick={() => handleToggleBenchFielder(p.id)}
                            className="px-2 py-1 rounded bg-amber-950 text-amber-300 border border-amber-600/50 text-[10px] font-bold shrink-0 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 transition-colors"
                          >
                            ベンチ入中
                          </button>
                        ) : (
                          <button
                            disabled={!canAdd}
                            onClick={() => handleToggleBenchFielder(p.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 transition-colors ${
                              canAdd
                                ? 'bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-slate-200 border border-slate-700'
                                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                            }`}
                          >
                            {canAdd ? '+ ベンチ入' : '満員(5名)'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Pitchers Tab */}
      {subTab === 'pitchers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-slate-200">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>投手陣・ベンチ入り配置管理</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              投手: {team.roster.filter(p => p.position === '投').length}名
            </span>
          </div>

          {/* 1. 先発ローテーション編成 (第一先発、第二先発、第三先発) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>先発ローテーション編成 (第一先発・第二先発・第三先発)</span>
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold">登板後2試合休養</span>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              先発投手はマウンドに上がると疲労が蓄積し、<strong>登板後二試合は休養期間</strong>となります。第一〜第三先発の3枠を組むことで、毎試合万全な投手を先発させることができます。
            </p>

            {(() => {
              const allPitchers = team.roster.filter(p => p.position === '投');
              const rotationSlots = [
                { label: '第一先発', color: 'border-amber-400 text-amber-300', bg: 'bg-amber-950/40' },
                { label: '第二先発', color: 'border-cyan-400 text-cyan-300', bg: 'bg-cyan-950/40' },
                { label: '第三先発', color: 'border-purple-400 text-purple-300', bg: 'bg-purple-950/40' },
              ];

              return (
                <div className="space-y-3">
                  {rotationSlots.map((slot, sIdx) => {
                    const pId = team.pitcherRotation[sIdx] || allPitchers[sIdx]?.id;
                    const starter = team.roster.find(p => p.id === pId) || allPitchers[sIdx];
                    const outs = starter ? (starter.record.outsPitched ?? Math.round((starter.record.inningsPitched || 0) * 3)) : 0;
                    const era = outs > 0 ? ((starter!.record.earnedRuns * 27) / outs).toFixed(2) : '0.00';

                    return (
                      <div key={sIdx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${slot.color} ${slot.bg}`}>
                            {slot.label}
                          </span>
                          {starter ? renderFatigueBadge(starter) : <span className="text-[10px] text-slate-500">未指名</span>}
                        </div>

                        {starter ? (
                          <div
                            onClick={() => onSelectPlayer(starter)}
                            className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-400/50 transition-colors gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                              <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                                #{starter.number}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-bold text-xs text-slate-100 truncate">{starter.name}</span>
                                  <span className={`text-[9px] px-1 rounded font-bold border shrink-0 ${RARITY_BUDGET[starter.rarity].color}`}>
                                    {starter.rarity}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono block truncate">
                                  最速{getPitcherKmh(starter.stats.pitcher?.speed || 5)}km · 制{starter.stats.pitcher?.control} · 変{starter.stats.pitcher?.breaking} · ス{starter.stats.pitcher?.stamina}
                                </span>
                              </div>
                            </div>
                            <div className="text-right font-mono text-xs shrink-0 pl-1">
                              <span className="font-bold text-amber-400 block whitespace-nowrap">{starter.record.wins}勝{starter.record.losses}敗</span>
                              <span className="text-[10px] text-slate-400 block whitespace-nowrap">防 {era}</span>
                              <span className="text-[9px] text-slate-500 block whitespace-nowrap">{formatInningsPitched(starter.record)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 block py-1">投手が指名されていません</span>
                        )}

                        <div className="flex items-center gap-2 pt-0.5">
                          <label className="text-[10px] text-slate-400 font-bold shrink-0">{slot.label}指名:</label>
                          <select
                            value={starter?.id || ''}
                            onChange={e => handleSetRotationSlot(sIdx, e.target.value)}
                            className="flex-1 min-w-0 w-full bg-slate-950 border border-slate-700 text-amber-300 rounded-lg p-1 text-xs font-bold focus:outline-none truncate"
                          >
                            <option value="">投手を選択</option>
                            {allPitchers.map(p => {
                              const rest = p.restGamesRemaining ?? 0;
                              const statusText = rest > 0 ? `(休養残${rest})` : '(万全)';
                              return (
                                <option key={p.id} value={p.id}>
                                  #{p.number} {p.name} {statusText} [{p.rarity} · {getPitcherKmh(p.stats.pitcher?.speed || 5)}km]
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 2. 中継ぎ陣（ブルペン救援陣） */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>中継ぎ・救援陣 ({team.bullpen.length}名)</span>
              </span>
              <span className="text-[10px] text-slate-400">7回以降の継投</span>
            </div>

            {team.bullpen.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-1">中継ぎ投手が登録されていません。</p>
            ) : (
              <div className="space-y-1.5">
                {team.bullpen.map((pId, idx) => {
                  const p = team.roster.find(player => player.id === pId);
                  if (!p) return null;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 gap-2">
                      <div className="flex items-center gap-2 cursor-pointer min-w-0 flex-1 overflow-hidden" onClick={() => onSelectPlayer(p)}>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-950 px-1 py-0.5 rounded border border-slate-800 shrink-0">
                          継{idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-xs text-slate-200 truncate">{p.name} (#{p.number})</span>
                            <span className={`text-[9px] px-1 rounded font-bold border shrink-0 ${RARITY_BUDGET[p.rarity].color}`}>
                              {p.rarity}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            最速{getPitcherKmh(p.stats.pitcher?.speed || 5)}km · 制{p.stats.pitcher?.control} · 変{p.stats.pitcher?.breaking}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleBullpen(p.id)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-rose-400 border border-rose-800/60 hover:bg-rose-950/40 shrink-0"
                      >
                        中継ぎ解除
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. 抑え守護神 (クローザー) */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>抑え守護神 (クローザー)</span>
              </span>
              <span className="text-[10px] text-slate-400">9回リード時に登板</span>
            </div>

            {(() => {
              const closer = team.roster.find(p => p.id === team.closerId);
              return (
                <div className="space-y-2">
                  {closer ? (
                    <div onClick={() => onSelectPlayer(closer)} className="flex items-center justify-between cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-rose-400/50 transition-colors gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <span className="text-[10px] font-mono font-bold text-rose-400/90 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                          #{closer.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-xs text-slate-100 truncate">{closer.name}</span>
                            <span className={`text-[9px] px-1 rounded font-bold border shrink-0 ${RARITY_BUDGET[closer.rarity].color}`}>
                              {closer.rarity}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            最速{getPitcherKmh(closer.stats.pitcher?.speed || 5)}km · 変化{closer.stats.pitcher?.breaking}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400 shrink-0 whitespace-nowrap pl-1">
                        {closer.record.saves} セーブ
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 block py-1">抑えが指名されていません</span>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[10px] text-slate-400 font-bold shrink-0">抑え指名変更:</label>
                    <select
                      value={team.closerId}
                      onChange={e => handleSetCloser(e.target.value)}
                      className="flex-1 min-w-0 w-full bg-slate-900 border border-slate-700 text-rose-300 rounded-lg p-1 text-xs font-bold focus:outline-none truncate"
                    >
                      <option value="">未指名</option>
                      {team.roster.filter(p => p.position === '投').map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.number} {p.name} ({p.rarity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 4. ベンチ入り控え投手一覧 */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              投手一覧・配置割り当て
            </span>
            <div className="space-y-2">
              {team.roster.filter(p => p.position === '投').map(p => {
                const rotIdx = team.pitcherRotation.indexOf(p.id);
                const isRot1 = rotIdx === 0;
                const isRot2 = rotIdx === 1;
                const isRot3 = rotIdx === 2;
                const isBullpen = team.bullpen.includes(p.id);
                const isCloser = team.closerId === p.id;

                return (
                  <div key={p.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    {/* 上段: 背番号・選手名・所属役職・能力値 & 疲労度バッジ */}
                    <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => onSelectPlayer(p)}>
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                          #{p.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="font-bold text-slate-200 text-xs truncate">{p.name}</span>
                            <span className={`text-[9px] px-1 rounded font-bold border shrink-0 ${RARITY_BUDGET[p.rarity].color}`}>
                              {p.rarity}
                            </span>
                            {isRot1 && <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold shrink-0">第1先発</span>}
                            {isRot2 && <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold shrink-0">第2先発</span>}
                            {isRot3 && <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold shrink-0">第3先発</span>}
                            {isBullpen && <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold shrink-0">中継ぎ</span>}
                            {isCloser && <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold shrink-0">抑え</span>}
                            {!isRot1 && !isRot2 && !isRot3 && !isBullpen && !isCloser && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 shrink-0">控え</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block truncate mt-0.5">
                            最速{getPitcherKmh(p.stats.pitcher?.speed || 5)}km · 制{p.stats.pitcher?.control} · 変{p.stats.pitcher?.breaking} · ス{p.stats.pitcher?.stamina}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {renderFatigueBadge(p)}
                      </div>
                    </div>

                    {/* 下段: 5枠指名アクションボタングリッド (画面はみ出し防止・5列均等配置) */}
                    <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-slate-800/60 w-full">
                      <button
                        onClick={() => handleSetRotationSlot(0, p.id)}
                        className={`py-1 rounded text-[10px] font-bold border text-center transition-colors truncate ${
                          isRot1 ? 'bg-amber-400 text-slate-950 border-amber-400 shadow font-black' : 'bg-slate-950 text-amber-300 border-amber-800/50 hover:bg-amber-950/40'
                        }`}
                        title="第一先発に指名"
                      >
                        {isRot1 ? '✓第1先発' : '第1先発'}
                      </button>
                      <button
                        onClick={() => handleSetRotationSlot(1, p.id)}
                        className={`py-1 rounded text-[10px] font-bold border text-center transition-colors truncate ${
                          isRot2 ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow font-black' : 'bg-slate-950 text-cyan-300 border-cyan-800/50 hover:bg-cyan-950/40'
                        }`}
                        title="第二先発に指名"
                      >
                        {isRot2 ? '✓第2先発' : '第2先発'}
                      </button>
                      <button
                        onClick={() => handleSetRotationSlot(2, p.id)}
                        className={`py-1 rounded text-[10px] font-bold border text-center transition-colors truncate ${
                          isRot3 ? 'bg-purple-400 text-slate-950 border-purple-400 shadow font-black' : 'bg-slate-950 text-purple-300 border-purple-800/50 hover:bg-purple-950/40'
                        }`}
                        title="第三先発に指名"
                      >
                        {isRot3 ? '✓第3先発' : '第3先発'}
                      </button>
                      <button
                        onClick={() => handleToggleBullpen(p.id)}
                        className={`py-1 rounded text-[10px] font-bold border text-center transition-colors truncate ${
                          isBullpen ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow font-black' : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="中継ぎに登録・解除"
                      >
                        {isBullpen ? '✓中継ぎ' : '+中継ぎ'}
                      </button>
                      <button
                        onClick={() => handleSetCloser(p.id)}
                        className={`py-1 rounded text-[10px] font-bold border text-center transition-colors truncate ${
                          isCloser ? 'bg-rose-500 text-white border-rose-500 shadow font-black' : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="守護神に指名"
                      >
                        {isCloser ? '✓抑え' : '+抑え'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Tactics Tab */}
      {subTab === 'tactics' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-md text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 font-bold text-slate-200">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>チーム作戦設定</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="font-bold text-slate-300 block mb-1.5">盗塁方針</label>
              <div className="grid grid-cols-3 gap-2">
                {(['積極', '普通', '慎重'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onUpdateTeam({ ...team, tactics: { ...team.tactics, stealTendency: m } })}
                    className={`py-1.5 rounded-lg font-bold ${
                      team.tactics.stealTendency === m ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="font-bold text-slate-300 block mb-1.5">送りバント</label>
              <div className="grid grid-cols-3 gap-2">
                {(['多用', '普通', 'なし'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onUpdateTeam({ ...team, tactics: { ...team.tactics, buntTendency: m } })}
                    className={`py-1.5 rounded-lg font-bold ${
                      team.tactics.buntTendency === m ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 block text-xs">選手交代の頻度</label>
                <span className="text-[10px] text-amber-400 font-mono">
                  現在: {team.tactics.substitutionFrequency || '普通'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['積極的', '普通', '慎重'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onUpdateTeam({ ...team, tactics: { ...team.tactics, substitutionFrequency: m } })}
                    className={`py-2 rounded-lg font-bold text-xs transition-colors ${
                      (team.tactics.substitutionFrequency || '普通') === m
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                {(team.tactics.substitutionFrequency || '普通') === '積極的'
                  ? '※リード時や終盤の勝負所で早めの代打・継投・守備固めを積極的に起用します。'
                  : (team.tactics.substitutionFrequency || '普通') === '慎重'
                  ? '※スタメン野手や先発投手の実力を重視し、交代を控えめに引っ張ります。'
                  : '※試合の点差やイニングの状況に応じてバランス良く適時交代を行います。'}
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="font-bold text-slate-300 block mb-1.5">継投タイミング</label>
              <div className="grid grid-cols-3 gap-2">
                {(['早め', '普通', '我慢'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onUpdateTeam({ ...team, tactics: { ...team.tactics, pitcherChangeTendency: m } })}
                    className={`py-1.5 rounded-lg font-bold text-xs ${
                      team.tactics.pitcherChangeTendency === m ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <label className="font-bold text-slate-300 block mb-1.5">代打起用方針</label>
              <div className="grid grid-cols-3 gap-2">
                {(['積極', '普通', '我慢'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => onUpdateTeam({ ...team, tactics: { ...team.tactics, pinchHitterTendency: m } })}
                    className={`py-1.5 rounded-lg font-bold text-xs ${
                      team.tactics.pinchHitterTendency === m ? 'bg-amber-400 text-slate-950' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
