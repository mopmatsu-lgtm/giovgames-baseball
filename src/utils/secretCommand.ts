import {
  UserAccount,
  Team,
  League,
  Player,
  Position,
  SkillId,
  EquipmentItem
} from '../types/baseball';
import { ALL_SKILLS, ALL_EQUIPMENTS } from './playerGenerator';
import { createInitialLeague } from './leagueManager';

/**
 * 球団名「西武ライオンズ」とパスワード「6456」の隠しコマンド判定
 */
export function isSecretSeibuCommand(teamName: string, password: string): boolean {
  if (!teamName || !password) return false;
  // 全角数字や空白、表記揺れを正規化
  const normTeam = teamName.normalize('NFKC').replace(/\s+/g, '').trim().toLowerCase();
  const normPass = password.normalize('NFKC').replace(/\s+/g, '').trim();

  const isTeamMatch =
    normTeam === '西武ライオンズ' ||
    normTeam === '西武' ||
    normTeam === 'seibulions' ||
    normTeam === 'seibu';

  return isTeamMatch && normPass === '6456';
}

/**
 * 黄金期・西武ライオンズ 最強チームデータ生成
 */
export function createSecretSeibuTeam(userAccount?: Partial<UserAccount>): Team {
  const managerName = userAccount?.managerName?.trim() || '森 祇晶';

  // 装備アイテム一覧
  const woodBat = ALL_EQUIPMENTS.find(e => e.id === 'eq_wood_bat') || ALL_EQUIPMENTS[0];
  const spikePro = ALL_EQUIPMENTS.find(e => e.id === 'eq_spike_pro') || ALL_EQUIPMENTS[3];
  const leatherGlove = ALL_EQUIPMENTS.find(e => e.id === 'eq_leather_glove') || ALL_EQUIPMENTS[2];
  const pitchGlove = ALL_EQUIPMENTS.find(e => e.id === 'eq_pitch_glove') || ALL_EQUIPMENTS[4];

  // 1. レジェンド野手9名（黄金期ベストナイン）
  // 全選手 伝説ユニーク / 能力値オール10 / 弾道4 / スキル枠4 / 最強スキル4種装備
  const fielderDefs: Array<{
    id: string;
    name: string;
    number: number;
    pos: Position;
    batting: '右打' | '左打' | '両打';
    throwing: '右投' | '左投';
    skills: SkillId[];
    equipment: EquipmentItem;
    titles: string[];
    avatar: { skinColor: string; hairColor: string; hairStyle: number; eyesStyle: number; hasGlasses?: boolean };
  }> = [
    {
      id: 'seibu_legend_f1',
      name: '辻 発彦',
      number: 5,
      pos: '野',
      batting: '右打',
      throwing: '右投',
      skills: ['鉄壁', '神の手', 'ノーエラー', '内野安打'],
      equipment: leatherGlove,
      titles: ['ゴールデングラブ', 'ベストナイン', '首位打者'],
      avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 1, eyesStyle: 1 },
    },
    {
      id: 'seibu_legend_f2',
      name: '平野 謙',
      number: 2,
      pos: '野',
      batting: '両打',
      throwing: '右投',
      skills: ['チャンスメイク', '盗塁', '技あり', '外野適正'],
      equipment: spikePro,
      titles: ['ゴールデングラブ', '盗塁王', '犠打世界一級'],
      avatar: { skinColor: '#fcd34d', hairColor: '#0f172a', hairStyle: 2, eyesStyle: 2 },
    },
    {
      id: 'seibu_legend_f3',
      name: '秋山 幸二',
      number: 1,
      pos: '野',
      batting: '右打',
      throwing: '右投',
      skills: ['三冠王', '極首位打者', '極本塁打王', '極ホームランキャッチ'],
      equipment: woodBat,
      titles: ['本塁打王', '盗塁王', 'ベストナイン', 'ゴールデングラブ', 'MVP'],
      avatar: { skinColor: '#e0a96d', hairColor: '#0f172a', hairStyle: 3, eyesStyle: 3 },
    },
    {
      id: 'seibu_legend_f4',
      name: '清原 和博',
      number: 3,
      pos: '野',
      batting: '右打',
      throwing: '右投',
      skills: ['満塁神', 'ヒーロー', '9者連続本塁打', 'スラッガー'],
      equipment: woodBat,
      titles: ['新人王', 'ベストナイン', '日本シリーズMVP', '本塁打王級'],
      avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 4, eyesStyle: 1 },
    },
    {
      id: 'seibu_legend_f5',
      name: 'デストラーデ',
      number: 39,
      pos: '野',
      batting: '両打',
      throwing: '右投',
      skills: ['極本塁打王', 'お立ち台', 'ポール弾', 'テラス弾'],
      equipment: woodBat,
      titles: ['本塁打王3年連続', '打点王2年連続', 'ベストナイン', '日本シリーズMVP'],
      avatar: { skinColor: '#78350f', hairColor: '#0f172a', hairStyle: 1, eyesStyle: 2, hasGlasses: true },
    },
    {
      id: 'seibu_legend_f6',
      name: '石毛 宏典',
      number: 7,
      pos: '野',
      batting: '右打',
      throwing: '右投',
      skills: ['鉄壁', 'ノーエラー', 'ヒーロー', 'ムードメイカー'],
      equipment: leatherGlove,
      titles: ['MVP', 'ベストナイン8度', 'ゴールデングラブ10度', '主将'],
      avatar: { skinColor: '#fcd34d', hairColor: '#334155', hairStyle: 2, eyesStyle: 1 },
    },
    {
      id: 'seibu_legend_f7',
      name: '安部 理',
      number: 25,
      pos: '野',
      batting: '左打',
      throwing: '右投',
      skills: ['技あり', 'チャンス', '外野適正', 'スラッガー'],
      equipment: woodBat,
      titles: ['日本シリーズ優秀選手', 'クラッチヒッター'],
      avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 3, eyesStyle: 3 },
    },
    {
      id: 'seibu_legend_f8',
      name: '伊東 勤',
      number: 27,
      pos: '野',
      batting: '右打',
      throwing: '右投',
      skills: ['極爆肩', '鉄壁', 'ノーエラー', 'リクエスト'],
      equipment: leatherGlove,
      titles: ['ベストナイン10度', 'ゴールデングラブ11度', '黄金期正捕手'],
      avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 1, eyesStyle: 1 },
    },
    {
      id: 'seibu_legend_f9',
      name: '田辺 徳雄',
      number: 6,
      pos: '野',
      batting: '右打',
      throwing: '右投',
      skills: ['鉄壁', 'ノーエラー', '内野安打', 'チャンス'],
      equipment: leatherGlove,
      titles: ['ベストナイン2度', 'ゴールデングラブ2度', '恐怖の9番'],
      avatar: { skinColor: '#fcd34d', hairColor: '#0f172a', hairStyle: 2, eyesStyle: 2 },
    },
  ];

  const fielders: Player[] = fielderDefs.map(def => ({
    id: def.id,
    name: def.name,
    number: def.number,
    careerYears: 8,
    position: '野',
    rarity: '伝説ユニーク',
    stats: {
      fielder: {
        trajectory: 4,
        meet: 10,
        power: 10,
        speed: 10,
        defense: 10,
      },
    },
    skillSlots: 4,
    skills: def.skills,
    equipment: def.equipment,
    battingHand: def.batting,
    throwingHand: def.throwing,
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
    },
    avatar: def.avatar,
    titles: def.titles,
    restGamesRemaining: 0,
  }));

  // 2. レジェンド投手6名（黄金期投手陣）
  // 球速165km/h / 制球10 / スタミナ10 / 変化10 / スキル枠4 / 最強スキル4種装備
  const pitcherDefs: Array<{
    id: string;
    name: string;
    number: number;
    speed: number;
    role: '先発' | '中継ぎ' | '抑え';
    batting: '右打' | '左打' | '両打';
    throwing: '右投' | '左投';
    skills: SkillId[];
    equipment: EquipmentItem;
    titles: string[];
    avatar: { skinColor: string; hairColor: string; hairStyle: number; eyesStyle: number; hasGlasses?: boolean };
  }> = [
    {
      id: 'seibu_legend_p1',
      name: '工藤 公康',
      number: 47,
      speed: 165,
      role: '先発',
      batting: '左打',
      throwing: '左投',
      skills: ['超完封', '立ち上がり', '潮目', 'ピンチで抑えたら吠える'],
      equipment: pitchGlove,
      titles: ['最高勝率4度', '最優秀防御率4度', '最多奪三振2度', 'MVP2度', '沢村賞'],
      avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 3, eyesStyle: 1 },
    },
    {
      id: 'seibu_legend_p2',
      name: '渡辺 久信',
      number: 41,
      speed: 165,
      role: '先発',
      batting: '右打',
      throwing: '右投',
      skills: ['超完封', 'イニングイーター', '立ち上がり', '超火消し男'],
      equipment: pitchGlove,
      titles: ['最多勝3度', '最高勝率', '最多奪三振', 'ノーヒットノーラン'],
      avatar: { skinColor: '#fcd34d', hairColor: '#475569', hairStyle: 1, eyesStyle: 3 },
    },
    {
      id: 'seibu_legend_p3',
      name: '郭 泰源',
      number: 18,
      speed: 165,
      role: '先発',
      batting: '右打',
      throwing: '右投',
      skills: ['超完封', '立ち上がり', '技あり', '超火消し男'],
      equipment: pitchGlove,
      titles: ['MVP', '最高勝率2度', 'ノーヒットノーラン', 'オリエンタル・エクスプレス'],
      avatar: { skinColor: '#fcd34d', hairColor: '#0f172a', hairStyle: 2, eyesStyle: 2 },
    },
    {
      id: 'seibu_legend_p4',
      name: '潮崎 哲也',
      number: 16,
      speed: 160,
      role: '中継ぎ',
      batting: '右打',
      throwing: '右投',
      skills: ['リリーバー', '超火消し男', '回またぎ', '申告敬遠'],
      equipment: pitchGlove,
      titles: ['最優秀救援投手', '魔球シンカーの達人'],
      avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 1, eyesStyle: 1 },
    },
    {
      id: 'seibu_legend_p5',
      name: '鹿取 義隆',
      number: 14,
      speed: 160,
      role: '中継ぎ',
      batting: '右打',
      throwing: '右投',
      skills: ['リリーバー', '回またぎ', '超火消し男', '鉄壁'],
      equipment: pitchGlove,
      titles: ['最優秀救援投手', '鉄腕リリーフの神'],
      avatar: { skinColor: '#fcd34d', hairColor: '#334155', hairStyle: 2, eyesStyle: 2, hasGlasses: true },
    },
    {
      id: 'seibu_legend_p6',
      name: '豊田 清',
      number: 20,
      speed: 165,
      role: '抑え',
      batting: '右打',
      throwing: '右投',
      skills: ['超火消し男', 'リリーバー', '超完封', '潮目'],
      equipment: pitchGlove,
      titles: ['最優秀救援投手2度', '最多セーブ2度', '絶対的守護神'],
      avatar: { skinColor: '#fcd34d', hairColor: '#0f172a', hairStyle: 3, eyesStyle: 1 },
    },
  ];

  const pitchers: Player[] = pitcherDefs.map(def => ({
    id: def.id,
    name: def.name,
    number: def.number,
    careerYears: 8,
    position: '投',
    pitcherRole: def.role,
    rarity: '伝説ユニーク',
    stats: {
      pitcher: {
        speed: 10, // MAX値 (表示時 165km/h相当)
        control: 10,
        stamina: 10,
        breaking: 10,
      },
    },
    skillSlots: 4,
    skills: def.skills,
    equipment: def.equipment,
    battingHand: def.batting,
    throwingHand: def.throwing,
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
    },
    avatar: def.avatar,
    titles: def.titles,
    restGamesRemaining: 0,
  }));

  const roster: Player[] = [...pitchers, ...fielders];

  // オーダー・スタメン配置（黄金期固定）
  // 1番 辻(二), 2番 平野(中), 3番 秋山(右), 4番 清原(一), 5番 デストラーデ(指), 6番 石毛(三), 7番 安部(左), 8番 伊東(捕), 9番 田辺(遊)
  const lineup = fielders.map(f => f.id);
  const lineupPositions: Position[] = ['二', '中', '右', '一', '指', '三', '左', '捕', '遊'];

  // 先発ローテーション枠：工藤、渡辺久、郭泰源
  const pitcherRotation = [pitchers[0].id, pitchers[1].id, pitchers[2].id];
  // 中継ぎ：潮崎、鹿取
  const bullpen = [pitchers[3].id, pitchers[4].id];
  // 抑え：豊田
  const closerId = pitchers[5].id;

  // 全スキルをインベントリに所持
  const allSkillIds = ALL_SKILLS.map(s => s.id);

  // 全装備を複数所持
  const fullEquipments: EquipmentItem[] = [];
  ALL_EQUIPMENTS.forEach(eq => {
    for (let k = 0; k < 5; k++) {
      fullEquipments.push({ ...eq, id: `${eq.id}_seibu_${k}` });
    }
  });

  return {
    id: `team_seibu_lions_golden`,
    name: '西武ライオンズ',
    managerName,
    color: '#004098', // ライオンズ・ブルー
    gerda: 999999, // 99万9999ゲルダ (MAX資金)
    pitcherScoutTickets: 99,
    fielderScoutTickets: 99,
    inventory: {
      skillTickets: 99,
      slotExpandJewels: 99,
      equipments: fullEquipments,
      ownedSkills: allSkillIds,
      renameTickets: 99,
    },
    roster,
    lineup,
    lineupPositions,
    pitcherRotation,
    bullpen,
    closerId,
    tactics: {
      stealTendency: '積極',
      buntTendency: '普通',
      pinchHitterTendency: '積極',
      pitcherChangeTendency: '早め',
      substitutionFrequency: '積極的',
    },
    isUser: true,
    maxUnlockedDifficulty: 6, // 全難易度解放
    championshipTitles: [
      '黄金期覇者 (1982-1994)',
      '日本一連覇',
      'パ・リーグ黄金伝説',
      '常勝軍団',
      '完全無欠',
    ],
    activityLogs: [
      {
        id: `seibu_init_${Date.now()}`,
        message:
          '【隠しコマンド発動】球団名「西武ライオンズ」＆パスワード「6456」により黄金期の最強データが覚醒！全選手が伝説ユニーク＆全能力値MAX、資金999,999ゲルダ、全アイテム99個、全スキル所持でスタートしました！',
        category: 'system',
        timestamp: '球団設立時',
        createdAt: Date.now(),
      },
    ],
  };
}

/**
 * 黄金期・西武ライオンズ 最強リーグデータ生成
 */
export function createSecretSeibuLeague(userAccount?: Partial<UserAccount>): League {
  const seibuTeam = createSecretSeibuTeam(userAccount);
  const league = createInitialLeague(seibuTeam, 6); // 最高難易度★6でスタート可能
  league.difficulty = 6;
  league.maxUnlockedDifficulty = 6;
  return league;
}
