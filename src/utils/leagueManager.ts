import { League, Team, Standing, SeasonHistory, Player, Position, Rarity, LEAGUE_DIFFICULTIES, ChampionshipRewardInfo, SkillId, getLeagueDifficulty, getUnlockedDifficulties } from '../types/baseball';
import { generatePlayer, CHAMPION_EXCLUSIVE_EQUIPMENTS } from './playerGenerator';

export interface CpuTeamMeta {
  name: string;
  manager: string;
  color: string;
  isMlb?: boolean;
}

export const DOMESTIC_CPU_TEAMS_DATA: CpuTeamMeta[] = [
  { name: '大阪レッドサンダース', manager: '掛布監督', color: '#DC2626' },
  { name: '横浜ベイビースト', manager: '権藤監督', color: '#0284C7' },
  { name: '福岡ゴールデンフェニックス', manager: '秋山監督', color: '#D97706' },
  { name: '名古屋ドラゴンブレイド', manager: '落合監督', color: '#7C3AED' },
  { name: '札幌フロストファング', manager: '栗山監督', color: '#059669' },
  { name: '東京インフィニティ', manager: '王監督', color: '#E11D48' },
  { name: '仙台クリムゾンホークス', manager: '野村監督', color: '#B91C1C' },
  { name: '広島スカーレットカープ', manager: '緒方監督', color: '#C2410C' },
  { name: '兵庫タイタンズ', manager: '岡田監督', color: '#CA8A04' },
  { name: '千葉シーガルズ', manager: 'バレンタイン監督', color: '#0D9488' },
  { name: '埼玉エメラルドライオンズ', manager: '辻監督', color: '#16A34A' },
  { name: '京都ブラックフェザー', manager: '星野監督', color: '#1E293B' },
  { name: '神戸ブルーウェーブス', manager: '仰木監督', color: '#2563EB' },
  { name: '静岡フジサンサンズ', manager: '江川監督', color: '#EA580C' },
  { name: '新潟スノーウルフ', manager: '原監督', color: '#475569' },
  { name: '熊本ヒノクニブレイブス', manager: '秋山監督', color: '#BE123C' },
  { name: '沖縄コーラルオーシャンズ', manager: '新庄監督', color: '#06B6D4' },
  { name: '岡山ピーチスターズ', manager: '高橋監督', color: '#EC4899' },
  { name: '愛媛マンダリンキングス', manager: '工藤監督', color: '#F97316' },
  { name: '長野アルプスベアーズ', manager: '伊原監督', color: '#4B5563' },
  { name: '金沢ゴールドカイザーズ', manager: '松井監督', color: '#EAB308' },
  { name: '栃木ブレイブブルズ', manager: '真中監督', color: '#854D0E' },
  { name: '群馬ボルテックス', manager: '梨田監督', color: '#9333EA' },
  { name: '鹿児島サツマスピリッツ', manager: '稲尾監督', color: '#991B1B' },
  { name: '青森アップルナイツ', manager: '福本監督', color: '#DC2626' },
  { name: '奈良ディアクラウン', manager: '大石監督', color: '#92400E' },
  { name: '滋賀レイクシャークス', manager: '田淵監督', color: '#0284C7' },
  { name: '三重パールマリーンズ', manager: '中畑監督', color: '#0891B2' },
  { name: '山形チェリーボンバーズ', manager: '佐々木監督', color: '#DB2777' },
  { name: '岩手イーグルス', manager: '菊池監督', color: '#4338CA' },
  { name: '宮崎サンシャインズ', manager: '小久保監督', color: '#F59E0B' },
  { name: '山口チョウシュウライオンズ', manager: '山本監督', color: '#15803D' },
];

export const MAJOR_LEAGUE_CPU_TEAMS_DATA: CpuTeamMeta[] = [
  { name: 'ニューヨーク・エンパイア', manager: 'ブーン監督', color: '#0F172A', isMlb: true },
  { name: 'ロサンゼルス・コズモスターズ', manager: 'ロバーツ監督', color: '#1D4ED8', isMlb: true },
  { name: 'ボストン・レッドクラウン', manager: 'コーラ監督', color: '#B91C1C', isMlb: true },
  { name: 'シカゴ・ウインドキングス', manager: 'カウンセル監督', color: '#0369A1', isMlb: true },
  { name: 'ヒューストン・アストロナイツ', manager: 'エスパーダ監督', color: '#EA580C', isMlb: true },
  { name: 'アトランタ・ブレイズ', manager: 'スニッカー監督', color: '#DC2626', isMlb: true },
  { name: 'サンフランシスコ・ゴールドラッシュ', manager: 'メルビン監督', color: '#C2410C', isMlb: true },
  { name: 'シアトル・マリナーエクスプレス', manager: 'サービス監督', color: '#0F766E', isMlb: true },
  { name: 'トロント・ブルージェイズ', manager: 'シュナイダー監督', color: '#2563EB', isMlb: true },
  { name: 'フィラデルフィア・リバティーズ', manager: 'トムソン監督', color: '#E11D48', isMlb: true },
  { name: 'サンディエゴ・パドレス', manager: 'シルト監督', color: '#78350F', isMlb: true },
  { name: 'セントルイス・カーディナルス', manager: 'マーモル監督', color: '#991B1B', isMlb: true },
  { name: 'テキサス・レンジャーズ', manager: 'ボウチー監督', color: '#1E40AF', isMlb: true },
  { name: 'ボルチモア・オリオールズ', manager: 'ハイド監督', color: '#F97316', isMlb: true },
  { name: 'タンパベイ・レイズ', manager: 'キャッシュ監督', color: '#0284C7', isMlb: true },
];

export function generateLeagueCpuTeams(difficulty: number, userTeamName?: string): Team[] {
  let pool = DOMESTIC_CPU_TEAMS_DATA;
  if (difficulty % 10 === 0) {
    // 難易度10, 20, 30... 100: メジャーリーグ
    pool = MAJOR_LEAGUE_CPU_TEAMS_DATA;
  } else if (difficulty > 10) {
    // 難易度11以上: メジャー選抜と国内最強チームの混合
    pool = [...MAJOR_LEAGUE_CPU_TEAMS_DATA, ...DOMESTIC_CPU_TEAMS_DATA];
  }

  // ユーザーチーム名を除外し、シャッフル
  const available = pool.filter(t => t.name !== userTeamName);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const chosen5 = shuffled.slice(0, 5);

  return chosen5.map((meta, idx) => createCpuTeam(idx, difficulty, meta));
}

export function createCpuTeam(index: number, difficulty: number = 1, teamMeta?: CpuTeamMeta): Team {
  const isMlb = difficulty % 10 === 0;
  let meta = teamMeta;
  if (!meta) {
    const pool = isMlb ? MAJOR_LEAGUE_CPU_TEAMS_DATA : (difficulty > 10 ? [...MAJOR_LEAGUE_CPU_TEAMS_DATA, ...DOMESTIC_CPU_TEAMS_DATA] : DOMESTIC_CPU_TEAMS_DATA);
    meta = pool[index % pool.length];
  }

  const positions: ('投' | '捕' | '一' | '二' | '三' | '遊' | '左' | '中' | '右')[] = [
    '中', '遊', '左', '一', '三', '右', '二', '捕', '投'
  ];

  const getFielderRarity = (posIdx: number): Rarity => {
    if (difficulty >= 7) return '伝説ユニーク';
    const isCleanUp = posIdx === 3 || posIdx === 2; // 3・4番
    if (difficulty === 1) return isCleanUp ? 'SSR' : (posIdx < 5 ? 'SR' : 'R');
    if (difficulty === 2) return isCleanUp ? 'UR' : (posIdx < 5 ? 'SSR' : 'SR');
    if (difficulty === 3) return isCleanUp ? '伝説ユニーク' : (posIdx < 5 ? 'UR' : 'SSR');
    if (difficulty === 4) return isCleanUp ? '伝説ユニーク' : (posIdx < 5 ? '伝説ユニーク' : 'UR');
    if (difficulty === 5) return isCleanUp ? '伝説ユニーク' : (posIdx < 6 ? '伝説ユニーク' : 'UR');
    return '伝説ユニーク';
  };

  const getPitcherRarity = (pitcherIdx: number): Rarity => {
    if (difficulty >= 7) return '伝説ユニーク';
    if (difficulty === 1) return pitcherIdx < 2 ? 'SSR' : 'SR';
    if (difficulty === 2) return pitcherIdx < 2 ? 'UR' : 'SSR';
    if (difficulty === 3) return pitcherIdx === 0 ? '伝説ユニーク' : (pitcherIdx < 3 ? 'UR' : 'SSR');
    if (difficulty === 4) return pitcherIdx < 2 ? '伝説ユニーク' : 'UR';
    if (difficulty === 5) return pitcherIdx < 3 ? '伝説ユニーク' : 'UR';
    return '伝説ユニーク';
  };

  // 外国人比率: 10ごとのメジャーリーグは90%が外国人スーパースター！
  const foreignChance = isMlb ? 0.90 : (difficulty > 10 ? 0.70 : (difficulty >= 7 ? 0.45 : 0.20));

  // 難易度7以降の大幅強化スケーリング
  let statBoost = 0;
  if (difficulty === 6) statBoost = 1;
  else if (difficulty === 7) statBoost = 2;
  else if (difficulty === 8) statBoost = 3;
  else if (difficulty === 9) statBoost = 4;
  else if (difficulty >= 10) {
    const majorTier = Math.floor(difficulty / 10);
    const remainder = difficulty % 10;
    statBoost = 4 + majorTier + Math.floor(remainder * 0.4);
  }

  const roster: Player[] = [];
  // 野手9名
  positions.slice(0, 8).forEach((pos, i) => {
    const r = generatePlayer({
      position: '野',
      number: i + 1,
      fixedRarity: getFielderRarity(i),
      isForeign: Math.random() < foreignChance,
      isMajorLeague: isMlb,
      statBoost,
    });
    roster.push(r);
  });
  // 指名打者
  const dh = generatePlayer({
    position: '野',
    number: 9,
    fixedRarity: getFielderRarity(8),
    isForeign: Math.random() < foreignChance,
    isMajorLeague: isMlb,
    statBoost,
  });
  roster.push(dh);

  // 投手6名 (第一先発, 第二先発, 第三先発, 中継ぎ2名, 抑え1名)
  for (let i = 0; i < 6; i++) {
    const p = generatePlayer({
      position: '投',
      number: 11 + i,
      fixedRarity: getPitcherRarity(i),
      isForeign: Math.random() < foreignChance,
      isMajorLeague: isMlb,
      statBoost,
    });
    p.restGamesRemaining = 0;
    roster.push(p);
  }

  // 難易度に応じた追加スキル＆ステータス調整（レベル7以降を大幅強化）
  roster.forEach(p => {
    if (difficulty === 5) {
      p.skillSlots = Math.max(p.skillSlots, 3);
      const batterSkillsPool = ['スラッガー', 'お立ち台', 'チャンス', '満塁神', 'ヒーロー', '鉄壁', '極爆肩'];
      const pitcherSkillsPool = ['超完封', '超火消し男', 'リリーバー', 'イニングイーター', '立ち上がり'];

      const targetPool = p.position === '投' ? pitcherSkillsPool : batterSkillsPool;
      targetPool.forEach(sk => {
        if (p.skills.length < p.skillSlots && !p.skills.includes(sk as any)) {
          p.skills.push(sk as any);
        }
      });
    } else if (difficulty === 6) {
      p.skillSlots = 4;
      const batterSkillsPool = ['極本塁打王', '極首位打者', '三冠王', '満塁神', '極爆肩', '潮目', '鉄壁'];
      const pitcherSkillsPool = ['超火消し男', '超完封', 'イニングイーター', 'リリーバー', '潮目', '神の手'];

      const targetPool = p.position === '投' ? pitcherSkillsPool : batterSkillsPool;
      targetPool.forEach(sk => {
        if (p.skills.length < p.skillSlots && !p.skills.includes(sk as any)) {
          p.skills.push(sk as any);
        }
      });

      if (p.stats.fielder) {
        p.stats.fielder.meet = Math.min(10, p.stats.fielder.meet + 1);
        p.stats.fielder.power = Math.min(10, p.stats.fielder.power + 1);
        p.stats.fielder.speed = Math.min(10, p.stats.fielder.speed + 1);
        p.stats.fielder.defense = Math.min(10, p.stats.fielder.defense + 1);
      }
      if (p.stats.pitcher) {
        p.stats.pitcher.speed = Math.min(10, p.stats.pitcher.speed + 1);
        p.stats.pitcher.control = Math.min(10, p.stats.pitcher.control + 1);
        p.stats.pitcher.stamina = Math.min(10, p.stats.pitcher.stamina + 1);
        p.stats.pitcher.breaking = Math.min(10, p.stats.pitcher.breaking + 1);
      }
    } else if (difficulty >= 7) {
      // 難易度7以上：スキル枠を4〜5枠に拡張、超強力金特スキルをフル搭載！
      p.skillSlots = difficulty >= 10 ? 5 : 4;
      const batterSkillsPool = isMlb
        ? ['アーチスト', '怪物', '覇王の威圧感', '不動の四番', '神速スプリンター', '極本塁打王', 'ハンク・アーロン賞⭐︎6', '満塁神', '超人の威圧', '勝利への号令', '奇跡のビッグイニング']
        : ['極本塁打王', '極首位打者', '三冠王⭐︎6', '満塁神', '極爆肩', '潮目', '鉄壁', 'アーチスト', '怪物', '覇王の威圧感', '不動の四番'];
      const pitcherSkillsPool = isMlb
        ? ['ドクターK', '怪物', '守護神の領域', 'マダックス・極', '金剛不壊', 'サイ・ヤング賞⭐︎6', '超火消し男', '超完封', '完全試合', '勝利への号令', '鉄壁の要塞']
        : ['超火消し男', '超完封', 'イニングイーター', 'リリーバー', '潮目', '神の手', 'ドクターK', '怪物', '守護神の領域', 'マダックス・極', '金剛不壊'];

      const targetPool = p.position === '投' ? pitcherSkillsPool : batterSkillsPool;
      targetPool.forEach(sk => {
        if (p.skills.length < p.skillSlots && !p.skills.includes(sk as any)) {
          p.skills.push(sk as any);
        }
      });

      // 難易度7以上の能力値直接底上げ（10の上限を解放し、怪物級の能力に到達）
      const extraBoost = Math.max(1, statBoost - 1);
      if (p.stats.fielder) {
        p.stats.fielder.meet += extraBoost;
        p.stats.fielder.power += extraBoost;
        p.stats.fielder.speed += Math.floor(extraBoost * 0.8);
        p.stats.fielder.defense += Math.floor(extraBoost * 0.8);
        p.stats.fielder.trajectory = Math.min(4, Math.max(3, (p.stats.fielder.trajectory || 2) + 1));

        // 難易度7以上は強力装備も装着
        const isCleanUp = (p.number === 3 || p.number === 4);
        p.equipment = isCleanUp
          ? { id: `eq_cpu_${p.id}`, name: '黄金のトルピードバット', type: 'バット', description: '伝説の打撃装備', effectLabel: 'ミート+2 パワー+2', price: 50000 }
          : { id: `eq_cpu_${p.id}`, name: '真・スラッガーバット', type: 'バット', description: '破壊的打撃装備', effectLabel: 'パワー+3', price: 30000 };
      }
      if (p.stats.pitcher) {
        p.stats.pitcher.speed += extraBoost;
        p.stats.pitcher.control += extraBoost;
        p.stats.pitcher.stamina += extraBoost;
        p.stats.pitcher.breaking += extraBoost;

        // 投手用強力装備
        p.equipment = { id: `eq_cpu_${p.id}`, name: '覇王のグラブ', type: 'グラブ', description: '剛腕を支える神話グラブ', effectLabel: '球速+1 制球+2', price: 60000 };
      }
    }
  });

  const lineup = roster.slice(0, 9).map(p => p.id);
  const lineupPositions: Position[] = ['中', '遊', '左', '一', '三', '右', '二', '捕', '指'];
  const pitchers = roster.filter(p => p.position === '投');

  return {
    id: `cpu_${index}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: meta.name,
    managerName: meta.manager,
    color: meta.color,
    gerda: 20000,
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
    pitcherRotation: [pitchers[0].id, pitchers[1].id, pitchers[2].id],
    bullpen: [pitchers[3].id, pitchers[4].id],
    closerId: pitchers[5]?.id || pitchers[0].id,
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

export function createInitialLeague(userTeam: Team, difficulty: number = 1): League {
  const diff = Math.max(1, Math.min(100, difficulty));
  const cpuTeams = generateLeagueCpuTeams(diff, userTeam.name);
  const teams = [userTeam, ...cpuTeams];

  const standings: Standing[] = teams.map(t => ({
    teamId: t.id,
    teamName: t.name,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0.000,
    gamesBehind: 0,
    runsScored: 0,
    runsAllowed: 0,
  }));

  return {
    season: 1,
    totalGames: 72, // 1シーズン72試合制
    playedGames: 0,
    teams,
    standings,
    seasonHistory: [],
    difficulty: diff,
    maxUnlockedDifficulty: userTeam.maxUnlockedDifficulty || 1,
  };
}

/**
 * 勝率をNPB公式表記に整形（例: 1.000, .583, .000）
 */
export function formatWinRate(wr: number): string {
  if (isNaN(wr) || wr <= 0) return '.000';
  if (wr >= 1) return '1.000';
  const str = wr.toFixed(3);
  return str.startsWith('0') ? str.slice(1) : str;
}

/**
 * 打率をNPB公式表記に整形（例: 1.000, .312, .000）
 */
export function formatBattingAvg(avg: number): string {
  if (isNaN(avg) || avg <= 0) return '.000';
  if (avg >= 1) return '1.000';
  const str = avg.toFixed(3);
  return str.startsWith('0') ? str.slice(1) : str;
}

// 順位表更新（全球団ID・名称の完全整合、勝敗数・試合数・引き分け数・勝率の厳密計算とNPB公認タイブレーク）
export function calculateStandings(league: League): Standing[] {
  const teams = league.teams || [];
  const existingStandings = league.standings || [];

  // 全参加球団を1対1で確実にマッピング（IDの変更や球団名変更、欠落を完全補正）
  const standingsForTeams: Standing[] = teams.map(team => {
    // 1. teamIdによる完全一致
    let match = existingStandings.find(s => s.teamId === team.id);

    // 2. teamIdが一致しない場合、球団名またはユーザーフラグで照合救済
    if (!match) {
      if (team.isUser) {
        match = existingStandings.find(s => {
          const t = teams.find(tm => tm.id === s.teamId);
          return t?.isUser || s.teamName === team.name;
        });
      } else {
        match = existingStandings.find(s => s.teamName === team.name);
      }
    }

    const w = Math.max(0, isNaN(match?.wins ?? 0) ? 0 : (match?.wins ?? 0));
    const l = Math.max(0, isNaN(match?.losses ?? 0) ? 0 : (match?.losses ?? 0));
    const d = Math.max(0, isNaN(match?.draws ?? 0) ? 0 : (match?.draws ?? 0));
    // 試合数は必ず「勝 + 敗 + 分」の合計と一致させる（データの乖離を防止）
    const g = w + l + d;
    // 勝率は NPB公認規則通り「勝数 ÷ (勝数 + 負数)」、引き分けは分母から除外
    const decided = w + l;
    const wr = decided > 0 ? w / decided : 0;
    const rs = Math.max(0, isNaN(match?.runsScored ?? 0) ? 0 : (match?.runsScored ?? 0));
    const ra = Math.max(0, isNaN(match?.runsAllowed ?? 0) ? 0 : (match?.runsAllowed ?? 0));

    return {
      teamId: team.id,
      teamName: team.name, // 最新の球団名に常に同期
      games: g,
      wins: w,
      losses: l,
      draws: d,
      winRate: wr,
      runsScored: rs,
      runsAllowed: ra,
      gamesBehind: 0,
    };
  });

  // NPB公認順位決定規則によるソート:
  // 1. 勝率（降順）
  // 2. 勝利数（降順）
  // 3. 得失点差（降順）
  // 4. 総得点（降順）
  standingsForTeams.sort((a, b) => {
    if (Math.abs(b.winRate - a.winRate) > 0.00001) return b.winRate - a.winRate;
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.runsScored - a.runsAllowed;
    const diffB = b.runsScored - b.runsAllowed;
    if (diffB !== diffA) return diffB - diffA;
    return b.runsScored - a.runsScored;
  });

  // 首位からのゲーム差（GB: ((首位勝数 - 自勝数) + (自負数 - 首位負数)) / 2）
  const leader = standingsForTeams[0];
  standingsForTeams.forEach((s, idx) => {
    if (idx === 0 || !leader) {
      s.gamesBehind = 0;
    } else {
      const gb = ((leader.wins - s.wins) + (s.losses - leader.losses)) / 2;
      s.gamesBehind = Math.max(0, isNaN(gb) ? 0 : gb);
    }
  });

  return standingsForTeams;
}

export interface MagicNumberInfo {
  isLit: boolean;          // マジック点灯中か
  magicNumber: number;     // 残りマジック数 (例: 12)
  targetTeamName?: string; // 対象球団（自力優勝を阻止しうる最大勝率球団）
  isClinched: boolean;     // 優勝決定したか
}

/**
 * 実際のプロ野球（NPB公認規則）に準拠した優勝マジックナンバー計算
 * 首位チームが自力で優勝を決定できる条件が整った場合に点灯し、
 * 首位の勝利または対象ライバル球団の敗戦でカウントが減少します。
 */
export function calculateMagicNumber(league: League): MagicNumberInfo | null {
  const standings = calculateStandings(league);
  if (!standings || standings.length < 2) return null;
  const leader = standings[0];
  const totalGames = league.totalGames || 72;

  const leaderPlayed = leader.games;
  const leaderRemaining = Math.max(0, totalGames - leaderPlayed);

  // リーグ開始前
  if (leaderPlayed === 0) return null;

  // 全日程終了、または首位の残り試合が0
  if (leaderRemaining === 0) {
    return {
      isLit: false,
      magicNumber: 0,
      isClinched: true,
    };
  }

  // 首位の分母（引き分け除外）: NPBでは「全試合数 - 首位の引き分け数」
  const leaderDenom = Math.max(1, totalGames - leader.draws);

  let maxReqWins = -999;
  let targetTeam: Standing | undefined;

  // 他の全参加球団に対して必要な勝利数を計算
  for (let i = 1; i < standings.length; i++) {
    const opp = standings[i];
    const oppRemaining = Math.max(0, totalGames - opp.games);

    // 相手が残り全試合に勝利した場合の最大勝数
    const oppMaxWins = opp.wins + oppRemaining;
    const oppDecided = oppMaxWins + opp.losses;
    const oppMaxWinRate = oppDecided > 0 ? oppMaxWins / oppDecided : 0;

    // 首位が相手の最大勝率を上回るために必要な自勝数 x
    // (leader.wins + x) / leaderDenom > oppMaxWinRate
    const threshold = oppMaxWinRate * leaderDenom;
    let reqWins = Math.floor(threshold - leader.wins) + 1;
    if (reqWins < 0) reqWins = 0; // 自力で既に逆転不可能な差をつけている

    if (reqWins > maxReqWins) {
      maxReqWins = reqWins;
      targetTeam = opp;
    }
  }

  // 全ライバル球団に対して必要な勝利数が 0 以下なら既に優勝確定
  if (maxReqWins <= 0) {
    return {
      isLit: false,
      magicNumber: 0,
      isClinched: true,
    };
  }

  // NPBマジック点灯条件:
  // 1. 首位であること
  // 2. 必要な勝利数（マジック）が首位自身の残り試合数以下であること（自力優勝可能）
  // 3. 表示が早すぎるのを防ぐため、マジック20以下（M20〜M1）から点灯表示する
  const isLit = maxReqWins <= leaderRemaining && maxReqWins <= 20;

  return {
    isLit,
    magicNumber: maxReqWins,
    targetTeamName: targetTeam?.teamName,
    isClinched: false,
  };
}

// 個人タイトルリーダーの計算（規定打席・規定投球回を適用）
export function getLeagueLeaders(teams: Team[]) {
  const maxTeamGames = Math.max(
    1,
    ...teams.map(t => Math.max(...t.roster.map(p => p.record.games), 0))
  );

  // 規定打席: 試合数 × 2.7 (NPB公認野球規則準拠・最低3打席)
  const qualifyingAtBats = Math.max(3, Math.floor(maxTeamGames * 2.7));
  // 規定投球回: 試合数 × 1.0 (最低3回、NPB公認野球規則に準拠)
  const qualifyingInnings = Math.max(3, Math.floor(maxTeamGames * 1.0));

  const allBatters: { player: Player; teamName: string; avg: number; ops: number }[] = [];
  const allPitchers: { player: Player; teamName: string; era: number; ip: number; totalOuts: number }[] = [];

  teams.forEach(t => {
    t.roster.forEach(p => {
      if (p.record.atBats > 0) {
        const avg = p.record.hits / p.record.atBats;
        allBatters.push({
          player: p,
          teamName: t.name,
          avg: Math.round(avg * 1000) / 1000,
          ops: 0,
        });
      }
      if (p.record.inningsPitched > 0 || (p.record.outsPitched && p.record.outsPitched > 0)) {
        const totalOuts = p.record.outsPitched ?? Math.round(p.record.inningsPitched * 3);
        const era = totalOuts > 0
          ? (p.record.earnedRuns * 27) / totalOuts
          : (p.record.earnedRuns * 9) / Math.max(0.33, p.record.inningsPitched);
        allPitchers.push({
          player: p,
          teamName: t.name,
          era: Math.round(era * 100) / 100,
          ip: totalOuts / 3,
          totalOuts,
        });
      }
    });
  });

  // 打率リーダー: 規定打席到達者優先
  const qualifiedBatters = allBatters.filter(b => b.player.record.atBats >= qualifyingAtBats);
  const avgPool = qualifiedBatters.length > 0 ? qualifiedBatters : allBatters;
  const avgLeaders = [...avgPool].sort((a, b) => b.avg - a.avg).slice(0, 15);

  const hrLeaders = [...allBatters].sort((a, b) => b.player.record.homeRuns - a.player.record.homeRuns).slice(0, 15);
  const rbiLeaders = [...allBatters].sort((a, b) => b.player.record.rbi - a.player.record.rbi).slice(0, 15);
  const stealLeaders = [...allBatters].sort((a, b) => b.player.record.stolenBases - a.player.record.stolenBases).slice(0, 15);

  // 防御率リーダー: 規定投球回到達者優先 (規定未満の場合は一定以上投げている投手)
  const qualifiedPitchers = allPitchers.filter(p => p.ip >= qualifyingInnings);
  const halfQualifiedPitchers = allPitchers.filter(p => p.ip >= Math.max(2, Math.floor(qualifyingInnings * 0.5)));
  const eraPool = qualifiedPitchers.length > 0
    ? qualifiedPitchers
    : halfQualifiedPitchers.length > 0
    ? halfQualifiedPitchers
    : allPitchers.filter(p => p.ip >= 1);
  const eraLeaders = [...(eraPool.length > 0 ? eraPool : allPitchers)].sort((a, b) => {
    if (a.era !== b.era) return a.era - b.era;
    return b.ip - a.ip; // 同率なら投球回数が多い投手を上位に
  }).slice(0, 15);

  // 勝利数リーダー: 最多勝 (同数の場合は防御率が良い方を優先)
  const winLeaders = [...allPitchers].sort((a, b) => {
    if (b.player.record.wins !== a.player.record.wins) {
      return b.player.record.wins - a.player.record.wins;
    }
    return a.era - b.era;
  }).slice(0, 15);

  // 奪三振リーダー: 最多奪三振 (同数の場合は防御率が良い方を優先)
  const soLeaders = [...allPitchers].sort((a, b) => {
    if (b.player.record.pitchStrikeouts !== a.player.record.pitchStrikeouts) {
      return b.player.record.pitchStrikeouts - a.player.record.pitchStrikeouts;
    }
    return a.era - b.era;
  }).slice(0, 15);

  // セーブリーダー: 最多セーブ (同数の場合は防御率が良い方を優先)
  const saveLeaders = [...allPitchers].sort((a, b) => {
    if (b.player.record.saves !== a.player.record.saves) {
      return b.player.record.saves - a.player.record.saves;
    }
    return a.era - b.era;
  }).slice(0, 15);

  return {
    avgLeaders,
    hrLeaders,
    rbiLeaders,
    stealLeaders,
    eraLeaders,
    winLeaders,
    soLeaders,
    saveLeaders,
    qualifyingAtBats,
    qualifyingInnings,
  };
}

// 72試合完了時のシーズン終了・殿堂入り処理
export function concludeSeason(league: League, nextDifficulty?: number): {
  updatedLeague: League;
  historyItem: SeasonHistory;
  unlockedNewDifficulty?: boolean;
  awardedChampionshipTitle?: string;
  championshipRewards?: ChampionshipRewardInfo;
  isChampion?: boolean;
} {
  const standings = calculateStandings(league);
  const champion = standings[0];
  const userTeam = league.teams.find(t => t.isUser) || league.teams[0];
  if (userTeam) userTeam.isUser = true;
  const userRank = standings.findIndex(s => s.teamId === userTeam?.id) + 1;
  const userStanding = standings.find(s => s.teamId === userTeam?.id);

  const leaders = getLeagueLeaders(league.teams);
  const titles: { title: string; playerName: string; teamName?: string; value: string }[] = [];

  const topAvg = leaders.avgLeaders[0];
  const isAvgQualified = topAvg && topAvg.player.record.atBats >= leaders.qualifyingAtBats && topAvg.player.record.hits > 0;
  if (isAvgQualified) {
    titles.push({
      title: '首位打者',
      playerName: topAvg.player.name,
      teamName: topAvg.teamName || '-',
      value: formatBattingAvg(topAvg.avg),
    });
  }

  const topHr = leaders.hrLeaders[0];
  const isHrQualified = topHr && topHr.player.record.homeRuns > 0;
  if (isHrQualified) {
    titles.push({
      title: '本塁打王',
      playerName: topHr.player.name,
      teamName: topHr.teamName || '-',
      value: `${topHr.player.record.homeRuns}本`,
    });
  }

  const topRbi = leaders.rbiLeaders[0];
  const isRbiQualified = topRbi && topRbi.player.record.rbi > 0;
  if (isRbiQualified) {
    titles.push({
      title: '打点王',
      playerName: topRbi.player.name,
      teamName: topRbi.teamName || '-',
      value: `${topRbi.player.record.rbi}打点`,
    });
  }

  const topSteal = leaders.stealLeaders[0];
  const isStealQualified = topSteal && topSteal.player.record.stolenBases > 0;
  if (isStealQualified) {
    titles.push({
      title: '盗塁王',
      playerName: topSteal.player.name,
      teamName: topSteal.teamName || '-',
      value: `${topSteal.player.record.stolenBases}盗塁`,
    });
  }

  const topEra = leaders.eraLeaders[0];
  const isEraQualified = topEra && (topEra.totalOuts / 3) >= leaders.qualifyingInnings;
  if (isEraQualified) {
    titles.push({
      title: '最優秀防御率',
      playerName: topEra.player.name,
      teamName: topEra.teamName || '-',
      value: `${topEra.era.toFixed(2)}`,
    });
  }

  const topWin = leaders.winLeaders[0];
  const isWinQualified = topWin && topWin.player.record.wins > 0;
  if (isWinQualified) {
    titles.push({
      title: '最多勝',
      playerName: topWin.player.name,
      teamName: topWin.teamName || '-',
      value: `${topWin.player.record.wins}勝`,
    });
  }

  const topSo = leaders.soLeaders[0];
  const isSoQualified = topSo && topSo.player.record.pitchStrikeouts > 0;
  if (isSoQualified) {
    titles.push({
      title: '最多奪三振',
      playerName: topSo.player.name,
      teamName: topSo.teamName || '-',
      value: `${topSo.player.record.pitchStrikeouts}個`,
    });
  }

  const topSave = leaders.saveLeaders[0];
  const isSaveQualified = topSave && topSave.player.record.saves > 0;
  if (isSaveQualified) {
    titles.push({
      title: '最多セーブ',
      playerName: topSave.player.name,
      teamName: topSave.teamName || '-',
      value: `${topSave.player.record.saves}S`,
    });
  }

  const diff = league.difficulty || 1;
  const isMajorLeague = diff % 10 === 0 || getLeagueDifficulty(diff).name.includes('メジャーリーグ');

  // 三冠王 / ハンク・アーロン賞 判定: 首位打者・本塁打王・打点王を同一選手が同時に達成した場合
  const isTripleCrown = !!(
    isAvgQualified && isHrQualified && isRbiQualified &&
    topAvg && topHr && topRbi &&
    topAvg.player.id === topHr.player.id &&
    topAvg.player.id === topRbi.player.id
  );

  if (isTripleCrown) {
    const diffStar = Math.min(6, Math.max(1, league.difficulty || 1));
    const awardTitleName = isMajorLeague ? 'ハンク・アーロン賞' : '三冠王';
    const tripleCrownSkillId = isMajorLeague
      ? (`ハンク・アーロン賞⭐︎${diffStar}` as SkillId)
      : (`三冠王⭐︎${diffStar}` as SkillId);
    const tripleCrownPlayerId = topAvg.player.id;
    league.teams.forEach(team => {
      const p = team.roster.find(player => player.id === tripleCrownPlayerId);
      if (p) {
        if (!p.titles.includes(`第${league.season}季 ${awardTitleName}`)) {
          p.titles.unshift(`第${league.season}季 ${awardTitleName}`);
        }
        if (!p.skills.includes(tripleCrownSkillId)) {
          if (p.skills.length < p.skillSlots) {
            p.skills.push(tripleCrownSkillId);
          } else {
            team.inventory.ownedSkills = [...(team.inventory.ownedSkills || []), tripleCrownSkillId];
          }
        }
      }
    });
    titles.unshift({
      title: isMajorLeague ? '👑 ハンク・アーロン賞' : '👑 三冠王',
      playerName: topAvg.player.name,
      teamName: topAvg.teamName,
      value: `打率${formatBattingAvg(topAvg.avg)} / ${topHr.player.record.homeRuns}本 / ${topRbi.player.record.rbi}打点`,
    });
  }

  // 沢村賞 / サイ・ヤング賞 判定: 最多勝・最優秀防御率・最多奪三振を同一投手が同時に達成した場合
  const isSawamura = !!(
    isWinQualified && isEraQualified && isSoQualified &&
    topWin && topEra && topSo &&
    topWin.player.id === topEra.player.id &&
    topWin.player.id === topSo.player.id
  );

  if (isSawamura) {
    const diffStar = Math.min(6, Math.max(1, league.difficulty || 1));
    const awardTitleName = isMajorLeague ? 'サイ・ヤング賞' : '沢村賞';
    const sawamuraSkillId = isMajorLeague
      ? (`サイ・ヤング賞⭐︎${diffStar}` as SkillId)
      : (`沢村賞⭐︎${diffStar}` as SkillId);
    const sawamuraPlayerId = topWin.player.id;
    league.teams.forEach(team => {
      const p = team.roster.find(player => player.id === sawamuraPlayerId);
      if (p) {
        if (!p.titles.includes(`第${league.season}季 ${awardTitleName}`)) {
          p.titles.unshift(`第${league.season}季 ${awardTitleName}`);
        }
        if (!p.skills.includes(sawamuraSkillId)) {
          if (p.skills.length < p.skillSlots) {
            p.skills.push(sawamuraSkillId);
          } else {
            team.inventory.ownedSkills = [...(team.inventory.ownedSkills || []), sawamuraSkillId];
          }
        }
      }
    });
    titles.unshift({
      title: isMajorLeague ? '💎 サイ・ヤング賞' : '💎 沢村賞',
      playerName: topWin.player.name,
      teamName: topWin.teamName,
      value: `${topWin.player.record.wins}勝 / 防御率${topEra.era.toFixed(2)} / ${topSo.player.record.pitchStrikeouts}奪三振`,
    });
  }

  // タイトル受賞歴を選手データに記録 ＆ 該当選手にリーグ難易度に応じた星付きタイトルスキル(⭐︎1〜⭐︎6)を授与
  const diffStar = Math.min(6, Math.max(1, league.difficulty || 1));
  const titleToSkillMap: Record<string, SkillId> = {
    '首位打者': `首位打者⭐︎${diffStar}` as SkillId,
    '打点王': `打点王⭐︎${diffStar}` as SkillId,
    '本塁打王': `本塁打王⭐︎${diffStar}` as SkillId,
    '盗塁王': `盗塁王⭐︎${diffStar}` as SkillId,
    '最多勝': `最多勝⭐︎${diffStar}` as SkillId,
    '最優秀防御率': `最優秀防御率⭐︎${diffStar}` as SkillId,
    '最多奪三振': `奪三振王⭐︎${diffStar}` as SkillId,
    '最多セーブ': `最多セーブ⭐︎${diffStar}` as SkillId,
  };

  titles.forEach(t => {
    if (t.playerName === '-' || t.title.includes('三冠王') || t.title.includes('沢村賞') || t.title.includes('ハンク・アーロン賞') || t.title.includes('サイ・ヤング賞')) return;
    const targetSkill = titleToSkillMap[t.title];
    league.teams.forEach(team => {
      const p = team.roster.find(player => player.name === t.playerName);
      if (p) {
        if (!p.titles.includes(`第${league.season}季 ${t.title}`)) {
          p.titles.push(`第${league.season}季 ${t.title}`);
        }
        if (targetSkill && !p.skills.includes(targetSkill)) {
          if (p.skills.length < p.skillSlots) {
            p.skills.push(targetSkill);
          } else {
            team.inventory.ownedSkills = [...(team.inventory.ownedSkills || []), targetSkill];
          }
        }
      }
    });
  });

  // リーグ優勝報酬・名誉称号の授与 & 難易度解放処理
  let unlockedNewDifficulty = false;
  let awardedChampionshipTitle: string | undefined = undefined;
  let championshipRewards: ChampionshipRewardInfo | undefined = undefined;

  const isUserChampion = !!(
    champion &&
    champion.teamId === userTeam?.id &&
    userRank === 1 &&
    userTeam &&
    champion.wins > 0
  );

  const currentDiff = league.difficulty || 1;
  const diffInfo = getLeagueDifficulty(currentDiff);
  let nextMaxDiff = league.maxUnlockedDifficulty || userTeam?.maxUnlockedDifficulty || 1;

  if (isUserChampion && userTeam) {
    championshipRewards = diffInfo.rewards;
    awardedChampionshipTitle = `【${diffInfo.badgeLabel}制覇】${diffInfo.championshipTitle}`;

    if (!userTeam.championshipTitles) {
      userTeam.championshipTitles = [];
    }
    if (!userTeam.championshipTitles.includes(awardedChampionshipTitle)) {
      userTeam.championshipTitles.push(awardedChampionshipTitle);
    }

    // 難易度クリアで次難易度解放（最大★100まで）
    if (currentDiff >= nextMaxDiff && nextMaxDiff < 100) {
      nextMaxDiff = currentDiff + 1;
      unlockedNewDifficulty = true;
      userTeam.maxUnlockedDifficulty = nextMaxDiff;
    }

    if (!userTeam.inventory) {
      userTeam.inventory = {
        skillTickets: 0,
        slotExpandJewels: 0,
        equipments: [],
        ownedSkills: [],
        renameTickets: 0,
      };
    }
    if (!userTeam.inventory.equipments) userTeam.inventory.equipments = [];

    // ★優勝特別ボーナスの確率抽選（レア装備 or 特別追加ゲルダ）★
    const eqRoll = Math.random();
    const eqChance = diffInfo.rewards.equipmentChance ?? 0.70;
    let awardedEquipment = undefined;
    let bonusGerda = undefined;

    if (eqRoll < eqChance) {
      // 優勝限定レア装備プール（黄金のトルピードバット等）から選出
      const chosenTemplate = CHAMPION_EXCLUSIVE_EQUIPMENTS[Math.floor(Math.random() * CHAMPION_EXCLUSIVE_EQUIPMENTS.length)];
      awardedEquipment = {
        ...chosenTemplate,
        id: `champ_${chosenTemplate.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      userTeam.inventory.equipments.push(awardedEquipment);
    } else {
      // 装備非当選時は特別ボーナス賞金を付与
      bonusGerda = diffInfo.level * 25000 + 15000;
      userTeam.gerda = (userTeam.gerda || 0) + bonusGerda;
    }

    championshipRewards = {
      ...diffInfo.rewards,
      awardedEquipment,
      bonusGerda,
    };

    // ★各リーグ優勝基本報酬の確実な付与（優勝する度に何度でも全額獲得！）★
    userTeam.gerda = (userTeam.gerda || 0) + championshipRewards.gerda;
    userTeam.pitcherScoutTickets = (userTeam.pitcherScoutTickets || 0) + championshipRewards.pitcherTickets;
    userTeam.fielderScoutTickets = (userTeam.fielderScoutTickets || 0) + championshipRewards.fielderTickets;
    userTeam.inventory.renameTickets = (userTeam.inventory.renameTickets || 0) + championshipRewards.renameTickets;

    if (!userTeam.inventory.ownedSkills) userTeam.inventory.ownedSkills = [];
    userTeam.inventory.ownedSkills.push(championshipRewards.awardedSkill);

    // 活動ログに優勝と獲得報酬を記録
    const extraRewardDesc = awardedEquipment
      ? `【限定レア装備】「${awardedEquipment.name}」(${awardedEquipment.effectLabel})`
      : `【特別ボーナス賞金】+${(bonusGerda || 0).toLocaleString()}G`;

    if (!userTeam.activityLogs) userTeam.activityLogs = [];
    userTeam.activityLogs.unshift({
      id: `log_champ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      message: `第${league.season}季 リーグ優勝！！【${diffInfo.badgeLabel}制覇】賞金+${championshipRewards.gerda.toLocaleString()}G、スカウト券(投${championshipRewards.pitcherTickets}/野${championshipRewards.fielderTickets})、改名手形×${championshipRewards.renameTickets}、秘伝スキル「${championshipRewards.awardedSkill}」、そして${extraRewardDesc}を獲得！`,
      category: 'title',
      timestamp: `第${league.season}季 優勝`,
      timestampLabel: `第${league.season}季 優勝`,
      createdAt: Date.now(),
    });
  }

  const historyItem: SeasonHistory = {
    season: league.season,
    championTeamName: champion?.teamName || (userRank === 1 ? userTeam?.name : '優勝球団') || '優勝球団',
    userRank,
    userWins: userStanding?.wins || 0,
    userLosses: userStanding?.losses || 0,
    userDraws: userStanding?.draws || 0,
    titles,
  };

  // 選択難易度（指定がなければ現在難易度を継続、または解放された上位を提案可能）
  const selectedNextDiff = nextDifficulty || currentDiff;

  // 全選手のキャリア年数を+1、成績リセット、疲労回復！
  const refreshedUserTeam = userTeam ? {
    ...userTeam,
    isUser: true,
    maxUnlockedDifficulty: nextMaxDiff,
    roster: userTeam.roster.map(p => ({
      ...p,
      careerYears: p.careerYears + 1,
      restGamesRemaining: 0, // 新シーズン開幕時は全員万全！
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
  } : null;

  // CPU球団は新難易度に合わせてランダム再生成
  const nextCpuTeams = generateLeagueCpuTeams(selectedNextDiff, userTeam?.name);
  const nextTeams = refreshedUserTeam ? [refreshedUserTeam, ...nextCpuTeams] : nextCpuTeams;

  const resetStandings: Standing[] = nextTeams.map(t => ({
    teamId: t.id,
    teamName: t.name,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0.000,
    gamesBehind: 0,
    runsScored: 0,
    runsAllowed: 0,
  }));

  const updatedLeague: League = {
    season: league.season + 1,
    totalGames: 72,
    playedGames: 0,
    teams: nextTeams,
    standings: resetStandings,
    seasonHistory: [historyItem, ...league.seasonHistory],
    difficulty: selectedNextDiff,
    maxUnlockedDifficulty: nextMaxDiff,
  };

  return {
    updatedLeague,
    historyItem,
    unlockedNewDifficulty,
    awardedChampionshipTitle,
    championshipRewards,
    isChampion: isUserChampion,
  };
}
