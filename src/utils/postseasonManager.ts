import { Team, Player, Position, Rarity, SkillId, PostseasonProgress, EquipmentItem } from '../types/baseball';
import { generatePlayer } from './playerGenerator';
import { addActivityLog } from './storage';

export const TOTAL_POSTSEASON_STAGES = 103;

export interface PostseasonStageInfo {
  stage: number;
  name: string; // 例: "第1回戦", "第100回戦", "準々決勝", "準決勝", "決勝"
  tierLabel: string;
  opponentName: string;
  opponentManager: string;
  opponentColor: string;
  difficultyRating: number; // 1〜10+
  isBoss: boolean;
  firstClearReward: {
    gerda: number;
    pitcherTickets?: number;
    fielderTickets?: number;
    renameTickets?: number;
    skillId?: SkillId;
    title?: string;
    description: string;
  };
}

const REGIONAL_TEAMS = [
  '札幌フロスト', '函館ブルーオーシャン', '旭川ポーラーズ', '青森アップルズ',
  '秋田ナマハゲズ', '盛岡アイアンズ', '仙台イーグレット', '山形チェリーズ',
  '郡山ブレイカーズ', '水戸ナットーズ', '宇都宮ギョーザズ', '前橋ウインド',
  '大宮ソニック', '千葉マリンボーイズ', '所沢ライオネッツ', '江戸川リバーズ',
  '八王子マウンテンズ', '横浜ベイブレイブス', '川崎パイオニアーズ', '相模原グリーン',
  '甲府ワインズ', '長野アルプス', '新潟スノウズ', '富山ディープス',
  '金沢サムライ', '福井ダイナソーズ', '静岡ティーリーブス', '浜松ウイングス',
  '名古屋ドラゴンキングス', '岐阜アユズ', '津サンライズ', '大津レイクス',
  '京都センチュリー', '大阪タイタンズ', '堺フェニックス', '神戸ハーバーズ',
  '姫路キャッスルズ', '奈良バンビーズ', '和歌山オレンジ', '鳥取デューンズ',
  '松江レイクスターズ', '岡山ピーチズ', '広島カープレッド', '山口チョウシュウ',
  '徳島ボルテックス', '高松オリーブス', '松山ボッチャンズ', '高知ホエールズ',
  '北九州コークス', '福岡サンダーホークス', '久留米ブリッジ', '佐賀バルーンズ',
  '長崎ランタンズ', '熊本ヴォルカノ', '大分スプリングス', '宮崎サンシャイン',
  '鹿児島サツマズ', '那覇ハイビスカス', '帝都ブラックナイツ', '浪速サイボーグス',
  '武蔵プレデターズ', '駿河ウォーリアーズ', '黄金期ライオンハート', '信州ファントムズ',
  '陸奥サイクロン', '越後ブリザード', '尾張シャチホコ', '安芸タイガーズ',
  '博多どんたくクラブ', '琉球ドラゴンズ', '深淵ヴォイド', '漆黒の黙示録',
  '神話ヘラクレス', '天空ヴァルキリーズ', '冥府ケルベロス', '白銀のオリオン',
  '紅蓮のプロメテウス', '蒼穹のポセイドン', '覇道ウォーリアーズ', '雷帝ゼウス',
  '不滅のフェニックス', '超越のエクスカリバー', '創世のジェネシス', '終焉のラグナロク',
  '極北のアイスタイタン', '灼熱のボルケーノ', '無限のインフィニティ', '金剛デストロイヤー',
  '暗黒のブラックホール', '彗星のコメットスターズ', '銀河のスターダスト', '太陽のソルレックス',
  '絶対防衛アイアンウォール', '神速のスピードスターズ', '魔導のアルケミスト', '幻影のミラージュ',
  '天下無双サムライジャパン', '球聖レジェンズ', '極限のアルティメット'
];

export function getStageInfo(stage: number): PostseasonStageInfo {
  const isFinal = stage === 103;
  const isSemifinal = stage === 102;
  const isQuarterfinal = stage === 101;
  const isRound100 = stage === 100;

  let name = `第${stage}回戦`;
  let tierLabel = '地方予選';
  let isBoss = false;

  if (isFinal) {
    name = '決勝';
    tierLabel = '最高峰ファイナル';
    isBoss = true;
  } else if (isSemifinal) {
    name = '準決勝';
    tierLabel = '頂上決戦';
    isBoss = true;
  } else if (isQuarterfinal) {
    name = '準々決勝';
    tierLabel = '世界選抜ステージ';
    isBoss = true;
  } else if (isRound100) {
    name = '第100回戦';
    tierLabel = '最上階層・最終関門';
    isBoss = true;
  } else if (stage >= 90) {
    tierLabel = '極限の深淵';
    if (stage === 99) isBoss = true;
  } else if (stage >= 70) {
    tierLabel = '猛者選抜';
    if (stage % 10 === 0) isBoss = true;
  } else if (stage >= 40) {
    tierLabel = '全国トーナメント';
    if (stage % 10 === 0) isBoss = true;
  } else if (stage >= 20) {
    tierLabel = '地区代表決定戦';
    if (stage % 10 === 0) isBoss = true;
  }

  // Opponent naming
  let opponentName = REGIONAL_TEAMS[(stage - 1) % REGIONAL_TEAMS.length];
  let opponentManager = '名将';
  let opponentColor = '#3B82F6';

  if (isFinal) {
    opponentName = '絶対王者 ギャラクシー・パーフェクト・ナイツ';
    opponentManager = '球聖 総帥';
    opponentColor = '#F59E0B';
  } else if (isSemifinal) {
    opponentName = '球聖集う頂 ゴッド・ベースボール・キングダム';
    opponentManager = '神代監督';
    opponentColor = '#8B5CF6';
  } else if (isQuarterfinal) {
    opponentName = '世界選抜 オール・ワールド・レジェンズ';
    opponentManager = 'マック・プレジデント';
    opponentColor = '#EC4899';
  } else if (isRound100) {
    opponentName = '最上階層の門番 冥王ハーデスイレブン';
    opponentManager = '冥王ハデス';
    opponentColor = '#EF4444';
  } else if (stage === 99) {
    opponentName = '深淵の超越神 ヴォイド・ネビュラ';
    opponentManager = 'ヴォイド監督';
    opponentColor = '#6366F1';
  }

  // Difficulty scaling (1 to 10+)
  const difficultyRating = Math.min(10, Math.max(1, Math.floor(stage / 10) + 1));

  // First Clear Reward Calculation
  let gerda = 800 + stage * 500;
  let pitcherTickets = 0;
  let fielderTickets = 0;
  let renameTickets = 0;
  let skillId: SkillId | undefined = undefined;
  let title: string | undefined = undefined;

  // Specific milestone rewards
  if (isFinal) {
    gerda = 600000;
    pitcherTickets = 15;
    fielderTickets = 15;
    renameTickets = 15;
    skillId = '完全試合';
    title = 'ポストシーズン初代完全制覇王者';
  } else if (isSemifinal) {
    gerda = 300000;
    pitcherTickets = 8;
    fielderTickets = 8;
    renameTickets = 8;
    skillId = 'サヨナラ劇場の主';
  } else if (isQuarterfinal) {
    gerda = 200000;
    pitcherTickets = 6;
    fielderTickets = 6;
    renameTickets = 6;
    skillId = 'マダックス・極';
  } else if (isRound100) {
    gerda = 150000;
    pitcherTickets = 5;
    fielderTickets = 5;
    renameTickets = 5;
    skillId = '怪物';
  } else if (stage === 99) {
    gerda = 100000;
    pitcherTickets = 4;
    fielderTickets = 4;
    renameTickets = 4;
  } else if (stage % 25 === 0) {
    gerda = stage * 1500;
    renameTickets = 3;
    pitcherTickets = 3;
    fielderTickets = 3;
    if (stage === 50) skillId = '怪童';
    if (stage === 75) skillId = 'アーチスト';
  } else if (stage % 10 === 0) {
    gerda = stage * 1000;
    renameTickets = 2;
    pitcherTickets = 2;
    fielderTickets = 2;
  } else if (stage % 5 === 0) {
    pitcherTickets = 1;
    fielderTickets = 1;
    renameTickets = 1;
  } else if (stage % 2 === 0) {
    fielderTickets = 1;
  } else {
    pitcherTickets = 1;
  }

  const descParts: string[] = [`+${gerda.toLocaleString()}G`];
  if (skillId) {
    descParts.push(skillId === '完全試合' ? '最高峰スキル【？？？】' : `最高峰スキル【${skillId}】`);
  }
  if (renameTickets) descParts.push(`改名手形×${renameTickets}`);
  if (pitcherTickets || fielderTickets) descParts.push(`スカウト券(投${pitcherTickets}/野${fielderTickets})`);
  if (title) descParts.push(`称号【${title}】`);

  return {
    stage,
    name,
    tierLabel,
    opponentName,
    opponentManager,
    opponentColor,
    difficultyRating,
    isBoss,
    firstClearReward: {
      gerda,
      pitcherTickets: pitcherTickets || undefined,
      fielderTickets: fielderTickets || undefined,
      renameTickets: renameTickets || undefined,
      skillId,
      title,
      description: descParts.join(' · '),
    },
  };
}

export function initPostseason(team: Team): PostseasonProgress {
  const ps = team.postseason || {
    currentRound: 1,
    highestClearedStage: 0,
    clearedStages: [],
    claimedRewardStages: [],
    isEntered: false,
    totalAttempts: 0,
    championshipCount: 0,
    hasClaimedFinalSkill: false,
  };
  if (!ps.claimedRewardStages) {
    ps.claimedRewardStages = [];
  }
  return ps;
}

// Generate tournament opponent team with smooth progressive strength
export function generatePostseasonOpponent(stage: number): Team {
  const info = getStageInfo(stage);
  const isFinal = stage === 103;
  const isSemifinal = stage === 102;
  const isQuarterfinal = stage === 101;
  const isRound100 = stage === 100;

  // Determine rarity distribution according to stage
  const getFielderRarity = (idx: number): Rarity => {
    const isCleanUp = idx === 3 || idx === 2;
    if (stage >= 100) return '伝説ユニーク';
    if (stage >= 80) return isCleanUp ? '伝説ユニーク' : idx < 5 ? '伝説ユニーク' : 'UR';
    if (stage >= 60) return isCleanUp ? '伝説ユニーク' : idx < 5 ? 'UR' : 'SSR';
    if (stage >= 40) return isCleanUp ? 'UR' : idx < 5 ? 'SSR' : 'SR';
    if (stage >= 20) return isCleanUp ? 'SSR' : idx < 5 ? 'SR' : 'R';
    return isCleanUp ? 'SR' : 'R';
  };

  const getPitcherRarity = (idx: number): Rarity => {
    if (stage >= 100) return '伝説ユニーク';
    if (stage >= 80) return idx === 0 ? '伝説ユニーク' : 'UR';
    if (stage >= 60) return idx === 0 ? 'UR' : 'SSR';
    if (stage >= 40) return idx === 0 ? 'SSR' : 'SR';
    if (stage >= 20) return idx === 0 ? 'SR' : 'R';
    return idx === 0 ? 'R' : 'N';
  };

  const positions: Position[] = ['中', '遊', '左', '一', '三', '右', '二', '捕', '投'];
  const roster: Player[] = [];

  // Fielders (9)
  positions.slice(0, 8).forEach((pos, i) => {
    const r = generatePlayer({ position: '野', number: i + 1, fixedRarity: getFielderRarity(i) });
    roster.push(r);
  });
  // DH (1)
  const dh = generatePlayer({ position: '野', number: 9, fixedRarity: getFielderRarity(8) });
  roster.push(dh);

  // Pitchers (6)
  for (let i = 0; i < 6; i++) {
    const p = generatePlayer({ position: '投', number: 11 + i, fixedRarity: getPitcherRarity(i) });
    p.restGamesRemaining = 0; // Tournament pitchers are always ready
    roster.push(p);
  }

  // Stat buffs & special skills based on difficulty
  const statBonus = Math.min(4, Math.floor(stage / 25));
  roster.forEach(p => {
    p.restGamesRemaining = 0;

    if (p.stats.fielder) {
      p.stats.fielder.meet = Math.min(10, p.stats.fielder.meet + statBonus);
      p.stats.fielder.power = Math.min(10, p.stats.fielder.power + statBonus);
      p.stats.fielder.speed = Math.min(10, p.stats.fielder.speed + statBonus);
      p.stats.fielder.defense = Math.min(10, p.stats.fielder.defense + statBonus);
    }
    if (p.stats.pitcher) {
      p.stats.pitcher.speed = Math.min(10, p.stats.pitcher.speed + statBonus);
      p.stats.pitcher.control = Math.min(10, p.stats.pitcher.control + statBonus);
      p.stats.pitcher.stamina = Math.min(10, p.stats.pitcher.stamina + statBonus);
      p.stats.pitcher.breaking = Math.min(10, p.stats.pitcher.breaking + statBonus);
    }

    // High stage skill assignments
    if (stage >= 70) {
      p.skillSlots = Math.max(p.skillSlots, 3);
      const skillsToAdd: SkillId[] = p.position === '投'
        ? ['超完封', '超火消し男', '剛速球', '奪三振王']
        : ['極本塁打王', '極首位打者', '三冠王', '鉄壁'];

      skillsToAdd.forEach(sk => {
        if (p.skills.length < p.skillSlots && !p.skills.includes(sk)) {
          p.skills.push(sk);
        }
      });
    }

    if (stage >= 100) {
      p.skillSlots = 4;
      const supremeSkills: SkillId[] = p.position === '投'
        ? ['怪物', 'マダックス・極', '絶対零度', '守護神の領域']
        : ['アーチスト', '安打製造機', '神風', '常勝軍団の誇り'];

      supremeSkills.forEach(sk => {
        if (!p.skills.includes(sk) && p.skills.length < p.skillSlots) {
          p.skills.push(sk);
        }
      });

      // Finals ultimate boss gets extra max stats
      if (isFinal) {
        if (p.stats.fielder) {
          p.stats.fielder.meet = 10;
          p.stats.fielder.power = 10;
          p.stats.fielder.speed = 10;
          p.stats.fielder.defense = 10;
        }
        if (p.stats.pitcher) {
          p.stats.pitcher.speed = 10;
          p.stats.pitcher.control = 10;
          p.stats.pitcher.stamina = 10;
          p.stats.pitcher.breaking = 10;
        }
      }
    }
  });

  const lineup = roster.slice(0, 9).map(p => p.id);
  const lineupPositions: Position[] = ['中', '遊', '左', '一', '三', '右', '二', '捕', '指'];
  const pitcherRotation = roster.filter(p => p.position === '投').slice(0, 3).map(p => p.id);
  const bullpen = roster.filter(p => p.position === '投').slice(3, 5).map(p => p.id);
  const closerId = roster.filter(p => p.position === '投')[5]?.id || roster.filter(p => p.position === '投')[0]?.id;

  return {
    id: `postseason_opp_${stage}_${Date.now()}`,
    name: info.opponentName,
    managerName: info.opponentManager,
    color: info.opponentColor,
    gerda: 50000,
    pitcherScoutTickets: 0,
    fielderScoutTickets: 0,
    inventory: {
      skillTickets: 0,
      slotExpandJewels: 0,
      equipments: [],
      ownedSkills: [],
      renameTickets: 0,
    },
    roster,
    lineup,
    lineupPositions,
    benchFielders: roster.filter(p => p.position !== '投' && !lineup.includes(p.id)).slice(0, 5).map(p => p.id),
    pitcherRotation,
    bullpen,
    closerId,
    tactics: {
      stealTendency: '普通',
      buntTendency: '普通',
      pinchHitterTendency: '普通',
      pitcherChangeTendency: '普通',
      substitutionFrequency: '普通',
    },
    isUser: false,
  };
}

// Claim first-clear reward for a stage
export function claimPostseasonReward(team: Team, stage: number): { updatedTeam: Team; rewardSummary: string } {
  const info = getStageInfo(stage);
  const r = info.firstClearReward;

  const nextInventory = { ...team.inventory };
  nextInventory.renameTickets = (nextInventory.renameTickets || 0) + (r.renameTickets || 0);

  const nextOwnedSkills = [...(nextInventory.ownedSkills || [])];
  if (r.skillId && !nextOwnedSkills.includes(r.skillId)) {
    nextOwnedSkills.push(r.skillId);
  }
  nextInventory.ownedSkills = nextOwnedSkills;

  const currentTitles = [...(team.championshipTitles || [])];
  if (r.title && !currentTitles.includes(r.title)) {
    currentTitles.push(r.title);
  }

  const ps = initPostseason(team);
  const nextClearedStages = ps.clearedStages.includes(stage)
    ? ps.clearedStages
    : [...ps.clearedStages, stage];

  const currentClaimed = ps.claimedRewardStages || [];
  const nextClaimedStages = currentClaimed.includes(stage)
    ? currentClaimed
    : [...currentClaimed, stage];

  let nextChampionshipCount = ps.championshipCount || 0;
  let nextHasClaimedFinalSkill = ps.hasClaimedFinalSkill || false;
  if (stage === 103) {
    nextChampionshipCount += 1;
    nextHasClaimedFinalSkill = true;
  }

  let updatedTeam: Team = {
    ...team,
    gerda: team.gerda + r.gerda,
    pitcherScoutTickets: team.pitcherScoutTickets + (r.pitcherTickets || 0),
    fielderScoutTickets: team.fielderScoutTickets + (r.fielderTickets || 0),
    inventory: nextInventory,
    championshipTitles: currentTitles,
    postseason: {
      ...ps,
      clearedStages: nextClearedStages,
      claimedRewardStages: nextClaimedStages,
      highestClearedStage: Math.max(ps.highestClearedStage, stage),
      championshipCount: nextChampionshipCount,
      hasClaimedFinalSkill: nextHasClaimedFinalSkill,
    },
  };

  updatedTeam = addActivityLog(
    updatedTeam,
    `ポストシーズン【${info.name}】初回制覇報酬獲得: ${r.description}`,
    'match'
  );

  return {
    updatedTeam,
    rewardSummary: r.description,
  };
}

// Reconcile and grant missing first-clear rewards for previously cleared stages (automatic compensation)
export function reconcilePostseasonRewards(team: Team): { updatedTeam: Team; recoveredAmount: number; recoveredStages: number[] } {
  const ps = initPostseason(team);
  const cleared = ps.clearedStages || [];
  const claimed = ps.claimedRewardStages || [];

  const unclaimedStages = cleared.filter(s => !claimed.includes(s));
  if (unclaimedStages.length === 0) {
    return { updatedTeam: team, recoveredAmount: 0, recoveredStages: [] };
  }

  let totalGerda = 0;
  let totalPitcherTickets = 0;
  let totalFielderTickets = 0;
  let totalRenameTickets = 0;
  const newOwnedSkills = [...(team.inventory?.ownedSkills || [])];
  const newTitles = [...(team.championshipTitles || [])];

  for (const st of unclaimedStages) {
    const info = getStageInfo(st);
    const r = info.firstClearReward;
    totalGerda += r.gerda;
    totalPitcherTickets += r.pitcherTickets || 0;
    totalFielderTickets += r.fielderTickets || 0;
    totalRenameTickets += r.renameTickets || 0;
    if (r.skillId && !newOwnedSkills.includes(r.skillId)) {
      newOwnedSkills.push(r.skillId);
    }
    if (r.title && !newTitles.includes(r.title)) {
      newTitles.push(r.title);
    }
  }

  const nextInventory = {
    ...team.inventory,
    renameTickets: (team.inventory?.renameTickets || 0) + totalRenameTickets,
    ownedSkills: newOwnedSkills,
  };

  const nextClaimed = [...claimed, ...unclaimedStages];

  let updatedTeam: Team = {
    ...team,
    gerda: team.gerda + totalGerda,
    pitcherScoutTickets: team.pitcherScoutTickets + totalPitcherTickets,
    fielderScoutTickets: team.fielderScoutTickets + totalFielderTickets,
    inventory: nextInventory,
    championshipTitles: newTitles,
    postseason: {
      ...ps,
      claimedRewardStages: nextClaimed,
    },
  };

  updatedTeam = addActivityLog(
    updatedTeam,
    `ポストシーズン: 未反映だった初回制覇報酬（+${totalGerda.toLocaleString()}G / スカウト券等）を正常に補填・反映しました。`,
    'system'
  );

  return {
    updatedTeam,
    recoveredAmount: totalGerda,
    recoveredStages: unclaimedStages,
  };
}
