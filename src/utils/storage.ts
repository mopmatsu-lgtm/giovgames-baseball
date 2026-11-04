import { League, Team, UserAccount, Player, Position, ActivityLog } from '../types/baseball';
import { createInitialLeague, createCpuTeam, calculateStandings } from './leagueManager';
import { generatePlayer } from './playerGenerator';
import { isSecretSeibuCommand, createSecretSeibuTeam, createSecretSeibuLeague } from './secretCommand';

const STORAGE_LEAGUE_KEY = 'gekipawa_online_league_v3';
const STORAGE_USER_KEY = 'gekipawa_online_user_v3';
const STORAGE_USERS_REGISTRY_KEY = 'gekipawa_online_users_registry_v3';

// 球団活動ログ追加ヘルパー（最新50件を保持）
export function addActivityLog(
  team: Team,
  message: string,
  category: ActivityLog['category'],
  timestampLabel?: string
): Team {
  const label = timestampLabel || new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  const newLog: ActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    message,
    category,
    timestamp: label,
    timestampLabel: label,
    createdAt: Date.now(),
  };
  const logs = [newLog, ...(team.activityLogs || [])].slice(0, 50);
  return {
    ...team,
    activityLogs: logs,
  };
}

// 登録済みユーザー一覧の保存・読み込み
function getUsersRegistry(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_REGISTRY_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to get users registry:', err);
  }
  return {};
}

function saveUserToRegistry(user: UserAccount): void {
  try {
    const reg = getUsersRegistry();
    reg[user.teamName] = user;
    localStorage.setItem(STORAGE_USERS_REGISTRY_KEY, JSON.stringify(reg));
  } catch (err) {
    console.error('Failed to save user to registry:', err);
  }
}

export function findRegisteredUser(teamName: string): UserAccount | null {
  const reg = getUsersRegistry();
  return reg[teamName] || null;
}

export function saveUserAccount(user: UserAccount): void {
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    saveUserToRegistry(user);
  } catch (err) {
    console.error('Failed to save user account:', err);
  }
}

export function loadUserAccount(): UserAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) return JSON.parse(raw) as UserAccount;
  } catch (err) {
    console.error('Failed to load user account:', err);
  }
  return null;
}

// ログアウト時はセッション情報のみ破棄し、球団データ・リーグデータは一切削除しない（安全に保存保持）
export function clearUserAccount(): void {
  localStorage.removeItem(STORAGE_USER_KEY);
}

export function getLeagueStorageKey(teamName?: string): string {
  if (teamName) {
    return `${STORAGE_LEAGUE_KEY}_${teamName}`;
  }
  return STORAGE_LEAGUE_KEY;
}

export function saveLeague(league: League): void {
  try {
    const userTeam = league.teams.find(t => t.isUser);
    const key = getLeagueStorageKey(userTeam?.name);
    const serialized = JSON.stringify(league);
    localStorage.setItem(key, serialized);
    // バックアップ用にも保持
    localStorage.setItem(STORAGE_LEAGUE_KEY, serialized);
  } catch (err) {
    console.error('Failed to save league:', err);
  }
}

// 初期球団作成ヘルパー：投手6名＋野手9名（ランダム能力値）でスタート
export function createDefaultUserTeam(userAccount: UserAccount): Team {
  // 隠しコマンド「西武ライオンズ」＆「6456」判定
  if (isSecretSeibuCommand(userAccount.teamName, userAccount.passwordHash)) {
    return createSecretSeibuTeam(userAccount);
  }

  const defaultFieldPositions: Position[] = ['捕', '一', '二', '三', '遊', '左', '中', '右', '指'];

  // 1. 投手6名（ランダム能力値、登板疲労なし）
  const initialPitchers: Player[] = [];
  for (let i = 0; i < 6; i++) {
    const p = generatePlayer({
      position: '投',
      number: 11 + i,
    });
    p.restGamesRemaining = 0;
    initialPitchers.push(p);
  }

  // 2. 野手9名（ランダム能力値）
  const initialFielders: Player[] = [];
  for (let i = 0; i < 9; i++) {
    const f = generatePlayer({
      position: '野',
      number: i + 1,
    });
    initialFielders.push(f);
  }

  const roster = [...initialPitchers, ...initialFielders];
  const lineup = initialFielders.map(f => f.id);
  const lineupPositions = [...defaultFieldPositions];

  // 先発ローテーション枠：第1先発、第2先発、第3先発
  const pitcherRotation = [initialPitchers[0].id, initialPitchers[1].id, initialPitchers[2].id];
  // 中継ぎ2名
  const bullpen = [initialPitchers[3].id, initialPitchers[4].id];
  // 抑え1名
  const closerId = initialPitchers[5].id;

  return {
    id: `team_user_${Date.now()}`,
    name: userAccount.teamName,
    managerName: userAccount.managerName,
    color: '#1E40AF',
    gerda: 5000,
    pitcherScoutTickets: 0, // ★仕様：初期スカウト券配布なし
    fielderScoutTickets: 0, // ★仕様：初期スカウト券配布なし
    inventory: {
      skillTickets: 2,
      slotExpandJewels: 0,
      equipments: [],
      ownedSkills: ['鉄壁', 'お立ち台'],
      renameTickets: 1,
    },
    roster,
    lineup,
    lineupPositions,
    benchFielders: [],
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
    isUser: true,
    maxUnlockedDifficulty: 1,
    championshipTitles: [],
    activityLogs: [
      {
        id: `init_${Date.now()}`,
        message: `球団「${userAccount.teamName}」が設立されました！所属選手15名（投手6名・野手9名）が入団しました。`,
        category: 'scout',
        timestamp: '球団設立時',
        createdAt: Date.now(),
      }
    ],
  };
}

export function loadLeague(userAccount?: UserAccount): League | null {
  try {
    // 隠しコマンド「西武ライオンズ」＆「6456」で未セーブ時の新規生成
    if (userAccount && isSecretSeibuCommand(userAccount.teamName, userAccount.passwordHash)) {
      const key = getLeagueStorageKey(userAccount.teamName);
      const existing = localStorage.getItem(key);
      if (!existing) {
        const seibuLeague = createSecretSeibuLeague(userAccount);
        saveLeague(seibuLeague);
        return seibuLeague;
      }
    }

    const key = getLeagueStorageKey(userAccount?.teamName);
    let raw = localStorage.getItem(key);
    if (!raw && userAccount) {
      // 旧バージョンキーやグローバルキーからのフォールバック読み込み
      raw = localStorage.getItem(STORAGE_LEAGUE_KEY) || localStorage.getItem('gekipawa_online_league_v2');
    }

    if (raw) {
      const parsed = JSON.parse(raw) as League;
      const defaultFieldPositions: Position[] = ['捕', '一', '二', '三', '遊', '左', '中', '右', '指'];

      // 隠しコマンド適用：既存セーブであっても最強データへの昇格・初期化を保証
      if (userAccount && isSecretSeibuCommand(userAccount.teamName, userAccount.passwordHash)) {
        const userTeamIdx = parsed.teams.findIndex(t => t.isUser);
        const userTeam = parsed.teams[userTeamIdx];
        if (!userTeam || userTeam.gerda < 900000 || userTeam.roster[0]?.rarity !== '伝説ユニーク') {
          const seibuTeam = createSecretSeibuTeam(userAccount);
          if (userTeamIdx >= 0) {
            parsed.teams[userTeamIdx] = seibuTeam;
          } else {
            parsed.teams.unshift(seibuTeam);
          }
          parsed.difficulty = 6;
          parsed.maxUnlockedDifficulty = 6;
          parsed.standings = calculateStandings(parsed);
          saveLeague(parsed);
        }
      }

      // 難易度初期化＆解放
      if (!parsed.difficulty) parsed.difficulty = 1;
      if (!parsed.maxUnlockedDifficulty) parsed.maxUnlockedDifficulty = 6;
      else parsed.maxUnlockedDifficulty = Math.max(6, parsed.maxUnlockedDifficulty);

      // 自球団のisUserフラグを確実に保証

      // 自球団のisUserフラグを確実に保証
      const userTeamFound = parsed.teams.find(t => t.isUser) || parsed.teams[0];
      if (userTeamFound) {
        userTeamFound.isUser = true;
      }

      parsed.teams.forEach((t, idx) => {
        if (!t.inventory) t.inventory = {} as any;
        if (!t.inventory.ownedSkills) t.inventory.ownedSkills = ['鉄壁', 'お立ち台'];
        if (t.inventory.renameTickets === undefined) t.inventory.renameTickets = 1;
        t.maxUnlockedDifficulty = 6;
        if (!t.championshipTitles) t.championshipTitles = [];
        if (!t.activityLogs) t.activityLogs = [];
        if (!t.tactics) {
          t.tactics = {
            stealTendency: '普通',
            buntTendency: '普通',
            pinchHitterTendency: '普通',
            pitcherChangeTendency: '普通',
            substitutionFrequency: '普通',
          };
        } else if (!t.tactics.substitutionFrequency) {
          t.tactics.substitutionFrequency = '普通';
        }

        // 野手のポジション表記を「野」に統一、弾道補完
        t.roster.forEach(p => {
          if (p.position !== '投') {
            p.position = '野';
            if (p.stats.fielder && (p.stats.fielder.trajectory === undefined || p.stats.fielder.trajectory < 1 || p.stats.fielder.trajectory > 4)) {
              p.stats.fielder.trajectory = Math.floor(Math.random() * 4) + 1;
            }
          }
          if (p.restGamesRemaining === undefined) {
            p.restGamesRemaining = 0;
          }
        });

        // 選手が0人または極端に少ない場合の救済
        if (t.isUser && t.roster.length === 0) {
          const fresh = createDefaultUserTeam(userAccount || {
            teamName: t.name,
            managerName: t.managerName,
            passwordHash: '',
            createdAt: Date.now(),
            hasClaimedInitialScouts: true,
          });
          t.roster = fresh.roster;
          t.lineup = fresh.lineup;
          t.lineupPositions = fresh.lineupPositions;
          t.pitcherRotation = fresh.pitcherRotation;
          t.bullpen = fresh.bullpen;
          t.closerId = fresh.closerId;
          t.pitcherScoutTickets = 0;
          t.fielderScoutTickets = 0;
        }

        // 野手不足（9名未満）の場合の自動補充
        const fielders = t.roster.filter(p => p.position !== '投');
        while (fielders.length < 9) {
          const newF = generatePlayer({
            position: '野',
            number: t.roster.length + 1,
          });
          t.roster.push(newF);
          fielders.push(newF);
        }

        // 投手不足（3名未満）の場合の自動補充
        const pitchers = t.roster.filter(p => p.position === '投');
        while (pitchers.length < 3) {
          const newP = generatePlayer({
            position: '投',
            number: t.roster.length + 1,
          });
          newP.restGamesRemaining = 0;
          t.roster.push(newP);
          pitchers.push(newP);
        }

        // スタメン打順（9名）が未登録・不足・無効IDの場合の完全修復
        let validLineup = (t.lineup || []).filter(id => t.roster.some(p => p.id === id));
        if (validLineup.length < 9) {
          const remainingFielders = t.roster.filter(p => p.position !== '投' && !validLineup.includes(p.id));
          while (validLineup.length < 9 && remainingFielders.length > 0) {
            validLineup.push(remainingFielders.shift()!.id);
          }
          const otherCandidates = t.roster.filter(p => !validLineup.includes(p.id));
          while (validLineup.length < 9 && otherCandidates.length > 0) {
            validLineup.push(otherCandidates.shift()!.id);
          }
        }
        t.lineup = validLineup.slice(0, 9);

        // 守備位置の補完
        if (!t.lineupPositions || t.lineupPositions.length !== 9) {
          t.lineupPositions = [...defaultFieldPositions];
        }

        // 先発ローテーション枠の補完
        const validPitchers = t.roster.filter(p => p.position === '投');
        let validRot = (t.pitcherRotation || []).filter(id => validPitchers.some(p => p.id === id));
        while (validRot.length < 3 && validPitchers.length > 0) {
          const cand = validPitchers.find(p => !validRot.includes(p.id)) || validPitchers[0];
          validRot.push(cand.id);
        }
        t.pitcherRotation = validRot.slice(0, 3);

        // 抑え投手の補完
        if (!t.closerId || !t.roster.some(p => p.id === t.closerId)) {
          t.closerId = validPitchers[validPitchers.length - 1]?.id || t.roster[0]?.id || '';
        }

        // ベンチ入り控え野手のバリデーション (最大5名、スタメン外の有効な野手IDのみ)
        if (t.benchFielders) {
          t.benchFielders = t.benchFielders
            .filter(id => t.roster.some(p => p.id === id && p.position !== '投' && !t.lineup.includes(id)))
            .slice(0, 5);
        } else {
          t.benchFielders = [];
        }
        // 投手成績の整合性・NaN補正
        t.roster.forEach(p => {
          if (p.position === '投' && p.record) {
            p.record.wins = Number.isFinite(p.record.wins) ? Math.max(0, Math.floor(p.record.wins)) : 0;
            p.record.losses = Number.isFinite(p.record.losses) ? Math.max(0, Math.floor(p.record.losses)) : 0;
            p.record.saves = Number.isFinite(p.record.saves) ? Math.max(0, Math.floor(p.record.saves)) : 0;
            if (p.record.outsPitched === undefined || !Number.isFinite(p.record.outsPitched)) {
              const ip = p.record.inningsPitched || 0;
              const inn = Math.floor(ip);
              const frac = Math.round((ip - inn) * 10);
              if (frac === 7) p.record.outsPitched = inn * 3 + 2;
              else if (frac === 3) p.record.outsPitched = inn * 3 + 1;
              else p.record.outsPitched = Math.round(ip * 3);
            }
            p.record.inningsPitched = p.record.outsPitched / 3;
            p.record.earnedRuns = Number.isFinite(p.record.earnedRuns) ? Math.max(0, p.record.earnedRuns) : 0;
          }
        });

        // 新シーズン開幕時または試合数乖離時の個人成績整合性救済（旧シーズンの打率・勝敗が残る不具合の完全防止）
        t.roster.forEach(p => {
          if (!p.record) return;
          // 新シーズン開幕時（playedGames === 0）なのに打席や登板記録がある、またはチーム消化試合数より個人の出場試合数が多い場合は完全リセット
          if (parsed.playedGames === 0 || (p.record.games > parsed.playedGames)) {
            p.record = {
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
            };
          }
        });
      });

      // 順位表の勝敗数・試合数・勝率・差の完全整合性復旧
      if (parsed.standings && parsed.teams) {
        parsed.standings = calculateStandings(parsed);

        // チーム順位表の勝敗と投手陣通算勝敗の整合性自動復旧
        parsed.teams.forEach(t => {
          const teamStanding = parsed.standings.find(s => s.teamId === t.id);
          if (!teamStanding) return;

          const pitchers = t.roster.filter(p => p.position === '投');
          if (pitchers.length === 0) return;

          const totalPitcherWins = pitchers.reduce((sum, p) => sum + (p.record?.wins || 0), 0);
          const totalPitcherLosses = pitchers.reduce((sum, p) => sum + (p.record?.losses || 0), 0);

          // 旧バージョンの判定不整合で投手の勝ち数または負け数が0のままチーム勝敗と大幅に乖離している場合の整合性救済
          if (teamStanding.wins > 0 && totalPitcherWins === 0) {
            const rotPitchers = t.pitcherRotation
              ?.map(id => pitchers.find(p => p.id === id))
              .filter((p): p is Player => !!p) || [];
            const targetPitchers = rotPitchers.length > 0 ? rotPitchers : pitchers.slice(0, 3);
            let remWins = teamStanding.wins;
            targetPitchers.forEach((p, idx) => {
              const share = idx === targetPitchers.length - 1 ? remWins : Math.floor(teamStanding.wins / targetPitchers.length);
              p.record.wins = (p.record.wins || 0) + share;
              remWins -= share;
            });
          }

          if (teamStanding.losses > 0 && totalPitcherLosses === 0) {
            const rotPitchers = t.pitcherRotation
              ?.map(id => pitchers.find(p => p.id === id))
              .filter((p): p is Player => !!p) || [];
            const targetPitchers = rotPitchers.length > 0 ? rotPitchers : pitchers.slice(0, 3);
            let remLosses = teamStanding.losses;
            targetPitchers.forEach((p, idx) => {
              const share = idx === targetPitchers.length - 1 ? remLosses : Math.floor(teamStanding.losses / targetPitchers.length);
              p.record.losses = (p.record.losses || 0) + share;
              remLosses -= share;
            });
          }
        });

        // CPUチームの個人成績整合性自動復旧（個人タイトル争い復旧保証）
        // リーグ戦が進行している（playedGames > 0）にもかかわらず、CPU選手成績が空または不足している場合、
        // 順位表の試合数・勝敗・得失点に基づきリアルな個人打撃・投手記録を再構成・自動補填する
        if (parsed.playedGames > 0) {
          parsed.teams.forEach(t => {
            if (t.isUser) return;
            const teamStanding = parsed.standings.find(s => s.teamId === t.id);
            const teamGames = teamStanding?.games || parsed.playedGames;
            if (teamGames <= 0) return;

            const fielders = t.roster.filter(p => p.position !== '投');
            const totalAtBats = fielders.reduce((sum, p) => sum + (p.record?.atBats || 0), 0);

            // 打者成績が不足している場合の補填
            if (totalAtBats < teamGames * 10) {
              const lineupIds = t.lineup || [];
              fielders.forEach((p, idx) => {
                const order = lineupIds.indexOf(p.id);
                const isRegular = order >= 0 && order < 9;
                if (!isRegular && p.record.games > 0) return;

                const posOrder = isRegular ? order : idx;
                const g = isRegular ? teamGames : Math.floor(teamGames * 0.3);
                p.record.games = g;
                const atBatsPerGame = isRegular ? (posOrder < 5 ? 4.1 : 3.7) : 1.2;
                const ab = Math.round(g * atBatsPerGame);
                p.record.atBats = ab;

                const meet = p.stats.fielder?.meet || 5;
                const power = p.stats.fielder?.power || 5;
                const speed = p.stats.fielder?.speed || 5;

                const battingAvg = 0.225 + (meet * 0.014) + ((posOrder === 2 || posOrder === 3) ? 0.015 : 0);
                p.record.hits = Math.round(ab * battingAvg);
                p.record.doubles = Math.round(p.record.hits * 0.18);
                p.record.triples = speed >= 7 ? Math.round(p.record.hits * 0.03) : 0;
                const hrRate = 0.012 + (power * 0.0075);
                p.record.homeRuns = Math.max(0, Math.round(ab * hrRate));
                const rbiFactor = 0.09 + (power * 0.02) + (posOrder === 3 || posOrder === 2 ? 0.06 : 0);
                p.record.rbi = Math.max(p.record.homeRuns, Math.round(ab * rbiFactor));
                p.record.walks = Math.round(ab * 0.08);
                p.record.strikeouts = Math.max(0, Math.round(ab * (0.24 - meet * 0.009)));
                p.record.stolenBases = speed >= 7 ? Math.round(g * (speed * 0.045)) : 0;
              });
            }

            // 投手成績が不足している場合の補填
            const pitchers = t.roster.filter(p => p.position === '投');
            const totalPitchOuts = pitchers.reduce((sum, p) => sum + (p.record?.outsPitched || 0), 0);
            if (totalPitchOuts < teamGames * 15) {
              const rotation = t.pitcherRotation?.map(id => pitchers.find(p => p.id === id)).filter((p): p is Player => !!p) || pitchers.slice(0, 3);
              const rotationCount = Math.max(1, rotation.length);

              rotation.forEach((rotP, rIdx) => {
                const starts = Math.floor(teamGames / rotationCount) + (rIdx < (teamGames % rotationCount) ? 1 : 0);
                rotP.record.pitchGames = starts;
                const ip = starts * 6.2;
                rotP.record.outsPitched = Math.round(ip * 3);
                rotP.record.inningsPitched = rotP.record.outsPitched / 3;
                const control = rotP.stats.pitcher?.control || 5;
                const breaking = rotP.stats.pitcher?.breaking || 5;
                const speed = rotP.stats.pitcher?.speed || 5;

                const era = Math.max(1.80, 4.40 - (control * 0.22));
                rotP.record.earnedRuns = Math.round((era * rotP.record.inningsPitched) / 9);
                rotP.record.pitchStrikeouts = Math.round(rotP.record.inningsPitched * (0.65 + breaking * 0.06 + speed * 0.02));
                rotP.record.pitchHits = Math.round(rotP.record.inningsPitched * 0.92);
                rotP.record.pitchWalks = Math.max(1, Math.round(rotP.record.inningsPitched * (0.38 - control * 0.015)));
                rotP.record.pitchHomeRuns = Math.max(0, Math.round(rotP.record.inningsPitched * 0.11));
              });

              // 抑え投手補填
              const closer = pitchers.find(p => p.id === t.closerId) || pitchers[pitchers.length - 1];
              if (closer && !rotation.some(p => p.id === closer.id)) {
                closer.record.pitchGames = Math.round(teamGames * 0.42);
                closer.record.saves = Math.max(0, Math.round((teamStanding?.wins || 0) * 0.65));
                closer.record.outsPitched = Math.round(teamGames * 0.42 * 3.1);
                closer.record.inningsPitched = closer.record.outsPitched / 3;
                closer.record.earnedRuns = Math.round(closer.record.inningsPitched * 0.22);
                closer.record.pitchStrikeouts = Math.round(closer.record.inningsPitched * 1.15);
                closer.record.pitchHits = Math.round(closer.record.inningsPitched * 0.75);
                closer.record.pitchWalks = Math.round(closer.record.inningsPitched * 0.25);
              }
            }
          });
        }
      }

      return parsed;
    }
  } catch (err) {
    console.error('Failed to load league:', err);
  }

  if (userAccount) {
    // 新規球団初期化 (投手6名＋野手9名で開始！)
    const newUserTeam = createDefaultUserTeam(userAccount);
    const newLeague = createInitialLeague(newUserTeam, 1);
    saveLeague(newLeague);
    return newLeague;
  }

  return null;
}
