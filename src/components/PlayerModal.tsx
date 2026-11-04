import React, { useState } from 'react';
import { Player, Team, EquipmentItem, SkillId } from '../types/baseball';
import { RARITY_BUDGET, ALL_SKILLS, getPitcherKmh } from '../utils/playerGenerator';
import { formatInningsPitched } from '../utils/matchEngine';
import { getSellPrice } from './MarketView';
import { addActivityLog } from '../utils/storage';
import { soundFx } from '../utils/audio';
import { X, Edit2, Check, Award, Zap, Shield, Plus, RefreshCw, Sparkles, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  player: Player | null;
  team: Team;
  onClose: () => void;
  onUpdateTeam: (updatedTeam: Team) => void;
}

export const PlayerModal: React.FC<Props> = ({ player, team, onClose, onUpdateTeam }) => {
  if (!player) return null;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(player.name);
  const [editedNumber, setEditedNumber] = useState(player.number);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [showSellConfirm, setShowSellConfirm] = useState(false);

  const isPitcher = player.position === '投';
  const fStats = player.stats.fielder;
  const pStats = player.stats.pitcher;

  const isUserPlayer = team.roster.some(p => p.id === player.id);
  const totalFielders = team.roster.filter(p => p.position !== '投').length;
  const totalPitchers = team.roster.filter(p => p.position === '投').length;
  const canSellThisPlayer = isUserPlayer && (isPitcher ? totalPitchers > 3 : totalFielders > 9);

  // 自球団選手の売却処理
  const handleConfirmSellInModal = () => {
    if (!isUserPlayer) {
      setActionMsg('他球団の選手は売却できません。');
      return;
    }
    const sellPrice = getSellPrice(player.rarity);
    const nextEquips = [...(team.inventory.equipments || [])];
    if (player.equipment) {
      nextEquips.push(player.equipment);
    }

    // 装着中スキルがあれば所持スキル（インベントリ）に自動格納
    const nextOwnedSkills = [...(team.inventory.ownedSkills || [])];
    if (player.skills && player.skills.length > 0) {
      player.skills.forEach(skill => {
        nextOwnedSkills.push(skill);
      });
    }

    const updatedRoster = team.roster.filter(p => p.id !== player.id);
    let updatedLineup = team.lineup.filter(id => id !== player.id);
    let updatedPositions = [...(team.lineupPositions || [])];
    const nextBenchFielders = (team.benchFielders || []).filter(id => id !== player.id);

    // 野手枠の自動補充（9名未満の場合）
    const remainingFielders = updatedRoster.filter(p => !updatedLineup.includes(p.id) && p.position !== '投');
    while (updatedLineup.length < 9 && remainingFielders.length > 0) {
      const nextCand = remainingFielders.shift()!;
      updatedLineup.push(nextCand.id);
      if (updatedPositions.length < updatedLineup.length) {
        updatedPositions.push('指');
      }
    }

    let nextRotation = (team.pitcherRotation || []).filter(id => id !== player.id);
    let nextBullpen = (team.bullpen || []).filter(id => id !== player.id);
    let nextCloser = team.closerId === player.id ? '' : team.closerId;

    const remainingPitchers = updatedRoster.filter(p => p.position === '投');
    while (nextRotation.length < 3 && remainingPitchers.length >= nextRotation.length + 1) {
      const cand = remainingPitchers.find(p => !nextRotation.includes(p.id) && !nextBullpen.includes(p.id) && p.id !== nextCloser);
      if (cand) nextRotation.push(cand.id);
      else break;
    }
    if (!nextCloser && remainingPitchers.length > 0) {
      nextCloser = remainingPitchers.find(p => !nextRotation.includes(p.id))?.id || remainingPitchers[0].id;
    }

    let updated: Team = {
      ...team,
      gerda: team.gerda + sellPrice,
      roster: updatedRoster,
      lineup: updatedLineup,
      lineupPositions: updatedPositions,
      benchFielders: nextBenchFielders,
      pitcherRotation: nextRotation,
      bullpen: nextBullpen,
      closerId: nextCloser,
      inventory: {
        ...team.inventory,
        equipments: nextEquips,
        ownedSkills: nextOwnedSkills,
      },
    };

    const returnedCount = (player.skills?.length || 0) + (player.equipment ? 1 : 0);
    const returnMsg = returnedCount > 0 ? `（装備・スキル計${returnedCount}個を所持品に回収）` : '';

    updated = addActivityLog(
      updated,
      `市場にて「${player.name}」(${player.rarity}・${player.position === '投' ? '投手' : '野手'})を放出し、${sellPrice.toLocaleString()} ゲルダを獲得しました。${returnMsg}`,
      'market'
    );

    soundFx.playScore();
    onUpdateTeam(updated);
    setShowSellConfirm(false);
    onClose();
  };

  // 選手名・背番号保存
  const handleSaveName = () => {
    setActionMsg(null);
    if (!isUserPlayer) {
      setActionMsg('他球団の選手の情報は変更できません。');
      return;
    }
    const newTrimmedName = editedName.trim() || player.name;
    const isNameChanged = newTrimmedName !== player.name;
    const newNumber = Number(editedNumber) || player.number;

    // 名前変更がある場合は「改名手形」の所持を確認・消費
    if (isNameChanged) {
      const tickets = team.inventory.renameTickets || 0;
      if (tickets <= 0) {
        setActionMsg('【選手名変更不可】「改名手形」が必要です。萬屋（よろずや）で購入してください。');
        setEditedName(player.name);
        return;
      }

      // 改名手形を1枚消費
      const nextRenameTickets = tickets - 1;
      const updatedRoster = team.roster.map(p => {
        if (p.id === player.id) {
          return { ...p, name: newTrimmedName, number: newNumber };
        }
        return p;
      });

      soundFx.playScore();
      setActionMsg(`改名手形を1枚消費し、選手名を「${newTrimmedName}」に変更しました！（残り手形: ${nextRenameTickets}枚）`);
      let updatedTeam: Team = {
        ...team,
        inventory: {
          ...team.inventory,
          renameTickets: nextRenameTickets,
        },
        roster: updatedRoster,
      };
      updatedTeam = addActivityLog(
        updatedTeam,
        `改名手形を使用し、選手名を「${player.name}」から「${newTrimmedName}」に変更しました。`,
        'item'
      );
      onUpdateTeam(updatedTeam);
      setIsEditingName(false);
      return;
    }

    // 背番号のみの変更はアイテム消費なしで可能
    const updatedRoster = team.roster.map(p => {
      if (p.id === player.id) {
        return { ...p, number: newNumber };
      }
      return p;
    });
    onUpdateTeam({ ...team, roster: updatedRoster });
    setIsEditingName(false);
    setActionMsg('背番号を更新しました。');
  };

  // スキル設定用ステート
  const [selectingSlotIndex, setSelectingSlotIndex] = useState<number | null>(null);

  // 所持スキルからスキルをセット
  const handleSetSkill = (slotIndex: number, skillId: SkillId | null) => {
    setActionMsg(null);
    if (!isUserPlayer) {
      setActionMsg('他球団の選手のスキルは変更できません。');
      return;
    }
    const updatedSkills = [...player.skills];

    if (skillId === null) {
      // スキルを外す
      const removed = updatedSkills[slotIndex];
      updatedSkills.splice(slotIndex, 1);
      const updatedPlayer: Player = { ...player, skills: updatedSkills };
      const updatedRoster = team.roster.map(p => (p.id === player.id ? updatedPlayer : p));
      
      // 外したスキルを所持スキルプールに戻す
      const nextOwnedSkills = removed ? [...(team.inventory.ownedSkills || []), removed] : [...(team.inventory.ownedSkills || [])];

      soundFx.playScore();
      setActionMsg(`スキル「${removed}」を外し、所持スキル一覧に戻しました。`);
      let updatedTeam: Team = {
        ...team,
        inventory: { ...team.inventory, ownedSkills: nextOwnedSkills },
        roster: updatedRoster,
      };
      if (removed) {
        updatedTeam = addActivityLog(
          updatedTeam,
          `「${player.name}」からスキル「${removed}」を外し、所持品に戻しました。`,
          'item'
        );
      }
      onUpdateTeam(updatedTeam);
      setSelectingSlotIndex(null);
      return;
    }

    // 既にセットされている同一スキルがあるかチェック（重複不可）
    if (updatedSkills.includes(skillId) && updatedSkills[slotIndex] !== skillId) {
      setActionMsg(`スキル「${skillId}」は既にこの選手にセットされています。`);
      return;
    }

    const previousSkill = updatedSkills[slotIndex];
    if (slotIndex < updatedSkills.length) {
      updatedSkills[slotIndex] = skillId;
    } else {
      updatedSkills.push(skillId);
    }

    // 所持スキルから消費（前のスキルがあれば戻す）
    let nextOwnedSkills = [...(team.inventory.ownedSkills || [])];
    const skillIndexInPool = nextOwnedSkills.indexOf(skillId);
    if (skillIndexInPool >= 0) {
      nextOwnedSkills.splice(skillIndexInPool, 1);
    }
    if (previousSkill) {
      nextOwnedSkills.push(previousSkill);
    }

    const updatedPlayer: Player = { ...player, skills: updatedSkills };
    const updatedRoster = team.roster.map(p => (p.id === player.id ? updatedPlayer : p));

    soundFx.playHomeRun();
    confetti({ particleCount: 50, spread: 50 });
    setActionMsg(`【スキル装着！】「${skillId}」をスロット${slotIndex + 1}にセットしました！`);

    let updatedTeam: Team = {
      ...team,
      inventory: { ...team.inventory, ownedSkills: nextOwnedSkills },
      roster: updatedRoster,
    };
    updatedTeam = addActivityLog(
      updatedTeam,
      `「${player.name}」にスキル「${skillId}」をセットしました。`,
      'item'
    );
    onUpdateTeam(updatedTeam);
    setSelectingSlotIndex(null);
  };

  // 装備の装着・脱着
  const handleEquipItem = (eq: EquipmentItem) => {
    if (!isUserPlayer) {
      setActionMsg('他球団の選手に装備は装着できません。');
      return;
    }
    // 既存装備をインベントリに戻し、新装備を装着
    const nextEquips = team.inventory.equipments.filter(e => e.id !== eq.id);
    if (player.equipment) {
      nextEquips.push(player.equipment);
    }

    const updatedPlayer: Player = { ...player, equipment: eq };
    const updatedRoster = team.roster.map(p => (p.id === player.id ? updatedPlayer : p));

    soundFx.playScore();
    setActionMsg(`装備「${eq.name}」を装着しました！`);

    let updatedTeam: Team = {
      ...team,
      inventory: { ...team.inventory, equipments: nextEquips },
      roster: updatedRoster,
    };
    updatedTeam = addActivityLog(
      updatedTeam,
      `「${player.name}」に装備「${eq.name}」(${eq.effectLabel})を装着しました。`,
      'item'
    );
    onUpdateTeam(updatedTeam);
  };

  const handleUnequipItem = () => {
    if (!isUserPlayer) {
      setActionMsg('他球団の選手の装備は外せません。');
      return;
    }
    if (!player.equipment) return;
    const removedEq = player.equipment;
    const nextEquips = [...team.inventory.equipments, player.equipment];
    const updatedPlayer: Player = { ...player, equipment: undefined };
    const updatedRoster = team.roster.map(p => (p.id === player.id ? updatedPlayer : p));

    soundFx.playScore();
    setActionMsg(`装備を外しました。`);

    let updatedTeam: Team = {
      ...team,
      inventory: { ...team.inventory, equipments: nextEquips },
      roster: updatedRoster,
    };
    updatedTeam = addActivityLog(
      updatedTeam,
      `「${player.name}」の装備「${removedEq.name}」を外しました。`,
      'item'
    );
    onUpdateTeam(updatedTeam);
  };

  const r = player.record;
  const avg = r.atBats > 0 ? (r.hits / r.atBats).toFixed(3) : '.000';
  const totalOuts = r.outsPitched ?? Math.round((r.inningsPitched || 0) * 3);
  const era = totalOuts > 0 ? ((r.earnedRuns * 27) / totalOuts).toFixed(2) : '0.00';

  const rarityCardStyle =
    player.rarity === '伝説ユニーク'
      ? 'card-foil-ur border-rose-400/80 shadow-[0_0_28px_rgba(244,63,94,0.3)]'
      : player.rarity === 'UR'
      ? 'card-foil-ur border-purple-400/80 shadow-[0_0_24px_rgba(168,85,247,0.3)]'
      : player.rarity === 'SSR'
      ? 'card-foil-ssr border-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.3)]'
      : 'border-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
      <div className={`w-full max-w-md bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${rarityCardStyle}`}>
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col items-center justify-center font-bold shrink-0 shadow-inner">
              <span className="text-[10px] text-amber-400 font-mono leading-none">#{player.number}</span>
              <span className="text-sm text-slate-100 font-black mt-0.5 leading-none">{isPitcher ? '投' : '野'}</span>
            </div>
            <div>
              {isEditingName ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      placeholder="選手名"
                      className="bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs font-bold text-white w-28 focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="number"
                      value={editedNumber}
                      onChange={e => setEditedNumber(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-600 rounded px-1.5 py-0.5 text-xs font-mono text-white w-12 focus:outline-none focus:border-amber-400"
                      title="背番号"
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>保存</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditedName(player.name);
                        setEditedNumber(player.number);
                        setIsEditingName(false);
                      }}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-xs"
                    >
                      取消
                    </button>
                  </div>
                  <div className="text-[10px] text-amber-300/90 flex items-center gap-1">
                    <span>※名前変更には<strong>「改名手形」</strong>(所持: {team.inventory.renameTickets || 0}枚) を消費します。</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-black text-slate-100 font-['M_PLUS_Rounded_1c']">
                    {player.name}
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">#{player.number}</span>
                  {isUserPlayer && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-0.5 text-[10px]"
                      title="改名・背番号変更"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>改名/番号</span>
                    </button>
                  )}
                  {!isUserPlayer && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[9px] font-bold border border-slate-700">
                      他球団選手
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                <span className={`px-1 rounded text-[9px] font-bold border ${RARITY_BUDGET[player.rarity].color}`}>
                  {player.rarity}
                </span>
                <span>·</span>
                <span className={isPitcher ? 'text-cyan-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {isPitcher ? '投手' : '野手'}
                </span>
                <span>·</span>
                <span>プロ{player.careerYears}年目</span>
                <span>·</span>
                <span>{player.battingHand}/{player.throwingHand}</span>
                {isPitcher && (
                  <>
                    <span>·</span>
                    {(player.restGamesRemaining ?? 0) === 0 ? (
                      <span className="text-emerald-400 font-bold">⚡万全</span>
                    ) : (
                      <span className="text-rose-400 font-bold">💤休養 残{player.restGamesRemaining}試合</span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs font-bold text-amber-300 animate-pulse">
            {actionMsg}
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {!isUserPlayer && (
            <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl flex items-center gap-2.5 text-xs text-slate-300 shadow-md">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-100 block">他球団選手</span>
                <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                  対戦相手チームの選手データです。選手の売却、スキルの脱着、装備の変更、選手名・背番号の変更は行えません。
                </span>
              </div>
            </div>
          )}
          {/* Base Stats */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-bold">基本能力</span>
            </div>

            {isPitcher ? (
              <div className="grid grid-cols-4 gap-2 text-center font-mono">
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[9px] text-slate-500 block">球速</span>
                  <span className="font-bold text-slate-100 text-sm">{pStats?.speed}/10</span>
                  <span className="text-[10px] text-amber-400 block">{getPitcherKmh(pStats?.speed || 5)}km</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[9px] text-slate-500 block">制球</span>
                  <span className="font-bold text-slate-100 text-sm">{pStats?.control}/10</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[9px] text-slate-500 block">スタミナ</span>
                  <span className="font-bold text-slate-100 text-sm">{pStats?.stamina}/10</span>
                </div>
                <div className="bg-slate-900 p-2 rounded">
                  <span className="text-[9px] text-slate-500 block">変化</span>
                  <span className="font-bold text-slate-100 text-sm">{pStats?.breaking}/10</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[9px] text-slate-500 block">ミート</span>
                    <span className="font-bold text-slate-100 text-sm">{fStats?.meet}/10</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[9px] text-slate-500 block">パワー</span>
                    <span className="font-bold text-slate-100 text-sm">{fStats?.power}/10</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[9px] text-slate-500 block">走力</span>
                    <span className="font-bold text-slate-100 text-sm">{fStats?.speed}/10</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-[9px] text-slate-500 block">守備</span>
                    <span className="font-bold text-slate-100 text-sm">{fStats?.defense}/10</span>
                  </div>
                </div>

                {/* 野手の打球弾道 */}
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-200">打球弾道</span>
                    <span className="text-[10px] text-slate-400">
                      {(fStats?.trajectory ?? 2) === 1
                        ? '1・低弾道'
                        : (fStats?.trajectory ?? 2) === 2
                        ? '2・中弾道'
                        : (fStats?.trajectory ?? 2) === 3
                        ? '3・高弾道'
                        : '4・超高弾道'}
                    </span>
                  </div>
                  <span className="font-mono font-black text-amber-400 text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                    ★ {fStats?.trajectory ?? 2} / 4
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Skill Slots and Skills */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>スキル枠</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {player.skills.length} / {player.skillSlots} 枠
              </span>
            </div>

            <div className="space-y-2">
              {Array.from({ length: player.skillSlots }, (_, i) => {
                const skId = player.skills[i];
                const skDef = ALL_SKILLS.find(s => s.id === skId);

                return (
                  <div key={i} className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 transition-all ${
                    skDef?.isRare
                      ? 'bg-amber-950/25 border-amber-500/50 shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                      : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          枠{i + 1}
                        </span>
                        {skDef?.isRare && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 shadow-sm flex items-center gap-0.5">
                            ★レア
                          </span>
                        )}
                        {skDef ? (
                          <span className={`font-black ${skDef.isRare ? 'text-yellow-300' : 'text-amber-300'}`}>{skDef.name}</span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">未セット</span>
                        )}
                      </div>
                      {skDef && (
                        <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{skDef.description}</span>
                      )}
                    </div>

                    {isUserPlayer ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setSelectingSlotIndex(i)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700"
                          title="所持スキルから選んでセット"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{skDef ? '変更' : '選択'}</span>
                        </button>
                        {skDef && (
                          <button
                            onClick={() => handleSetSkill(i, null)}
                            className="px-1.5 py-1 rounded bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-[10px]"
                            title="スキルを外して所持品に戻す"
                          >
                            外す
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 shrink-0">
                        固定
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            
            {isUserPlayer && (
              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>球団の所持スキル数: <strong className="text-amber-400 font-mono">{(team.inventory.ownedSkills || []).length} 個</strong></span>
                <span className="text-[9px] text-slate-500">※スカウト施設「スキルガチャ」で獲得可能</span>
              </div>
            )}
          </div>

          {/* Equipment */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <span className="font-bold text-slate-300 block">装備品</span>
            {player.equipment ? (
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-100 block">{player.equipment.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold block">{player.equipment.effectLabel}</span>
                </div>
                {isUserPlayer && (
                  <button
                    onClick={handleUnequipItem}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded text-[10px] font-bold"
                  >
                    外す
                  </button>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-500 italic py-1">装備していません。</div>
            )}

            {/* Available equipments to equip */}
            {isUserPlayer && team.inventory.equipments.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-bold">所持装備から装着:</span>
                <div className="space-y-1">
                  {team.inventory.equipments.map(eq => (
                    <div key={eq.id} className="p-1.5 bg-slate-900 rounded flex justify-between items-center text-[11px]">
                      <span>{eq.name} · <strong className="text-emerald-400 font-normal">{eq.effectLabel}</strong></span>
                      <button
                        onClick={() => handleEquipItem(eq)}
                        className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded text-[10px]"
                      >
                        装着
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Season Record */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 font-mono">
            <span className="font-bold text-slate-300 block font-sans">今シーズン成績</span>
            {isPitcher ? (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-900 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">防御率</span>
                    <span className="font-bold text-cyan-400">{era}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">勝 / 敗</span>
                    <span className="font-bold text-slate-200">{r.wins}勝{r.losses}敗</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">投球回</span>
                    <span className="font-bold text-slate-100">{formatInningsPitched(totalOuts)}</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">奪三振</span>
                    <span className="font-bold text-slate-200">{r.pitchStrikeouts}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-400">
                  <div className="bg-slate-900/60 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">登板</span>
                    <span className="font-bold text-slate-300">{r.pitchGames || 0}試合</span>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">セーブ</span>
                    <span className="font-bold text-rose-400">{r.saves}</span>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">被安打</span>
                    <span className="font-bold text-slate-300">{r.pitchHits || 0}</span>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded">
                    <span className="text-[9px] text-slate-500 block">与四球</span>
                    <span className="font-bold text-slate-300">{r.pitchWalks || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-1.5 rounded">
                  <span className="text-[9px] text-slate-500 block">打率</span>
                  <span className="font-bold text-amber-400">{avg}</span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded">
                  <span className="text-[9px] text-slate-500 block">本塁打</span>
                  <span className="font-bold text-amber-300">{r.homeRuns}</span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded">
                  <span className="text-[9px] text-slate-500 block">打点</span>
                  <span className="font-bold text-slate-200">{r.rbi}</span>
                </div>
                <div className="bg-slate-900 p-1.5 rounded">
                  <span className="text-[9px] text-slate-500 block">盗塁</span>
                  <span className="font-bold text-slate-200">{r.stolenBases}</span>
                </div>
              </div>
            )}
          </div>

          {/* 市場売却・放出アクション（自球団選手のみ表示） */}
          {isUserPlayer ? (
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>選手の市場売却・放出</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  売却査定: <strong className="text-amber-400 font-mono">+{getSellPrice(player.rarity).toLocaleString()} G</strong>
                </span>
              </div>
              <button
                onClick={() => setShowSellConfirm(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold flex items-center gap-1 transition-transform active:scale-95 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>売却する</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Shield className="w-4 h-4 text-slate-500" />
                <span>他球団選手</span>
              </span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                閲覧専用
              </span>
            </div>
          )}
        </div>

        {/* 所持スキル選択モーダル */}
        {selectingSlotIndex !== null && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="font-black text-sm text-white">
                  枠{selectingSlotIndex + 1} にセットするスキルを選択
                </span>
              </div>
              <button
                onClick={() => setSelectingSlotIndex(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 py-2">
              球団が所持しているスキルから自由に選択してセットできます。枠から外すと再び所持スキルに戻ります。
            </p>

            <div className="flex-1 overflow-y-auto space-y-2 py-1 pr-1">
              {/* スキルを外す選択肢 */}
              {player.skills[selectingSlotIndex] && (
                <div
                  onClick={() => handleSetSkill(selectingSlotIndex, null)}
                  className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl cursor-pointer hover:bg-rose-900/50 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-bold text-rose-300 text-xs block">この枠のスキルを外す</span>
                    <span className="text-[10px] text-slate-400">現在セットされている「{player.skills[selectingSlotIndex]}」を外して所持品に戻します。</span>
                  </div>
                  <span className="text-xs font-bold text-rose-400 px-2 py-1 rounded bg-slate-900 border border-rose-700/50">
                    外す
                  </span>
                </div>
              )}

              {/* 所持スキル一覧 */}
              {(team.inventory.ownedSkills || []).length === 0 ? (
                <div className="text-center py-8 space-y-3 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
                  <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">セット可能な所持スキルがありません。</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    「スカウト」施設の【スキルガチャ】で新しいスキルを獲得できます！
                  </p>
                </div>
              ) : (
                (() => {
                  // 重複を除外したユニーク所持スキルと個数カウント
                  const counts: Record<string, number> = {};
                  (team.inventory.ownedSkills || []).forEach(s => {
                    counts[s] = (counts[s] || 0) + 1;
                  });

                  return Object.entries(counts).map(([skId, count]) => {
                    const skDef = ALL_SKILLS.find(s => s.id === skId);
                    const alreadyEquipped = player.skills.includes(skId as SkillId) && player.skills[selectingSlotIndex] !== skId;

                    return (
                      <div
                        key={skId}
                        onClick={() => {
                          if (!alreadyEquipped) {
                            handleSetSkill(selectingSlotIndex, skId as SkillId);
                          }
                        }}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                          alreadyEquipped
                            ? 'bg-slate-950 border-slate-800 opacity-50 cursor-not-allowed'
                            : skDef?.isRare
                            ? 'bg-amber-950/20 border-amber-500/60 hover:border-amber-300 cursor-pointer shadow-[0_0_10px_rgba(251,191,36,0.15)]'
                            : 'bg-slate-900 border-slate-700/80 hover:border-amber-400 cursor-pointer hover:bg-slate-850'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-black text-xs ${skDef?.isRare ? 'text-yellow-300' : 'text-amber-300'}`}>
                              {skDef?.name || skId}
                            </span>
                            {skDef?.isRare && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 shadow-sm flex items-center gap-0.5">
                                ★レア
                              </span>
                            )}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                              所持数: {count}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                              {skDef?.category || '汎用'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-300 leading-snug mt-1">
                            {skDef?.description || '特殊な効果を発揮するスキル。'}
                          </p>
                          {alreadyEquipped && (
                            <span className="text-[9px] text-rose-400 font-bold block mt-0.5">※この選手が既に別枠で装備中</span>
                          )}
                        </div>

                        <button
                          disabled={alreadyEquipped}
                          className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shrink-0 disabled:opacity-40"
                        >
                          セット
                        </button>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectingSlotIndex(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-200 text-xs font-bold rounded-lg hover:bg-slate-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* 売却確認モーダル */}
        {showSellConfirm && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md p-4 flex flex-col justify-center animate-fade-in">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-sm text-slate-100">選手売却・放出の確認</span>
                </div>
                <button
                  onClick={() => setShowSellConfirm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-base">{player.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${RARITY_BUDGET[player.rarity].color}`}>
                    {player.rarity}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono block">
                  #{player.number} · {isPitcher ? '投手' : '野手'} · プロ{player.careerYears}年目
                </span>
                {player.equipment && (
                  <div className="text-[10px] text-emerald-400 pt-1 border-t border-slate-800">
                    ※装着中の装備「{player.equipment.name}」は球団の倉庫に自動返還されます。
                  </div>
                )}
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-amber-200 font-bold">獲得ゲルダ</span>
                <span className="font-mono text-base font-black text-amber-400">
                  +{getSellPrice(player.rarity).toLocaleString()} G
                </span>
              </div>

              {!canSellThisPlayer ? (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>売却できません</span>
                  </div>
                  <p className="text-[11px] text-rose-300/90 leading-tight">
                    公式戦に出場するための最低人数（野手9名・投手3名）を下回るため放出できません。
                    先にスカウト施設等で選手を獲得してから売却してください。
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 leading-snug">
                  本当にこの選手を放出して売却しますか？売却後は取り消すことができません。
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setShowSellConfirm(false)}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleConfirmSellInModal}
                  disabled={!canSellThisPlayer}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-transform active:scale-95"
                >
                  売却を確定する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
