import React, { useState } from 'react';
import { Team, Player, Position, Rarity, SkillId } from '../types/baseball';
import { generatePlayer, RARITY_BUDGET, ALL_SKILLS } from '../utils/playerGenerator';
import { addActivityLog } from '../utils/storage';
import { soundFx } from '../utils/audio';
import { ShoppingCart, Coins, Trash2, CheckCircle2, AlertTriangle, X, Shield, ArrowRight, Zap, CheckSquare, Square, Filter, Lock, Users, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  team: Team;
  onUpdateTeam: (updated: Team) => void;
  onSelectPlayer: (player: Player) => void;
}

export function getSellPrice(rarity: Rarity): number {
  switch (rarity) {
    case '伝説ユニーク': return 12000;
    case 'UR': return 6000;
    case 'SSR': return 3500;
    case 'SR': return 1500;
    case 'R': return 800;
    case 'N': default: return 300;
  }
}

export function getSkillSellPrice(skillId: SkillId): number {
  if (skillId.startsWith('三冠王⭐︎') || skillId.startsWith('沢村賞⭐︎') || skillId.startsWith('ハンク・アーロン賞⭐︎') || skillId.startsWith('サイ・ヤング賞⭐︎')) {
    const star = parseInt(skillId.slice(-1), 10) || 1;
    switch (star) {
      case 1: return 3000;
      case 2: return 5000;
      case 3: return 8000;
      case 4: return 12000;
      case 5: return 18000;
      case 6: return 25000;
      default: return 3000;
    }
  }

  if (skillId.includes('⭐︎')) {
    const star = parseInt(skillId.slice(-1), 10) || 1;
    switch (star) {
      case 1: return 1000;
      case 2: return 2000;
      case 3: return 3500;
      case 4: return 5500;
      case 5: return 8000;
      case 6: return 12000;
      default: return 1000;
    }
  }

  const def = ALL_SKILLS.find(s => s.id === skillId);
  if (def?.isRare) {
    return 2500;
  }

  return 500;
}

/**
 * 試合出場登録メンバー（スタメン・ベンチ入り野手、先発ローテ・中継ぎ・抑え投手）の役割を判定
 * 役割が存在する場合は売却不可
 */
export function getPlayerActiveRole(player: Player, team: Team): string | null {
  if (team.lineup && team.lineup.includes(player.id)) {
    const orderIdx = team.lineup.indexOf(player.id);
    const pos = team.lineupPositions?.[orderIdx] || '';
    return `スタメン (${orderIdx + 1}番·${pos})`;
  }
  if (team.benchFielders && team.benchFielders.includes(player.id)) {
    return 'ベンチ控え野手';
  }
  if (team.pitcherRotation && team.pitcherRotation.includes(player.id)) {
    const rotIdx = team.pitcherRotation.indexOf(player.id);
    const labels = ['第一先発', '第二先発', '第三先発'];
    return labels[rotIdx] || '先発ローテ';
  }
  if (team.closerId === player.id) {
    return '守護神(抑え)';
  }
  if (team.bullpen && team.bullpen.includes(player.id)) {
    return '中継ぎ';
  }
  return null;
}

export const MarketView: React.FC<Props> = ({ team, onUpdateTeam, onSelectPlayer }) => {
  const [marketTab, setMarketTab] = useState<'fa' | 'sell' | 'skill_sell'>('fa');
  const [faList, setFaList] = useState<Player[]>(() => generateInitialFaList());
  const [marketMsg, setMarketMsg] = useState<string | null>(null);
  const [playerToSell, setPlayerToSell] = useState<Player | null>(null);

  // 選手売却（複数選択）ステート
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSellFilter, setPlayerSellFilter] = useState<'all' | 'sellable' | 'fielder' | 'pitcher'>('all');
  const [showPlayerBulkSellModal, setShowPlayerBulkSellModal] = useState<boolean>(false);

  // スキル売却ステート
  const [selectedSkillIndices, setSelectedSkillIndices] = useState<number[]>([]);
  const [skillFilter, setSkillFilter] = useState<'all' | '打者' | '投手' | '守備・特殊' | 'rare' | 'title'>('all');
  const [showSkillSellConfirmModal, setShowSkillSellConfirmModal] = useState<boolean>(false);

  function generateInitialFaList(): Player[] {
    const positions: Position[] = ['投', '野', '野', '野', '野'];
    // FAマーケットではUR以上の販売を行わない（最大SSRまで）
    const rarities: Rarity[] = ['SSR', 'SSR', 'SR', 'SR', 'R'];
    return positions.map((pos, idx) => {
      const p = generatePlayer({
        position: pos,
        fixedRarity: rarities[idx],
        careerYears: Math.floor(Math.random() * 8) + 3, // ベテランFA選手
      });
      return p;
    });
  }

  // FA選手の契約獲得
  const handleSignFaPlayer = (faPlayer: Player, price: number) => {
    setMarketMsg(null);
    if (team.gerda < price) {
      setMarketMsg('ゲルダが不足しています！');
      return;
    }

    let updated: Team = {
      ...team,
      gerda: team.gerda - price,
      roster: [...team.roster, faPlayer],
    };

    updated = addActivityLog(
      updated,
      `FA市場にて「${faPlayer.name}」選手と契約合意しました！（契約金: ${price.toLocaleString()}G）`,
      'market'
    );

    soundFx.playHomeRun();
    confetti({ particleCount: 70, spread: 60 });
    setFaList(faList.filter(p => p.id !== faPlayer.id));
    setMarketMsg(`【FA契約成立！】${faPlayer.name}選手と合意しました！`);
    onUpdateTeam(updated);
  };

  // 自球団選手の市場売却実行
  const handleConfirmSell = () => {
    if (!playerToSell) return;
    const player = playerToSell;
    const sellPrice = getSellPrice(player.rarity);

    // 装備があればインベントリに戻す
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

    // 野手売却時、スタメンが9人未満なら控え野手から補充
    const remainingFielders = updatedRoster.filter(p => p.position !== '投');
    while (updatedLineup.length < 9 && remainingFielders.length >= updatedLineup.length) {
      const candidate = remainingFielders.find(p => !updatedLineup.includes(p.id));
      if (candidate) {
        updatedLineup.push(candidate.id);
        updatedPositions.push('指');
      } else {
        break;
      }
    }

    // 投手の場合、ローテーション・中継ぎ・抑えの再調整
    let nextRotation = (team.pitcherRotation || []).filter(id => id !== player.id);
    let nextBullpen = (team.bullpen || []).filter(id => id !== player.id);
    let nextCloser = team.closerId === player.id ? '' : team.closerId;

    const remainingPitchers = updatedRoster.filter(p => p.position === '投');
    while (nextRotation.length < 3 && remainingPitchers.length >= nextRotation.length + 1) {
      const candidate = remainingPitchers.find(p => !nextRotation.includes(p.id) && !nextBullpen.includes(p.id) && p.id !== nextCloser);
      if (candidate) nextRotation.push(candidate.id);
      else break;
    }
    if (!nextCloser && remainingPitchers.length > 0) {
      const cand = remainingPitchers.find(p => !nextRotation.includes(p.id)) || remainingPitchers[0];
      nextCloser = cand.id;
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
    setMarketMsg(`【売却成立】${player.name}を売却し、+${sellPrice.toLocaleString()} ゲルダを獲得しました。${returnMsg}`);
    onUpdateTeam(updated);
    setPlayerToSell(null);
  };

  const isPitcher = playerToSell?.position === '投';
  const totalFielders = team.roster.filter(p => p.position !== '投').length;
  const totalPitchers = team.roster.filter(p => p.position === '投').length;
  const canSellSelected = playerToSell
    ? (isPitcher ? totalPitchers > 3 : totalFielders > 9)
    : false;

  // スキル売却ハンドラー
  const handleToggleSelectSkill = (idx: number) => {
    setSelectedSkillIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllFiltered = (indices: number[]) => {
    setSelectedSkillIndices(indices);
  };

  const handleDeselectAllSkills = () => {
    setSelectedSkillIndices([]);
  };

  const handleSelectNormalOnly = () => {
    const owned = team.inventory.ownedSkills || [];
    const normalIndices: number[] = [];
    owned.forEach((skillId, idx) => {
      const def = ALL_SKILLS.find(s => s.id === skillId);
      const isRare = def?.isRare;
      const isTitleStar = skillId.includes('⭐︎');
      if (!isRare && !isTitleStar) {
        normalIndices.push(idx);
      }
    });
    setSelectedSkillIndices(normalIndices);
  };

  const handleConfirmBulkSellSkills = () => {
    if (selectedSkillIndices.length === 0) return;
    const owned = [...(team.inventory.ownedSkills || [])];
    const selectedSorted = [...selectedSkillIndices].sort((a, b) => b - a);
    let totalEarned = 0;
    const soldSkillNames: string[] = [];

    selectedSorted.forEach(idx => {
      if (idx >= 0 && idx < owned.length) {
        const skill = owned[idx];
        totalEarned += getSkillSellPrice(skill);
        soldSkillNames.push(skill);
        owned.splice(idx, 1);
      }
    });

    let updated: Team = {
      ...team,
      gerda: team.gerda + totalEarned,
      inventory: {
        ...team.inventory,
        ownedSkills: owned,
      },
    };

    const count = soldSkillNames.length;
    updated = addActivityLog(
      updated,
      `市場にて所持スキル${count}個（${soldSkillNames.slice(0, 3).join('、')}${count > 3 ? `他${count - 3}件` : ''}）を一括売却し、+${totalEarned.toLocaleString()}Gを獲得しました。`,
      'market'
    );

    soundFx.playScore();
    confetti({ particleCount: 70, spread: 60 });
    setMarketMsg(`【売却完了】スキル計${count}個を売却し、+${totalEarned.toLocaleString()} ゲルダを獲得しました！`);
    onUpdateTeam(updated);
    setSelectedSkillIndices([]);
    setShowSkillSellConfirmModal(false);
  };

  // フィルタリング後のスキル一覧
  const ownedSkills = team.inventory.ownedSkills || [];
  const skillItemsWithMeta = ownedSkills.map((skillId, originalIndex) => {
    const def = ALL_SKILLS.find(s => s.id === skillId);
    const price = getSkillSellPrice(skillId);
    const isTitleStar = skillId.includes('⭐︎');
    const isRare = def?.isRare;
    const category = def?.category || '特殊';
    return {
      skillId,
      originalIndex,
      def,
      price,
      isTitleStar,
      isRare,
      category,
    };
  });

  const filteredSkillItems = skillItemsWithMeta.filter(item => {
    if (skillFilter === 'all') return true;
    if (skillFilter === 'rare') return item.isRare;
    if (skillFilter === 'title') return item.isTitleStar;
    if (skillFilter === '守備・特殊') return item.category === '守備' || item.category === '特殊';
    return item.category === skillFilter;
  });

  const filteredSkillIndices = filteredSkillItems.map(item => item.originalIndex);

  const selectedTotalEarned = selectedSkillIndices.reduce((sum, idx) => {
    const sId = ownedSkills[idx];
    return sId ? sum + getSkillSellPrice(sId) : sum;
  }, 0);

  const hasSelectedRareOrTitle = selectedSkillIndices.some(idx => {
    const sId = ownedSkills[idx];
    if (!sId) return false;
    const def = ALL_SKILLS.find(s => s.id === sId);
    return def?.isRare || sId.includes('⭐︎');
  });

  // 選手売却ハンドラー（複数選択）
  const handleToggleSelectPlayer = (playerId: string) => {
    const player = team.roster.find(p => p.id === playerId);
    if (!player || getPlayerActiveRole(player, team) !== null) {
      return; // 試合出場・ベンチ入り選手は選択不可
    }
    setSelectedPlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSelectAllSellablePlayers = (ids: string[]) => {
    setSelectedPlayerIds(ids);
  };

  const handleDeselectAllPlayers = () => {
    setSelectedPlayerIds([]);
  };

  const handleConfirmBulkSellPlayers = () => {
    if (selectedPlayerIds.length === 0) return;
    const playersToSell = team.roster.filter(p => selectedPlayerIds.includes(p.id));
    const validPlayers = playersToSell.filter(p => getPlayerActiveRole(p, team) === null);
    if (validPlayers.length === 0) {
      setMarketMsg('試合出場メンバーやベンチ入り選手は売却できません。');
      setSelectedPlayerIds([]);
      setShowPlayerBulkSellModal(false);
      return;
    }

    let totalEarned = 0;
    const nextEquips = [...(team.inventory.equipments || [])];
    const nextOwnedSkills = [...(team.inventory.ownedSkills || [])];
    let returnedItemsCount = 0;

    validPlayers.forEach(p => {
      totalEarned += getSellPrice(p.rarity);
      if (p.equipment) {
        nextEquips.push(p.equipment);
        returnedItemsCount++;
      }
      if (p.skills && p.skills.length > 0) {
        p.skills.forEach(skill => {
          nextOwnedSkills.push(skill);
          returnedItemsCount++;
        });
      }
    });

    const validIds = validPlayers.map(p => p.id);
    const updatedRoster = team.roster.filter(p => !validIds.includes(p.id));

    let updated: Team = {
      ...team,
      gerda: team.gerda + totalEarned,
      roster: updatedRoster,
      inventory: {
        ...team.inventory,
        equipments: nextEquips,
        ownedSkills: nextOwnedSkills,
      },
    };

    const count = validPlayers.length;
    const names = validPlayers.map(p => p.name);
    const nameSummary = names.slice(0, 3).join('、') + (count > 3 ? `他${count - 3}名` : '');
    const returnMsg = returnedItemsCount > 0 ? `（装備・スキル計${returnedItemsCount}個を倉庫に回収）` : '';

    updated = addActivityLog(
      updated,
      `市場にて選手${count}名（${nameSummary}）を放出し、+${totalEarned.toLocaleString()}Gを獲得しました。${returnMsg}`,
      'market'
    );

    soundFx.playScore();
    confetti({ particleCount: 70, spread: 60 });
    setMarketMsg(`【売却完了】選手${count}名を売却し、+${totalEarned.toLocaleString()} ゲルダを獲得しました！${returnMsg}`);
    onUpdateTeam(updated);
    setSelectedPlayerIds([]);
    setShowPlayerBulkSellModal(false);
  };

  // 選手売却用の計算・役割判定
  const rosterWithRole = team.roster.map(p => {
    const activeRole = getPlayerActiveRole(p, team);
    const sellPrice = getSellPrice(p.rarity);
    const canSell = activeRole === null;
    return {
      player: p,
      activeRole,
      sellPrice,
      canSell,
    };
  });

  const filteredRosterItems = rosterWithRole.filter(item => {
    if (playerSellFilter === 'sellable') return item.canSell;
    if (playerSellFilter === 'fielder') return item.player.position !== '投';
    if (playerSellFilter === 'pitcher') return item.player.position === '投';
    return true;
  });

  const sellableFilteredIds = filteredRosterItems
    .filter(item => item.canSell)
    .map(item => item.player.id);

  const selectedTotalPlayerEarned = selectedPlayerIds.reduce((sum, id) => {
    const p = team.roster.find(player => player.id === id);
    return p ? sum + getSellPrice(p.rarity) : sum;
  }, 0);

  const hasSelectedRarePlayer = selectedPlayerIds.some(id => {
    const p = team.roster.find(player => player.id === id);
    return p && (p.rarity === 'SSR' || p.rarity === 'UR' || p.rarity === '伝説ユニーク');
  });

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['M_PLUS_Rounded_1c']">
              市場・FAマーケット
            </h2>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400">{team.gerda.toLocaleString()} G</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          他球団からの自由契約・FA選手と契約したり、不要な選手や余剰スキルを売却して資金を調達できます。
        </p>

        {marketMsg && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{marketMsg}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center justify-between text-xs font-bold gap-1">
        <button
          onClick={() => { setMarketTab('fa'); setMarketMsg(null); }}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            marketTab === 'fa' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          FA選手獲得
        </button>
        <button
          onClick={() => { setMarketTab('sell'); setMarketMsg(null); }}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            marketTab === 'sell' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          選手売却
        </button>
        <button
          onClick={() => { setMarketTab('skill_sell'); setMarketMsg(null); }}
          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            marketTab === 'skill_sell' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>スキル売却</span>
          {ownedSkills.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${marketTab === 'skill_sell' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
              {ownedSkills.length}
            </span>
          )}
        </button>
      </div>

      {marketTab === 'fa' && (
        <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-center justify-between">
          <span>※FA移籍市場は<strong>最大SSRまで</strong>の即戦力選手が対象です。</span>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {marketTab === 'fa' ? (
          (() => {
            const validFaList = faList.filter(p => p.rarity !== 'UR' && p.rarity !== '伝説ユニーク');
            if (validFaList.length === 0) {
              return (
                <div className="text-center py-8 text-xs text-slate-500">
                  現在市場に出ているFA選手はいません。
                </div>
              );
            }
            return validFaList.map(p => {
              const price = p.rarity === 'SSR' ? 14000
                : p.rarity === 'SR' ? 6000
                : p.rarity === 'R' ? 3000 : 1500;
              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div
                    onClick={() => onSelectPlayer(p)}
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-950 px-1.5 py-1 rounded border border-slate-800 shrink-0">
                      {p.position === '投' ? '投' : '野'}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-100 text-xs truncate">{p.name}</span>
                        <span className={`text-[9px] px-1 rounded font-bold border ${RARITY_BUDGET[p.rarity].color}`}>
                          {p.rarity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {p.position === '投' ? '投手' : '野手'} · プロ{p.careerYears}年目 · 枠:{p.skillSlots}
                      </span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold block pt-0.5">
                        {p.skills.length > 0 ? p.skills[0] : 'スキルなし'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block font-mono">契約金</span>
                    <button
                      onClick={() => handleSignFaPlayer(p, price)}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow active:scale-95"
                    >
                      {price.toLocaleString()} G
                    </button>
                  </div>
                </div>
              );
            });
          })()
        ) : marketTab === 'sell' ? (
          <div className="space-y-3">
            {/* Summary & Instruction Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>自球団選手の売却（まとめ売り対応）</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  所属: {team.roster.length} 名 (売却可: {rosterWithRole.filter(r => r.canSell).length} 名)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                スタメン・ベンチ入り野手、および先発ローテ・中継ぎ・抑えの投手は試合出場メンバーとして保護されているため選択・売却できません。控え選手をタップして複数選択し、一括売却できます。
              </p>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectAllSellablePlayers(sellableFilteredIds)}
                  disabled={sellableFilteredIds.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-[11px] font-bold border border-amber-400/40 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  売却可能選手を全選択
                </button>
                {selectedPlayerIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAllPlayers}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-bold border border-slate-700 transition-colors"
                  >
                    選択解除
                  </button>
                )}
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
              {(
                [
                  { id: 'all', label: `すべて (${team.roster.length})` },
                  { id: 'sellable', label: `売却可能のみ (${rosterWithRole.filter(r => r.canSell).length})` },
                  { id: 'fielder', label: `野手 (${team.roster.filter(p => p.position !== '投').length})` },
                  { id: 'pitcher', label: `投手 (${team.roster.filter(p => p.position === '投').length})` },
                ] as const
              ).map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPlayerSellFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors border ${
                    playerSellFilter === f.id
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List of Players */}
            <div className="space-y-2">
              {filteredRosterItems.map(({ player: p, activeRole, sellPrice, canSell }) => {
                const isSelected = selectedPlayerIds.includes(p.id);
                const returningCount = (p.skills?.length || 0) + (p.equipment ? 1 : 0);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (canSell) {
                        handleToggleSelectPlayer(p.id);
                      } else {
                        onSelectPlayer(p);
                      }
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      !canSell
                        ? 'bg-slate-950/70 border-slate-800/80 cursor-pointer opacity-85'
                        : isSelected
                        ? 'bg-amber-400/15 border-amber-400 shadow-md cursor-pointer'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Selection checkbox or lock */}
                      <div className="shrink-0">
                        {!canSell ? (
                          <div
                            className="w-5 h-5 rounded flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-500"
                            title="試合・ベンチ登録中のため選択不可"
                          >
                            <Lock className="w-3 h-3 text-slate-500" />
                          </div>
                        ) : isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-amber-400 text-slate-950" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-600" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                            #{p.number}
                          </span>
                          <span className="font-bold text-slate-100 text-xs truncate">
                            {p.name}
                          </span>
                          <span className={`text-[9px] px-1 rounded font-bold border ${RARITY_BUDGET[p.rarity].color}`}>
                            {p.rarity}
                          </span>
                          <span className="text-[9px] px-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {p.position === '投' ? '投手' : '野手'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-400 font-mono">
                          <span>プロ{p.careerYears}年目</span>
                          {returningCount > 0 && (
                            <span className="text-emerald-400">
                              (装備・スキル{returningCount}個返還)
                            </span>
                          )}
                        </div>

                        {/* Active Role status badge or Sellable badge */}
                        <div className="pt-0.5">
                          {!canSell ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300/90 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                              <Lock className="w-2.5 h-2.5 text-amber-400" />
                              <span>{activeRole}（登録中・売却不可）</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                              <span>控え選手（売却可能）</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400 block">
                        +{sellPrice.toLocaleString()} G
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sticky Bottom Summary Bar for Bulk Player Selling */}
            {selectedPlayerIds.length > 0 && (
              <div className="sticky bottom-16 z-30 bg-slate-900/95 backdrop-blur-md border border-amber-400/50 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    選択中: <strong className="text-white text-xs">{selectedPlayerIds.length}</strong> 名
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    獲得予定: +{selectedTotalPlayerEarned.toLocaleString()} G
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlayerBulkSellModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>まとめて売却する</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* marketTab === 'skill_sell' */
          <div className="space-y-3">
            {/* Summary & Multi-select Helpers */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>所持スキルの売却（まとめ売り対応）</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  全 {ownedSkills.length} 個
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                選手に装着していない余剰スキルを売却して資金を獲得できます。タップで複数選択して一括売却が可能です。
              </p>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectAllFiltered(filteredSkillIndices)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition-colors"
                >
                  表示分を全選択
                </button>
                <button
                  type="button"
                  onClick={handleSelectNormalOnly}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 text-[11px] font-bold border border-amber-400/40 transition-colors"
                >
                  通常スキルのみ全選択
                </button>
                {selectedSkillIndices.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAllSkills}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] font-bold border border-slate-700 transition-colors"
                  >
                    選択解除
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold scrollbar-none">
              {(
                [
                  { id: 'all', label: 'すべて' },
                  { id: '打者', label: '打者' },
                  { id: '投手', label: '投手' },
                  { id: '守備・特殊', label: '守備/特殊' },
                  { id: 'rare', label: 'レア(金特)' },
                  { id: 'title', label: 'タイトル⭐︎' },
                ] as const
              ).map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSkillFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors border ${
                    skillFilter === f.id
                      ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            {ownedSkills.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 space-y-1">
                <Zap className="w-8 h-8 text-slate-600 mx-auto stroke-[1.5]" />
                <p className="font-bold text-slate-300">現在、所持スキルはありません</p>
                <p className="text-[11px] text-slate-500">
                  スキルガチャやリーグ個人タイトルの獲得、選手売却時の返還によりスキルを獲得できます。
                </p>
              </div>
            ) : filteredSkillItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
                このカテゴリの所持スキルはありません。
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSkillItems.map(({ skillId, originalIndex, def, price, isTitleStar, isRare }) => {
                  const isSelected = selectedSkillIndices.includes(originalIndex);
                  return (
                    <div
                      key={originalIndex}
                      onClick={() => handleToggleSelectSkill(originalIndex)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between gap-3 transition-all ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-400 shadow-md'
                          : isRare
                          ? 'bg-slate-900/90 border-amber-500/40 hover:border-amber-400/70'
                          : isTitleStar
                          ? 'bg-slate-900/90 border-purple-500/40 hover:border-purple-400/70'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 text-amber-400">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 fill-amber-400 text-slate-950" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-black text-xs ${
                                isRare
                                  ? 'text-amber-300'
                                  : isTitleStar
                                  ? 'text-purple-300'
                                  : 'text-slate-100'
                              }`}
                            >
                              {skillId}
                            </span>
                            {isRare && (
                              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                                金特
                              </span>
                            )}
                            {isTitleStar && (
                              <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                                栄誉
                              </span>
                            )}
                            <span className="text-[9px] px-1 rounded bg-slate-950 text-slate-400 border border-slate-800">
                              {def?.category || '特殊'}
                            </span>
                          </div>
                          {def?.description && (
                            <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                              {def.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-mono font-bold text-amber-400 block">
                          +{price.toLocaleString()} G
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sticky Bottom Summary Bar for Bulk Selling */}
            {selectedSkillIndices.length > 0 && (
              <div className="sticky bottom-16 z-30 bg-slate-900/95 backdrop-blur-md border border-amber-400/50 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    選択中: <strong className="text-white text-xs">{selectedSkillIndices.length}</strong> 個
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    獲得予定: +{selectedTotalEarned.toLocaleString()} G
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSkillSellConfirmModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 shrink-0 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>まとめて売却する</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* スキル一括売却確認モーダル */}
      {showSkillSellConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm text-slate-100">スキルまとめて売却の確認</span>
              </div>
              <button
                onClick={() => setShowSkillSellConfirmModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              選択された <strong>{selectedSkillIndices.length} 個</strong> のスキルを売却します。
            </p>

            {/* Rare / Title warning */}
            {hasSelectedRareOrTitle && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>注意: レアスキル（金特）またはタイトル栄誉スキルが含まれています。</span>
              </div>
            )}

            {/* List of skills to be sold */}
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-40 overflow-y-auto space-y-1 text-xs divide-y divide-slate-900">
              {selectedSkillIndices.map(idx => {
                const sId = ownedSkills[idx];
                if (!sId) return null;
                const price = getSkillSellPrice(sId);
                const isRare = ALL_SKILLS.find(s => s.id === sId)?.isRare;
                const isTitleStar = sId.includes('⭐︎');
                return (
                  <div key={idx} className="flex items-center justify-between text-slate-300 py-1">
                    <span className={`truncate pr-2 ${isRare ? 'text-amber-300 font-bold' : isTitleStar ? 'text-purple-300 font-bold' : ''}`}>
                      {sId}
                    </span>
                    <span className="font-mono text-amber-400 font-bold shrink-0">+{price.toLocaleString()}G</span>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs text-amber-200 font-bold">獲得ゲルダ合計</span>
              <span className="font-mono text-base font-black text-amber-400">
                +{selectedTotalEarned.toLocaleString()} G
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSkillSellConfirmModal(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkSellSkills}
                className="py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shadow-lg transition-transform active:scale-95"
              >
                売却を実行する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 選手一括売却確認モーダル */}
      {showPlayerBulkSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-sm text-slate-100">選手まとめて売却の確認</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPlayerBulkSellModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-0.5">
              <p className="text-xs text-slate-300 leading-relaxed">
                選択された <strong className="text-white">{selectedPlayerIds.length} 名</strong> の二軍・控え選手を球団から放出して売却します。
              </p>

              {/* SSR/UR warning */}
              {hasSelectedRarePlayer && (
                <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-xl text-[11px] text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>注意: 高レアリティ（SSR / UR / 伝説ユニーク）の選手が含まれています。</span>
                </div>
              )}

              <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-[10px] text-emerald-300 flex items-start gap-1.5 leading-snug">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>売却される選手が装備しているアイテムや習得しているスキルは、すべて球団の倉庫に自動返還されます。</span>
              </div>

              {/* List of players to be sold */}
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 max-h-44 overflow-y-auto space-y-1.5 text-xs divide-y divide-slate-900">
                {selectedPlayerIds.map(id => {
                  const p = team.roster.find(player => player.id === id);
                  if (!p) return null;
                  const price = getSellPrice(p.rarity);
                  const rarityBadge = RARITY_BUDGET[p.rarity];
                  return (
                    <div key={id} className="flex items-center justify-between text-slate-300 pt-1.5 first:pt-0">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${rarityBadge?.color || 'text-slate-400'}`}>
                            {p.rarity}
                          </span>
                          <span className="font-bold text-slate-100 truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-400">({p.position === '投' ? '投' : '野'})</span>
                        </div>
                      </div>
                      <span className="font-mono text-amber-400 font-bold shrink-0 text-xs">
                        +{price.toLocaleString()} G
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Earned */}
              <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-amber-200 font-bold">獲得ゲルダ合計</span>
                <span className="font-mono text-base font-black text-amber-400">
                  +{selectedTotalPlayerEarned.toLocaleString()} G
                </span>
              </div>

              <p className="text-[10px] text-slate-500 text-center leading-tight">
                ※売却後は取り消すことができません。
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setShowPlayerBulkSellModal(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkSellPlayers}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>まとめて売却する</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {playerToSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-sm text-slate-100">選手売却・放出の確認</span>
              </div>
              <button
                onClick={() => setPlayerToSell(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 対象選手詳細 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-black text-white text-base block font-['M_PLUS_Rounded_1c']">
                    {playerToSell.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    #{playerToSell.number} · {playerToSell.position === '投' ? '投手' : '野手'} · プロ{playerToSell.careerYears}年目
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${RARITY_BUDGET[playerToSell.rarity].color}`}>
                  {playerToSell.rarity}
                </span>
              </div>

              {playerToSell.equipment && (
                <div className="text-[10px] text-emerald-400 pt-1 border-t border-slate-800">
                  ※装着中の装備「{playerToSell.equipment.name}」は球団の倉庫に自動返還されます。
                </div>
              )}
            </div>

            {/* 獲得ゲルダ表示 */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs text-amber-200 font-bold">獲得ゲルダ</span>
              <span className="font-mono text-base font-black text-amber-400">
                +{getSellPrice(playerToSell.rarity).toLocaleString()} G
              </span>
            </div>

            {/* 最低戦力バリデーション */}
            {!canSellSelected ? (
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
                onClick={() => setPlayerToSell(null)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmSell}
                disabled={!canSellSelected}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-transform active:scale-95"
              >
                売却を確定する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
