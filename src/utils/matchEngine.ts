import {
  MatchState,
  Team,
  Player,
  MatchPlayLog,
  MatchPlayerBatting,
  MatchPlayerPitching,
  ScoringPlay,
  AtBatEvent,
  StealRecord,
  Position,
  SkillId
} from '../types/baseball';
import { getPitcherKmh } from './playerGenerator';

/**
 * 投球回数（アウト数）を日本のプロ野球公式記録表記（例: 7回2/3、2/3回、0回など）に整形する
 */
export function formatInningsPitched(
  outsOrRecord: number | { outsPitched?: number; inningsPitched?: number; outsRecorded?: number }
): string {
  let outs = 0;
  if (typeof outsOrRecord === 'number') {
    if (Number.isInteger(outsOrRecord)) {
      outs = outsOrRecord;
    } else {
      const inn = Math.floor(outsOrRecord);
      const frac = Math.round((outsOrRecord - inn) * 10);
      if (frac === 7) outs = inn * 3 + 2;
      else if (frac === 3) outs = inn * 3 + 1;
      else outs = Math.round(outsOrRecord * 3);
    }
  } else if (outsOrRecord) {
    if (typeof outsOrRecord.outsRecorded === 'number') {
      outs = outsOrRecord.outsRecorded;
    } else if (typeof outsOrRecord.outsPitched === 'number') {
      outs = outsOrRecord.outsPitched;
    } else {
      const ip = outsOrRecord.inningsPitched || 0;
      const inn = Math.floor(ip);
      const frac = Math.round((ip - inn) * 10);
      if (frac === 7) outs = inn * 3 + 2;
      else if (frac === 3) outs = inn * 3 + 1;
      else outs = Math.round(ip * 3);
    }
  }

  outs = Math.max(0, Math.floor(outs));
  const inn = Math.floor(outs / 3);
  const rem = outs % 3;

  if (rem === 0) {
    return `${inn}回`;
  }
  if (inn === 0) {
    return `${rem}/3回`;
  }
  return `${inn}回${rem}/3`;
}

export function createMatch(matchNumber: number, homeTeam: Team, awayTeam: Team): MatchState {
  const inningScores = Array.from({ length: 9 }, () => ({ top: null, bottom: null }));

  return {
    id: `match_${matchNumber}_${Date.now()}`,
    matchNumber,
    homeTeam: JSON.parse(JSON.stringify(homeTeam)),
    awayTeam: JSON.parse(JSON.stringify(awayTeam)),
    currentInning: 1,
    isBottom: false,
    outs: 0,
    scoreTop: 0,
    scoreBottom: 0,
    hitsTop: 0,
    hitsBottom: 0,
    errorsTop: 0,
    errorsBottom: 0,
    inningScores,
    runners: { first: null, second: null, third: null },
    isFinished: false,
    winnerId: null,
    logs: [
      {
        id: `log_init_${Date.now()}`,
        inning: 1,
        isBottom: false,
        outs: 0,
        text: `プレイボール！第${matchNumber}試合 【${awayTeam.name}】 vs 【${homeTeam.name}】`,
        scoreTop: 0,
        scoreBottom: 0,
        type: 'hit',
      }
    ],
    homeBattingStats: [],
    awayBattingStats: [],
    homePitchingStats: [],
    awayPitchingStats: [],
    scoringPlays: [],
    atBatEvents: [],
    steals: [],
  };
}

// 塁上の走者状態を正確に8分類する判定関数（一三塁などの欠落を完全防止）
export function getRunnersDescription(runners: { first: string | null; second: string | null; third: string | null }): string {
  const f = !!runners.first;
  const s = !!runners.second;
  const t = !!runners.third;
  if (f && s && t) return '満塁';
  if (f && s && !t) return '一二塁';
  if (f && !s && t) return '一三塁';
  if (!f && s && t) return '二三塁';
  if (f) return '一塁';
  if (s) return '二塁';
  if (t) return '三塁';
  return '走者なし';
}

// 走者の盗塁企図・判定
function trySteal(
  runners: { first: string | null; second: string | null; third: string | null },
  battingTeam: Team,
  fieldingTeam: Team,
  battingMap: Record<string, MatchPlayerBatting>,
  logs: MatchPlayLog[],
  inn: number,
  isBottom: boolean,
  atBatEvents: AtBatEvent[],
  stealsList: StealRecord[],
  pitcherName: string,
  currentOuts: number
): { first: string | null; second: string | null; third: string | null; outsDelta: number } {
  let outsDelta = 0;
  const next = { ...runners };

  // 1塁走者の二盗判定（2塁が空いている場合）
  if (next.first && !next.second) {
    const runner = battingTeam.roster.find(p => p.name === next.first) || battingTeam.roster.find(p => p.id === next.first);
    if (runner) {
      let stealKingStar = 0;
      for (let s = 6; s >= 1; s--) {
        if (runner.skills.includes(`盗塁王⭐︎${s}` as SkillId)) {
          stealKingStar = s;
          break;
        }
      }
      const stealKingSpdBonus = stealKingStar === 6 ? 8 : stealKingStar === 5 ? 6 : stealKingStar === 4 ? 5 : stealKingStar === 3 ? 4 : stealKingStar === 2 ? 3 : stealKingStar === 1 ? 2 : 0;
      const runnerSpdBonus = (runner.equipment?.name.includes('エアロ') ? 2 : (runner.equipment?.name.includes('スパイク') ? 1 : 0)) +
        stealKingSpdBonus +
        (runner.skills.includes('神速の韋駄天') ? 6 : runner.skills.includes('神速スプリンター') ? 5 : runner.skills.includes('ダイヤモンドの支配者') ? 5 : (runner.skills.includes('韋駄天') || runner.skills.includes('快足スプリンター')) ? 3 : 0);
      const spd = (runner.stats.fielder?.speed || 5) + runnerSpdBonus;
      const hasStealSkill = runner.skills.includes('盗塁');
      const hasJumpSkill = runner.skills.includes('飛び出し');
      const hasDenko = runner.skills.includes('電光石火');
      const hasIdaten = runner.skills.includes('韋駄天');
      const hasDenkoKai = runner.skills.includes('電光石火・改');
      const hasShinsoku = runner.skills.includes('神速スプリンター');
      const hasIdatenGod = runner.skills.includes('神速の韋駄天');
      const hasDiamondRuler = runner.skills.includes('ダイヤモンドの支配者');
      const hasStealGuardBreak = runner.skills.includes('盗塁警戒破り');
      const hasFastSprint = runner.skills.includes('快足スプリンター');
      const tactic = battingTeam.tactics.stealTendency || '普通';

      // 守備側投手＆捕手のスキルチェック
      const currentPitcher = fieldingTeam.roster.find(p => p.name === pitcherName) || fieldingTeam.roster.find(p => p.position === '投');
      const pitcherHasQuick = currentPitcher?.skills?.includes('クイック○');
      const pitcherHasKensei = currentPitcher?.skills?.includes('牽制○');

      // 走力に応じたリアルな盗塁企図率（現実のプロ野球の頻度に調整）
      let attemptProb = spd >= 9 ? 0.16 : spd >= 7 ? 0.08 : spd >= 5 ? 0.025 : 0.005;
      if (tactic === '積極') attemptProb += 0.06;
      if (tactic === '慎重') attemptProb = Math.max(0.002, attemptProb - 0.03);
      if (hasStealSkill) attemptProb += 0.10;
      if (hasJumpSkill) attemptProb += 0.05;
      if (hasDenko) attemptProb += 0.12;
      if (hasIdaten) attemptProb += 0.08;
      if (hasDenkoKai) attemptProb += 0.22;
      if (hasShinsoku) attemptProb += 0.15;
      if (hasIdatenGod) attemptProb += 0.26;
      if (hasDiamondRuler) attemptProb += 0.22;
      if (stealKingStar > 0) attemptProb += stealKingStar * 0.04;
      if (hasStealGuardBreak) attemptProb += 0.14;
      if (hasFastSprint) attemptProb += 0.08;
      if (!hasDenkoKai && !hasIdatenGod && !hasStealGuardBreak) {
        if (pitcherHasQuick) attemptProb *= 0.6;
        if (pitcherHasKensei) attemptProb *= 0.7;
      }

      // 2アウト時はリスクを避けて企図率半減
      if (currentOuts === 2) attemptProb *= 0.5;

      if (Math.random() < Math.max(0.003, Math.min(0.85, attemptProb))) {
        // 捕手肩力（守備）チェック
        const catcher = fieldingTeam.roster.find(p => fieldingTeam.lineupPositions?.[fieldingTeam.lineup.indexOf(p.id)] === '捕') || fieldingTeam.roster[0];
        const cDefense = (catcher?.stats.fielder?.defense || 5) +
          (catcher?.skills?.includes('司令塔') ? 3 : (catcher?.skills?.includes('扇の要') ? 2 : 0));
        const catcherHasBakuKata = catcher?.skills?.includes('極爆肩');
        const catcherHasCannon = catcher?.skills?.includes('キャノン肩');
        const catcherHasCannonLaser = catcher?.skills?.includes('キャノンレーザー');
        const catcherHasOginoKaname = catcher?.skills?.includes('扇の要');
        const catcherHasSireitou = catcher?.skills?.includes('司令塔');
        const catcherHasLaser = catcher?.skills?.includes('レーザービーム');
        const catcherHasAccuracy = catcher?.skills?.includes('送球精度');

        let successProb = 0.65 + (spd - cDefense) * 0.04;
        if (stealKingStar > 0) successProb += stealKingStar * 0.06;
        if (hasStealSkill) successProb += 0.15;
        if (hasDenko) successProb += 0.20;
        if (hasIdaten) successProb += 0.15;
        if (hasShinsoku) successProb += 0.22;
        if (hasDenkoKai) successProb += 0.35;
        if (hasIdatenGod) successProb += 0.40;
        if (hasDiamondRuler) successProb += 0.35;
        if (hasStealGuardBreak) successProb += 0.25;
        if (hasFastSprint) successProb += 0.12;
        if (catcherHasCannonLaser) successProb -= 0.45;
        if (catcherHasBakuKata) successProb -= 0.35;
        if (catcherHasCannon) successProb -= 0.25;
        if (catcherHasLaser) successProb -= 0.35;
        if (catcherHasSireitou) successProb -= 0.25;
        if (catcherHasAccuracy) successProb -= 0.18;
        if (catcherHasOginoKaname) successProb -= 0.15;
        if (!hasDenkoKai && !hasIdatenGod && !hasStealGuardBreak) {
          if (pitcherHasQuick) successProb -= 0.15;
          if (pitcherHasKensei) successProb -= 0.10;
        }
        successProb = Math.max(0.15, Math.min(0.96, successProb));

        const order = (battingTeam.lineup.indexOf(runner.id) + 1) || 1;

        if (Math.random() < successProb) {
          next.second = next.first;
          next.first = null;
          const bStat = battingMap[runner.id];
          if (bStat) bStat.stolenBases = (bStat.stolenBases || 0) + 1;

          const skillUsed = stealKingStar > 0 ? `盗塁王⭐︎${stealKingStar}` : hasIdatenGod ? '神速の韋駄天' : hasDiamondRuler ? 'ダイヤモンドの支配者' : hasStealGuardBreak ? '盗塁警戒破り' : hasDenkoKai ? '電光石火・改' : hasShinsoku ? '神速スプリンター' : hasFastSprint ? '快足スプリンター' : hasDenko ? '電光石火' : hasIdaten ? '韋駄天' : hasStealSkill ? '盗塁' : hasJumpSkill ? '飛び出し' : undefined;

          stealsList.push({
            id: `steal_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            teamName: battingTeam.name,
            runnerName: runner.name,
            base: '二盗',
            success: true,
            catcherName: catcher?.name,
            speed: spd,
            skillUsed,
          });

          atBatEvents.push({
            id: `ev_steal_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            order,
            batterName: runner.name,
            pitcherName,
            result: `⚡ 二盗成功！${skillUsed ? ` 【スキル: ${skillUsed}】` : ''}`,
            type: 'steal',
            rbi: 0,
            runnersState: getRunnersDescription(runners),
            outs: currentOuts,
            skillUsed,
            stealDetails: {
              runnerName: runner.name,
              base: '二盗',
              success: true,
              catcherName: catcher?.name,
              speed: spd,
            },
          });

          logs.push({
            id: `log_steal_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            outs: currentOuts,
            text: `【⚡ 盗塁成功！】走者・${runner.name}が鮮やかに二盗を決めました！${skillUsed ? `【スキル: ${skillUsed}】` : ''}`,
            scoreTop: 0,
            scoreBottom: 0,
            type: 'steal',
            skillTriggered: skillUsed,
          });
        } else {
          next.first = null;
          outsDelta = 1;
          const skillUsed = catcherHasBakuKata ? '極爆肩' : undefined;

          stealsList.push({
            id: `steal_cs_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            teamName: battingTeam.name,
            runnerName: runner.name,
            base: '二盗',
            success: false,
            catcherName: catcher?.name,
            speed: spd,
            skillUsed,
          });

          atBatEvents.push({
            id: `ev_cs_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            order,
            batterName: runner.name,
            pitcherName,
            result: `🚫 盗塁失敗 タッチアウト${skillUsed ? ` 【スキル: ${skillUsed}】` : ''}`,
            type: 'steal',
            rbi: 0,
            runnersState: getRunnersDescription(runners),
            outs: currentOuts,
            skillUsed,
            stealDetails: {
              runnerName: runner.name,
              base: '二盗',
              success: false,
              catcherName: catcher?.name,
              speed: spd,
            },
          });

          logs.push({
            id: `log_cs_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            outs: currentOuts,
            text: `【🚫 盗塁死！】走者・${runner.name}が二塁を狙うも捕手・${catcher?.name || '捕手'}の鋭い送球に刺されタッチアウト！${skillUsed ? `【スキル: ${skillUsed}】` : ''}`,
            scoreTop: 0,
            scoreBottom: 0,
            type: 'out',
            skillTriggered: skillUsed,
          });
        }
      }
    }
  } else if (next.second && !next.third) {
    // 2塁走者の三盗判定（3塁が空いている場合）
    const runner = battingTeam.roster.find(p => p.name === next.second) || battingTeam.roster.find(p => p.id === next.second);
    if (runner) {
      const spd = (runner.stats.fielder?.speed || 5) + (runner.equipment?.name.includes('エアロ') ? 2 : (runner.equipment?.name.includes('スパイク') ? 1 : 0)) + (runner.skills.includes('韋駄天') ? 3 : 0);
      const hasStealSkill = runner.skills.includes('盗塁');
      const hasJumpSkill = runner.skills.includes('飛び出し');
      const hasDenko = runner.skills.includes('電光石火');
      const hasIdaten = runner.skills.includes('韋駄天');
      const tactic = battingTeam.tactics.stealTendency || '普通';

      const currentPitcher = fieldingTeam.roster.find(p => p.name === pitcherName) || fieldingTeam.roster.find(p => p.position === '投');
      const pitcherHasQuick = currentPitcher?.skills?.includes('クイック○');

      // 三盗は現実の野球同様、ごく稀な奇襲プレーに限定（走力7以上または盗塁・韋駄天スキル保持者のみ）
      if (spd >= 7 || hasStealSkill || hasDenko || hasIdaten) {
        let attemptProb = spd >= 9 ? 0.025 : spd >= 7 ? 0.012 : 0.005;
        if (tactic === '積極') attemptProb += 0.015;
        if (tactic === '慎重') attemptProb = Math.max(0.001, attemptProb - 0.01);
        if (hasStealSkill) attemptProb += 0.03;
        if (hasJumpSkill) attemptProb += 0.015;
        if (hasDenko) attemptProb += 0.035;
        if (hasIdaten) attemptProb += 0.025;
        if (pitcherHasQuick) attemptProb *= 0.5;
        if (currentOuts === 2) attemptProb *= 0.4;

        if (Math.random() < Math.max(0.002, Math.min(0.40, attemptProb))) {
          const catcher = fieldingTeam.roster.find(p => fieldingTeam.lineupPositions?.[fieldingTeam.lineup.indexOf(p.id)] === '捕') || fieldingTeam.roster[0];
          const cDefense = (catcher?.stats.fielder?.defense || 5) + (catcher?.skills?.includes('扇の要') ? 2 : 0);
          const catcherHasBakuKata = catcher?.skills?.includes('極爆肩');
          const catcherHasCannon = catcher?.skills?.includes('キャノン肩');
          const catcherHasOginoKaname = catcher?.skills?.includes('扇の要');

          let successProb = 0.58 + (spd - cDefense) * 0.04;
          if (hasStealSkill) successProb += 0.15;
          if (hasDenko) successProb += 0.20;
          if (hasIdaten) successProb += 0.15;
          if (catcherHasBakuKata) successProb -= 0.35;
          if (catcherHasCannon) successProb -= 0.25;
          if (catcherHasOginoKaname) successProb -= 0.15;
          if (pitcherHasQuick) successProb -= 0.15;
          successProb = Math.max(0.12, Math.min(0.88, successProb));

          const order = (battingTeam.lineup.indexOf(runner.id) + 1) || 1;

        if (Math.random() < successProb) {
          next.third = next.second;
          next.second = null;
          const bStat = battingMap[runner.id];
          if (bStat) bStat.stolenBases = (bStat.stolenBases || 0) + 1;

          const skillUsed = hasDenko ? '電光石火' : hasIdaten ? '韋駄天' : hasStealSkill ? '盗塁' : hasJumpSkill ? '飛び出し' : undefined;

          stealsList.push({
            id: `steal3_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            teamName: battingTeam.name,
            runnerName: runner.name,
            base: '三盗',
            success: true,
            speed: spd,
            skillUsed,
          });

          atBatEvents.push({
            id: `ev_steal3_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            order,
            batterName: runner.name,
            pitcherName,
            result: `⚡ 三盗成功！${skillUsed ? ` 【スキル: ${skillUsed}】` : ''}`,
            type: 'steal',
            rbi: 0,
            runnersState: getRunnersDescription(runners),
            outs: currentOuts,
            skillUsed,
            stealDetails: {
              runnerName: runner.name,
              base: '三盗',
              success: true,
              speed: spd,
            },
          });

          logs.push({
            id: `log_steal3_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            outs: currentOuts,
            text: `【⚡ 三盗成功！】走者・${runner.name}、意表を突くスタートで三塁盗塁を決めました！${skillUsed ? `【スキル: ${skillUsed}】` : ''}`,
            scoreTop: 0,
            scoreBottom: 0,
            type: 'steal',
            skillTriggered: skillUsed,
          });
        } else {
          next.second = null;
          outsDelta = 1;

          stealsList.push({
            id: `steal_cs3_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            teamName: battingTeam.name,
            runnerName: runner.name,
            base: '三盗',
            success: false,
            speed: spd,
          });

          atBatEvents.push({
            id: `ev_cs3_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            order,
            batterName: runner.name,
            pitcherName,
            result: `🚫 三盗失敗 タッチアウト`,
            type: 'steal',
            rbi: 0,
            runnersState: getRunnersDescription(runners),
            outs: currentOuts,
            stealDetails: {
              runnerName: runner.name,
              base: '三盗',
              success: false,
              speed: spd,
            },
          });

          logs.push({
            id: `log_cs3_${Date.now()}_${Math.random()}`,
            inning: inn,
            isBottom,
            outs: currentOuts,
            text: `【🚫 三盗死！】走者・${runner.name}、三塁タッチアウト！`,
            scoreTop: 0,
            scoreBottom: 0,
            type: 'out',
          });
        }
      }
    }
  }
}

  return { ...next, outsDelta };
}

export function simulateFullMatch(state: MatchState): MatchState {
  const s: MatchState = JSON.parse(JSON.stringify(state));
  if (!s.steals) s.steals = [];
  if (!s.atBatEvents) s.atBatEvents = [];

  // 各チームの打者ラインナップと投手取得（9名を確実に保証し、欠員・ID不一致時は即座に自動補完）
  const getLineupPlayers = (team: Team): Player[] => {
    let players = (team.lineup || [])
      .map(id => team.roster.find(p => p.id === id))
      .filter((p): p is Player => !!p);

    if (players.length < 9) {
      const candidates = team.roster.filter(p => !players.some(lp => lp.id === p.id));
      while (players.length < 9 && candidates.length > 0) {
        players.push(candidates.shift()!);
      }
    }

    // 最終防壁：万一選手が9人に満たない場合の安全な補填
    while (players.length < 9) {
      const idx = players.length + 1;
      players.push({
        id: `emergency_${team.id}_${idx}`,
        name: `登録選手${idx}号`,
        number: 80 + idx,
        careerYears: 1,
        position: '野',
        rarity: 'N',
        stats: { fielder: { meet: 4, power: 4, speed: 4, defense: 4, trajectory: 2 } },
        skillSlots: 1,
        skills: [],
        titles: [],
        battingHand: '右打',
        throwingHand: '右投',
        avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 1, eyesStyle: 1 },
        record: {
          games: 0, atBats: 0, hits: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
          walks: 0, strikeouts: 0, stolenBases: 0, pitchGames: 0, wins: 0, losses: 0,
          saves: 0, holds: 0, inningsPitched: 0, earnedRuns: 0, pitchHits: 0,
          pitchHomeRuns: 0, pitchStrikeouts: 0, pitchWalks: 0
        }
      });
    }

    return players.slice(0, 9);
  };

  const homeLineup = getLineupPlayers(s.homeTeam);
  const awayLineup = getLineupPlayers(s.awayTeam);

  const createBattingStatMap = (lineup: Player[], team: Team): Record<string, MatchPlayerBatting> => {
    const map: Record<string, MatchPlayerBatting> = {};
    lineup.forEach((p, idx) => {
      const defaultPositions: Position[] = ['捕', '一', '二', '三', '遊', '左', '中', '右', '指'];
      const lineupPos = team.lineupPositions?.[idx];
      const pos = (lineupPos && lineupPos !== '野' && lineupPos !== '野手')
        ? lineupPos
        : (p.position === '投' ? '投' : defaultPositions[idx] || '指');
      const avg = p.record.atBats > 0 ? p.record.hits / p.record.atBats : 0;
      map[p.id] = {
        playerId: p.id,
        name: p.name,
        order: idx + 1,
        position: pos,
        atBats: 0,
        hits: 0,
        doubles: 0,
        triples: 0,
        homeRuns: 0,
        rbi: 0,
        walks: 0,
        strikeouts: 0,
        stolenBases: 0,
        seasonAvg: Math.round(avg * 1000) / 1000,
      };
    });
    return map;
  };

  const awayBattingMap = createBattingStatMap(awayLineup, s.awayTeam);
  const homeBattingMap = createBattingStatMap(homeLineup, s.homeTeam);

  // 投手ボックススコア追跡用
  const awayPitchingMap: Record<string, MatchPlayerPitching> = {};
  const homePitchingMap: Record<string, MatchPlayerPitching> = {};

  const getOrInitPitcherStat = (
    pitcher: Player,
    role: string,
    map: Record<string, MatchPlayerPitching>
  ): MatchPlayerPitching => {
    if (!map[pitcher.id]) {
      const era = pitcher.record.inningsPitched > 0 ? (pitcher.record.earnedRuns * 9) / pitcher.record.inningsPitched : 0;
      map[pitcher.id] = {
        playerId: pitcher.id,
        name: pitcher.name,
        role,
        inningsPitched: 0,
        hits: 0,
        homeRuns: 0,
        strikeouts: 0,
        walks: 0,
        runs: 0,
        earnedRuns: 0,
        seasonEra: Math.round(era * 100) / 100,
      };
    }
    return map[pitcher.id];
  };

  const getPitcher = (team: Team, inning: number, scoreDiff: number): { pitcher: Player; role: string } => {
    // 9回リード時は抑え
    if (inning >= 9 && scoreDiff >= 1 && scoreDiff <= 3 && team.closerId) {
      const closer = team.roster.find(p => p.id === team.closerId);
      if (closer) return { pitcher: closer, role: '抑え' };
    }

    // 先発ローテーション枠決定
    const rotList = (team.pitcherRotation && team.pitcherRotation.length > 0)
      ? team.pitcherRotation
      : team.roster.filter(p => p.position === '投').map(p => p.id);
    const scheduledSlotIdx = (s.matchNumber - 1) % Math.min(3, Math.max(1, rotList.length));
    const scheduledStarterId = rotList[scheduledSlotIdx] || rotList[0];
    let starter = team.roster.find(p => p.id === scheduledStarterId);

    // 予定先発が休養中（restGamesRemaining > 0）の場合、ローテ枠内の万全な投手を探索
    if (!starter || (starter.restGamesRemaining || 0) > 0) {
      const readyRotationPitcher = rotList
        .map(id => team.roster.find(p => p.id === id))
        .find(p => p && (p.restGamesRemaining || 0) === 0);

      if (readyRotationPitcher) {
        starter = readyRotationPitcher;
      } else {
        const readyAnyPitcher = team.roster.find(p => p.position === '投' && (p.restGamesRemaining || 0) === 0);
        if (readyAnyPitcher) {
          starter = readyAnyPitcher;
        } else if (!starter) {
          starter = team.roster.find(p => p.position === '投') || team.roster[0];
        }
      }
    }

    // 先発が好投中（7回かつ自責2以下、スタミナ6以上）なら7回も続投
    if (starter) {
      const starterStamina = starter.stats.pitcher?.stamina || 5;
      const starterPitchStat = (s.isBottom ? awayPitchingMap : homePitchingMap)[starter.id];
      const starterEarned = starterPitchStat?.earnedRuns ?? 0;
      if (inning === 7 && starterStamina >= 6 && starterEarned <= 2) {
        return { pitcher: starter, role: '先発' };
      }
    }

    // 7回以降は中継ぎ（試合番号とイニングを組み合わせて中継ぎ陣を均等起用）
    if (inning >= 7 && team.bullpen.length > 0) {
      const relIdx = (s.matchNumber + inning) % team.bullpen.length;
      const rel = team.roster.find(p => p.id === team.bullpen[relIdx]);
      if (rel) return { pitcher: rel, role: '中継ぎ' };
    }

    if (!starter) {
      starter = {
        id: `emergency_pitcher_${team.id}`,
        name: '緊急登板投手',
        number: 99,
        careerYears: 1,
        position: '投',
        rarity: 'N',
        stats: { pitcher: { speed: 4, control: 4, stamina: 4, breaking: 4 } },
        skillSlots: 1,
        skills: [],
        titles: [],
        battingHand: '右打',
        throwingHand: '右投',
        avatar: { skinColor: '#fcd34d', hairColor: '#1e293b', hairStyle: 1, eyesStyle: 1 },
        record: {
          games: 0, atBats: 0, hits: 0, doubles: 0, triples: 0, homeRuns: 0, rbi: 0,
          walks: 0, strikeouts: 0, stolenBases: 0, pitchGames: 1, wins: 0, losses: 0,
          saves: 0, holds: 0, inningsPitched: 0, earnedRuns: 0, pitchHits: 0,
          pitchHomeRuns: 0, pitchStrikeouts: 0, pitchWalks: 0
        }
      };
    }

    return { pitcher: starter as Player, role: '先発' };
  };

  let awayOrderIdx = 0;
  let homeOrderIdx = 0;
  let atBatCounter = 1;

  // 責任投手（勝利・敗戦・セーブ）判定用の得点推移およびイニング履歴追跡
  const runEvents: Array<{
    runNumberForTeam: number;
    battingTeamId: string;
    concedingPitcherId: string;
    concedingPitcherName: string;
    inning: number;
    isBottom: boolean;
  }> = [];

  const halfInnings: Array<{
    inning: number;
    isBottom: boolean;
    pitcherId: string;
    pitcherName: string;
    scoreTop: number;
    scoreBottom: number;
  }> = [];

  let awayTotalRunsCounter = 0;
  let homeTotalRunsCounter = 0;

  // 公認野球規則 9.17 準拠：リード推移追跡
  // 試合終了まで一度も同点または逆転されずに保たれた「最後の決定的なリード」の発生瞬間を記録
  let finalLeadEvent: {
    leadingTeamId: string;
    concedingPitcherId: string; // リードを許した相手投手（敗戦投手の対象）
    concedingPitcherName: string;
    pitcherOfRecordId: string;  // リードを奪った瞬間に自軍の責任投手だった投手（勝利投手の権利対象）
    pitcherOfRecordName: string;
    inning: number;
    isBottom: boolean;
  } | null = null;

  const initialHomeStarter = getPitcher(s.homeTeam, 1, 0).pitcher;
  const initialAwayStarter = getPitcher(s.awayTeam, 1, 0).pitcher;
  let lastHomePitcher: Player = initialHomeStarter;
  let lastAwayPitcher: Player = initialAwayStarter;

  // ベンチ入り控え野手の初期化（スタメン外の野手・最大5名）
  const getBenchFieldersList = (team: Team, activeLineup: Player[]): Player[] => {
    const activeIds = new Set(activeLineup.map(p => p.id));
    const benchIds = (team.benchFielders && team.benchFielders.length > 0)
      ? team.benchFielders
      : [];
    return benchIds
      .map(id => team.roster.find(p => p.id === id))
      .filter((p): p is Player => !!p && p.position !== '投' && !activeIds.has(p.id));
  };

  const availableBenchAway: Player[] = getBenchFieldersList(s.awayTeam, awayLineup);
  const availableBenchHome: Player[] = getBenchFieldersList(s.homeTeam, homeLineup);

  // 代打起用判定関数
  const considerPinchHitter = (
    currentBatter: Player,
    slotIdx: number,
    isBottom: boolean,
    inning: number,
    outsCount: number,
    currentRunners: { first: string | null; second: string | null; third: string | null },
    battingTeam: Team,
    myScore: number,
    oppScore: number,
    activeLineup: Player[],
    benchPool: Player[],
    battingMap: Record<string, MatchPlayerBatting>,
    oppPitcherName: string
  ): Player => {
    if (benchPool.length === 0) return currentBatter;

    // 代打の考慮条件：終盤7回以降、またはビハインド時に6回以降
    const isLate = inning >= 7 || (inning >= 6 && myScore < oppScore);
    if (!isLate) return currentBatter;

    const isTrailing = myScore < oppScore;
    const isTied = myScore === oppScore;
    const hasScoringChance = !!currentRunners.second || !!currentRunners.third || (!!currentRunners.first && outsCount === 2);

    if (!isTrailing && !isTied && !hasScoringChance) return currentBatter;

    const tendency = battingTeam.tactics?.pinchHitterTendency || '普通';
    if (tendency === '我慢' && !isTrailing) return currentBatter;

    const cMeet = currentBatter.stats.fielder?.meet || 5;
    const cPower = currentBatter.stats.fielder?.power || 5;
    const cRating = cMeet * 1.5 + cPower * 1.2;

    let bestCandidate: Player | null = null;
    let bestRating = cRating;

    for (const cand of benchPool) {
      const meet = cand.stats.fielder?.meet || 5;
      const power = cand.stats.fielder?.power || 5;
      let rating = meet * 1.5 + power * 1.2;

      if (cand.skills.includes('代打の神髄')) rating += 10;
      else if (cand.skills.includes('伝説の代打')) rating += 8;
      else if (cand.skills.includes('代打')) rating += 4;
      if (cand.skills.includes('勝負師')) rating += 3;
      if (cand.skills.includes('乾坤一擲')) rating += 3;
      if (cand.skills.includes('神撃の主砲')) rating += 4;
      if (cand.skills.includes('天下一品')) rating += 4;
      if (cand.skills.includes('フルスイングの極致')) rating += 4;
      if (cand.skills.includes('アーチスト')) rating += 3;
      if (cand.skills.includes('安打製造機')) rating += 3;
      if (cand.skills.includes('サヨナラキング') && inning >= 9 && isBottom && isTrailing) rating += 8;
      else if (cand.skills.includes('サヨナラ劇場の主') && inning >= 9 && isBottom && isTrailing) rating += 6;
      if ((currentRunners.first && currentRunners.second && currentRunners.third) && (cand.skills.includes('満塁神') || cand.skills.includes('満塁男'))) rating += 5;

      if (rating > bestRating + 1.2) {
        bestRating = rating;
        bestCandidate = cand;
      }
    }

    if (bestCandidate === null) return currentBatter;

    const subPlayer: Player = bestCandidate;
    const idx = benchPool.findIndex(p => p.id === subPlayer.id);
    if (idx >= 0) benchPool.splice(idx, 1);

    activeLineup[slotIdx] = subPlayer;

    if (!battingMap[subPlayer.id]) {
      const avg = subPlayer.record.atBats > 0 ? subPlayer.record.hits / subPlayer.record.atBats : 0;
      battingMap[subPlayer.id] = {
        playerId: subPlayer.id,
        name: subPlayer.name,
        order: slotIdx + 1,
        position: '指',
        atBats: 0,
        hits: 0,
        doubles: 0,
        triples: 0,
        homeRuns: 0,
        rbi: 0,
        walks: 0,
        strikeouts: 0,
        stolenBases: 0,
        seasonAvg: Math.round(avg * 1000) / 1000,
      };
    }

    s.logs.push({
      id: `log_ph_${Date.now()}_${Math.random()}`,
      inning,
      isBottom,
      outs: outsCount,
      text: `【代打起用】${battingTeam.name}、${currentBatter.name}に代わり「${subPlayer.name}」が代打として打席へ！`,
      scoreTop: s.scoreTop,
      scoreBottom: s.scoreBottom,
      type: 'sub',
      skillTriggered: subPlayer.skills.find((sk: string) => sk.includes('代打')),
    });

    s.atBatEvents.push({
      id: `ev_ph_${Date.now()}_${Math.random()}`,
      inning,
      isBottom,
      order: slotIdx + 1,
      batterName: subPlayer.name,
      pitcherName: oppPitcherName,
      result: `📣 【代打起用】${currentBatter.name} ➔ ${subPlayer.name}`,
      type: 'sub',
      rbi: 0,
      runnersState: getRunnersDescription(currentRunners),
      outs: outsCount,
      skillUsed: subPlayer.skills.find((sk: string) => sk.includes('代打')),
    });

    return subPlayer;
  };

  // 守備固め判定関数
  const considerDefensiveSub = (
    fieldingTeam: Team,
    activeLineup: Player[],
    benchPool: Player[],
    inning: number,
    isBottom: boolean,
    myScore: number,
    oppScore: number,
    battingMap: Record<string, MatchPlayerBatting>
  ) => {
    if (inning < 8 || benchPool.length === 0) return;
    const lead = myScore - oppScore;
    if (lead <= 0 || lead > 4) return;

    const defensiveSpecialist = benchPool.find(p => {
      const def = p.stats.fielder?.defense || 5;
      return def >= 7 || p.skills.includes('ゴールデングラブの極致') || p.skills.includes('難攻不落の要塞') || p.skills.includes('キャノンレーザー') || p.skills.includes('鉄壁') || p.skills.includes('名手') || p.skills.includes('ダイビングキャッチ') || p.skills.includes('送球精度') || p.skills.includes('バックアップ');
    });

    if (!defensiveSpecialist) return;

    let worstDefIdx = -1;
    let worstDef = 99;

    activeLineup.forEach((p, idx) => {
      const pos = fieldingTeam.lineupPositions?.[idx] || '指';
      if (pos === '指') return;
      const def = p.stats.fielder?.defense || 5;
      if (def <= 5 && def < worstDef && !p.skills.includes('ゴールデングラブの極致') && !p.skills.includes('鉄壁') && !p.skills.includes('名手')) {
        worstDef = def;
        worstDefIdx = idx;
      }
    });

    if (worstDefIdx >= 0) {
      const replacedStarter = activeLineup[worstDefIdx];
      const bIdx = benchPool.findIndex(p => p.id === defensiveSpecialist.id);
      if (bIdx >= 0) benchPool.splice(bIdx, 1);

      activeLineup[worstDefIdx] = defensiveSpecialist;
      const targetPos = fieldingTeam.lineupPositions?.[worstDefIdx] || '外';

      if (!battingMap[defensiveSpecialist.id]) {
        const avg = defensiveSpecialist.record.atBats > 0 ? defensiveSpecialist.record.hits / defensiveSpecialist.record.atBats : 0;
        battingMap[defensiveSpecialist.id] = {
          playerId: defensiveSpecialist.id,
          name: defensiveSpecialist.name,
          order: worstDefIdx + 1,
          position: targetPos,
          atBats: 0,
          hits: 0,
          doubles: 0,
          triples: 0,
          homeRuns: 0,
          rbi: 0,
          walks: 0,
          strikeouts: 0,
          stolenBases: 0,
          seasonAvg: Math.round(avg * 1000) / 1000,
        };
      }

      s.logs.push({
        id: `log_def_sub_${Date.now()}_${Math.random()}`,
        inning,
        isBottom,
        outs: 0,
        text: `【守備固め】${fieldingTeam.name}、逃げ切りを図り${replacedStarter.name}に代えて「${defensiveSpecialist.name}」(${targetPos})を守備固めに投入！`,
        scoreTop: s.scoreTop,
        scoreBottom: s.scoreBottom,
        type: 'sub',
        skillTriggered: defensiveSpecialist.skills.find((sk: string) => sk.includes('守備') || sk.includes('鉄壁')),
      });

      s.atBatEvents.push({
        id: `ev_def_sub_${Date.now()}_${Math.random()}`,
        inning,
        isBottom,
        order: worstDefIdx + 1,
        batterName: defensiveSpecialist.name,
        pitcherName: '',
        result: `🛡️ 【守備固め】${replacedStarter.name} ➔ ${defensiveSpecialist.name} (${targetPos})`,
        type: 'sub',
        rbi: 0,
        runnersState: '走者なし',
        outs: 0,
        skillUsed: defensiveSpecialist.skills.find((sk: string) => sk.includes('守備') || sk.includes('鉄壁')),
      });
    }
  };

  for (let inn = 1; inn <= 12; inn++) {
    s.currentInning = inn;

    // --- 表 (Away攻撃 / Home投球) ---
    s.isBottom = false;
    let innRunsTop = 0;
    let outs = 0;
    let runners = { first: null as string | null, second: null as string | null, third: null as string | null };

    // 守備固め判定 (Home守備)
    considerDefensiveSub(
      s.homeTeam,
      homeLineup,
      availableBenchHome,
      inn,
      false,
      s.scoreBottom,
      s.scoreTop,
      homeBattingMap
    );

    const { pitcher: homePitcher, role: hRole } = getPitcher(s.homeTeam, inn, s.scoreBottom - s.scoreTop);
    const homePitchStat = getOrInitPitcherStat(homePitcher, hRole, homePitchingMap);
    lastHomePitcher = homePitcher;
    const awayPitcherOfRecord = lastAwayPitcher;

    let inningHadError = false;
    let errorAtOuts: number | null = null;

    while (outs < 3) {
      // 走者の盗塁企図判定 (1塁または2塁に走者がいる場合)
      if (runners.first || runners.second) {
        const stealRes = trySteal(
          runners,
          s.awayTeam,
          s.homeTeam,
          awayBattingMap,
          s.logs,
          inn,
          false,
          s.atBatEvents,
          s.steals,
          homePitcher.name,
          outs
        );
        runners = { first: stealRes.first, second: stealRes.second, third: stealRes.third };
        outs += stealRes.outsDelta;
        if (stealRes.outsDelta > 0) {
          homePitchStat.outsRecorded = (homePitchStat.outsRecorded || 0) + stealRes.outsDelta;
        }
        if (outs >= 3) break;
      }

      const order = (awayOrderIdx % awayLineup.length) + 1;
      const awaySlot = awayOrderIdx % awayLineup.length;
      let batter = awayLineup[awaySlot];
      awayOrderIdx++;

      // 代打起用判定 (Away攻撃)
      batter = considerPinchHitter(
        batter,
        awaySlot,
        false,
        inn,
        outs,
        runners,
        s.awayTeam,
        s.scoreTop + innRunsTop,
        s.scoreBottom,
        awayLineup,
        availableBenchAway,
        awayBattingMap,
        homePitcher.name
      );

      const bStat = awayBattingMap[batter.id];
      const outsBefore = outs; // 打席前の正確なアウトカウント
      const runnersDesc = getRunnersDescription(runners);

      const res = resolveAtBat(batter, homePitcher, inn, false, runners, s.homeTeam, s.awayTeam, s.scoreTop + innRunsTop, s.scoreBottom, outs);
      innRunsTop += res.runs;
      outs += res.outsDelta;
      runners = res.nextRunners;

      // 決勝点・責任投手追跡用：失点した投手と得点番号を記録
      if (res.runs > 0) {
        for (let r = 0; r < res.runs; r++) {
          const prevScoreTop = s.scoreTop + innRunsTop - res.runs + r;
          const newScoreTop = prevScoreTop + 1;
          const curScoreBottom = s.scoreBottom;

          // 同点になった場合：それまでのリードおよび敗戦・勝利の権利は完全にリセット・消滅
          if (prevScoreTop < curScoreBottom && newScoreTop === curScoreBottom) {
            finalLeadEvent = null;
          }
          // 勝ち越しまたは逆転でリードを奪った瞬間（相手投手＝敗戦責任、自軍責任投手＝勝利権利）
          else if (prevScoreTop <= curScoreBottom && newScoreTop > curScoreBottom) {
            finalLeadEvent = {
              leadingTeamId: s.awayTeam.id,
              concedingPitcherId: homePitcher.id,
              concedingPitcherName: homePitcher.name,
              pitcherOfRecordId: awayPitcherOfRecord.id,
              pitcherOfRecordName: awayPitcherOfRecord.name,
              inning: inn,
              isBottom: false,
            };
          }

          awayTotalRunsCounter++;
          runEvents.push({
            runNumberForTeam: awayTotalRunsCounter,
            battingTeamId: s.awayTeam.id,
            concedingPitcherId: homePitcher.id,
            concedingPitcherName: homePitcher.name,
            inning: inn,
            isBottom: false,
          });
        }
      }

      if (res.eventType === 'error') {
        s.errorsBottom++;
        inningHadError = true;
        if (errorAtOuts === null) errorAtOuts = outsBefore;
      }

      // 個別打撃成績反映
      if (bStat) {
        bStat.atBats += (res.isWalk || res.isSacFly) ? 0 : 1;
        if (res.isHit) bStat.hits++;
        if (res.isDouble) bStat.doubles++;
        if (res.isTriple) bStat.triples++;
        if (res.isHomeRun) bStat.homeRuns++;
        if (res.isWalk) bStat.walks++;
        if (res.isStrikeout) bStat.strikeouts++;
        bStat.rbi += res.runs;
      }

      // 投手成績反映（公認野球規則 9.16(a) に基づく自責点厳密判定）
      let earnedThisPlay = res.earnedRuns;
      if (inningHadError && errorAtOuts !== null && errorAtOuts >= 2) {
        earnedThisPlay = 0;
      }
      homePitchStat.outsRecorded = (homePitchStat.outsRecorded || 0) + res.outsDelta;
      if (res.isHit) homePitchStat.hits++;
      if (res.isHomeRun) homePitchStat.homeRuns++;
      if (res.isStrikeout) homePitchStat.strikeouts++;
      if (res.isWalk) homePitchStat.walks++;
      homePitchStat.runs += res.runs;
      homePitchStat.earnedRuns += earnedThisPlay;

      if (res.isHit) s.hitsTop++;
      if (res.log) s.logs.push(res.log);

      // 一打席イベント記録（打席開始時点のアウトカウントと走者状況を正しく記録）
      s.atBatEvents.push({
        id: `ab_${atBatCounter++}`,
        inning: inn,
        isBottom: false,
        order,
        batterName: batter.name,
        pitcherName: homePitcher.name,
        result: res.resultText,
        type: res.eventType,
        rbi: res.runs,
        runnersState: runnersDesc,
        outs: outsBefore,
        skillUsed: res.skillTriggered,
      });

      // 得点シーン記録
      if (res.runs > 0) {
        const scoreBefore = s.scoreTop + (innRunsTop - res.runs);
        const scoreAfter = s.scoreTop + innRunsTop;
        const isGameFirstScore = scoreBefore === 0 && s.scoreBottom === 0;
        const playStatus = scoreAfter > s.scoreBottom && scoreBefore <= s.scoreBottom
          ? (scoreBefore < s.scoreBottom ? '逆転' : (isGameFirstScore ? '先制' : '勝ち越し'))
          : scoreAfter === s.scoreBottom
          ? '同点'
          : scoreAfter > s.scoreBottom
          ? (isGameFirstScore ? '先制' : '追加点')
          : '得点';

        const statusDesc = playStatus === '追加点'
          ? `${res.runs}点追加！`
          : playStatus === '同点'
          ? '同点！'
          : playStatus === '逆転'
          ? '逆転！'
          : `${res.runs}点${playStatus}！`;

        s.scoringPlays.push({
          inning: inn,
          isBottom: false,
          batterName: batter.name,
          description: `${inn}回表：${batter.name}の${res.resultText}により ${statusDesc}`,
          rbi: res.runs,
          scoreTop: scoreAfter,
          scoreBottom: s.scoreBottom,
          skillUsed: res.skillTriggered,
        });
      }
    }

    s.scoreTop += innRunsTop;
    if (!s.inningScores[inn - 1]) s.inningScores[inn - 1] = { top: null, bottom: null };
    s.inningScores[inn - 1].top = innRunsTop;

    halfInnings.push({
      inning: inn,
      isBottom: false,
      pitcherId: homePitcher.id,
      pitcherName: homePitcher.name,
      scoreTop: s.scoreTop,
      scoreBottom: s.scoreBottom,
    });

    // 9回裏サヨナラ・コールド判定（表終了時に9回以降でホームリードの場合は裏攻撃なし）
    if (inn >= 9 && s.scoreBottom > s.scoreTop) {
      s.isFinished = true;
      s.winnerId = s.homeTeam.id;
      break;
    }

    // --- 裏 (Home攻撃 / Away投球) ---
    s.isBottom = true;
    let innRunsBottom = 0;
    outs = 0;
    runners = { first: null, second: null, third: null };

    // 守備固め判定 (Away守備)
    considerDefensiveSub(
      s.awayTeam,
      awayLineup,
      availableBenchAway,
      inn,
      true,
      s.scoreTop,
      s.scoreBottom,
      awayBattingMap
    );

    const { pitcher: awayPitcher, role: aRole } = getPitcher(s.awayTeam, inn, s.scoreTop - s.scoreBottom);
    const awayPitchStat = getOrInitPitcherStat(awayPitcher, aRole, awayPitchingMap);
    lastAwayPitcher = awayPitcher;
    const homePitcherOfRecord = lastHomePitcher;
    inningHadError = false;
    errorAtOuts = null;

    while (outs < 3) {
      // 走者の盗塁企図判定 (1塁または2塁に走者がいる場合)
      if (runners.first || runners.second) {
        const stealRes = trySteal(
          runners,
          s.homeTeam,
          s.awayTeam,
          homeBattingMap,
          s.logs,
          inn,
          true,
          s.atBatEvents,
          s.steals,
          awayPitcher.name,
          outs
        );
        runners = { first: stealRes.first, second: stealRes.second, third: stealRes.third };
        outs += stealRes.outsDelta;
        if (stealRes.outsDelta > 0) {
          awayPitchStat.outsRecorded = (awayPitchStat.outsRecorded || 0) + stealRes.outsDelta;
        }
        if (outs >= 3) break;
      }

      const order = (homeOrderIdx % homeLineup.length) + 1;
      const homeSlot = homeOrderIdx % homeLineup.length;
      let batter = homeLineup[homeSlot];
      homeOrderIdx++;

      // 代打起用判定 (Home攻撃)
      batter = considerPinchHitter(
        batter,
        homeSlot,
        true,
        inn,
        outs,
        runners,
        s.homeTeam,
        s.scoreBottom + innRunsBottom,
        s.scoreTop,
        homeLineup,
        availableBenchHome,
        homeBattingMap,
        awayPitcher.name
      );

      const bStat = homeBattingMap[batter.id];
      const outsBefore = outs; // 打席前の正確なアウトカウント
      const runnersDesc = getRunnersDescription(runners);

      const res = resolveAtBat(batter, awayPitcher, inn, true, runners, s.awayTeam, s.homeTeam, s.scoreBottom + innRunsBottom, s.scoreTop, outs);
      const scoreBeforeBottom = s.scoreBottom + innRunsBottom;
      innRunsBottom += res.runs;
      outs += res.outsDelta;
      runners = res.nextRunners;
      const scoreAfterBottom = s.scoreBottom + innRunsBottom;

      // 決勝点・責任投手追跡用：失点した投手と得点番号を記録
      if (res.runs > 0) {
        for (let r = 0; r < res.runs; r++) {
          const prevScoreBottom = s.scoreBottom + innRunsBottom - res.runs + r;
          const newScoreBottom = prevScoreBottom + 1;
          const curScoreTop = s.scoreTop;

          // 同点になった場合：それまでのリードおよび敗戦・勝利の権利は完全にリセット・消滅
          if (prevScoreBottom < curScoreTop && newScoreBottom === curScoreTop) {
            finalLeadEvent = null;
          }
          // 勝ち越しまたは逆転でリードを奪った瞬間（相手投手＝敗戦責任、自軍責任投手＝勝利権利）
          else if (prevScoreBottom <= curScoreTop && newScoreBottom > curScoreTop) {
            finalLeadEvent = {
              leadingTeamId: s.homeTeam.id,
              concedingPitcherId: awayPitcher.id,
              concedingPitcherName: awayPitcher.name,
              pitcherOfRecordId: homePitcherOfRecord.id,
              pitcherOfRecordName: homePitcherOfRecord.name,
              inning: inn,
              isBottom: true,
            };
          }

          homeTotalRunsCounter++;
          runEvents.push({
            runNumberForTeam: homeTotalRunsCounter,
            battingTeamId: s.homeTeam.id,
            concedingPitcherId: awayPitcher.id,
            concedingPitcherName: awayPitcher.name,
            inning: inn,
            isBottom: true,
          });
        }
      }

      if (res.eventType === 'error') {
        s.errorsTop++;
        inningHadError = true;
        if (errorAtOuts === null) errorAtOuts = outsBefore;
      }

      // 9回裏以降で、この打席で勝ち越してサヨナラとなったかを判定
      const isSayonara = inn >= 9 && scoreBeforeBottom <= s.scoreTop && scoreAfterBottom > s.scoreTop;

      if (bStat) {
        bStat.atBats += (res.isWalk || res.isSacFly) ? 0 : 1;
        if (res.isHit) bStat.hits++;
        if (res.isDouble) bStat.doubles++;
        if (res.isTriple) bStat.triples++;
        if (res.isHomeRun) bStat.homeRuns++;
        if (res.isWalk) bStat.walks++;
        if (res.isStrikeout) bStat.strikeouts++;
        bStat.rbi += res.runs;
      }

      // 投手成績反映（公認野球規則 9.16(a) に基づく自責点厳密判定）
      let earnedThisPlay = res.earnedRuns;
      if (inningHadError && errorAtOuts !== null && errorAtOuts >= 2) {
        earnedThisPlay = 0;
      }
      awayPitchStat.outsRecorded = (awayPitchStat.outsRecorded || 0) + res.outsDelta;
      if (res.isHit) awayPitchStat.hits++;
      if (res.isHomeRun) awayPitchStat.homeRuns++;
      if (res.isStrikeout) awayPitchStat.strikeouts++;
      if (res.isWalk) awayPitchStat.walks++;
      awayPitchStat.runs += res.runs;
      awayPitchStat.earnedRuns += earnedThisPlay;

      if (res.isHit) s.hitsBottom++;
      if (res.log) s.logs.push(res.log);

      let finalResultText = res.resultText;
      if (isSayonara) {
        finalResultText = `${res.resultText}・サヨナラ！`;
      }

      s.atBatEvents.push({
        id: `ab_${atBatCounter++}`,
        inning: inn,
        isBottom: true,
        order,
        batterName: batter.name,
        pitcherName: awayPitcher.name,
        result: finalResultText,
        type: res.eventType,
        rbi: res.runs,
        runnersState: runnersDesc,
        outs: outsBefore,
        skillUsed: res.skillTriggered,
        isWalkOff: isSayonara,
      });

      if (res.runs > 0) {
        const isGameFirstScore = scoreBeforeBottom === 0 && s.scoreTop === 0;
        const playStatus = isSayonara
          ? 'サヨナラ勝ち'
          : scoreAfterBottom === s.scoreTop
          ? '同点'
          : scoreAfterBottom > s.scoreTop && scoreBeforeBottom <= s.scoreTop
          ? (scoreBeforeBottom < s.scoreTop ? '逆転' : (isGameFirstScore ? '先制' : '勝ち越し'))
          : scoreAfterBottom > s.scoreTop
          ? (isGameFirstScore ? '先制' : '追加点')
          : '得点';

        const statusDesc = playStatus === 'サヨナラ勝ち'
          ? '劇的なサヨナラ勝ち！'
          : playStatus === '同点'
          ? '同点！'
          : playStatus === '追加点'
          ? `${res.runs}点追加！`
          : playStatus === '逆転'
          ? '逆転！'
          : `${res.runs}点${playStatus}！`;

        s.scoringPlays.push({
          inning: inn,
          isBottom: true,
          batterName: batter.name,
          description: `${inn}回裏：${batter.name}の${res.resultText}により ${statusDesc}`,
          rbi: res.runs,
          scoreTop: s.scoreTop,
          scoreBottom: scoreAfterBottom,
          skillUsed: res.skillTriggered,
        });
      }

      // サヨナラ判定（9回裏以降で得点して勝ち越した瞬間に即ゲームセット）
      if (isSayonara) {
        s.scoreBottom = scoreAfterBottom;
        s.inningScores[inn - 1].bottom = innRunsBottom;
        s.isFinished = true;
        s.winnerId = s.homeTeam.id;
        s.logs.push({
          id: `log_sayonara_${Date.now()}`,
          inning: inn,
          isBottom: true,
          outs: outsBefore,
          text: `劇的なサヨナラ勝ち！！【${s.homeTeam.name}】が劇的な勝利で熱戦に終止符を打ちました！`,
          scoreTop: s.scoreTop,
          scoreBottom: s.scoreBottom,
          type: 'homerun',
        });
        halfInnings.push({
          inning: inn,
          isBottom: true,
          pitcherId: awayPitcher.id,
          pitcherName: awayPitcher.name,
          scoreTop: s.scoreTop,
          scoreBottom: s.scoreBottom,
        });
        finalizeStatsAndPitchers(s, homePitchingMap, awayPitchingMap, homeBattingMap, awayBattingMap, runEvents, halfInnings, finalLeadEvent);
        return s;
      }
    }

    s.scoreBottom += innRunsBottom;
    s.inningScores[inn - 1].bottom = innRunsBottom;

    halfInnings.push({
      inning: inn,
      isBottom: true,
      pitcherId: awayPitcher.id,
      pitcherName: awayPitcher.name,
      scoreTop: s.scoreTop,
      scoreBottom: s.scoreBottom,
    });

    if (inn >= 9) {
      if (s.scoreTop !== s.scoreBottom) {
        s.isFinished = true;
        s.winnerId = s.scoreBottom > s.scoreTop ? s.homeTeam.id : s.awayTeam.id;
        break;
      }
    }
  }

  s.isFinished = true;
  s.winnerId = s.scoreBottom > s.scoreTop ? s.homeTeam.id : s.scoreTop > s.scoreBottom ? s.awayTeam.id : null;
  s.logs.push({
    id: `log_end_${Date.now()}`,
    inning: s.currentInning,
    isBottom: true,
    outs: 3,
    text: `ゲームセット！試合終了 【${s.scoreTop} - ${s.scoreBottom}】`,
    scoreTop: s.scoreTop,
    scoreBottom: s.scoreBottom,
    type: 'hit',
  });

  finalizeStatsAndPitchers(s, homePitchingMap, awayPitchingMap, homeBattingMap, awayBattingMap, runEvents, halfInnings, finalLeadEvent);
  return s;
}

function applyMatchToRoster(
  team: Team,
  battingStats: MatchPlayerBatting[],
  pitchingStats: MatchPlayerPitching[],
  starterPlayerId?: string
): Team {
  const batMap = new Map(battingStats.map(b => [b.playerId, b]));
  const pitchMap = new Map(pitchingStats.map(p => [p.playerId, p]));

  const updatedRoster = team.roster.map(player => {
    const b = batMap.get(player.id);
    const p = pitchMap.get(player.id);

    // 投手疲労度・登板間隔管理
    // 先発投手は登板後2試合登板不可。登板しなかった休養中投手は残り試合数を1減少
    let currentRest = player.restGamesRemaining ?? 0;
    if (player.position === '投') {
      if (player.id === starterPlayerId) {
        currentRest = 2; // 登板後二試合は試合に出られない
      } else if (currentRest > 0) {
        currentRest = currentRest - 1; // 1試合休養消化
      }
    }

    if (!b && !p) {
      if (player.restGamesRemaining !== currentRest) {
        return {
          ...player,
          restGamesRemaining: currentRest,
        };
      }
      return player;
    }

    const r = { ...player.record };

    if (b) {
      r.games += 1;
      r.atBats += b.atBats;
      r.hits += b.hits;
      r.doubles += b.doubles;
      r.triples += b.triples;
      r.homeRuns += b.homeRuns;
      r.rbi += b.rbi;
      r.walks += b.walks;
      r.strikeouts += b.strikeouts;
      r.stolenBases = (r.stolenBases || 0) + (b.stolenBases || 0);
    }

    if (p) {
      r.pitchGames = (r.pitchGames || 0) + 1;
      const outsDelta = p.outsRecorded || Math.round((p.inningsPitched || 0) * 3);
      const currentOuts = r.outsPitched ?? Math.round((r.inningsPitched || 0) * 3);
      const nextOuts = currentOuts + outsDelta;
      r.outsPitched = nextOuts;
      r.inningsPitched = nextOuts / 3;
      r.earnedRuns = (r.earnedRuns || 0) + (p.earnedRuns || 0);
      r.pitchHits = (r.pitchHits || 0) + (p.hits || 0);
      r.pitchHomeRuns = (r.pitchHomeRuns || 0) + (p.homeRuns || 0);
      r.pitchStrikeouts = (r.pitchStrikeouts || 0) + (p.strikeouts || 0);
      r.pitchWalks = (r.pitchWalks || 0) + (p.walks || 0);
      if (p.isWin) r.wins = (r.wins || 0) + 1;
      if (p.isLoss) r.losses = (r.losses || 0) + 1;
      if (p.isSave) r.saves = (r.saves || 0) + 1;
    }

    return {
      ...player,
      record: r,
      restGamesRemaining: currentRest,
    };
  });

  return {
    ...team,
    roster: updatedRoster,
  };
}

function finalizeStatsAndPitchers(
  s: MatchState,
  homePitchMap: Record<string, MatchPlayerPitching>,
  awayPitchMap: Record<string, MatchPlayerPitching>,
  homeBatMap: Record<string, MatchPlayerBatting>,
  awayBatMap: Record<string, MatchPlayerBatting>,
  runEvents: Array<{
    runNumberForTeam: number;
    battingTeamId: string;
    concedingPitcherId: string;
    concedingPitcherName: string;
    inning: number;
    isBottom: boolean;
  }> = [],
  halfInnings: Array<{
    inning: number;
    isBottom: boolean;
    pitcherId: string;
    pitcherName: string;
    scoreTop: number;
    scoreBottom: number;
  }> = [],
  finalLeadEvent?: {
    leadingTeamId: string;
    concedingPitcherId: string;
    concedingPitcherName: string;
    pitcherOfRecordId: string;
    pitcherOfRecordName: string;
    inning: number;
    isBottom: boolean;
  } | null
) {
  const homePitchers = Object.values(homePitchMap);
  const awayPitchers = Object.values(awayPitchMap);

  // 投球回数を正確なアウトカウントから算出・フラグリセット
  [...homePitchers, ...awayPitchers].forEach(p => {
    const outs = p.outsRecorded || 0;
    p.inningsPitched = outs / 3;
    p.isWin = false;
    p.isLoss = false;
    p.isSave = false;
  });

  s.winningPitcher = undefined;
  s.losingPitcher = undefined;
  s.savePitcher = undefined;

  // 引き分け判定 (スコア同点なら勝敗・セーブ投手なし)
  if (s.scoreTop !== s.scoreBottom && s.winnerId) {
    const isHomeWinner = s.winnerId === s.homeTeam.id;
    const winPitchers = isHomeWinner ? homePitchers : awayPitchers;
    const losePitchers = isHomeWinner ? awayPitchers : homePitchers;
    const winTeamId = isHomeWinner ? s.homeTeam.id : s.awayTeam.id;

    const winFinalScore = isHomeWinner ? s.scoreBottom : s.scoreTop;
    const loseFinalScore = isHomeWinner ? s.scoreTop : s.scoreBottom;

    // --- 1. 敗戦投手（Losing Pitcher）の公認野球規則 9.17(d) 厳密判定 ---
    // 相手チームがリードを奪い、以後一度も同点・逆転されることなく試合終了に至った「決勝点」を許した投手に負けが記録される。
    // ※ビハインド（リードされている状態）で登板した救援投手は、自チームが同点に追いつかない限り絶対に敗戦投手にはならない。
    let loserPitcher: MatchPlayerPitching | undefined;

    if (finalLeadEvent && finalLeadEvent.leadingTeamId === winTeamId) {
      loserPitcher = losePitchers.find(p => p.playerId === finalLeadEvent.concedingPitcherId);
    }

    // フォールバック（万一決勝リードイベントが取得できない場合の安全策）
    if (!loserPitcher && losePitchers.length > 0) {
      const decisiveRunNum = loseFinalScore + 1;
      const decisiveRun = runEvents.find(
        re => re.battingTeamId === winTeamId && re.runNumberForTeam === decisiveRunNum
      );
      if (decisiveRun) {
        loserPitcher = losePitchers.find(p => p.playerId === decisiveRun.concedingPitcherId);
      }
      if (!loserPitcher) {
        loserPitcher = losePitchers[0];
      }
    }

    if (loserPitcher) {
      loserPitcher.isLoss = true;
      s.losingPitcher = loserPitcher.name;
    }

    // --- 2. 勝利投手（Winning Pitcher）の公認野球規則 9.17(a)(b) 厳密判定 ---
    // 先発投手: 5回以上（15アウト以上）投げ、先発投手が降板した時点で自チームがリードしており、そのリードを試合終了まで一度も同点または逆転されずに保ったこと。
    // （※先発が投げ終えた回の裏に自チームが勝ち越して次イニングから救援投手が登板した場合も先発に勝利権利）
    // 先発投手が5回未満、または降板時非リード、または降板後に同点・逆転された場合は、救援投手に勝利が与えられる。
    const starter = winPitchers[0];
    let winnerPitcher: MatchPlayerPitching | undefined;

    const leadPitcherId = finalLeadEvent?.leadingTeamId === winTeamId
      ? finalLeadEvent.pitcherOfRecordId
      : starter?.playerId;

    const starterOuts = starter ? (starter.outsRecorded || 0) : 0;

    // リードを奪った瞬間の投手が先発投手だった場合
    if (starter && leadPitcherId === starter.playerId) {
      // 先発投手が5回（15アウト）以上投げ終えている、または1人で完投した場合
      if (starterOuts >= 15 || winPitchers.length === 1) {
        winnerPitcher = starter;
      } else {
        // 先発がリードを持っていたが5回未満（14アウト以下）で降板した場合：
        // 公認野球規則 9.17(b): 救援投手のうち最も効果的な投球をした救援投手に勝利を与える
        const relievers = winPitchers.slice(1);
        if (relievers.length > 0) {
          const sortedRelievers = [...relievers].sort((a, b) => {
            const aEarned = a.earnedRuns ?? a.runs ?? 0;
            const bEarned = b.earnedRuns ?? b.runs ?? 0;
            if (aEarned !== bEarned) return aEarned - bEarned;
            return (b.outsRecorded || 0) - (a.outsRecorded || 0);
          });
          winnerPitcher = sortedRelievers[0];
        }
      }
    } else if (leadPitcherId) {
      // リードを奪った瞬間の投手が救援投手だった場合（同点・ビハインドから勝ち越した瞬間）：
      // その救援投手に勝利投手の権利が与えられる
      winnerPitcher = winPitchers.find(p => p.playerId === leadPitcherId);
    }

    // まだ決定していない場合の救援投手選考
    if (!winnerPitcher && winPitchers.length > 1) {
      const relievers = winPitchers.slice(1);
      const sortedRelievers = [...relievers].sort((a, b) => {
        const aRuns = a.runs ?? 0;
        const bRuns = b.runs ?? 0;
        if (aRuns !== bRuns) return aRuns - bRuns;
        return (b.outsRecorded || 0) - (a.outsRecorded || 0);
      });
      winnerPitcher = sortedRelievers[0];
    }

    // 最終フォールバック（必ず勝利チームから1名選出）
    if (!winnerPitcher && winPitchers.length > 0) {
      winnerPitcher = winPitchers[0];
    }

    if (winnerPitcher) {
      winnerPitcher.isWin = true;
      s.winningPitcher = winnerPitcher.name;
    }

    // --- 3. セーブ投手（Save Pitcher）の公認野球規則 9.19 厳密判定 ---
    // 条件：
    // ① 勝利投手ではないこと
    // ② 勝利チームの最後の投手として試合終了まで投げきったこと
    // ③ 最低1アウト（1/3回）以上投げていること
    // ④ 次のいずれかを満たすこと：
    //    - 3点以内のリードで登板しリードを守りきった
    //    - または 3回（9アウト）以上投げてリードを守りきった
    if (winPitchers.length > 1 && winnerPitcher) {
      const closer = winPitchers[winPitchers.length - 1];
      if (closer.playerId !== winnerPitcher.playerId) {
        const margin = winFinalScore - loseFinalScore;
        const closerOuts = closer.outsRecorded || 0;
        if (closerOuts >= 1 && (margin <= 3 || closerOuts >= 9)) {
          closer.isSave = true;
          s.savePitcher = closer.name;
        }
      }
    }
  }

  s.homeBattingStats = Object.values(homeBatMap);
  s.awayBattingStats = Object.values(awayBatMap);
  s.homePitchingStats = homePitchers;
  s.awayPitchingStats = awayPitchers;

  // 出場選手の個人通算成績（record）および投手疲労度（restGamesRemaining）を更新
  const homeStarterId = homePitchers[0]?.playerId;
  const awayStarterId = awayPitchers[0]?.playerId;
  s.homeTeam = applyMatchToRoster(s.homeTeam, s.homeBattingStats, s.homePitchingStats, homeStarterId);
  s.awayTeam = applyMatchToRoster(s.awayTeam, s.awayBattingStats, s.awayPitchingStats, awayStarterId);

  // 試合後の最新シーズン打率・防御率をボックススコアへ同期反映
  s.homeBattingStats.forEach(b => {
    const p = s.homeTeam.roster.find(pl => pl.id === b.playerId);
    if (p && p.record.atBats > 0) {
      b.seasonAvg = Math.round((p.record.hits / p.record.atBats) * 1000) / 1000;
    }
  });
  s.awayBattingStats.forEach(b => {
    const p = s.awayTeam.roster.find(pl => pl.id === b.playerId);
    if (p && p.record.atBats > 0) {
      b.seasonAvg = Math.round((p.record.hits / p.record.atBats) * 1000) / 1000;
    }
  });
  s.homePitchingStats.forEach(pt => {
    const p = s.homeTeam.roster.find(pl => pl.id === pt.playerId);
    if (p) {
      const outs = p.record.outsPitched ?? Math.round((p.record.inningsPitched || 0) * 3);
      if (outs > 0) {
        pt.seasonEra = Math.round(((p.record.earnedRuns * 27) / outs) * 100) / 100;
      }
    }
  });
  s.awayPitchingStats.forEach(pt => {
    const p = s.awayTeam.roster.find(pl => pl.id === pt.playerId);
    if (p) {
      const outs = p.record.outsPitched ?? Math.round((p.record.inningsPitched || 0) * 3);
      if (outs > 0) {
        pt.seasonEra = Math.round(((p.record.earnedRuns * 27) / outs) * 100) / 100;
      }
    }
  });
}

function resolveAtBat(
  batter: Player,
  pitcher: Player,
  inning: number,
  isBottom: boolean,
  runners: { first: string | null; second: string | null; third: string | null },
  pitchingTeam: Team,
  battingTeam: Team,
  myScore: number,
  oppScore: number,
  outs: number = 0
): {
  runs: number;
  earnedRuns: number;
  outsDelta: number;
  isHit: boolean;
  isDouble: boolean;
  isTriple: boolean;
  isHomeRun: boolean;
  isWalk: boolean;
  isStrikeout: boolean;
  isSacFly?: boolean;
  resultText: string;
  eventType: 'hit' | 'homerun' | 'strikeout' | 'out' | 'walk' | 'error';
  nextRunners: { first: string | null; second: string | null; third: string | null };
  skillTriggered?: string;
  log?: MatchPlayLog;
} {
  const bStats: { meet: number; power: number; speed: number; defense: number; trajectory?: number } =
    batter.stats.fielder || { meet: 5, power: 5, speed: 5, defense: 5, trajectory: 2 };
  const pStats = pitcher.stats.pitcher || { speed: 5, control: 5, stamina: 5, breaking: 5 };

  let meet = bStats.meet + (batter.equipment?.name.includes('トルピード') ? 1 : (batter.equipment?.name.includes('カーボン') ? 1 : 0));
  let power = bStats.power + (
    batter.equipment?.name.includes('真・スラッガー') ? 3 :
    batter.equipment?.name.includes('トルピード') ? 2 :
    batter.equipment?.name.includes('木製') ? 1 : 0
  );
  let speed = bStats.speed + (
    batter.equipment?.name.includes('エアロ') ? 2 :
    batter.equipment?.name.includes('スパイク') ? 1 : 0
  );

  let pSpeed = pStats.speed + (pitcher.equipment?.name.includes('覇王') ? 1 : 0);
  let pControl = pStats.control + (
    pitcher.equipment?.name.includes('覇王') ? 2 :
    pitcher.equipment?.name.includes('投手用') ? 1 : 0
  );
  let pBreaking = pStats.breaking;

  const bSkills = batter.skills;
  const pSkills = pitcher.skills;

  let skillTriggered: string | undefined = undefined;

  const isBasesLoaded = !!(runners.first && runners.second && runners.third);
  const isScoringPosition = !!(runners.second || runners.third);
  const isBasesEmpty = !runners.first && !runners.second && !runners.third;
  const isLateInning = inning >= 7;
  const isTrailingOrTied = myScore <= oppScore;

  // 打順の特定（1番〜9番）
  const orderIdx = battingTeam.lineup?.indexOf(batter.id) ?? -1;
  const battingOrder = orderIdx >= 0 ? orderIdx + 1 : 0;

  // 捕手スキルの反映（扇の要、壁役、司令塔、鉄人キャッチャー）
  const catcherIdx = pitchingTeam.lineupPositions?.indexOf('捕') ?? -1;
  const catcher = catcherIdx >= 0 && pitchingTeam.lineup?.[catcherIdx]
    ? pitchingTeam.roster.find(p => p.id === pitchingTeam.lineup[catcherIdx])
    : pitchingTeam.roster.find(p => p.position === '捕');
  const catcherSkills = catcher?.skills || [];
  if (catcherSkills.includes('司令塔')) {
    pControl += 2;
    pBreaking += 2;
    pSpeed += 1;
  } else if (catcherSkills.includes('扇の要')) {
    pControl += 1;
    pBreaking += 1;
  }

  // 勝利への号令（チーム全員の全能力+2）
  if (bSkills.includes('勝利への号令') || battingTeam.roster.some(p => p.skills.includes('勝利への号令'))) {
    meet += 2;
    power += 2;
    speed += 2;
    if (!skillTriggered && bSkills.includes('勝利への号令')) skillTriggered = '勝利への号令';
  }
  if (pSkills.includes('勝利への号令') || pitchingTeam.roster.some(p => p.skills.includes('勝利への号令'))) {
    pSpeed += 2;
    pControl += 2;
    pBreaking += 2;
    if (!skillTriggered && pSkills.includes('勝利への号令')) skillTriggered = '勝利への号令';
  }

  // 奇跡のビッグイニング（走者あり・連打時に打撃力大爆発）
  if (!isBasesEmpty && (bSkills.includes('奇跡のビッグイニング') || battingTeam.roster.some(p => p.skills.includes('奇跡のビッグイニング')))) {
    meet += 3;
    power += 3;
    if (!skillTriggered) skillTriggered = '奇跡のビッグイニング';
  }

  // ベンチの活気（チーム全員の集中力向上）
  if (bSkills.includes('ベンチの活気') || battingTeam.roster.some(p => p.skills.includes('ベンチの活気'))) {
    meet += 1;
    power += 1;
    if (!skillTriggered && bSkills.includes('ベンチの活気')) skillTriggered = 'ベンチの活気';
  }
  if (pSkills.includes('ベンチの活気') || pitchingTeam.roster.some(p => p.skills.includes('ベンチの活気'))) {
    pControl += 1;
    pBreaking += 1;
    if (!skillTriggered && pSkills.includes('ベンチの活気')) skillTriggered = 'ベンチの活気';
  }

  // ベースコーチの眼（走塁指示）
  if (bSkills.includes('ベースコーチの眼') || battingTeam.roster.some(p => p.skills.includes('ベースコーチの眼'))) {
    speed += 1;
  }

  // 観察眼（相手投手の癖を見抜く）
  if (bSkills.includes('観察眼')) {
    meet += 1;
    if (!skillTriggered) skillTriggered = '観察眼';
  }

  // 常勝軍団の誇り（チーム常時全能力+1）
  if (bSkills.includes('常勝軍団の誇り') || battingTeam.roster.some(p => p.skills.includes('常勝軍団の誇り'))) {
    meet += 1;
    power += 1;
    speed += 1;
    if (!skillTriggered && bSkills.includes('常勝軍団の誇り')) skillTriggered = '常勝軍団の誇り';
  }
  if (pSkills.includes('常勝軍団の誇り') || pitchingTeam.roster.some(p => p.skills.includes('常勝軍団の誇り'))) {
    pSpeed += 1;
    pControl += 1;
    pBreaking += 1;
    if (!skillTriggered && pSkills.includes('常勝軍団の誇り')) skillTriggered = '常勝軍団の誇り';
  }

  // 特殊・チームスキルの反映（神風、勝利の方程式、奇跡の采配、球場の味方、勝利の執念、名将の采配）
  if (isLateInning && myScore < oppScore && (bSkills.includes('神風') || battingTeam.roster.some(p => p.skills.includes('神風')))) {
    meet += 3;
    power += 2;
    if (!skillTriggered) skillTriggered = '神風';
  }

  if (isLateInning && oppScore > myScore && (pSkills.includes('勝利の方程式') || pitchingTeam.roster.some(p => p.skills.includes('勝利の方程式')))) {
    pSpeed += 3;
    pControl += 3;
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = '勝利の方程式';
  }

  if (bSkills.includes('奇跡の采配')) {
    meet += 2;
    power += 2;
    if (!skillTriggered) skillTriggered = '奇跡の采配';
  }

  if (isBottom && (bSkills.includes('球場の味方') || battingTeam.roster.some(p => p.skills.includes('球場の味方')))) {
    meet += 1;
    power += 1;
    if (!skillTriggered && bSkills.includes('球場の味方')) skillTriggered = '球場の味方';
  } else if (!isBottom && (pSkills.includes('球場の味方') || pitchingTeam.roster.some(p => p.skills.includes('球場の味方')))) {
    pControl += 1;
    pSpeed += 1;
    if (!skillTriggered && pSkills.includes('球場の味方')) skillTriggered = '球場の味方';
  }

  if (inning >= 9 && myScore < oppScore && (bSkills.includes('勝利の執念') || battingTeam.roster.some(p => p.skills.includes('勝利の執念')))) {
    meet += 2;
    power += 1;
    if (!skillTriggered) skillTriggered = '勝利の執念';
  }

  if (bSkills.includes('名将の采配')) {
    meet += 1;
    power += 1;
    if (!skillTriggered) skillTriggered = '名将の采配';
  }

  // 三冠王 (ミート+2、パワー+3)
  if (bSkills.includes('三冠王')) {
    meet += 2;
    power += 3;
    if (!skillTriggered) skillTriggered = '三冠王';
  }

  // 👑 三冠王⭐︎1〜⭐︎6
  for (let star = 6; star >= 1; star--) {
    const sk = `三冠王⭐︎${star}` as SkillId;
    if (bSkills.includes(sk)) {
      const bonus = star === 6 ? 10 : star === 5 ? 8 : star === 4 ? 7 : star === 3 ? 6 : star === 2 ? 5 : 4;
      meet += bonus;
      power += bonus;
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 🏆 ハンク・アーロン賞 / ハンク・アーロン賞⭐︎1〜⭐︎6 (メジャーリーグ打撃三冠栄誉)
  if (bSkills.includes('ハンク・アーロン賞')) {
    meet += 3;
    power += 4;
    if (!skillTriggered) skillTriggered = 'ハンク・アーロン賞';
  }
  for (let star = 6; star >= 1; star--) {
    const sk = `ハンク・アーロン賞⭐︎${star}` as SkillId;
    if (bSkills.includes(sk)) {
      const bonus = star === 6 ? 10 : star === 5 ? 8 : star === 4 ? 7 : star === 3 ? 6 : star === 2 ? 5 : 4;
      meet += bonus;
      power += bonus;
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 🥇 首位打者⭐︎1〜⭐︎6
  for (let star = 6; star >= 1; star--) {
    const sk = `首位打者⭐︎${star}` as SkillId;
    if (bSkills.includes(sk)) {
      const mBonus = star === 6 ? 8 : star === 5 ? 6 : star === 4 ? 5 : star === 3 ? 4 : star === 2 ? 3 : 2;
      meet += mBonus;
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 💥 本塁打王⭐︎1〜⭐︎6
  for (let star = 6; star >= 1; star--) {
    const sk = `本塁打王⭐︎${star}` as SkillId;
    if (bSkills.includes(sk)) {
      const pBonus = star === 6 ? 9 : star === 5 ? 7 : star === 4 ? 6 : star === 3 ? 5 : star === 2 ? 4 : 3;
      power += pBonus;
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 🔥 打点王⭐︎1〜⭐︎6 (得点圏時)
  if (isScoringPosition) {
    for (let star = 6; star >= 1; star--) {
      const sk = `打点王⭐︎${star}` as SkillId;
      if (bSkills.includes(sk)) {
        const bonus = star === 6 ? 8 : star === 5 ? 6 : star === 4 ? 5 : star === 3 ? 4 : star === 2 ? 3 : 2;
        meet += bonus;
        power += bonus;
        if (!skillTriggered) skillTriggered = sk;
        break;
      }
    }
  }

  // ⚡ 盗塁王⭐︎1〜⭐︎6 (走力ボーナス)
  for (let star = 6; star >= 1; star--) {
    const sk = `盗塁王⭐︎${star}` as SkillId;
    if (bSkills.includes(sk)) {
      const sBonus = star === 6 ? 8 : star === 5 ? 6 : star === 4 ? 5 : star === 3 ? 4 : star === 2 ? 3 : 2;
      speed += sBonus;
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 打者スキル判定（レアスキル・金特を含む）
  if (inning >= 9 && isBottom && myScore <= oppScore && bSkills.includes('サヨナラキング')) {
    meet += 5;
    power += 5;
    skillTriggered = 'サヨナラキング';
  } else if (inning >= 9 && isBottom && myScore <= oppScore && bSkills.includes('サヨナラ劇場の主')) {
    meet += 3;
    power += 5;
    skillTriggered = 'サヨナラ劇場の主';
  } else if (isLateInning && myScore < oppScore && bSkills.includes('代打の神髄')) {
    meet += 5;
    power += 5;
    skillTriggered = '代打の神髄';
  } else if (oppScore - myScore >= 5 && bSkills.includes('逆境の咆哮')) {
    meet += 5;
    power += 4;
    skillTriggered = '逆境の咆哮';
  } else if (bSkills.includes('神撃の主砲')) {
    meet += 3;
    power += 5;
    skillTriggered = '神撃の主砲';
  } else if (bSkills.includes('天下一品')) {
    meet += 4;
    power += 4;
    skillTriggered = '天下一品';
  } else if (bSkills.includes('超音速スライサー')) {
    meet += 4;
    skillTriggered = '超音速スライサー';
  } else if (bSkills.includes('フルスイングの極致')) {
    power += 6;
    skillTriggered = 'フルスイングの極致';
  } else if (battingOrder >= 3 && battingOrder <= 5 && bSkills.includes('不倒のクリーンアップ')) {
    meet += 3;
    power += 4;
    skillTriggered = '不倒のクリーンアップ';
  } else if (!isBasesEmpty && bSkills.includes('連打の連鎖反応')) {
    meet += 4;
    power += 3;
    skillTriggered = '連打の連鎖反応';
  } else if (bSkills.includes('鉄人スラッガー')) {
    power += 4;
    meet += 3;
    skillTriggered = '鉄人スラッガー';
  } else if (bSkills.includes('選球眼の極み')) {
    meet += 2;
    skillTriggered = '選球眼の極み';
  } else if (bSkills.includes('ダイヤモンドの支配者')) {
    speed += 5;
    skillTriggered = 'ダイヤモンドの支配者';
  } else if (bSkills.includes('神速の韋駄天')) {
    speed += 6;
    skillTriggered = '神速の韋駄天';
  } else if (isLateInning && myScore < oppScore && bSkills.includes('ミラクル男')) {
    meet += 3;
    power += 4;
    skillTriggered = 'ミラクル男';
  } else if (bSkills.includes('アーチスト')) {
    power += 4;
    skillTriggered = 'アーチスト';
  } else if (bSkills.includes('安打製造機')) {
    meet += 4;
    skillTriggered = '安打製造機';
  } else if (isScoringPosition && bSkills.includes('勝負師')) {
    meet += 3;
    power += 3;
    skillTriggered = '勝負師';
  } else if (battingOrder === 4 && bSkills.includes('不動の四番')) {
    meet += 3;
    power += 3;
    skillTriggered = '不動の四番';
  } else if ((outs === 2 || (isLateInning && isTrailingOrTied)) && bSkills.includes('乾坤一擲')) {
    power += 4;
    meet += 1;
    skillTriggered = '乾坤一擲';
  } else if (bSkills.includes('広角砲')) {
    power += 3;
    meet += 2;
    skillTriggered = '広角砲';
  } else if (battingOrder === 1 && bSkills.includes('切り込み隊長')) {
    meet += 3;
    speed += 3;
    skillTriggered = '切り込み隊長';
  } else if (inning <= 3 && bSkills.includes('ロケットスタート')) {
    meet += 3;
    power += 2;
    skillTriggered = 'ロケットスタート';
  } else if (isLateInning && isTrailingOrTied && bSkills.includes('伝説の代打')) {
    meet += 4;
    power += 4;
    skillTriggered = '伝説の代打';
  } else if (bSkills.includes('超ジャイロ打法')) {
    power += 3;
    skillTriggered = '超ジャイロ打法';
  } else if (bSkills.includes('驚異の切れ味')) {
    skillTriggered = '驚異の切れ味';
  } else if (bSkills.includes('高速スナイパー')) {
    meet += 2;
    skillTriggered = '高速スナイパー';
  } else if (battingOrder >= 7 && battingOrder <= 9 && bSkills.includes('恐怖の下位打線')) {
    power += 3;
    meet += 2;
    skillTriggered = '恐怖の下位打線';
  } else if (bSkills.includes('ランナーズハイ')) {
    if (isBasesLoaded) {
      meet += 4;
      power += 4;
    } else if (isScoringPosition) {
      meet += 2;
      power += 2;
    } else {
      meet += 1;
    }
    skillTriggered = 'ランナーズハイ';
  } else if (!isBasesEmpty && bSkills.includes('疾風怒濤')) {
    meet += 3;
    power += 3;
    skillTriggered = '疾風怒濤';
  } else if (bSkills.includes('黄金の右足')) {
    meet += 3;
    power += 2;
    skillTriggered = '黄金の右足';
  } else if (bSkills.includes('神速スプリンター')) {
    speed += 5;
    skillTriggered = '神速スプリンター';
  } else if (bSkills.includes('電光石火・改')) {
    speed += 4;
    skillTriggered = '電光石火・改';
  } else if (isBasesLoaded && bSkills.includes('満塁男')) {
    meet += 3;
    power += 3;
    skillTriggered = '満塁男';
  } else if (isScoringPosition && bSkills.includes('クラッチヒッター')) {
    meet += 2;
    power += 1;
    skillTriggered = 'クラッチヒッター';
  } else if (inning <= 2 && bSkills.includes('先制攻撃')) {
    meet += 2;
    skillTriggered = '先制攻撃';
  } else if (oppScore - myScore >= 3 && bSkills.includes('一矢報いる')) {
    meet += 2;
    power += 1;
    skillTriggered = '一矢報いる';
  } else if (isBasesEmpty && bSkills.includes('連打の導火線')) {
    meet += 2;
    skillTriggered = '連打の導火線';
  } else if (bSkills.includes('打撃開眼')) {
    meet += 2;
    power += 1;
    skillTriggered = '打撃開眼';
  } else if (bSkills.includes('安打警戒破り')) {
    meet += 2;
    skillTriggered = '安打警戒破り';
  } else if (bSkills.includes('流し打ち')) {
    meet += 1;
    skillTriggered = '流し打ち';
  } else if (isScoringPosition && bSkills.includes('内野警戒突破')) {
    meet += 2;
    skillTriggered = '内野警戒突破';
  } else if (bSkills.includes('インコースヒッター')) {
    power += 2;
    skillTriggered = 'インコースヒッター';
  } else if (bSkills.includes('アウトコースヒッター')) {
    meet += 1;
    power += 1;
    skillTriggered = 'アウトコースヒッター';
  } else if (bSkills.includes('高め打ち')) {
    power += 2;
    skillTriggered = '高め打ち';
  } else if (bSkills.includes('ローボールヒッター')) {
    meet += 1;
    power += 1;
    skillTriggered = 'ローボールヒッター';
  } else if (bSkills.includes('快足スプリンター')) {
    speed += 3;
    skillTriggered = '快足スプリンター';
  } else if (bSkills.includes('足攻')) {
    speed += 2;
    skillTriggered = '足攻';
  } else if (bSkills.includes('ベース一周')) {
    speed += 2;
    skillTriggered = 'ベース一周';
  } else if (bSkills.includes('盗塁警戒破り')) {
    speed += 2;
    skillTriggered = '盗塁警戒破り';
  } else if (bSkills.includes('タフネスバッター')) {
    meet += 1;
    skillTriggered = 'タフネスバッター';
  } else if (inning >= 9 && isBottom && myScore <= oppScore && bSkills.includes('サヨナラ男')) {
    meet += 2;
    power += 4;
    skillTriggered = 'サヨナラ男';
  } else if (oppScore - myScore >= 3 && bSkills.includes('逆境○')) {
    meet += 3;
    power += 3;
    skillTriggered = '逆境○';
  } else if (battingOrder === 1 && inning === 1 && bSkills.includes('トップバッター')) {
    meet += 3;
    speed += 1;
    skillTriggered = 'トップバッター';
  } else if (battingOrder >= 3 && battingOrder <= 5 && isScoringPosition && bSkills.includes('クリーンアップ')) {
    power += 2;
    meet += 1;
    skillTriggered = 'クリーンアップ';
  } else if (battingOrder >= 7 && battingOrder <= 9 && bSkills.includes('下位打線の鬼')) {
    meet += 2;
    power += 1;
    skillTriggered = '下位打線の鬼';
  } else if (isBasesLoaded && bSkills.includes('満塁神')) {
    meet += 1;
    power += 2;
    skillTriggered = '満塁神';
  } else if (isLateInning && isTrailingOrTied && bSkills.includes('ヒーロー')) {
    power += 3;
    skillTriggered = 'ヒーロー';
  } else if ((!isBasesEmpty || isLateInning) && bSkills.includes('お祭り男')) {
    meet += 2;
    power += 2;
    skillTriggered = 'お祭り男';
  } else if (isScoringPosition && bSkills.includes('チャンス')) {
    meet += 1;
    power += 1;
    skillTriggered = 'チャンス';
  } else if (isScoringPosition && bSkills.includes('お立ち台')) {
    meet += 1;
    skillTriggered = 'お立ち台';
  } else if (bSkills.includes('極首位打者')) {
    meet += 2;
    skillTriggered = '極首位打者';
  } else if (bSkills.includes('極本塁打王')) {
    power += 3;
    skillTriggered = '極本塁打王';
  } else if (bSkills.includes('スラッガー')) {
    power += 2;
    skillTriggered = 'スラッガー';
  } else if (bSkills.includes('レーザー弾')) {
    power += 2;
    skillTriggered = 'レーザー弾';
  } else if (bSkills.includes('プルヒッター')) {
    power += 3;
    skillTriggered = 'プルヒッター';
  } else if (bSkills.includes('広角打法')) {
    meet += 2;
    skillTriggered = '広角打法';
  } else if (bSkills.includes('ライン際職人')) {
    meet += 2;
    skillTriggered = 'ライン際職人';
  } else if ((pitcher.throwingHand === '左投' || (pitcher.throwingHand as any) === '左') && bSkills.includes('左キラー')) {
    meet += 1;
    power += 1;
    skillTriggered = '左キラー';
  } else if (pitcher.throwingHand !== '左投' && (pitcher.throwingHand as any) !== '左' && bSkills.includes('右キラー')) {
    meet += 2;
    power += 1;
    skillTriggered = '右キラー';
  } else if (isBasesEmpty && bSkills.includes('チャンスメイク')) {
    meet += 1;
    skillTriggered = 'チャンスメイク';
  } else if (bSkills.includes('ムードメイカー')) {
    meet += 1;
    power += 1;
    skillTriggered = 'ムードメイカー';
  } else if (bSkills.includes('初球打ち') && Math.random() < 0.5) {
    meet += 2;
    power += 1;
    skillTriggered = '初球打ち';
  } else if (bSkills.includes('ファーストストライク') && Math.random() < 0.5) {
    meet += 2;
    power += 1;
    skillTriggered = 'ファーストストライク';
  } else if (bSkills.includes('フルカウント○') && Math.random() < 0.4) {
    meet += 2;
    power += 2;
    skillTriggered = 'フルカウント○';
  } else if (bSkills.includes('追い込まれ強打') && Math.random() < 0.5) {
    meet += 2;
    skillTriggered = '追い込まれ強打';
  } else if (bSkills.includes('高速打球')) {
    skillTriggered = '高速打球';
  } else if (bSkills.includes('技あり') && (pControl + pBreaking >= 14 || Math.random() < 0.4)) {
    meet += 1;
    skillTriggered = '技あり';
  } else if (isLateInning && isTrailingOrTied && bSkills.includes('代打')) {
    meet += 1;
    power += 1;
    skillTriggered = '代打';
  } else if (bSkills.includes('ポール弾')) {
    power += 2;
    skillTriggered = 'ポール弾';
  } else if (bSkills.includes('テラス弾')) {
    power += 1;
    skillTriggered = 'テラス弾';
  } else if (runners.third && bSkills.includes('ツーランスクイズ')) {
    meet += 1;
    skillTriggered = 'ツーランスクイズ';
  } else if (bSkills.includes('一点張り')) {
    power += 2;
    meet += 1;
    skillTriggered = '一点張り';
  } else if (bSkills.includes('サインミス')) {
    power += 2;
    skillTriggered = 'サインミス';
  } else if (bSkills.includes('韋駄天')) {
    speed += 3;
    skillTriggered = '韋駄天';
  } else if (bSkills.includes('電光石火')) {
    speed += 2;
    skillTriggered = '電光石火';
  } else if (bSkills.includes('激走')) {
    speed += 2;
    skillTriggered = '激走';
  } else if (bSkills.includes('飛び出し')) {
    speed += 2;
    skillTriggered = '飛び出し';
  }

  // 打者の威圧感（覇王の威圧感 / 威圧感（打））
  if (bSkills.includes('覇王の威圧感')) {
    pControl = Math.max(1, pControl - 3);
    pSpeed = Math.max(1, pSpeed - 3);
    pBreaking = Math.max(1, pBreaking - 2);
    if (!skillTriggered) skillTriggered = '覇王の威圧感';
  } else if (bSkills.includes('威圧感（打）')) {
    pControl = Math.max(1, pControl - 2);
    pBreaking = Math.max(1, pBreaking - 1);
    if (!skillTriggered) skillTriggered = '威圧感（打）';
  }

  // 投手スキル判定（レアスキル・金特を含む）
  // 💎 沢村賞⭐︎1〜⭐︎6 (投手最高峰栄誉)
  if (pSkills.includes('沢村賞')) {
    pSpeed += 3;
    pControl += 3;
    pBreaking += 3;
    meet = Math.max(1, meet - 2);
    power = Math.max(1, power - 2);
    if (!skillTriggered) skillTriggered = '沢村賞';
  }
  for (let star = 6; star >= 1; star--) {
    const sk = `沢村賞⭐︎${star}` as SkillId;
    if (pSkills.includes(sk)) {
      const bonus = star === 6 ? 10 : star === 5 ? 8 : star === 4 ? 7 : star === 3 ? 6 : star === 2 ? 5 : 4;
      pSpeed += bonus;
      pControl += bonus;
      pBreaking += bonus;
      meet = Math.max(1, meet - Math.floor(bonus / 2));
      power = Math.max(1, power - Math.floor(bonus / 2));
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 💎 サイ・ヤング賞 / サイ・ヤング賞⭐︎1〜⭐︎6 (メジャーリーグ投手三冠栄誉)
  if (pSkills.includes('サイ・ヤング賞')) {
    pSpeed += 4;
    pControl += 4;
    pBreaking += 4;
    meet = Math.max(1, meet - 2);
    power = Math.max(1, power - 2);
    if (!skillTriggered) skillTriggered = 'サイ・ヤング賞';
  }
  for (let star = 6; star >= 1; star--) {
    const sk = `サイ・ヤング賞⭐︎${star}` as SkillId;
    if (pSkills.includes(sk)) {
      const bonus = star === 6 ? 10 : star === 5 ? 8 : star === 4 ? 7 : star === 3 ? 6 : star === 2 ? 5 : 4;
      pSpeed += bonus;
      pControl += bonus;
      pBreaking += bonus;
      meet = Math.max(1, meet - Math.floor(bonus / 2));
      power = Math.max(1, power - Math.floor(bonus / 2));
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 🏆 最多勝⭐︎1〜⭐︎6
  for (let star = 6; star >= 1; star--) {
    const sk = `最多勝⭐︎${star}` as SkillId;
    if (pSkills.includes(sk)) {
      const bonus = star === 6 ? 8 : star === 5 ? 6 : star === 4 ? 5 : star === 3 ? 4 : star === 2 ? 3 : 2;
      pSpeed += bonus;
      pControl += bonus;
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 🛡️ 最優秀防御率⭐︎1〜⭐︎6
  for (let star = 6; star >= 1; star--) {
    const sk = `最優秀防御率⭐︎${star}` as SkillId;
    if (pSkills.includes(sk)) {
      const bonus = star === 6 ? 8 : star === 5 ? 6 : star === 4 ? 5 : star === 3 ? 4 : star === 2 ? 3 : 2;
      pControl += bonus;
      pBreaking += bonus;
      meet = Math.max(1, meet - Math.floor(bonus / 3));
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // ⚡ 奪三振王⭐︎1〜⭐︎6
  for (let star = 6; star >= 1; star--) {
    const sk = `奪三振王⭐︎${star}` as SkillId;
    if (pSkills.includes(sk)) {
      const bonus = star === 6 ? 8 : star === 5 ? 6 : star === 4 ? 5 : star === 3 ? 4 : star === 2 ? 3 : 2;
      pSpeed += bonus;
      pBreaking += bonus;
      if (!skillTriggered) skillTriggered = sk;
      break;
    }
  }

  // 🔒 最多セーブ⭐︎1〜⭐︎6 (9回以降登板時)
  if (inning >= 9 && oppScore > myScore) {
    for (let star = 6; star >= 1; star--) {
      const sk = `最多セーブ⭐︎${star}` as SkillId;
      if (pSkills.includes(sk)) {
        const bonus = star === 6 ? 8 : star === 5 ? 6 : star === 4 ? 5 : star === 3 ? 4 : star === 2 ? 3 : 2;
        pSpeed += bonus;
        pControl += bonus;
        pBreaking += bonus;
        if (!skillTriggered) skillTriggered = sk;
        break;
      }
    }
  }

  if (pSkills.includes('完全試合')) {
    pSpeed += 4;
    pControl += 5;
    pBreaking += 4;
    meet = Math.max(1, meet - 3);
    power = Math.max(1, power - 3);
    if (!skillTriggered) skillTriggered = '完全試合';
  } else if (pSkills.includes('無双の制球')) {
    pControl += 6;
    if (!skillTriggered) skillTriggered = '無双の制球';
  } else if (pSkills.includes('神速ストレート')) {
    pSpeed += 5;
    if (!skillTriggered) skillTriggered = '神速ストレート';
  } else if (pSkills.includes('魔神のチェンジアップ')) {
    pBreaking += 5;
    if (!skillTriggered) skillTriggered = '魔神のチェンジアップ';
  } else if (pSkills.includes('絶対零度スライダー')) {
    pBreaking += 5;
    if (!skillTriggered) skillTriggered = '絶対零度スライダー';
  } else if (pSkills.includes('鉄壁のマウンド')) {
    pSpeed += 3;
    pControl += 4;
    pBreaking += 4;
    if (!skillTriggered) skillTriggered = '鉄壁のマウンド';
  } else if (pSkills.includes('剛腕シャットアウト')) {
    pSpeed += 4;
    pControl += 2;
    if (!skillTriggered) skillTriggered = '剛腕シャットアウト';
  } else if (pSkills.includes('パーフェクトリリーフ')) {
    pControl += 4;
    pBreaking += 4;
    pSpeed += 2;
    if (!skillTriggered) skillTriggered = 'パーフェクトリリーフ';
  } else if (isScoringPosition && pSkills.includes('ドクターフォーク')) {
    pBreaking += 5;
    if (!skillTriggered) skillTriggered = 'ドクターフォーク';
  } else if (inning >= 9 && oppScore > myScore && pSkills.includes('クローザーの誇り')) {
    pSpeed += 4;
    pControl += 4;
    if (!skillTriggered) skillTriggered = 'クローザーの誇り';
  } else if (isScoringPosition && pSkills.includes('百戦錬磨のエース')) {
    pSpeed += 3;
    pControl += 3;
    pBreaking += 3;
    if (!skillTriggered) skillTriggered = '百戦錬磨のエース';
  } else if (inning >= 5 && pSkills.includes('イニングイーター・極')) {
    pControl += 4;
    pSpeed += 3;
    if (!skillTriggered) skillTriggered = 'イニングイーター・極';
  } else if (pSkills.includes('覇気')) {
    meet = Math.max(1, meet - 3);
    power = Math.max(1, power - 2);
    if (!skillTriggered) skillTriggered = '覇気';
  } else if (pSkills.includes('威圧感（投）')) {
    meet = Math.max(1, meet - 2);
    power = Math.max(1, power - 1);
    if (!skillTriggered) skillTriggered = '威圧感（投）';
  }

  if (battingOrder >= 3 && battingOrder <= 5 && pSkills.includes('絶対零度')) {
    power = Math.max(1, power - 3);
    meet = Math.max(1, meet - 2);
    if (!skillTriggered) skillTriggered = '絶対零度';
  }

  if (isBasesLoaded && pSkills.includes('火消しの帝王')) {
    pControl += 4;
    pBreaking += 3;
    pSpeed += 2;
    if (!skillTriggered) skillTriggered = '火消しの帝王';
  } else if (inning >= 9 && oppScore > myScore && pSkills.includes('守護神の領域')) {
    pSpeed += 3;
    pControl += 3;
    pBreaking += 3;
    if (!skillTriggered) skillTriggered = '守護神の領域';
  } else if (isScoringPosition && pSkills.includes('強心臓')) {
    pControl += 4;
    pBreaking += 3;
    if (!skillTriggered) skillTriggered = '強心臓';
  } else if (isScoringPosition && pSkills.includes('ピンチ脱出')) {
    pControl += 2;
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = 'ピンチ脱出';
  } else if (pSkills.includes('怪物')) {
    pSpeed += 4;
    if (!skillTriggered) skillTriggered = '怪物';
  } else if (pSkills.includes('ドクターK')) {
    pBreaking += 3;
    if (!skillTriggered) skillTriggered = 'ドクターK';
  } else if (pSkills.includes('精密機械')) {
    pControl += 4;
    if (!skillTriggered) skillTriggered = '精密機械';
  } else if (pSkills.includes('インローの鬼')) {
    pControl += 2;
    if (!skillTriggered) skillTriggered = 'インローの鬼';
  } else if (pSkills.includes('初球ストライク')) {
    pControl += 1;
    if (!skillTriggered) skillTriggered = '初球ストライク';
  } else if (pSkills.includes('カウント稼ぎ')) {
    pControl += 2;
    if (!skillTriggered) skillTriggered = 'カウント稼ぎ';
  } else if (pSkills.includes('四球拒否')) {
    pControl += 2;
    if (!skillTriggered) skillTriggered = '四球拒否';
  } else if (pSkills.includes('緩急○')) {
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = '緩急○';
  } else if (pSkills.includes('ナックル軌道')) {
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = 'ナックル軌道';
  } else if (pSkills.includes('バックドア')) {
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = 'バックドア';
  } else if (pSkills.includes('フロントドア')) {
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = 'フロントドア';
  } else if (pSkills.includes('球持ち○')) {
    pSpeed += 2;
    if (!skillTriggered) skillTriggered = '球持ち○';
  } else if (pSkills.includes('クロスファイアー')) {
    pSpeed += 2;
    pControl += 1;
    if (!skillTriggered) skillTriggered = 'クロスファイアー';
  } else if (pSkills.includes('ブレーキ○')) {
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = 'ブレーキ○';
  } else if (pSkills.includes('フライボールピッチャー')) {
    pSpeed += 1;
    if (!skillTriggered) skillTriggered = 'フライボールピッチャー';
  } else if (pSkills.includes('雨天巧者')) {
    pControl += 1;
    pSpeed += 1;
    if (!skillTriggered) skillTriggered = '雨天巧者';
  } else if (inning >= 7 && oppScore > myScore && pSkills.includes('逃げ切り体勢')) {
    pControl += 2;
    pBreaking += 1;
    if (!skillTriggered) skillTriggered = '逃げ切り体勢';
  } else if (inning === 8 && pSkills.includes('セットアッパー○')) {
    pSpeed += 2;
    pControl += 2;
    if (!skillTriggered) skillTriggered = 'セットアッパー○';
  } else if (inning >= 4 && pSkills.includes('ロングリリーフ')) {
    pControl += 2;
    pBreaking += 1;
    if (!skillTriggered) skillTriggered = 'ロングリリーフ';
  } else if (inning >= 5 && pSkills.includes('マウンドの主')) {
    pSpeed += 2;
    pControl += 2;
    if (!skillTriggered) skillTriggered = 'マウンドの主';
  } else if (inning >= 6 && pSkills.includes('昇り龍')) {
    pSpeed += 3;
    pControl += 3;
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = '昇り龍';
  } else if (inning <= 3 && pSkills.includes('怪童')) {
    pSpeed += 3;
    pControl += 3;
    if (!skillTriggered) skillTriggered = '怪童';
  } else if (pSkills.includes('幻影魔球')) {
    pBreaking += 4;
    if (!skillTriggered) skillTriggered = '幻影魔球';
  } else if (inning >= 7 && pSkills.includes('金剛不壊')) {
    pControl += 2;
    pSpeed += 2;
    if (!skillTriggered) skillTriggered = '金剛不壊';
  } else if (isScoringPosition && pSkills.includes('不屈の闘志')) {
    pSpeed += 2;
    pControl += 2;
    if (!skillTriggered) skillTriggered = '不屈の闘志';
  } else if (pSkills.includes('ゴロキラー')) {
    pControl += 3;
    if (!skillTriggered) skillTriggered = 'ゴロキラー';
  } else if (pSkills.includes('マダックス・極')) {
    pControl += 4;
    if (!skillTriggered) skillTriggered = 'マダックス・極';
  } else if (isScoringPosition && pSkills.includes('鉄腕リリーフ')) {
    pControl += 3;
    pBreaking += 3;
    if (!skillTriggered) skillTriggered = '鉄腕リリーフ';
  } else if (pSkills.includes('死角なし')) {
    pControl += 2;
    pSpeed += 1;
    if (!skillTriggered) skillTriggered = '死角なし';
  } else if (inning >= 9 && oppScore > myScore && pSkills.includes('絶対的守護神')) {
    pSpeed += 2;
    pControl += 2;
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = '絶対的守護神';
  } else if (isScoringPosition && pSkills.includes('ギアチェンジ')) {
    pSpeed += 3;
    pControl += 2;
    if (!skillTriggered) skillTriggered = 'ギアチェンジ';
  } else if (pSkills.includes('魔球')) {
    pBreaking += 3;
    if (!skillTriggered) skillTriggered = '魔球';
  } else if (pSkills.includes('剛速球')) {
    pSpeed += 3;
    if (!skillTriggered) skillTriggered = '剛速球';
  } else if (pSkills.includes('キレ○')) {
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = 'キレ○';
  } else if (pSkills.includes('低め〇')) {
    pControl += 2;
    if (!skillTriggered) skillTriggered = '低め〇';
  } else if (pSkills.includes('マダックス')) {
    pControl += 3;
    if (!skillTriggered) skillTriggered = 'マダックス';
  } else if (inning >= 5 && pSkills.includes('尻上がり')) {
    const bonus = Math.min(3, inning - 4);
    pSpeed += bonus;
    pControl += bonus;
    if (!skillTriggered) skillTriggered = '尻上がり';
  } else if (isScoringPosition && pSkills.includes('闘志')) {
    pSpeed += 2;
    pControl += 1;
    if (!skillTriggered) skillTriggered = '闘志';
  } else if (isScoringPosition && pSkills.includes('ポーカーフェイス')) {
    pControl += 1;
    pBreaking += 1;
    if (!skillTriggered) skillTriggered = 'ポーカーフェイス';
  } else if (isScoringPosition && outs <= 1 && pSkills.includes('ワンポイント')) {
    pControl += 3;
    pBreaking += 2;
    if (!skillTriggered) skillTriggered = 'ワンポイント';
  } else if (pSkills.includes('打たせて取る')) {
    pControl += 2;
    if (!skillTriggered) skillTriggered = '打たせて取る';
  } else if (inning <= 2 && pSkills.includes('立ち上がり')) {
    pSpeed += 1;
    pControl += 1;
    if (!skillTriggered) skillTriggered = '立ち上がり';
  } else if (inning >= 8 && pSkills.includes('回またぎ')) {
    pControl += 2;
    pBreaking += 1;
    if (!skillTriggered) skillTriggered = '回またぎ';
  } else if (isScoringPosition && pSkills.includes('超火消し男')) {
    pControl += 2;
    pBreaking += 2;
    skillTriggered = '超火消し男';
  } else if ((runners.first || isScoringPosition) && pSkills.includes('火消し男')) {
    pControl += 1;
    pBreaking += 1;
    skillTriggered = '火消し男';
  } else if (pSkills.includes('超完封') && isLateInning) {
    pSpeed += 2;
    pControl += 2;
    skillTriggered = '超完封';
  } else if (pSkills.includes('リリーバー')) {
    pControl += 1;
    pBreaking += 1;
    skillTriggered = 'リリーバー';
  } else if (inning >= 5 && pSkills.includes('イニングイーター')) {
    pControl += 1;
    skillTriggered = 'イニングイーター';
  } else if (pSkills.includes('申告敬遠')) {
    pControl += 2;
    skillTriggered = '申告敬遠';
  }

  if (isLateInning && (bSkills.includes('潮目') || pSkills.includes('潮目'))) {
    meet += 1;
    power += 1;
    speed += 1;
    if (!skillTriggered) skillTriggered = '潮目';
  }

  // 弾道 (固定ステータス 1〜4) の反映（アーチスト・超ジャイロ打法・スラッガー・レーザー弾で弾道補正）
  const trajectory = bStats.trajectory ?? 2;
  const isArtisan = bSkills.includes('アーチスト') || bSkills.includes('超ジャイロ打法');
  const effectiveTrajectory = isArtisan ? 4 : Math.min(4, Math.max(1, trajectory + (bSkills.includes('スラッガー') ? 1 : 0) + (bSkills.includes('レーザー弾') ? 1 : 0)));
  const hrTrajectoryMult = effectiveTrajectory === 4 ? 1.4 : effectiveTrajectory === 3 ? 1.2 : effectiveTrajectory === 2 ? 1.0 : 0.7;

  // 実在プロ野球水準の打率・防御率調整（NPB公認記録基準：チーム防御率3.10〜3.50、最優秀防御率1.85〜2.30）
  // リーグ平均打率: 約 .240〜.248、首位打者: .320〜.345
  const meetDiff = meet - (pControl + pBreaking) / 2;
  let hitProb = Math.min(0.295, Math.max(0.140, 0.230 + meetDiff * 0.0075));
  if (bSkills.includes('天下一品')) hitProb += 0.025;
  if (bSkills.includes('超音速スライサー')) hitProb += 0.020;
  if (bSkills.includes('安打製造機')) hitProb += 0.020;
  if (bSkills.includes('驚異の切れ味')) hitProb += 0.025;
  if (bSkills.includes('流し打ち')) hitProb += 0.012;
  if (bSkills.includes('高速打球')) hitProb += 0.012;
  if (pSkills.includes('魔神のチェンジアップ')) hitProb -= 0.020;
  if (pSkills.includes('パーフェクトリリーフ')) hitProb -= 0.025;
  if (pSkills.includes('幻影魔球')) hitProb -= 0.015;
  if (pSkills.includes('魔球')) hitProb -= 0.010;
  if (pSkills.includes('初球ストライク')) hitProb -= 0.008;
  if (pSkills.includes('緩急○')) hitProb -= 0.008;
  if (pSkills.includes('ナックル軌道')) hitProb -= 0.010;
  if (pSkills.includes('打たせて取る')) hitProb += 0.006;

  const powerDiff = power - pSpeed;

  // 本塁打率の計算（アーチスト・乾坤一擲・広角砲・超ジャイロ・怪物・重い球・低め〇・プルヒッター・レーザー弾の反映）
  let hrShareOfHits = Math.min(0.46, Math.max(0.018, (0.100 + powerDiff * 0.033) * hrTrajectoryMult));
  if (bSkills.includes('神撃の主砲')) hrShareOfHits *= 1.45;
  if (bSkills.includes('フルスイングの極致')) hrShareOfHits *= 1.60;
  if (bSkills.includes('アーチスト')) hrShareOfHits *= 1.45;
  if (bSkills.includes('乾坤一擲')) hrShareOfHits *= 1.30;
  if (bSkills.includes('広角砲')) hrShareOfHits *= 1.25;
  if (bSkills.includes('超ジャイロ打法')) hrShareOfHits *= 1.30;
  if (bSkills.includes('インコースヒッター')) hrShareOfHits *= 1.15;
  if (bSkills.includes('高め打ち')) hrShareOfHits *= 1.15;
  if (bSkills.includes('プルヒッター')) hrShareOfHits *= 1.25;
  if (bSkills.includes('レーザー弾')) hrShareOfHits *= 1.20;
  if (pSkills.includes('剛腕シャットアウト')) hrShareOfHits *= 0.40;
  if (pSkills.includes('怪物')) hrShareOfHits *= 0.50;
  if (pSkills.includes('重い球')) hrShareOfHits *= 0.60;
  if (pSkills.includes('低め〇')) hrShareOfHits *= 0.80;
  if (pSkills.includes('フライボールピッチャー')) hrShareOfHits *= 0.85;

  const hrCutoff = hitProb * hrShareOfHits;

  const roll = Math.random();

  let runs = 0;
  let outsDelta = 0;
  let isHit = false;
  let isDouble = false;
  let isTriple = false;
  let isHomeRun = false;
  let isWalk = false;
  let isStrikeout = false;
  let isSacFly = false;
  let isEarned = true;
  let resultText = '';
  let eventType: 'hit' | 'homerun' | 'strikeout' | 'out' | 'walk' | 'error' = 'out';
  let log: MatchPlayLog | undefined = undefined;
  const nextRunners = { ...runners };

  if (roll < hrCutoff) {
    isHit = true;
    isHomeRun = true;
    eventType = 'homerun';

    let rbi = 1;
    if (runners.first) rbi++;
    if (runners.second) rbi++;
    if (runners.third) rbi++;
    runs = rbi;

    nextRunners.first = null;
    nextRunners.second = null;
    nextRunners.third = null;

    const hrTitle = rbi === 4 ? '満塁ホームラン' : rbi === 3 ? '3ラン本塁打' : rbi === 2 ? '2ラン本塁打' : 'ソロ本塁打';
    const hrPhrases = [
      `レフトスタンド中段への${hrTitle}`,
      `ライトスタンド中段への${hrTitle}`,
      `右中間スタンドへ飛び込む${hrTitle}`,
      `左中間スタンドへ飛び込む豪快な${hrTitle}`,
      `バックスクリーン直撃の特大${hrTitle}`,
      `ライトポール際スタンドへ飛び込む${hrTitle}`,
      `レフトポール際スタンドへ飛び込む${hrTitle}`,
      `スタンド上段へ叩き込む特大${hrTitle}`,
      `場外へと消え去る超特大アーチの${hrTitle}`,
      `打った瞬間それと分かる超特大${hrTitle}`,
      `完璧に捉えた打球がスタンドへ吸い込まれる${hrTitle}`,
      `弾丸ライナーでスタンドへ突き刺す痛烈な${hrTitle}`,
    ];
    resultText = hrPhrases[Math.floor(Math.random() * hrPhrases.length)];

    log = {
      id: `log_hr_${Date.now()}_${Math.random()}`,
      inning,
      isBottom,
      outs: 0,
      text: `【特大アーチ！】${batter.name}、豪快なスイングで放つ${hrTitle}！！`,
      scoreTop: 0,
      scoreBottom: 0,
      type: 'homerun',
      skillTriggered,
    };
  } else if (roll < hitProb) {
    // 守備側ファインプレー判定（超ファインプレー / ダイビングキャッチ）
    const outfielders = pitchingTeam.roster.filter(p => p.skills.includes('超ファインプレー') || p.skills.includes('ダイビングキャッチ'));
    const hasSuperFine = outfielders.some(p => p.skills.includes('超ファインプレー'));
    const isRobbedByDefense = outfielders.length > 0 && Math.random() < (hasSuperFine ? 0.25 : 0.12);

    if (isRobbedByDefense) {
      outsDelta = 1;
      eventType = 'out';
      const robber = outfielders[0].name;
      const finePlayTitle = hasSuperFine ? '超ファインプレー' : 'ダイビングキャッチ';
      resultText = `【${finePlayTitle}！】外野手・${robber}が横っ飛び好捕！抜ければ長打の打球をスーパープレーで阻む！`;
      log = {
        id: `log_dive_${Date.now()}_${Math.random()}`,
        inning,
        isBottom,
        outs: 0,
        text: `【${finePlayTitle}！】${robber}、体を投げ出す神技キャッチで${batter.name}の痛烈な打球を好捕！`,
        scoreTop: 0,
        scoreBottom: 0,
        type: 'out',
        skillTriggered: finePlayTitle,
      };
    } else {
      isHit = true;
      eventType = 'hit';

      const isTripleChance = (speed >= 8 || bSkills.includes('神速の韋駄天') || bSkills.includes('神速スプリンター') || bSkills.includes('韋駄天')) &&
        Math.random() < (bSkills.includes('神速の韋駄天') ? 0.090 : bSkills.includes('神速スプリンター') ? 0.065 : bSkills.includes('韋駄天') ? 0.045 : 0.020);
      let doubleProb = power >= 8 ? 0.25 : power >= 6 ? 0.19 : 0.14;
      if (bSkills.includes('超音速スライサー')) doubleProb += 0.22;
      if (bSkills.includes('高速スナイパー')) doubleProb += 0.18;
      if (bSkills.includes('広角砲')) doubleProb += 0.12;
      if (bSkills.includes('ライン際職人')) doubleProb += 0.14;
      if (bSkills.includes('アウトコースヒッター')) doubleProb += 0.08;
      if (bSkills.includes('広角打法')) doubleProb += 0.08;
      if (bSkills.includes('韋駄天')) doubleProb += 0.06;
      const isDoubleChance = !isTripleChance && Math.random() < doubleProb;

      // 外野のキャノン肩・レーザービーム・中継プレー○有無
      const hasLaserBeam = pitchingTeam.roster.some(p => p.skills.includes('レーザービーム') || p.skills.includes('キャノンレーザー'));
      const hasCannonArm = hasLaserBeam || pitchingTeam.roster.some(p => p.skills.includes('キャノン肩'));
      const hasRelayPlay = pitchingTeam.roster.some(p => p.skills.includes('中継プレー○'));

      if (isTripleChance) {
        isTriple = true;
        // 三塁打: 塁上の全走者が生還、打者走者は3塁へ
        if (runners.third) runs++;
        if (runners.second) runs++;
        if (runners.first) runs++;
        nextRunners.first = null;
        nextRunners.second = null;
        nextRunners.third = batter.name;
        resultText = runs > 0 ? '右中間を深々と破る走者一掃の適時三塁打！' : '痛烈なライナーが外野フェンスを直撃する三塁打！';
      } else if (isDoubleChance) {
        isDouble = true;
        // 二塁打: 3塁走者生還、2塁走者生還、1塁走者は確率で生還または3塁へ
        if (runners.third) runs++;
        if (runners.second) runs++;

        let new3rd: string | null = null;
        if (runners.first) {
          // 1塁走者が2塁打で一気に生還する確率（レーザービームなら確実に本塁突入阻止）
          let scoreFrom1stProb = outs === 2
            ? (speed >= 8 ? 0.52 : speed >= 6 ? 0.32 : 0.15)
            : (speed >= 8 ? 0.35 : speed >= 6 ? 0.20 : 0.10);
          if (bSkills.includes('神速の韋駄天') || bSkills.includes('ベース一周') || bSkills.includes('神速スプリンター') || bSkills.includes('韋駄天') || bSkills.includes('激走')) scoreFrom1stProb += 0.30;
          if (hasLaserBeam) scoreFrom1stProb = 0.04;
          else if (hasCannonArm) scoreFrom1stProb *= 0.40;
          if (hasRelayPlay) scoreFrom1stProb *= 0.65;

          if (Math.random() < scoreFrom1stProb) {
            runs++; // 1塁走者も一気に生還
          } else {
            new3rd = runners.first; // 3塁ストップ
          }
        }
        nextRunners.third = new3rd;
        nextRunners.second = batter.name;
        nextRunners.first = null;

        const doubleText = bSkills.includes('高速スナイパー')
          ? '【高速スナイパー】三塁線を鋭く射抜く完璧な適時二塁打！'
          : bSkills.includes('広角砲')
          ? '【広角砲】逆方向へ痛烈にライナーで運ぶ適時二塁打！'
          : bSkills.includes('ライン際職人')
          ? '【ライン際職人】一塁線を鋭く破る痛烈な適時二塁打！'
          : (runs > 0 ? `右中間を深々と破る適時二塁打！` : `左中間フェンス直撃の鋭い二塁打！`);
        resultText = doubleText;
      } else {
        // 単打: 3塁走者生還、2塁走者は確率で本塁生還または3塁へ、1塁走者は2塁へ
        const r3 = runners.third;
        const r2 = runners.second;
        const r1 = runners.first;

        if (r3) runs++;

        let new3rd: string | null = null;
        if (r2) {
          // 2塁走者が単打で生還する確率（神速・激走・韋駄天なら生還、レーザービームなら警戒）
          let scoreFrom2ndProb = outs === 2
            ? (speed >= 8 ? 0.68 : speed >= 6 ? 0.54 : 0.38)
            : (speed >= 8 ? 0.46 : speed >= 6 ? 0.32 : 0.20);
          if (bSkills.includes('神速スプリンター') || bSkills.includes('激走') || bSkills.includes('韋駄天')) scoreFrom2ndProb = 0.95;
          if (hasLaserBeam) scoreFrom2ndProb *= 0.25;
          else if (hasCannonArm) scoreFrom2ndProb *= 0.55;

          if (Math.random() < scoreFrom2ndProb) {
            runs++; // 2塁走者生還
          } else {
            new3rd = r2; // 3塁ストップ
          }
        }

        let new2nd: string | null = null;
        if (r1) {
          const runTo3rdProb = (speed >= 8 || bSkills.includes('神速スプリンター') || bSkills.includes('韋駄天') || bSkills.includes('激走'))
            ? (bSkills.includes('神速スプリンター') ? 0.60 : bSkills.includes('韋駄天') ? 0.45 : 0.22)
            : (speed >= 6 ? 0.10 : 0);
          if (!new3rd && Math.random() < runTo3rdProb) {
            new3rd = r1; // 一気に3塁進塁
          } else {
            new2nd = r1; // 2塁進塁
          }
        }

        nextRunners.third = new3rd;
        nextRunners.second = new2nd;
        nextRunners.first = batter.name;

        const hitDirections = [
          'センター前クリーンヒット',
          'レフト前ヒット',
          '一二塁間を破るライト前安打',
          '三遊間を抜く痛烈なヒット',
          '痛烈な弾丸ライナーのセンター前安打'
        ];
        const dir = hitDirections[Math.floor(Math.random() * hitDirections.length)];
        resultText = runs > 0 ? `${dir}・適時打！` : dir;
      }

      if (runs > 0 || isDouble || isTriple || skillTriggered) {
        log = {
          id: `log_hit_${Date.now()}_${Math.random()}`,
          inning,
          isBottom,
          outs: 0,
          text: `${batter.name}、${resultText} ${runs > 0 ? `走者生還し${runs}点！` : ''}`,
          scoreTop: 0,
          scoreBottom: 0,
          type: 'hit',
          skillTriggered,
        };
      }
    }
  } else {
    // リアルプロ野球水準の与四球率（選球眼の極み・神眼・選球眼・精密機械・無双の制球・マダックス極対応）
    let walkProb = Math.min(0.085, Math.max(0.008, 0.038 - (pControl - 5) * 0.005));
    if (bSkills.includes('選球眼の極み')) walkProb += 0.050;
    if (bSkills.includes('神眼')) walkProb += 0.040;
    if (bSkills.includes('選球眼')) walkProb += 0.025;
    if (bSkills.includes('切り込み隊長') && battingOrder === 1) walkProb += 0.025;
    if (bSkills.includes('観察眼')) walkProb += 0.012;
    if (bSkills.includes('タフネスバッター')) walkProb += 0.010;
    if (bSkills.includes('カットマン')) walkProb += 0.015;
    if (bSkills.includes('トップバッター') && battingOrder === 1) walkProb += 0.015;
    if (pSkills.includes('無双の制球')) walkProb *= 0.05;
    else if (pSkills.includes('マダックス・極')) walkProb *= 0.08;
    else if (pSkills.includes('精密機械')) walkProb *= 0.12;
    else if (pSkills.includes('マダックス')) walkProb *= 0.25;
    if (pSkills.includes('四球拒否')) walkProb *= 0.40;
    if (pSkills.includes('カウント稼ぎ')) walkProb *= 0.70;

    if (roll < hitProb + walkProb) {
      // 四球
      isWalk = true;
      eventType = 'walk';
      if (bSkills.includes('選球眼の極み')) skillTriggered = '選球眼の極み';
      else if (bSkills.includes('神眼')) skillTriggered = '神眼';
      else if (bSkills.includes('選球眼')) skillTriggered = '選球眼';

      const r3 = runners.third;
      const r2 = runners.second;
      const r1 = runners.first;

      if (r1 && r2 && r3) {
        // 満塁押し出し
        runs++;
        nextRunners.third = r2;
        nextRunners.second = r1;
        nextRunners.first = batter.name;
        resultText = '押し出し四球';
      } else if (r1 && r2) {
        // 一二塁 → 満塁
        nextRunners.third = r2;
        nextRunners.second = r1;
        nextRunners.first = batter.name;
        resultText = '四球で満塁';
      } else if (r1 && r3) {
        // 一三塁 → 満塁（3塁走者はそのまま、1塁走者が2塁へ）
        nextRunners.third = r3;
        nextRunners.second = r1;
        nextRunners.first = batter.name;
        resultText = '四球で満塁';
      } else if (r1) {
        // 一塁 → 一二塁
        nextRunners.third = null;
        nextRunners.second = r1;
        nextRunners.first = batter.name;
        resultText = '四球で出塁';
      } else {
        // 走者なし、または二塁、三塁、二三塁（1塁が空いているので走者は動かない）
        nextRunners.third = r3;
        nextRunners.second = r2;
        nextRunners.first = batter.name;
        resultText = r3 || r2 ? '四球で出塁' : '四球';
      }
    } else {
      // スクイズ・バント職人・電撃バント判定（3塁走者がおり、2死未満）
      const hasBuntSkill = bSkills.includes('電撃バント') || bSkills.includes('スクイズ') || bSkills.includes('バント職人') || bSkills.includes('奇跡の采配') || bSkills.includes('セーフティバント');
      if (nextRunners.third && outs < 2 && hasBuntSkill && Math.random() < (bSkills.includes('電撃バント') ? 0.98 : bSkills.includes('奇跡の采配') ? 0.95 : bSkills.includes('バント職人') ? 0.90 : 0.75)) {
        runs++;
        nextRunners.third = null;
        skillTriggered = bSkills.includes('電撃バント') ? '電撃バント' : bSkills.includes('奇跡の采配') ? '奇跡の采配' : bSkills.includes('バント職人') ? 'バント職人' : 'スクイズ';
        const isBuntHit = (speed >= 8 || bSkills.includes('神速の韋駄天') || bSkills.includes('神速スプリンター') || bSkills.includes('内野安打') || bSkills.includes('バント職人') || bSkills.includes('電撃バント') || bSkills.includes('セーフティバント')) && Math.random() < (bSkills.includes('電撃バント') ? 0.70 : bSkills.includes('セーフティバント') ? 0.50 : 0.35);
        if (isBuntHit) {
          outsDelta = 0;
          isHit = true;
          eventType = 'hit';
          nextRunners.third = runners.second;
          nextRunners.second = runners.first;
          nextRunners.first = batter.name;
          resultText = `【${skillTriggered}成功！】完璧なバントで三塁走者が生還し打者走者もセーフ！`;
        } else {
          outsDelta = 1;
          eventType = 'out';
          nextRunners.third = runners.second;
          nextRunners.second = runners.first;
          nextRunners.first = null;
          resultText = `【${skillTriggered}成功！】打者走者はアウトも三塁走者が生還し1点奪取！`;
        }
        log = {
          id: `log_sq_${Date.now()}_${Math.random()}`,
          inning,
          isBottom,
          outs: 0,
          text: `${batter.name}、${resultText}`,
          scoreTop: 0,
          scoreBottom: 0,
          type: 'hit',
          skillTriggered,
        };
      } else {
        // 三振判定（ドクターK・絶対零度スライダー・ドクターフォーク・神速ストレート等対応）
        const soDiff = (pSpeed * 0.6 + pBreaking * 0.4) - meet;
        const hasKSkill = pSkills.includes('超完封') || pSkills.includes('超火消し男') || pSkills.includes('奪三振王') || pSkills.includes('奪三振マシン') || pSkills.includes('ドクターK') || pSkills.includes('絶対零度スライダー') || pSkills.includes('ドクターフォーク') || pSkills.includes('神速ストレート');
        let soProb = Math.min(0.26, Math.max(0.025, 0.108 + soDiff * 0.010 + (hasKSkill ? 0.045 : 0)));
        if (pSkills.includes('ドクターフォーク')) soProb += 0.065;
        if (pSkills.includes('絶対零度スライダー')) soProb += 0.060;
        if (pSkills.includes('ドクターK')) soProb += 0.060;
        if (pSkills.includes('神速ストレート')) soProb += 0.045;
        if (pSkills.includes('紫電一閃')) soProb += 0.045;
        if (pSkills.includes('幻影魔球')) soProb += 0.050;
        if (pSkills.includes('バックドア') || pSkills.includes('フロントドア')) soProb += 0.025;
        if (pSkills.includes('ブレーキ○')) soProb += 0.020;
        if (pSkills.includes('キレ○')) soProb += 0.025;
        if (pSkills.includes('魔球')) soProb += 0.030;
        if (pSkills.includes('ゴロキラー')) soProb *= 0.55;
        if (pSkills.includes('打たせて取る')) soProb *= 0.55;
        if (bSkills.includes('選球眼の極み')) soProb *= 0.40;
        if (bSkills.includes('神眼')) soProb *= 0.55;
        if (bSkills.includes('タフネスバッター')) soProb *= 0.65;
        if (bSkills.includes('粘り打ち')) soProb *= 0.60;
        if (bSkills.includes('カットマン')) soProb *= 0.50;

        const isSO = Math.random() < soProb;
        if (isSO) {
          outsDelta = 1;
          isStrikeout = true;
          eventType = 'strikeout';
          const soTypes = ['空振り三振', '外角いっぱい見逃し三振', '低め鋭い変化球に空振り三振', '渾身の剛速球にバット空を切る三振', '手元で消える魔球に手が出ず見逃し三振'];
          resultText = soTypes[Math.floor(Math.random() * soTypes.length)];

          if (pSkills.includes('ドクターフォーク')) skillTriggered = 'ドクターフォーク';
          else if (pSkills.includes('絶対零度スライダー')) skillTriggered = '絶対零度スライダー';
          else if (pSkills.includes('神速ストレート')) skillTriggered = '神速ストレート';
          else if (pSkills.includes('ドクターK')) skillTriggered = 'ドクターK';
          else if (pSkills.includes('紫電一閃')) skillTriggered = '紫電一閃';
          else if (pSkills.includes('奪三振王')) skillTriggered = '奪三振王';
          else if (pSkills.includes('奪三振マシン')) skillTriggered = '奪三振マシン';
          else if (pSkills.includes('バックドア')) skillTriggered = 'バックドア';
          else if (pSkills.includes('フロントドア')) skillTriggered = 'フロントドア';

          if (skillTriggered || (runners.second && runners.third)) {
            log = {
              id: `log_so_${Date.now()}_${Math.random()}`,
              inning,
              isBottom,
              outs: 0,
              text: `【奪三振！】投手${pitcher.name}、${resultText}に仕留めました！`,
              scoreTop: 0,
              scoreBottom: 0,
              type: 'strikeout',
              skillTriggered,
            };
          }
        } else {
          // 打球が野手へ飛んだ場合の判定（魔術師・名手・鉄壁・ノーエラー・神速スプリンター・ヘッスラ・鉄壁の要塞・レーザービーム）
          const outPlayMap: { label: string; posName: string; posSymbol: Position }[] = [
            { label: 'ショートゴロ', posName: 'ショート', posSymbol: '遊' },
            { label: 'セカンドゴロ', posName: 'セカンド', posSymbol: '二' },
            { label: 'サードゴロ', posName: 'サード', posSymbol: '三' },
            { label: 'ファーストゴロ', posName: 'ファースト', posSymbol: '一' },
            { label: 'ピッチャーゴロ', posName: 'ピッチャー', posSymbol: '投' },
            { label: 'センターフライ', posName: 'センター', posSymbol: '中' },
            { label: 'レフトフライ', posName: 'レフト', posSymbol: '左' },
            { label: 'ライトフライ', posName: 'ライト', posSymbol: '右' },
            { label: 'キャッチャーフライ', posName: 'キャッチャー', posSymbol: '捕' },
          ];
          const chosen = outPlayMap[Math.floor(Math.random() * outPlayMap.length)];
          const isGrounder = chosen.label.includes('ゴロ');

          // 打球を処理する守備野手を特定
          const fielderIdx = pitchingTeam.lineupPositions?.indexOf(chosen.posSymbol) ?? -1;
          const fielderPlayer = fielderIdx >= 0 && pitchingTeam.lineup[fielderIdx]
            ? pitchingTeam.roster.find(p => p.id === pitchingTeam.lineup[fielderIdx])
            : (chosen.posSymbol === '投' ? pitcher : pitchingTeam.roster.find(p => p.position !== '投'));

          const fielderDef = chosen.posSymbol === '投'
            ? Math.min(10, Math.max(1, Math.round((pitcher.stats.pitcher?.control || 5) * 0.7)))
            : (fielderPlayer?.stats.fielder?.defense ?? 5);
          const hasNoErrors = fielderPlayer?.skills?.includes('ノーエラー') ?? false;
          const hasTeppeki = fielderPlayer?.skills?.includes('鉄壁') ?? false;
          const hasMeishu = fielderPlayer?.skills?.includes('名手') ?? false;
          const hasMajutsushi = fielderPlayer?.skills?.includes('魔術師') ?? false;
          const hasGoldGlove = fielderPlayer?.skills?.includes('ゴールデングラブの極致') ?? false;
          const hasAccuracy = fielderPlayer?.skills?.includes('送球精度') ?? false;
          const hasBackup = pitchingTeam.roster.some(p => p.skills.includes('バックアップ'));

          // 守備力に応じた失策（エラー）発生確率（魔術師・ゴールデングラブの極致スキル所持時は完全無失策0%）
          const errorRatesByDef = [0, 0.045, 0.035, 0.026, 0.020, 0.015, 0.010, 0.007, 0.004, 0.002, 0.001];
          let errorProb = errorRatesByDef[Math.max(1, Math.min(10, fielderDef))] || 0.015;
          if (hasTeppeki) errorProb *= 0.4;
          if (hasMeishu) errorProb *= 0.15;
          if (hasAccuracy) errorProb *= 0.50;
          if (hasBackup) errorProb *= 0.70;
          if (bSkills.includes('足攻')) errorProb *= 1.35;
          if (hasGoldGlove || hasMajutsushi || hasNoErrors) errorProb = 0.0001;

          if (Math.random() < errorProb) {
            // 守備エラー発生！失策による得点は非自責点
            eventType = 'error';
            outsDelta = 0;
            isEarned = false;
            const fielderLabel = fielderPlayer ? `${chosen.posName}・${fielderPlayer.name}` : chosen.posName;
            resultText = `${fielderLabel}が痛恨のファンブル失策！打者走者セーフ！`;

            if (nextRunners.third) {
              runs++;
              nextRunners.third = null;
            }
            if (nextRunners.second) {
              nextRunners.third = nextRunners.second;
              nextRunners.second = null;
            }
            if (nextRunners.first) {
              nextRunners.second = nextRunners.first;
              nextRunners.first = null;
            }
            nextRunners.first = batter.name;

            log = {
              id: `log_err_${Date.now()}_${Math.random()}`,
              inning,
              isBottom,
              outs: 0,
              text: `【痛恨の失策！】${fielderLabel}が痛恨の守備エラー！打者・${batter.name}が出塁！${runs > 0 ? `走者が生還し${runs}点！` : ''}`,
              scoreTop: 0,
              scoreBottom: 0,
              type: 'out',
            };
          } else if (
            isGrounder &&
            (bSkills.includes('神速の韋駄天') || bSkills.includes('神速スプリンター') || bSkills.includes('快足スプリンター') || bSkills.includes('内野安打') || bSkills.includes('ヘッスラ') || bSkills.includes('電光石火') || bSkills.includes('電光石火・改') || bSkills.includes('セーフティバント') || speed >= 8) &&
            Math.random() < (
              (pitchingTeam.roster.some(p => p.skills.includes('難攻不落の要塞')) ? 0.35 : 1.0) * (
                bSkills.includes('神速の韋駄天') ? 0.55 :
                bSkills.includes('神速スプリンター') ? 0.45 :
                bSkills.includes('ヘッスラ') ? 0.35 :
                bSkills.includes('セーフティバント') ? 0.40 :
                bSkills.includes('電光石火・改') ? 0.30 :
                bSkills.includes('快足スプリンター') ? 0.28 :
                bSkills.includes('内野安打') ? 0.25 :
                bSkills.includes('電光石火') ? 0.20 :
                (speed >= 10 ? 0.06 : 0.035)
              )
            )
          ) {
            // 内野安打成功！神速の韋駄天・神速スプリンター・快足スプリンター・ヘッスラ・電光石火・セーフティバントの反映
            outsDelta = 0;
            isHit = true;
            eventType = 'hit';
            if (bSkills.includes('神速の韋駄天')) {
              skillTriggered = '神速の韋駄天';
              resultText = '【神速の韋駄天！】光速のダッシュで駆け抜ける！異次元の内野安打！';
            } else if (bSkills.includes('神速スプリンター')) {
              skillTriggered = '神速スプリンター';
              resultText = '【神速スプリンター！】驚異のダッシュで一瞬にして一塁到達！神速の内野安打！';
            } else if (bSkills.includes('セーフティバント')) {
              skillTriggered = 'セーフティバント';
              resultText = '【セーフティバント！】意表を突く絶妙な転がしで一塁セーフ！見事なバント安打！';
            } else if (bSkills.includes('快足スプリンター')) {
              skillTriggered = '快足スプリンター';
              resultText = '【快足スプリンター！】俊足を活かして一塁をもぎ取る内野安打！';
            } else if (bSkills.includes('ヘッスラ')) {
              skillTriggered = 'ヘッスラ';
              resultText = '【ヘッスラ炸裂！】ヘッドスライディングで気迫の一塁セーフ！内野安打！';
            } else if (bSkills.includes('内野安打')) {
              skillTriggered = '内野安打';
              resultText = '俊足を飛ばして一塁セーフ！気迫の【スキル内野安打】！';
            } else {
              resultText = '俊足を飛ばして一塁セーフ！間一髪の内野安打！';
            }

            const r3 = runners.third;
            const r2 = runners.second;
            const r1 = runners.first;

            if (r3 && r2 && r1) {
              runs++;
              nextRunners.third = r2;
              nextRunners.second = r1;
              nextRunners.first = batter.name;
            } else if (r2 && r1) {
              nextRunners.third = r2;
              nextRunners.second = r1;
              nextRunners.first = batter.name;
            } else if (r3 && r1) {
              nextRunners.third = r3;
              nextRunners.second = r1;
              nextRunners.first = batter.name;
            } else if (r1) {
              nextRunners.third = null;
              nextRunners.second = r1;
              nextRunners.first = batter.name;
            } else if (r2) {
              nextRunners.third = r2;
              nextRunners.second = null;
              nextRunners.first = batter.name;
            } else if (r3) {
              nextRunners.third = r3;
              nextRunners.second = null;
              nextRunners.first = batter.name;
            } else {
              nextRunners.third = null;
              nextRunners.second = null;
              nextRunners.first = batter.name;
            }

            log = {
              id: `log_inf_${Date.now()}_${Math.random()}`,
              inning,
              isBottom,
              outs: 0,
              text: `${batter.name}、${resultText}`,
              scoreTop: 0,
              scoreBottom: 0,
              type: 'hit',
              skillTriggered,
            };
          } else {
            // ゴロ時の併殺打（ゲッツー）判定: 1死以下で1塁に走者がいる場合（難攻不落の要塞・鉄壁の要塞・進塁打名人等対応）
            let dpRate = speed >= 8 ? 0.25 : speed >= 6 ? 0.36 : 0.44;
            if (bSkills.includes('進塁打名人')) dpRate *= 0.45;
            if (bSkills.includes('ランエンドヒット')) dpRate *= 0.30;
            if (pSkills.includes('ゴロキラー')) dpRate *= 1.60;
            if (pSkills.includes('打たせて取る')) dpRate *= 1.45;
            const hasImpregnable = pitchingTeam.roster.some(p => p.skills.includes('難攻不落の要塞'));
            const hasFortress = hasImpregnable || pitchingTeam.roster.some(p => p.skills.includes('鉄壁の要塞'));
            const hasHeisatsuMaster = hasFortress || pitchingTeam.roster.some(p => p.skills.includes('併殺マスター'));
            if (hasImpregnable) dpRate *= 1.70;
            else if (hasFortress) dpRate *= 1.55;
            else if (hasHeisatsuMaster) dpRate *= 1.35;

            const isDoublePlayChance = isGrounder && outs < 2 && !!runners.first && Math.random() < dpRate;

            // 外野フライ時の犠牲フライ判定: 2死未満で3塁に走者がいる場合（キャノンレーザー・レーザービーム・犠牲フライ職人・激走・キャノン肩・本塁死守対応）
            const isOutfieldFly = chosen.label.includes('フライ') && !chosen.label.includes('キャッチャー') && !chosen.label.includes('ピッチャー');
            const hasCannonLaser = fielderPlayer?.skills?.includes('キャノンレーザー') || pitchingTeam.roster.some(p => p.skills.includes('キャノンレーザー'));
            const hasLaser = hasCannonLaser || (fielderPlayer?.skills?.includes('レーザービーム') || pitchingTeam.roster.some(p => p.skills.includes('レーザービーム')));
            const hasCannon = hasLaser || (fielderPlayer?.skills?.includes('キャノン肩') ?? false);
            let sacFlyProb = 0.45;
            if (bSkills.includes('犠牲フライ職人')) sacFlyProb += 0.35;
            if (bSkills.includes('激走')) sacFlyProb += 0.30;
            if (hasCannonLaser) sacFlyProb = 0.02;
            else if (hasLaser) sacFlyProb = 0.05;
            else if (hasCannon) sacFlyProb *= 0.25;
            if (catcherSkills.includes('本塁死守')) sacFlyProb *= 0.55;

            const isSacFlyChance = isOutfieldFly && outs < 2 && !!runners.third && Math.random() < sacFlyProb;

            if (isDoublePlayChance) {
              outsDelta = 2;
              eventType = 'out';
              if (hasImpregnable) {
                resultText = '【難攻不落の要塞】神技の高速連係！一寸の隙もない完璧なダブルプレー完成！';
              } else if (hasFortress) {
                resultText = '【鉄壁の要塞】神速の転送プレー！寸分の狂いもない高速ダブルプレー完成！';
              } else if (pSkills.includes('ゴロキラー')) {
                resultText = '【ゴロキラー】鋭く沈む球で完璧な内野ゴロ併殺打に討ち取り！';
              } else if (hasHeisatsuMaster) {
                resultText = '【併殺マスター】電光石火の転送プレー！鮮やかなダブルプレー成立！';
              } else if (pSkills.includes('打たせて取る')) {
                resultText = '【打たせて取る】狙い通りの内野ゴロでダブルプレー成立！';
              } else {
                resultText = '【併殺打】痛恨のゲッツー！ダブルプレー成立';
              }
              nextRunners.first = null;

              if (outs === 0) {
                // 0死の場合、ダブルプレー後も1アウト残る(0+2=2死)
                // 3塁走者は併殺の間に生還（公認野球規則準拠・打点はつかない）
                if (runners.third) {
                  runs++;
                  nextRunners.third = null;
                }
                // 2塁走者がいた場合、1塁走者が2塁封殺される間に2塁走者は3塁へ進塁！
                if (runners.second) {
                  nextRunners.third = runners.second;
                  nextRunners.second = null;
                }
              } else {
                // 1死の場合、併殺打で3アウト（チェンジ）
                // 3アウト目でイニング終了のため得点は無効・塁上の走者は残らない
                nextRunners.first = null;
                nextRunners.second = null;
                nextRunners.third = null;
              }
            } else if (isSacFlyChance) {
              outsDelta = 1;
              isSacFly = true;
              eventType = 'out';
              runs++;
              nextRunners.third = null;
              // 2塁走者がいた場合、大飛球タッチアップで3塁へ進塁
              if (runners.second) {
                nextRunners.third = runners.second;
                nextRunners.second = null;
              }
              resultText = bSkills.includes('犠牲フライ職人')
                ? `【犠牲フライ職人！】狙いすました外野大飛球！三塁走者が悠々タッチアップ生還！`
                : bSkills.includes('激走')
                ? `【激走タッチアップ！】${chosen.posName}への飛球で好スタート！本塁へ滑り込み生還！`
                : `【犠牲フライ】${chosen.posName}への大飛球！三塁走者がタッチアップ生還！`;
            } else if (isOutfieldFly && outs < 2 && !!runners.third && (hasLaser || hasCannon)) {
              // レーザービーム・キャノン肩によるタッチアップ阻止
              outsDelta = 1;
              eventType = 'out';
              resultText = hasLaser
                ? `【レーザービーム発動！】${chosen.posName}から超低空の矢のような送球！三塁走者はタッチアップを断念！`
                : `【キャノン肩発動！】${chosen.posName}からの強烈な送球で三塁走者はタッチアップを自重！`;
            } else {
              // 通常の凡退
              outsDelta = 1;
              eventType = 'out';
              resultText = chosen.label;

              // ゴロ時の走者進塁処理（2死未満時）
              if (isGrounder && outs < 2) {
                // 走者一塁時：打者は一塁アウト、一塁走者は二塁へ進塁（進塁打）
                if (runners.first && !runners.second && !runners.third) {
                  nextRunners.second = runners.first;
                  nextRunners.first = null;
                  resultText = `${chosen.label}・進塁打`;
                }
                // 走者二塁時：一塁・二塁ゴロ・投ゴロなら二塁走者は三塁へ進塁
                else if (runners.second && !runners.first && !runners.third) {
                  if (chosen.posSymbol === '一' || chosen.posSymbol === '二' || chosen.posSymbol === '投') {
                    nextRunners.third = runners.second;
                    nextRunners.second = null;
                    resultText = `${chosen.label}・進塁打`;
                  }
                }
                // 走者一二塁時：二塁走者は三塁へ、一塁走者は二塁へ進塁
                else if (runners.first && runners.second && !runners.third) {
                  nextRunners.third = runners.second;
                  nextRunners.second = runners.first;
                  nextRunners.first = null;
                  resultText = `${chosen.label}・進塁打`;
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    runs,
    earnedRuns: isEarned ? runs : 0,
    outsDelta,
    isHit,
    isDouble,
    isTriple,
    isHomeRun,
    isWalk,
    isStrikeout,
    isSacFly,
    resultText,
    eventType,
    nextRunners,
    skillTriggered,
    log,
  };
}
