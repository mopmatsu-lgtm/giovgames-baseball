export type Position = '投' | '捕' | '一' | '二' | '三' | '遊' | '左' | '中' | '右' | '指' | '野' | '野手';

export type PitcherRole = '先発' | '中継ぎ' | '抑え';

export type BattingHand = '右打' | '左打' | '両打';
export type ThrowingHand = '右投' | '左投';

export type Rarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR' | '伝説ユニーク';

// 仕様書記載のスキル群
export type SkillId =
  // 打者向け
  | '満塁神'
  | 'ヒーロー'
  | 'お立ち台'
  | 'ポール弾'
  | 'テラス弾'
  | '極首位打者'
  | '極本塁打王'
  | '三冠王'
  | '9者連続本塁打'
  | 'ツーランスクイズ'
  | '一点張り'
  | 'セルフジャッジ'
  | 'サインミス'
  | '飛び出し'
  | 'スラッガー'
  | 'チャンス'
  | '左キラー'
  | 'チャンスメイク'
  | 'ムードメイカー'
  | '技あり'
  | '代打'
  | '内野安打'
  | '盗塁'
  | 'スクイズ'
  | '右キラー'
  | '高速打球'
  | '初球打ち'
  | '粘り打ち'
  | '逆境○'
  | 'サヨナラ男'
  | '広角打法'
  | 'レーザー弾'
  | 'プルヒッター'
  | 'ライン際職人'
  | 'トップバッター'
  | 'クリーンアップ'
  | '下位打線の鬼'
  | '選球眼'
  | '威圧感（打）'
  | 'お祭り男'
  | 'バント職人'
  | 'カットマン'
  | '電光石火'
  | 'ヘッスラ'
  | '韋駄天'
  | 'ランエンドヒット'
  // 投手向け
  | 'リリーバー'
  | '火消し男'
  | '超火消し男'
  | 'イニングイーター'
  | '超完封'
  | 'ピンチで抑えたら吠える'
  | '申告敬遠'
  | '立ち上がり'
  | '回またぎ'
  | '重い球'
  | 'キレ○'
  | '奪三振王'
  | '低め〇'
  | '尻上がり'
  | 'ポーカーフェイス'
  | '剛速球'
  | '魔球'
  | '闘志'
  | 'クイック○'
  | 'ギアチェンジ'
  | 'ワンポイント'
  | '威圧感（投）'
  | '奪三振マシン'
  | '打たせて取る'
  | '牽制○'
  | '絶対的守護神'
  | 'マダックス'
  // 守備向け
  | 'ノーエラー'
  | '鉄壁'
  | '外野適正'
  | '極ホームランキャッチ'
  | '極爆肩'
  | '神の手'
  | '名手'
  | 'キャノン肩'
  | '扇の要'
  | 'ダイビングキャッチ'
  | '併殺マスター'
  | '壁役'
  // その他・特殊
  | 'リクエスト'
  | '潮目'
  | '激走'
  | '勝利の執念'
  | '球場の味方'
  | '名将の采配'
  // === レアスキル（金特 50種） ===
  // 打者系レアスキル (22種)
  | 'アーチスト'
  | '安打製造機'
  | '勝負師'
  | '不動の四番'
  | '乾坤一擲'
  | '広角砲'
  | '切り込み隊長'
  | 'ロケットスタート'
  | '伝説の代打'
  | '驚異の切れ味'
  | '超ジャイロ打法'
  | '高速スナイパー'
  | '恐怖の下位打線'
  | '神眼'
  | '覇王の威圧感'
  | 'ランナーズハイ'
  | '神速スプリンター'
  | '疾風怒濤'
  | 'ミラクル男'
  | '黄金の右足'
  | '電光石火・改'
  | 'サヨナラ劇場の主'
  // 投手系レアスキル (18種)
  | '怪物'
  | 'ドクターK'
  | '精密機械'
  | '昇り龍'
  | '怪童'
  | '強心臓'
  | '幻影魔球'
  | '金剛不壊'
  | '不屈の闘志'
  | '守護神の領域'
  | 'ゴロキラー'
  | '紫電一閃'
  | '鉄腕リリーフ'
  | '死角なし'
  | '覇気'
  | 'マダックス・極'
  | '絶対零度'
  | '火消しの帝王'
  | '完全試合'
  // 守備系レアスキル (6種)
  | '魔術師'
  | 'レーザービーム'
  | '司令塔'
  | '鉄壁の要塞'
  | '超ファインプレー'
  | '鉄人キャッチャー'
  // 特殊・チーム系レアスキル (4種)
  | '神風'
  | '勝利の方程式'
  | '常勝軍団の誇り'
  | '奇跡の采配'

  // === 追加通常スキル (50種) ===
  // 打者 (24種)
  | '安打警戒破り'
  | '流し打ち'
  | '内野警戒突破'
  | 'インコースヒッター'
  | 'アウトコースヒッター'
  | '高め打ち'
  | 'ローボールヒッター'
  | 'フルカウント○'
  | 'ファーストストライク'
  | '追い込まれ強打'
  | '連打の導火線'
  | '足攻'
  | 'セーフティバント'
  | '犠牲フライ職人'
  | '進塁打名人'
  | '一矢報いる'
  | '先制攻撃'
  | '満塁男'
  | '打撃開眼'
  | '快足スプリンター'
  | 'ベース一周'
  | '盗塁警戒破り'
  | 'タフネスバッター'
  | 'クラッチヒッター'
  // 投手 (18種)
  | '初球ストライク'
  | 'インローの鬼'
  | 'バックドア'
  | 'フロントドア'
  | '緩急○'
  | 'ナックル軌道'
  | 'フライボールピッチャー'
  | '球持ち○'
  | 'クロスファイアー'
  | 'ブレーキ○'
  | '逃げ切り体勢'
  | 'カウント稼ぎ'
  | '四球拒否'
  | '雨天巧者'
  | 'ロングリリーフ'
  | 'セットアッパー○'
  | 'ピンチ脱出'
  | 'マウンドの主'
  // 守備・特殊 (8種)
  | 'バックアップ'
  | '送球精度'
  | '中継プレー○'
  | '本塁死守'
  | 'フェンス恐怖心ゼロ'
  | 'ベースコーチの眼'
  | 'ベンチの活気'
  | '観察眼'

  // === 追加レアスキル（金特 30種） ===
  // 打者 (14種)
  | '神撃の主砲'
  | '超音速スライサー'
  | '天下一品'
  | 'フルスイングの極致'
  | '電撃バント'
  | 'サヨナラキング'
  | '神速の韋駄天'
  | '鉄人スラッガー'
  | '連打の連鎖反応'
  | '選球眼の極み'
  | 'ダイヤモンドの支配者'
  | '逆境の咆哮'
  | '不倒のクリーンアップ'
  | '代打の神髄'
  // 投手 (11種)
  | '神速ストレート'
  | '魔神のチェンジアップ'
  | 'パーフェクトリリーフ'
  | 'イニングイーター・極'
  | '絶対零度スライダー'
  | 'ドクターフォーク'
  | '鉄壁のマウンド'
  | 'クローザーの誇り'
  | '百戦錬磨のエース'
  | '無双の制球'
  | '剛腕シャットアウト'
  // 守備・特殊 (5種)
  | 'ゴールデングラブの極致'
  | '難攻不落の要塞'
  | '奇跡のビッグイニング'
  | 'キャノンレーザー'
  | '勝利への号令'
  // === リーグタイトル獲得報酬スキル (⭐︎1〜⭐︎6) ===
  // 打撃タイトル
  | '首位打者⭐︎1' | '首位打者⭐︎2' | '首位打者⭐︎3' | '首位打者⭐︎4' | '首位打者⭐︎5' | '首位打者⭐︎6'
  | '打点王⭐︎1' | '打点王⭐︎2' | '打点王⭐︎3' | '打点王⭐︎4' | '打点王⭐︎5' | '打点王⭐︎6'
  | '本塁打王⭐︎1' | '本塁打王⭐︎2' | '本塁打王⭐︎3' | '本塁打王⭐︎4' | '本塁打王⭐︎5' | '本塁打王⭐︎6'
  | '盗塁王⭐︎1' | '盗塁王⭐︎2' | '盗塁王⭐︎3' | '盗塁王⭐︎4' | '盗塁王⭐︎5' | '盗塁王⭐︎6'
  // 投手タイトル
  | '奪三振王⭐︎1' | '奪三振王⭐︎2' | '奪三振王⭐︎3' | '奪三振王⭐︎4' | '奪三振王⭐︎5' | '奪三振王⭐︎6'
  | '最多勝⭐︎1' | '最多勝⭐︎2' | '最多勝⭐︎3' | '最多勝⭐︎4' | '最多勝⭐︎5' | '最多勝⭐︎6'
  | '最優秀防御率⭐︎1' | '最優秀防御率⭐︎2' | '最優秀防御率⭐︎3' | '最優秀防御率⭐︎4' | '最優秀防御率⭐︎5' | '最優秀防御率⭐︎6'
  | '最多セーブ⭐︎1' | '最多セーブ⭐︎2' | '最多セーブ⭐︎3' | '最多セーブ⭐︎4' | '最多セーブ⭐︎5' | '最多セーブ⭐︎6'
  // 特別栄誉三冠スキル
  | '三冠王⭐︎1' | '三冠王⭐︎2' | '三冠王⭐︎3' | '三冠王⭐︎4' | '三冠王⭐︎5' | '三冠王⭐︎6'
  | '沢村賞'
  | '沢村賞⭐︎1' | '沢村賞⭐︎2' | '沢村賞⭐︎3' | '沢村賞⭐︎4' | '沢村賞⭐︎5' | '沢村賞⭐︎6'
  // メジャーリーグ特別栄誉スキル
  | 'ハンク・アーロン賞'
  | 'ハンク・アーロン賞⭐︎1' | 'ハンク・アーロン賞⭐︎2' | 'ハンク・アーロン賞⭐︎3' | 'ハンク・アーロン賞⭐︎4' | 'ハンク・アーロン賞⭐︎5' | 'ハンク・アーロン賞⭐︎6'
  | 'サイ・ヤング賞'
  | 'サイ・ヤング賞⭐︎1' | 'サイ・ヤング賞⭐︎2' | 'サイ・ヤング賞⭐︎3' | 'サイ・ヤング賞⭐︎4' | 'サイ・ヤング賞⭐︎5' | 'サイ・ヤング賞⭐︎6';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  category: '打者' | '投手' | '守備' | '特殊';
  description: string;
  isRare?: boolean;
}

// 装備アイテム
export type EquipmentType = 'バット' | 'グラブ' | 'スパイク';

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  description: string;
  effectLabel: string;
  price: number; // ゲルダ
}

// 萬屋の消費アイテム
export interface ShopItem {
  id: string;
  name: string;
  type: 'skill_ticket' | 'slot_expand' | 'pitcher_scout' | 'fielder_scout' | 'rename_ticket';
  description: string;
  price: number; // ゲルダ
}

// 野手能力 (1〜10、弾道1〜4)
export interface FielderStats {
  meet: number;       // ミート 1〜10
  power: number;      // パワー 1〜10
  speed: number;      // 走力 1〜10
  defense: number;    // 守備 1〜10
  trajectory: number; // 弾道 1〜4 (1が低く、4が高い)
}

// 投手能力 (1〜10)
export interface PitcherStats {
  speed: number;   // 球速 1〜10 (表示は135km/h + speed*2.8)
  control: number; // 制球 1〜10
  stamina: number; // スタミナ 1〜10
  breaking: number;// 変化 1〜10
}

// 選手の基本能力値 (獲得時点で固定、練習による成長なし)
export interface PlayerStats {
  fielder?: FielderStats;
  pitcher?: PitcherStats;
}

export interface PlayerRecord {
  // 打撃成績
  games: number;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;

  // 投手成績
  pitchGames: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  inningsPitched: number; // 回数
  outsPitched?: number;   // 通算アウト数 (正確な投球回・防御率計算用)
  earnedRuns: number;
  pitchHits: number;
  pitchHomeRuns: number;
  pitchStrikeouts: number;
  pitchWalks: number;
}

export interface PlayerAvatarData {
  skinColor: string;
  hairColor: string;
  hairStyle: number;
  eyesStyle: number;
  hasGlasses?: boolean;
  hasBeard?: boolean;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  careerYears: number; // プロXシーズン目
  position: Position;
  rarity: Rarity;
  stats: PlayerStats;
  skillSlots: number;    // スキル枠数 (1〜4) レアリティと独立！
  skills: SkillId[];     // 装着中スキル
  equipment?: EquipmentItem; // 装備
  battingHand: BattingHand;
  throwingHand: ThrowingHand;
  pitcherRole?: PitcherRole;
  record: PlayerRecord;
  avatar: PlayerAvatarData;
  isRetired?: boolean;
  titles: string[]; // 獲得タイトル履歴
  restGamesRemaining?: number; // 登板後疲労（0: 万全・登板可、1〜2: 疲労休養中・登板不可）
}

export interface TeamTactic {
  stealTendency: '積極' | '普通' | '慎重';
  buntTendency: '多用' | '普通' | 'なし';
  pinchHitterTendency: '積極' | '普通' | '我慢';
  pitcherChangeTendency: '早め' | '普通' | '我慢';
  substitutionFrequency: '積極的' | '普通' | '慎重'; // 選手交代の頻度（代打・継投・守備固め）
  intentionalWalk?: boolean; // 申告敬遠の活用（旧設定・後方互換）
}

export interface ActivityLog {
  id: string;
  message: string;
  category: 'scout' | 'market' | 'match' | 'item' | 'skill' | 'title' | 'system';
  timestamp?: string; // e.g. "第1季 12節" or 時刻
  timestampLabel?: string;
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;       // 球団名
  managerName: string;// 監督名
  color: string;
  gerda: number;      // ゲーム内通貨「ゲルダ」
  pitcherScoutTickets: number; // 投手スカウト券
  fielderScoutTickets: number; // 野手スカウト券
  inventory: {
    skillTickets: number;     // スキル変更券（互換性保持）
    slotExpandJewels: number; // 互換性保持フィールド
    equipments: EquipmentItem[];
    ownedSkills: SkillId[];   // 所持スキル一覧（スキルガチャ等で獲得したスキル）
    renameTickets: number;    // 改名手形（選手名変更アイテム）
  };
  roster: Player[];
  lineup: string[];           // 1〜9番 Player ID
  lineupPositions: Position[];// 1〜9番 守備位置
  benchFielders?: string[];   // ベンチ入り控え野手 (最大5名、スタメン外から選抜。代打・守備固め用)
  pitcherRotation: string[];  // 先発 Player IDs (第一先発, 第二先発, 第三先発)
  bullpen: string[];          // 中継ぎ Player IDs
  closerId: string;           // 抑え Player ID
  tactics: TeamTactic;
  isUser: boolean;
  maxUnlockedDifficulty?: number; // 解放済みリーグ難易度 (1〜6)
  championshipTitles?: string[];  // 獲得した名誉ある制覇称号リスト
  activityLogs?: ActivityLog[];   // 球団活動・獲得・取引ログ
  postseason?: PostseasonProgress;// ポストシーズントーナメント進行データ
}

export interface PostseasonProgress {
  currentRound: number;        // 1〜100 (1〜100回戦), 101 (準々決勝), 102 (準決勝), 103 (決勝)
  highestClearedStage: number; // 過去最高到達ステージ (0〜103)
  clearedStages: number[];     // 初回勝利報酬受取済みのステージ番号リスト
  claimedRewardStages?: number[]; // 初回クリア報酬（ゲルダ等）を実際に受領・反映済みのステージ番号リスト
  isEntered: boolean;          // エントリー中フラグ
  totalAttempts: number;       // 挑戦回数
  championshipCount: number;   // 決勝制覇数
  hasClaimedFinalSkill?: boolean; // 最高峰スキル「完全試合」受取済みフラグ
}

export interface MatchPlayLog {
  id: string;
  inning: number;
  isBottom: boolean;
  outs: number;
  text: string;
  scoreTop: number;
  scoreBottom: number;
  type: 'hit' | 'homerun' | 'strikeout' | 'out' | 'walk' | 'steal' | 'defense' | 'skill' | 'sub';
  skillTriggered?: string;
}

export interface MatchPlayerBatting {
  playerId: string;
  name: string;
  order: number;
  position: Position;
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases?: number;
  seasonAvg: number;
}

export interface MatchPlayerPitching {
  playerId: string;
  name: string;
  role: string;
  inningsPitched: number;
  outsRecorded?: number;
  hits: number;
  homeRuns: number;
  strikeouts: number;
  walks: number;
  runs: number;
  earnedRuns: number;
  seasonEra: number;
  isWin?: boolean;
  isLoss?: boolean;
  isSave?: boolean;
}

export interface ScoringPlay {
  inning: number;
  isBottom: boolean;
  batterName: string;
  description: string;
  rbi: number;
  scoreTop: number;
  scoreBottom: number;
  skillUsed?: string;
}

export interface StealRecord {
  id: string;
  inning: number;
  isBottom: boolean;
  teamName: string;
  runnerName: string;
  base: '二盗' | '三盗';
  success: boolean;
  catcherName?: string;
  speed: number;
  skillUsed?: string;
}

export interface AtBatEvent {
  id: string;
  inning: number;
  isBottom: boolean;
  order: number;
  batterName: string;
  pitcherName: string;
  result: string;
  type: 'hit' | 'homerun' | 'strikeout' | 'out' | 'walk' | 'error' | 'steal' | 'sub';
  rbi: number;
  runnersState: string;
  outs: number;
  skillUsed?: string;
  isWalkOff?: boolean; // サヨナラ打判定フラグ
  stealDetails?: {
    runnerName: string;
    base: '二盗' | '三盗';
    success: boolean;
    catcherName?: string;
    speed?: number;
  };
}

export interface MatchState {
  id: string;
  matchNumber: number; // 第X試合 (1〜72)
  homeTeam: Team;
  awayTeam: Team;
  currentInning: number;
  isBottom: boolean;
  outs: number;
  scoreTop: number;
  scoreBottom: number;
  hitsTop: number;
  hitsBottom: number;
  errorsTop: number;
  errorsBottom: number;
  inningScores: { top: number | null; bottom: number | null }[];
  runners: {
    first: string | null;  // Player Name
    second: string | null;
    third: string | null;
  };
  isFinished: boolean;
  winnerId: string | null;
  winningPitcher?: string;
  losingPitcher?: string;
  savePitcher?: string;
  logs: MatchPlayLog[];
  homeBattingStats: MatchPlayerBatting[];
  awayBattingStats: MatchPlayerBatting[];
  homePitchingStats: MatchPlayerPitching[];
  awayPitchingStats: MatchPlayerPitching[];
  scoringPlays: ScoringPlay[];
  atBatEvents: AtBatEvent[];
  steals?: StealRecord[];
}

export interface Standing {
  teamId: string;
  teamName: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  gamesBehind: number;
  runsScored: number;
  runsAllowed: number;
}

export interface SeasonHistory {
  season: number;
  championTeamName: string;
  userRank: number;
  userWins: number;
  userLosses: number;
  userDraws?: number;
  titles: { title: string; playerName: string; teamName?: string; value: string }[];
}

export interface League {
  season: number;
  totalGames: number; // 72試合制
  playedGames: number;
  teams: Team[];
  standings: Standing[];
  seasonHistory: SeasonHistory[];
  difficulty: number; // 1〜6 (★1〜★6)
  maxUnlockedDifficulty: number; // 1〜6
}

export interface ChampionshipRewardInfo {
  gerda: number;
  pitcherTickets: number;
  fielderTickets: number;
  slotExpandJewels?: number; // 互換性保持
  renameTickets: number;
  awardedSkill: SkillId;
  awardedEquipment?: EquipmentItem; // 獲得した優勝限定レア装備（当選時）
  bonusGerda?: number;             // 装備の代わりに当選した特別優勝ボーナス賞金
  equipmentChance?: number;        // レア装備当選確率 (0.0〜1.0)
}

export interface LeagueDifficultyInfo {
  level: number;
  name: string;
  stars: string;
  badgeLabel: string;
  color: string;
  border: string;
  bg: string;
  description: string;
  championshipTitle: string;
  cpuStrengthText: string;
  rewards: ChampionshipRewardInfo;
}

export const BASE_LEAGUE_DIFFICULTIES: LeagueDifficultyInfo[] = [
  {
    level: 1,
    name: 'ビギナーリーグ',
    stars: '★☆☆☆☆☆',
    badgeLabel: '★1 初級',
    color: 'text-emerald-400',
    border: 'border-emerald-500/50',
    bg: 'bg-emerald-950/40',
    description: 'R〜SR級の選手が中心でクリーンアップにSSRが控える、初陣に最適な育成リーグ！',
    championshipTitle: '初陣の覇者・ビギナー王者',
    cpuStrengthText: 'R〜SR級・主軸SSR',
    rewards: {
      gerda: 30000,
      pitcherTickets: 1,
      fielderTickets: 1,
      renameTickets: 1,
      awardedSkill: 'スラッガー',
      equipmentChance: 0.65,
    },
  },
  {
    level: 2,
    name: 'ブロンズリーグ',
    stars: '★★☆☆☆☆',
    badgeLabel: '★2 育成',
    color: 'text-amber-500',
    border: 'border-amber-600/50',
    bg: 'bg-amber-950/40',
    description: 'SR〜SSR級の好選手と主砲URが立ち塞がる熱戦の強豪育成リーグ！',
    championshipTitle: '蒼穹の覇王・ブロンズマイスター',
    cpuStrengthText: 'SR〜SSR級・主軸UR',
    rewards: {
      gerda: 45000,
      pitcherTickets: 2,
      fielderTickets: 2,
      renameTickets: 1,
      awardedSkill: '超火消し男',
      equipmentChance: 0.70,
    },
  },
  {
    level: 3,
    name: 'シルバーリーグ',
    stars: '★★★☆☆☆',
    badgeLabel: '★3 中堅',
    color: 'text-slate-300',
    border: 'border-slate-400/50',
    bg: 'bg-slate-900',
    description: 'SSR〜UR級の主戦力と伝説ユニーク打者が軸となる本格実力派リーグ！',
    championshipTitle: '白銀の支配者・シルバーチャンプ',
    cpuStrengthText: 'SSR〜UR級・主軸伝説',
    rewards: {
      gerda: 70000,
      pitcherTickets: 3,
      fielderTickets: 3,
      renameTickets: 1,
      awardedSkill: '超完封',
      equipmentChance: 0.75,
    },
  },
  {
    level: 4,
    name: 'ゴールドリーグ',
    stars: '★★★★☆☆',
    badgeLabel: '★4 強豪',
    color: 'text-amber-400',
    border: 'border-amber-400/60',
    bg: 'bg-amber-950/50',
    description: 'UR〜伝説ユニーク級のスター選手が君臨し、強力スキルが飛び交う強豪リーグ！',
    championshipTitle: '黄金の王者・ゴールドレジェンド',
    cpuStrengthText: 'UR〜伝説ユニーク級',
    rewards: {
      gerda: 95000,
      pitcherTickets: 4,
      fielderTickets: 4,
      renameTickets: 2,
      awardedSkill: '鉄壁',
      equipmentChance: 0.80,
    },
  },
  {
    level: 5,
    name: 'プラチナリーグ',
    stars: '★★★★★☆',
    badgeLabel: '★5 頂上',
    color: 'text-cyan-400',
    border: 'border-cyan-400/60',
    bg: 'bg-cyan-950/50',
    description: '伝説ユニークが打線と先発を固め、多数の強力スキルを操る超一流軍団が集う頂上決戦！',
    championshipTitle: '白金の名将・プラチナマスター',
    cpuStrengthText: '伝説主軸・UR級',
    rewards: {
      gerda: 120000,
      pitcherTickets: 5,
      fielderTickets: 5,
      renameTickets: 2,
      awardedSkill: '極爆肩',
      equipmentChance: 0.85,
    },
  },
  {
    level: 6,
    name: 'レジェンド神域リーグ',
    stars: '★★★★★★',
    badgeLabel: '★6 神域',
    color: 'text-purple-400',
    border: 'border-purple-400/70',
    bg: 'bg-purple-950/60',
    description: '全選手が伝説ユニーク級！オールスター級の怪物と極スキルが跋扈する最高峰の神域！',
    championshipTitle: '球界の神話・絶対王者・不滅の覇神',
    cpuStrengthText: '全選手 伝説ユニーク級',
    rewards: {
      gerda: 180000,
      pitcherTickets: 7,
      fielderTickets: 7,
      renameTickets: 3,
      awardedSkill: '三冠王⭐︎1',
      equipmentChance: 1.00,
    },
  },
  {
    level: 7,
    name: 'マスターズクラウン',
    stars: '★7',
    badgeLabel: '★7 覇者',
    color: 'text-indigo-400',
    border: 'border-indigo-500/60',
    bg: 'bg-indigo-950/50',
    description: '神域の先へと足を踏み入れた者のみが挑む超激闘リーグ。',
    championshipTitle: '神域の覇王・マスターズクラウン',
    cpuStrengthText: '極スキル・伝説ユニーク超強化軍団',
    rewards: {
      gerda: 220000,
      pitcherTickets: 8,
      fielderTickets: 8,
      renameTickets: 3,
      awardedSkill: '三冠王⭐︎2',
      equipmentChance: 1.00,
    },
  },
  {
    level: 8,
    name: 'グランドチャンピオンズ',
    stars: '★8',
    badgeLabel: '★8 激闘',
    color: 'text-pink-400',
    border: 'border-pink-500/60',
    bg: 'bg-pink-950/50',
    description: '選ばれし名将と怪物選手たちが集う究極のチャンピオンシップ。',
    championshipTitle: '頂点を超越せし名将・グランドチャンプ',
    cpuStrengthText: '超弩級・全選手フル装備',
    rewards: {
      gerda: 270000,
      pitcherTickets: 9,
      fielderTickets: 9,
      renameTickets: 4,
      awardedSkill: '三冠王⭐︎3',
      equipmentChance: 1.00,
    },
  },
  {
    level: 9,
    name: 'ワールドロード',
    stars: '★9',
    badgeLabel: '★9 世界前哨',
    color: 'text-rose-400',
    border: 'border-rose-500/60',
    bg: 'bg-rose-950/50',
    description: '世界最高峰メジャーリーグへの門番が立ちはだかる決戦の舞台。',
    championshipTitle: '世界の扉を開く者・ワールドマスター',
    cpuStrengthText: '世界水準・驚異の怪物打線',
    rewards: {
      gerda: 330000,
      pitcherTickets: 10,
      fielderTickets: 10,
      renameTickets: 4,
      awardedSkill: '三冠王⭐︎4',
      equipmentChance: 1.00,
    },
  },
  {
    level: 10,
    name: 'メジャーリーグ',
    stars: '★10',
    badgeLabel: '★10 メジャー',
    color: 'text-emerald-300',
    border: 'border-emerald-400/70',
    bg: 'bg-emerald-950/60',
    description: '世界最高峰のメジャーリーグ！超弩級パワーと剛速球を誇るトップレベルの外国人選手がうようよ集う夢の舞台！',
    championshipTitle: '世界最強・メジャーリーグチャンピオン',
    cpuStrengthText: 'メジャー級スーパースター外国人軍団',
    rewards: {
      gerda: 420000,
      pitcherTickets: 12,
      fielderTickets: 12,
      renameTickets: 5,
      awardedSkill: '三冠王⭐︎5',
      equipmentChance: 1.00,
    },
  },
];

const ROMAN_NUMERALS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
};

export function getLeagueDifficulty(level: number): LeagueDifficultyInfo {
  const clamped = Math.max(1, Math.min(100, Math.floor(level)));
  const base = BASE_LEAGUE_DIFFICULTIES.find(d => d.level === clamped);
  if (base) return base;

  const isMajorLeague = clamped % 10 === 0;
  const majorStage = Math.floor(clamped / 10);
  const romanStage = ROMAN_NUMERALS[majorStage] || `${majorStage}`;

  let name = '';
  let badgeLabel = '';
  let color = 'text-cyan-300';
  let border = 'border-cyan-400/70';
  let bg = 'bg-cyan-950/50';
  let description = '';
  let championshipTitle = '';
  let cpuStrengthText = '';

  if (isMajorLeague) {
    if (clamped === 100) {
      name = 'メジャーリーグ X (頂点神話)';
      badgeLabel = '★100 メジャーX';
      color = 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300';
      border = 'border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.7)]';
      bg = 'bg-slate-950';
      description = '野球の歴史の極致！世界最高峰メジャーリーグの頂点神話！レベル100に到達した真の覇者だけが挑める終極の聖域！';
      championshipTitle = '世界最強メジャー絶対覇神・メジャーX';
      cpuStrengthText = '世界最強メジャー外国人オールスター・究極完全体';
    } else {
      name = `メジャーリーグ ${romanStage}`;
      badgeLabel = `★${clamped} メジャー${romanStage}`;
      if (clamped <= 30) {
        color = 'text-sky-300';
        border = 'border-sky-400/80';
        bg = 'bg-sky-950/70';
      } else if (clamped <= 60) {
        color = 'text-indigo-300';
        border = 'border-indigo-400/80';
        bg = 'bg-indigo-950/70';
      } else {
        color = 'text-amber-300';
        border = 'border-amber-400/80';
        bg = 'bg-amber-950/70';
      }
      description = `世界最高峰のメジャーリーグ（Stage ${majorStage}）！トップレベルの超弩級外国人スーパースターたちが集結した全米選抜球団が立ち塞がる！`;
      championshipTitle = `世界最高峰メジャーリーグ制覇・Stage ${majorStage}`;
      cpuStrengthText = `メジャー級スーパースター外国人軍団（Tier ${majorStage}）`;
    }
  } else {
    // 10ごとのメジャーリーグに至る前哨・挑戦階層
    const nextMajorStage = Math.floor(clamped / 10) + 1;
    const nextRoman = ROMAN_NUMERALS[nextMajorStage] || `${nextMajorStage}`;
    name = `メジャーロード ${ROMAN_NUMERALS[Math.floor(clamped / 10)] || ''} (Lv.${clamped})`;
    badgeLabel = `★${clamped} 挑戦`;
    color = 'text-emerald-300';
    border = 'border-emerald-500/60';
    bg = 'bg-emerald-950/40';
    description = `次なるメジャーリーグ（Stage ${nextRoman}）への挑戦権を懸けた死闘！ハイレベルな強豪選手たちが待ち受ける。`;
    championshipTitle = `メジャーロード踏破・★${clamped}`;
    cpuStrengthText = `メジャー前哨・世界選抜精鋭軍団（Lv.${clamped}）`;
  }

  const gerda = 420000 + (clamped - 10) * 38000;
  const pitcherTickets = Math.min(30, 12 + Math.floor((clamped - 10) * 0.4));
  const fielderTickets = Math.min(30, 12 + Math.floor((clamped - 10) * 0.4));
  const renameTickets = Math.min(10, 5 + Math.floor((clamped - 10) / 10));

  return {
    level: clamped,
    name,
    stars: `★${clamped}`,
    badgeLabel,
    color,
    border,
    bg,
    description,
    championshipTitle,
    cpuStrengthText,
    rewards: {
      gerda,
      pitcherTickets,
      fielderTickets,
      renameTickets,
      awardedSkill: isMajorLeague ? 'ハンク・アーロン賞⭐︎6' : '三冠王⭐︎6',
      equipmentChance: 1.00,
    },
  };
}

export function getUnlockedDifficulties(maxUnlocked: number = 1): LeagueDifficultyInfo[] {
  const maxLvl = Math.max(1, Math.min(100, Math.floor(maxUnlocked)));
  const list: LeagueDifficultyInfo[] = [];
  for (let l = 1; l <= maxLvl; l++) {
    list.push(getLeagueDifficulty(l));
  }
  return list;
}

export const LEAGUE_DIFFICULTIES: LeagueDifficultyInfo[] = getUnlockedDifficulties(6);

export interface UserAccount {
  teamName: string;
  managerName: string;
  passwordHash: string; // 単純な一致検証用
  createdAt: number;
  hasClaimedInitialScouts: boolean;
}
