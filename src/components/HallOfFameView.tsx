import React from 'react';
import { League, Team, Player, getUnlockedDifficulties } from '../types/baseball';
import { Trophy, Award, History, Star, Lock, Swords, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  league: League;
  team: Team;
  onSelectPlayer: (player: Player) => void;
}

export const HallOfFameView: React.FC<Props> = ({ league, team, onSelectPlayer }) => {
  const allTitlesHeldByCurrentRoster: { player: Player; title: string }[] = [];
  team.roster.forEach(p => {
    (p.titles || []).forEach(t => {
      // 不正なプレースホルダーや0記録タイトルを除外
      if (t && !t.includes('-') && !t.includes('0本') && !t.includes('0打点') && !t.includes('0S')) {
        allTitlesHeldByCurrentRoster.push({ player: p, title: t });
      }
    });
  });

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-slate-100 font-['M_PLUS_Rounded_1c']">
            球団栄誉の殿堂
          </h2>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          球団が積み重ねたシーズン優勝の歴史、歴代の個人タイトルホルダー、名誉ある制覇称号。
        </p>
      </div>

      {/* ポストシーズン戦歴 & 決勝制覇の栄誉 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Swords className="w-4 h-4 text-indigo-400" />
            <span>ポストシーズントーナメント栄誉</span>
          </div>
          <span className="text-[10px] text-indigo-300 font-bold font-mono">
            全103戦 一発勝負
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold">最高突破</div>
            <div className="text-xs font-black text-amber-400 mt-0.5 truncate">
              {team.postseason?.highestClearedStage === 103
                ? '🏆 決勝制覇'
                : team.postseason?.highestClearedStage
                ? `${team.postseason.highestClearedStage}戦`
                : '未挑戦'}
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold">決勝制覇数</div>
            <div className="text-xs font-black text-indigo-400 mt-0.5">
              {team.postseason?.championshipCount || 0}回
            </div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold">最高峰スキル</div>
            <div className="text-xs font-black text-emerald-400 mt-0.5">
              {team.postseason?.hasClaimedFinalSkill || (team.inventory?.ownedSkills || []).includes('完全試合')
                ? '★ 完全試合'
                : '？？？'}
            </div>
          </div>
        </div>
      </div>

      {/* 獲得した名誉ある制覇称号 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Star className="w-4 h-4 text-amber-400" />
            <span>球団栄誉の獲得称号・リーグ優勝報酬</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono font-bold">
            最高解放難易度: ★{team.maxUnlockedDifficulty || league.maxUnlockedDifficulty || 1}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-[10px] text-amber-200 leading-relaxed flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>各難易度のリーグで優勝する度に、賞金・スカウト券・限定レア装備・改名手形・秘伝スキルの豪華優勝報酬を何度でも全額獲得できます！</span>
        </div>

        <div className="space-y-2">
          {getUnlockedDifficulties(team.maxUnlockedDifficulty || league.maxUnlockedDifficulty || 1).map(d => {
            const isEarned = (team.championshipTitles || []).some(
              t => t.includes(`★${d.level}`) || t.includes(d.badgeLabel) || t.includes(d.championshipTitle)
            );

            return (
              <div
                key={d.level}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isEarned
                    ? 'bg-gradient-to-r from-amber-500/15 via-amber-400/5 to-slate-950 border-amber-400/50 shadow-md'
                    : 'bg-slate-950/70 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isEarned
                        ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}
                  >
                    {isEarned ? <Trophy className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border font-mono ${d.border} ${d.color} ${d.bg}`}>
                        {d.badgeLabel}
                      </span>
                      <span className={`text-xs font-black truncate block ${isEarned ? 'text-amber-300' : 'text-slate-400'}`}>
                        {d.championshipTitle}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-300 mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                      <span className="text-amber-300 font-bold">+{d.rewards.gerda.toLocaleString()}G</span>
                      <span>スカウト券(投{d.rewards.pitcherTickets}/野{d.rewards.fielderTickets})</span>
                      <span className="text-amber-200 font-bold">限定レア装備or賞金</span>
                      <span>改名×{d.rewards.renameTickets}</span>
                      <span className="text-amber-200 font-bold">「{d.rewards.awardedSkill}」</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                      {isEarned
                        ? '公式ペナントレース制覇の証・優勝毎に報酬受取可能'
                        : `※難易度【${d.badgeLabel}】でペナント優勝すると授与`}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2 text-right">
                  {isEarned ? (
                    <span className="text-[10px] text-amber-300 font-black px-2 py-0.5 rounded bg-amber-950/60 border border-amber-400/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      <span>獲得済</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>未獲得</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Season History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
          <History className="w-4 h-4 text-amber-400" />
          <span>歴代シーズン記録</span>
        </div>

        {league.seasonHistory.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            まだ終了したシーズンはありません。72試合を消化すると歴代シーズン記録が刻まれます。
          </div>
        ) : (
          <div className="space-y-2.5">
            {league.seasonHistory.map(hist => (
              <div
                key={hist.season}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-400 font-sans">第{hist.season}季 ペナント</span>
                  <span className="text-slate-300">
                    自球団: <strong className={hist.userRank === 1 ? 'text-amber-400 font-black' : 'text-slate-200'}>{hist.userRank}位</strong> ({hist.userWins}勝 {hist.userLosses}敗 {hist.userDraws ?? 0}分)
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>覇者: <strong>{hist.championTeamName}</strong></span>
                </div>

                {/* Titles in this season */}
                <div className="pt-1.5 border-t border-slate-800/80 flex flex-wrap gap-1">
                  {hist.titles.map((t, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {t.title}: {t.playerName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Title Holders in current roster */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
          <Award className="w-4 h-4 text-cyan-400" />
          <span>所属選手の獲得タイトル</span>
        </div>

        {allTitlesHeldByCurrentRoster.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            タイトルを獲得した選手はまだいません。
          </div>
        ) : (
          <div className="space-y-2">
            {allTitlesHeldByCurrentRoster.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectPlayer(item.player)}
                className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:border-slate-700"
              >
                <div>
                  <span className="font-bold text-slate-100 block">{item.player.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold">{item.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  プロ{item.player.careerYears}年目
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
