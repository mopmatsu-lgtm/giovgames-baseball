import React from 'react';
import { Team, Player, Position } from '../types/baseball';
import { RARITY_BUDGET, getPitcherKmh } from '../utils/playerGenerator';
import { Shield, Sparkles, User, Award } from 'lucide-react';

interface Props {
  team: Team;
  onSelectPlayer: (player: Player) => void;
  onChangePosition?: (idx: number, pos: Position) => void;
}

interface PosCoord {
  pos: Position;
  label: string;
  top: string;
  left: string;
  badgeBg: string;
  badgeText: string;
}

const FIELD_COORDS: Record<Position, PosCoord> = {
  投: { pos: '投', label: '投手', top: '65%', left: '50%', badgeBg: 'bg-cyan-950 border-cyan-400', badgeText: 'text-cyan-300' },
  捕: { pos: '捕', label: '捕手', top: '85%', left: '50%', badgeBg: 'bg-amber-950 border-amber-400', badgeText: 'text-amber-300' },
  一: { pos: '一', label: '一塁', top: '56%', left: '76%', badgeBg: 'bg-emerald-950 border-emerald-400', badgeText: 'text-emerald-300' },
  二: { pos: '二', label: '二塁', top: '42%', left: '64%', badgeBg: 'bg-emerald-950 border-emerald-400', badgeText: 'text-emerald-300' },
  三: { pos: '三', label: '三塁', top: '56%', left: '24%', badgeBg: 'bg-emerald-950 border-emerald-400', badgeText: 'text-emerald-300' },
  遊: { pos: '遊', label: '遊撃', top: '42%', left: '36%', badgeBg: 'bg-emerald-950 border-emerald-400', badgeText: 'text-emerald-300' },
  左: { pos: '左', label: '左翼', top: '22%', left: '22%', badgeBg: 'bg-sky-950 border-sky-400', badgeText: 'text-sky-300' },
  中: { pos: '中', label: '中堅', top: '14%', left: '50%', badgeBg: 'bg-sky-950 border-sky-400', badgeText: 'text-sky-300' },
  右: { pos: '右', label: '右翼', top: '22%', left: '78%', badgeBg: 'bg-sky-950 border-sky-400', badgeText: 'text-sky-300' },
  指: { pos: '指', label: '指名', top: '86%', left: '16%', badgeBg: 'bg-purple-950 border-purple-400', badgeText: 'text-purple-300' },
  野: { pos: '野', label: '野手', top: '50%', left: '50%', badgeBg: 'bg-slate-900 border-slate-600', badgeText: 'text-slate-300' },
  野手: { pos: '野手', label: '野手', top: '50%', left: '50%', badgeBg: 'bg-slate-900 border-slate-600', badgeText: 'text-slate-300' },
};

export const TacticalFieldView: React.FC<Props> = ({ team, onSelectPlayer }) => {
  const DEFAULT_LINEUP_POSITIONS: Position[] = ['捕', '一', '二', '三', '遊', '左', '中', '右', '指'];
  const lineupPositions: Position[] =
    team.lineupPositions && team.lineupPositions.length === 9
      ? team.lineupPositions
      : DEFAULT_LINEUP_POSITIONS;

  // Active starter pitcher
  const starterId = team.pitcherRotation?.[0] || team.roster.find(p => p.position === '投')?.id;
  const starterPitcher = team.roster.find(p => p.id === starterId);

  // Lineup players mapped to position
  const fieldItems: { player: Player; orderIdx?: number; pos: Position }[] = [];

  // Pitcher on mound
  if (starterPitcher) {
    fieldItems.push({ player: starterPitcher, pos: '投' });
  }

  // 9 Fielders in lineup
  team.lineup.slice(0, 9).forEach((pId, idx) => {
    const p = team.roster.find(r => r.id === pId);
    const pos = lineupPositions[idx] || '野';
    if (p) {
      fieldItems.push({ player: p, orderIdx: idx + 1, pos });
    }
  });

  // Calculate team summary ratings
  const lineupPlayers = team.lineup
    .slice(0, 9)
    .map(id => team.roster.find(p => p.id === id))
    .filter(Boolean) as Player[];

  const avgMeet = lineupPlayers.length ? Math.round(lineupPlayers.reduce((acc, p) => acc + (p.stats.fielder?.meet || 0), 0) / lineupPlayers.length) : 0;
  const avgPower = lineupPlayers.length ? Math.round(lineupPlayers.reduce((acc, p) => acc + (p.stats.fielder?.power || 0), 0) / lineupPlayers.length) : 0;
  const avgSpeed = lineupPlayers.length ? Math.round(lineupPlayers.reduce((acc, p) => acc + (p.stats.fielder?.speed || 0), 0) / lineupPlayers.length) : 0;
  const avgDefense = lineupPlayers.length ? Math.round(lineupPlayers.reduce((acc, p) => acc + (p.stats.fielder?.defense || 0), 0) / lineupPlayers.length) : 0;

  return (
    <div className="space-y-3">
      {/* Team Capability Rating Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5 mb-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <Shield className="w-4 h-4" />
            <span>スタメン守備・総合戦力値</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            先発陣平均能力値
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center font-mono">
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 block">巧打力</span>
            <strong className="text-amber-300 text-sm">{avgMeet}</strong>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 block">長打力</span>
            <strong className="text-rose-400 text-sm">{avgPower}</strong>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 block">走力</span>
            <strong className="text-cyan-400 text-sm">{avgSpeed}</strong>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
            <span className="text-[9px] text-slate-500 block">守備力</span>
            <strong className="text-emerald-400 text-sm">{avgDefense}</strong>
          </div>
        </div>
      </div>

      {/* Baseball Diamond Ground Visual */}
      <div className="baseball-turf rounded-2xl border border-emerald-900/60 p-2 relative shadow-2xl overflow-hidden min-h-[460px] flex items-center justify-center">
        {/* Outfield arc fence */}
        <div className="absolute top-2 w-[92%] h-[65%] border-2 border-dashed border-white/20 rounded-t-[140px] pointer-events-none" />

        {/* Foul lines from home to outfield */}
        <div className="absolute top-[35%] left-[50%] w-[1px] h-[55%] bg-white/20 -rotate-45 origin-bottom transform pointer-events-none" />
        <div className="absolute top-[35%] left-[50%] w-[1px] h-[55%] bg-white/20 rotate-45 origin-bottom transform pointer-events-none" />

        {/* Infield dirt circle */}
        <div className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-amber-900/40 bg-amber-900/10 pointer-events-none" />

        {/* Infield Diamond lines */}
        <div className="absolute top-[58%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/30 rotate-45 pointer-events-none" />

        {/* Home Plate */}
        <div className="absolute top-[85%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white/90 clip-home-plate pointer-events-none shadow" />

        {/* Pitcher Mound */}
        <div className="absolute top-[65%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-900/60 border border-amber-600/50 flex items-center justify-center pointer-events-none shadow-inner">
          <div className="w-3 h-1 bg-white rounded-sm" />
        </div>

        {/* Field Positions Cards */}
        {fieldItems.map((item, idx) => {
          const coord = FIELD_COORDS[item.pos] || FIELD_COORDS['野'];
          const isPitcher = item.pos === '投';
          const p = item.player;

          return (
            <div
              key={`${p.id}_${idx}`}
              onClick={() => onSelectPlayer(p)}
              style={{ top: coord.top, left: coord.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer game-btn group"
            >
              <div
                className={`w-[78px] sm:w-[84px] bg-slate-950/95 backdrop-blur-md rounded-xl p-1.5 border shadow-xl flex flex-col items-center transition-all ${
                  isPitcher
                    ? 'border-cyan-400/80 shadow-cyan-500/20'
                    : item.pos === '指'
                    ? 'border-purple-400/80'
                    : 'border-slate-700/80 group-hover:border-amber-400'
                }`}
              >
                {/* Header line: Position badge & order number */}
                <div className="flex items-center justify-between w-full mb-0.5">
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-black border ${coord.badgeBg} ${coord.badgeText}`}
                  >
                    {coord.pos}
                  </span>
                  {item.orderIdx ? (
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-slate-900 px-1 rounded border border-slate-800">
                      {item.orderIdx}番
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-cyan-400 bg-slate-900 px-1 rounded border border-slate-800">
                      先発
                    </span>
                  )}
                </div>

                {/* Player Name */}
                <span className="text-[11px] font-black text-slate-100 truncate w-full text-center block font-['M_PLUS_Rounded_1c']">
                  {p.name}
                </span>

                {/* Stats Snippet */}
                <div className="text-[9px] font-mono text-slate-400 w-full text-center truncate mt-0.5">
                  {isPitcher ? (
                    <span className="text-cyan-300">
                      {135 + (p.stats.pitcher?.speed || 5) * 3}km 制{p.stats.pitcher?.control}
                    </span>
                  ) : (
                    <span>
                      巧{p.stats.fielder?.meet} 長{p.stats.fielder?.power} 守{p.stats.fielder?.defense}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        ※グラウンド上の選手カードをタップすると能力詳細・スキル・装備の確認ができます。
      </p>
    </div>
  );
};
