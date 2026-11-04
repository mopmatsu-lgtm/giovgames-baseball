import React, { useState } from 'react';
import { Team, Player, Position, SkillDefinition } from '../types/baseball';
import { generatePlayer, RARITY_BUDGET, getPitcherKmh, ALL_SKILLS, TITLE_ONLY_SKILLS, SCOUT_RARITY_RATES, SSR_GUARANTEED_RATES, SKILL_GACHA_RATES } from '../utils/playerGenerator';
import { addActivityLog } from '../utils/storage';
import { soundFx } from '../utils/audio';
import { UserCheck, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Edit3, Minus, Plus, Sliders, RotateCcw, AlertTriangle, Zap, Coins, Dices, Crown, Flame, Eye, Compass, Shield, Mail, FileText, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

import { ScoutCutsceneModal } from './ScoutCutsceneModal';

interface Props {
  team: Team;
  onUpdateTeam: (updated: Team) => void;
  onSelectPlayer: (player: Player) => void;
  onGoToDugout: () => void;
}

export const ScoutView: React.FC<Props> = ({ team, onUpdateTeam, onSelectPlayer, onGoToDugout }) => {
  const [scoutModalState, setScoutModalState] = useState<{
    isOpen: boolean;
    scoutType: 'pitcher' | 'fielder';
    isSSR: boolean;
    player: Player | null;
  }>({
    isOpen: false,
    scoutType: 'fielder',
    isSSR: false,
    player: null,
  });
  const [notification, setNotification] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'players' | 'skills'>('players');
  const [isSkillGachaAnim, setIsSkillGachaAnim] = useState<boolean>(false);
  const [pulledSkills, setPulledSkills] = useState<SkillDefinition[] | null>(null);

  // スキルガチャ実行 (1回: 1,500 G / 5連: 7,000 G)
  const handleDrawSkillGacha = (count: 1 | 5) => {
    setNotification(null);
    setPulledSkills(null);
    const cost = count === 1 ? 1500 : 7000;

    if (team.gerda < cost) {
      setNotification(`ゲルダが不足しています！（必要: ${cost.toLocaleString()} G）`);
      return;
    }

    setIsSkillGachaAnim(true);

    setTimeout(() => {
      setIsSkillGachaAnim(false);

      const normalPool = ALL_SKILLS.filter(s => !TITLE_ONLY_SKILLS.includes(s.id) && !s.isRare);
      const rarePool = ALL_SKILLS.filter(s => !TITLE_ONLY_SKILLS.includes(s.id) && s.isRare);
      const drawn: SkillDefinition[] = [];
      for (let i = 0; i < count; i++) {
        // レアスキル（金特）の排出率を5.0%に設定（通常スキル95.0%）
        const isRare = Math.random() < 0.05;
        const pool = isRare && rarePool.length > 0 ? rarePool : normalPool;
        const randSkill = pool[Math.floor(Math.random() * pool.length)];
        drawn.push(randSkill);
      }

      setPulledSkills(drawn);

      let updatedTeam = { ...team };
      updatedTeam.gerda -= cost;
      const currentOwned = [...(updatedTeam.inventory.ownedSkills || [])];
      drawn.forEach(s => currentOwned.push(s.id));
      updatedTeam.inventory.ownedSkills = currentOwned;

      const hasRare = drawn.some(s => s.isRare);
      const skillNames = drawn.map(s => (s.isRare ? `【★${s.name}】` : s.name)).join('、');
      updatedTeam = addActivityLog(
        updatedTeam,
        `スキルガチャを引き、新たなスキル（${skillNames}）を獲得しました！`,
        'scout'
      );

      if (hasRare) {
        // 金特排出時は黄金の紙吹雪＋ホームラン音で祝福
        confetti({
          particleCount: 120,
          spread: 80,
          colors: ['#F59E0B', '#FCD34D', '#FBBF24', '#F43F5E', '#38BDF8'],
        });
        soundFx.playHomeRun();
      } else if (count === 5) {
        confetti({ particleCount: 60, spread: 50 });
        soundFx.playScore();
      } else {
        soundFx.playScore();
      }

      onUpdateTeam(updatedTeam);
      setNotification(
        hasRare
          ? `【★超激レア金特排出！】新たなスキル（${skillNames}）を獲得しました！ダグアウトで各選手にセットできます。`
          : `【スキル獲得！】新たに${count}個のスキル（${skillNames}）を獲得しました！ダグアウトで各選手にセットできます。`
      );
    }, 800);
  };

  const pitcherCount = team.roster.filter(p => p.position === '投').length;
  const fielderCount = team.roster.filter(p => p.position !== '投').length;
  const isInitialPhase = team.roster.length < 10;

  const handleScout = (type: 'pitcher' | 'fielder', isSSR: boolean = false) => {
    setNotification(null);
    const cost = isSSR ? 20000 : 1000;
    const hasTicket = !isSSR && (type === 'pitcher' ? team.pitcherScoutTickets > 0 : team.fielderScoutTickets > 0);

    if (!hasTicket && team.gerda < cost) {
      setNotification(
        isSSR
          ? `極・名門スカウトに必要な資金が不足しています！（必要: 20,000 G / 現在: ${team.gerda.toLocaleString()} G）`
          : `スカウト券または資金（${cost.toLocaleString()} ゲルダ）が不足しています！`
      );
      return;
    }

    // チケットまたはゲルダ消費
    const updatedTeam = { ...team };
    if (isSSR) {
      updatedTeam.gerda -= cost;
    } else if (type === 'pitcher') {
      if (updatedTeam.pitcherScoutTickets > 0) updatedTeam.pitcherScoutTickets--;
      else updatedTeam.gerda -= cost;
    } else {
      if (updatedTeam.fielderScoutTickets > 0) updatedTeam.fielderScoutTickets--;
      else updatedTeam.gerda -= cost;
    }
    onUpdateTeam(updatedTeam);

    // ポジション決定 (投手または野手)
    const pos: Position = type === 'pitcher' ? '投' : '野';
    const newPlayer = generatePlayer({
      position: pos,
      number: updatedTeam.roster.length + 1,
      minRarity: isSSR ? 'SSR' : undefined,
    });

    // 全画面スカウト特別演出ポップアップを開く
    setScoutModalState({
      isOpen: true,
      scoutType: type,
      isSSR,
      player: newPlayer,
    });
  };

  const applyPlayerToTeam = (baseTeam: Team, finalPlayer: Player, isSSR: boolean): Team => {
    const nextRoster = [...baseTeam.roster, finalPlayer];

    // 自動で打順・守備位置に配置（初回編成を支援）
    let nextLineup = [...baseTeam.lineup];
    let nextPositions = [...baseTeam.lineupPositions];
    let nextRotation = [...baseTeam.pitcherRotation];
    let nextCloser = baseTeam.closerId;

    if (finalPlayer.position === '投') {
      if (nextRotation.length === 0) nextRotation.push(finalPlayer.id);
      if (!nextCloser) nextCloser = finalPlayer.id;
    } else {
      if (nextLineup.length < 9) {
        nextLineup.push(finalPlayer.id);
        const defaultFieldPositions: Position[] = ['捕', '一', '二', '三', '遊', '左', '中', '右', '指'];
        const assignedPos = defaultFieldPositions.find(p => !nextPositions.includes(p)) || '指';
        nextPositions.push(assignedPos);
      }
    }

    let updatedTeam: Team = {
      ...baseTeam,
      roster: nextRoster,
      lineup: nextLineup,
      lineupPositions: nextPositions,
      pitcherRotation: nextRotation,
      closerId: nextCloser,
    };

    updatedTeam = addActivityLog(
      updatedTeam,
      isSSR
        ? `【極・名門スカウト】20,000Gを投じてSSR以上確定スカウトを実施し、「${finalPlayer.name}」(${finalPlayer.rarity}・${finalPlayer.position === '投' ? '投手' : '野手'})を獲得・入団させました！`
        : `スカウトにて「${finalPlayer.name}」(${finalPlayer.rarity}・${finalPlayer.position === '投' ? '投手' : '野手'})を獲得・入団させました！`,
      'scout'
    );

    return updatedTeam;
  };

  const handleConfirmSign = (finalPlayer: Player) => {
    const isSSR = scoutModalState.isSSR;
    const updatedTeam = applyPlayerToTeam(team, finalPlayer, isSSR);
    const isNowComplete = updatedTeam.roster.length === 10;

    onUpdateTeam(updatedTeam);

    setScoutModalState({
      isOpen: false,
      scoutType: scoutModalState.scoutType,
      isSSR: scoutModalState.isSSR,
      player: null,
    });
    setNotification(
      isSSR
        ? `【入団合意！】★極・名門スカウト★ ${finalPlayer.name}（${finalPlayer.rarity}・${finalPlayer.position === '投' ? '投手' : '野手'}）が球団に加わりました！`
        : `【入団合意！】${finalPlayer.name}（${finalPlayer.position === '投' ? '投手' : '野手'}）が球団に加わりました！`
    );

    if (isNowComplete) {
      setTimeout(() => {
        setNotification('投手1名・野手9名が揃いました！ダグアウトへ移動してスタメンを確認しましょう！');
        onGoToDugout();
      }, 500);
    }
  };

  // 入団させてそのまま続けてスカウトする処理（選手が消える不具合を完全に防止）
  const handleSignAndScoutAgain = (finalPlayer: Player, nextType: 'pitcher' | 'fielder', nextIsSSR: boolean) => {
    // 1. まず現在の選手を入団確定
    let updatedTeam = applyPlayerToTeam(team, finalPlayer, scoutModalState.isSSR);

    // 2. 次のスカウトが可能かチェック
    const cost = nextIsSSR ? 20000 : 1000;
    const hasTicket = !nextIsSSR && (nextType === 'pitcher' ? updatedTeam.pitcherScoutTickets > 0 : updatedTeam.fielderScoutTickets > 0);

    if (!hasTicket && updatedTeam.gerda < cost) {
      onUpdateTeam(updatedTeam);
      setScoutModalState({
        isOpen: false,
        scoutType: nextType,
        isSSR: nextIsSSR,
        player: null,
      });
      setNotification(
        `【入団合意！】${finalPlayer.name}が球団に加わりました！（続けてスカウトするためのスカウト券または資金が不足しています）`
      );
      if (updatedTeam.roster.length === 10) {
        setTimeout(() => {
          setNotification('投手1名・野手9名が揃いました！ダグアウトへ移動してスタメンを確認しましょう！');
          onGoToDugout();
        }, 500);
      }
      return;
    }

    // 3. 次のスカウトのコストを消費
    if (nextIsSSR) {
      updatedTeam.gerda -= cost;
    } else if (nextType === 'pitcher') {
      if (updatedTeam.pitcherScoutTickets > 0) updatedTeam.pitcherScoutTickets--;
      else updatedTeam.gerda -= cost;
    } else {
      if (updatedTeam.fielderScoutTickets > 0) updatedTeam.fielderScoutTickets--;
      else updatedTeam.gerda -= cost;
    }

    // 4. 新たな選手を生成
    const pos: Position = nextType === 'pitcher' ? '投' : '野';
    const newPlayer = generatePlayer({
      position: pos,
      number: updatedTeam.roster.length + 1,
      minRarity: nextIsSSR ? 'SSR' : undefined,
    });

    // 5. 入団選手と新スカウト消費を同時にコミット保存
    onUpdateTeam(updatedTeam);

    // 6. モーダルを開いたまま新選手を表示
    setScoutModalState({
      isOpen: true,
      scoutType: nextType,
      isSSR: nextIsSSR,
      player: newPlayer,
    });

    setNotification(
      `【入団完了＆連続スカウト】「${finalPlayer.name}」が入団しました！続けてスカウトを実施中…`
    );
  };

  return (
    <div className="space-y-5 max-w-md mx-auto pb-24">
      {/* Initial Guidance Card */}
      {isInitialPhase && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>球団創設スカウト進行中 ({team.roster.length}/10名)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            初回スカウト券を使って、まずは<strong>投手1名</strong>と<strong>野手9名</strong>をスカウトしてください。選手獲得時に好きな名前を命名できます！
          </p>
          <div className="flex items-center gap-4 text-xs font-mono pt-1 text-slate-400">
            <span>投手: <strong className="text-white">{pitcherCount}/1</strong></span>
            <span>·</span>
            <span>野手: <strong className="text-white">{fielderCount}/9</strong></span>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-amber-300 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Scout Tabs: 選手スカウト / スキルガチャ */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
        <button
          onClick={() => setActiveTab('players')}
          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'players' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>選手スカウト</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'skills' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span>スキルガチャ</span>
          {(team.inventory.ownedSkills || []).length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/80 text-amber-300 font-mono">
              {(team.inventory.ownedSkills || []).length}
            </span>
          )}
        </button>
      </div>

      {/* --- 選手スカウト タブ --- */}
      {activeTab === 'players' && (
        <div className="space-y-4">
          {/* 球団資金＆スカウト券サマリー */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-400 font-bold">球団所持資金:</span>
              <span className="font-mono font-black text-amber-300 text-sm">{team.gerda.toLocaleString()} <span className="text-[10px] text-amber-400/80 font-normal">G</span></span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
              <span>投手券: <strong className="text-amber-400">{team.pitcherScoutTickets}</strong>枚</span>
              <span>·</span>
              <span>野手券: <strong className="text-cyan-400">{team.fielderScoutTickets}</strong>枚</span>
            </div>
          </div>

          {/* ★★★ 極・名門スカウト (1回 20,000 G · SSR以上確定) ★★★ */}
          <div className="relative rounded-2xl p-4 bg-gradient-to-br from-amber-950/70 via-slate-900 to-indigo-950/60 border-2 border-amber-400/80 shadow-[0_0_24px_rgba(251,191,36,0.18)] space-y-3.5 overflow-hidden">
            {/* Background luxury glow */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-200 text-slate-950 shadow flex items-center gap-1">
                    <Crown className="w-3 h-3 text-slate-950 fill-slate-950" />
                    <span>SSR以上確定！</span>
                  </span>
                  <span className="text-[9px] text-amber-300 font-mono font-bold tracking-wider">
                    PREMIUM SCOUT
                  </span>
                </div>
                <h3 className="text-base font-black text-white font-['M_PLUS_Rounded_1c'] mt-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>極・名門スカウト</span>
                </h3>
                <p className="text-[11px] text-amber-100/90 mt-0.5 leading-snug">
                  <strong>SSR · UR · 伝説ユニーク</strong>のいずれかが<strong>100%確定</strong>！<br />
                  神話級の怪物選手や即戦力スターを一本釣り指名。
                </p>
              </div>

              <div className="text-right shrink-0 bg-slate-950/80 border border-amber-400/40 rounded-xl px-2.5 py-1.5 shadow">
                <span className="text-[9px] text-slate-400 block font-bold">1回費用</span>
                <span className="font-mono font-black text-amber-400 text-sm">20,000</span>
                <span className="text-[10px] font-mono text-amber-300 font-bold ml-0.5">G</span>
              </div>
            </div>

            {/* Premium Scout Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 relative z-10">
              {/* Pitcher SSR Guaranteed */}
              <button
                type="button"
                onClick={() => handleScout('pitcher', true)}
                disabled={scoutModalState.isOpen || team.gerda < 20000}
                className="py-3 px-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1 border border-amber-200/50"
              >
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4 text-amber-950 fill-amber-950" />
                  <span className="text-[12px] font-black">投手スカウト</span>
                </div>
                <span className="text-[9px] font-mono text-slate-900 bg-white/70 px-2 py-0.5 rounded font-bold shadow-xs">
                  SSR以上確定 (20,000 G)
                </span>
              </button>

              {/* Fielder SSR Guaranteed */}
              <button
                type="button"
                onClick={() => handleScout('fielder', true)}
                disabled={scoutModalState.isOpen || team.gerda < 20000}
                className="py-3 px-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-300 hover:from-cyan-300 hover:to-emerald-200 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1 border border-cyan-200/50"
              >
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-teal-950 fill-teal-950" />
                  <span className="text-[12px] font-black">野手スカウト</span>
                </div>
                <span className="text-[9px] font-mono text-slate-900 bg-white/70 px-2 py-0.5 rounded font-bold shadow-xs">
                  SSR以上確定 (20,000 G)
                </span>
              </button>
            </div>

            {/* Rates Table for SSR Guaranteed */}
            <div className="pt-2 border-t border-amber-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>極・名門スカウト提供割合</span>
                </span>
                <span className="text-emerald-400 font-bold font-mono">計 100.0%</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
                {SSR_GUARANTEED_RATES.map(r => (
                  <div key={r.rarity} className="bg-slate-950/80 border border-amber-500/30 rounded-lg p-1.5">
                    <span className={`text-[10px] font-black block ${r.color}`}>
                      {r.rarity}
                    </span>
                    <span className="text-xs font-black text-amber-300 block mt-0.5">
                      {r.rate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- 通常スカウト --- */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>通常スカウト</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Pitcher Scout */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-md">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">PITCHER</span>
                  <h3 className="text-sm font-black text-slate-100 font-['M_PLUS_Rounded_1c'] mt-0.5">
                    通常 投手スカウト
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    全国から先発・リリーフ候補の投手を指名。
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
                    <span>所持券:</span>
                    <strong className="text-amber-400">{team.pitcherScoutTickets} 枚</strong>
                  </div>
                  <button
                    onClick={() => handleScout('pitcher', false)}
                    disabled={scoutModalState.isOpen}
                    className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {team.pitcherScoutTickets > 0 ? 'スカウト券で使用' : '1,000 G でスカウト'}
                  </button>
                </div>
              </div>

              {/* Fielder Scout */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-md">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">FIELDER</span>
                  <h3 className="text-sm font-black text-slate-100 font-['M_PLUS_Rounded_1c'] mt-0.5">
                    通常 野手スカウト
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    捕手・内野手・外野手から戦力を指名。
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
                    <span>所持券:</span>
                    <strong className="text-cyan-400">{team.fielderScoutTickets} 枚</strong>
                  </div>
                  <button
                    onClick={() => handleScout('fielder', false)}
                    disabled={scoutModalState.isOpen}
                    className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs rounded-xl shadow transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {team.fielderScoutTickets > 0 ? 'スカウト券で使用' : '1,000 G でスカウト'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 各レアリティの排出率（提供割合） */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 font-['M_PLUS_Rounded_1c']">通常スカウト提供割合</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-bold">1回 1,000 G</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {SCOUT_RARITY_RATES.map(r => (
                <div key={r.rarity} className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border shrink-0 ${r.color}`}>
                      {r.rarity}
                    </span>
                    <span className="text-slate-300 text-[10px] leading-tight truncate">{r.desc}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400 text-xs shrink-0 pl-1">
                    {r.rate}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              ※スカウト獲得時、各能力を好みに応じてカスタマイズできます。
            </p>
          </div>
        </div>
      )}

      {/* --- スキルガチャ タブ --- */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black text-slate-100 font-['M_PLUS_Rounded_1c']">
                  秘伝スキルガチャ
                </h3>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-bold text-amber-400">{team.gerda.toLocaleString()} G</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-snug">
              打者・投手・守備・特殊の全135種以上の秘伝スキルをランダム獲得！超強力な<strong>★金特・レアスキル（全50種 / 排出率5.0%）</strong>は試合の趨勢を握る超希少能力。獲得したスキルは<strong>ダグアウトの選手詳細から好きな選手のスキル枠に自由にセット</strong>できます。
            </p>

            {/* Gacha action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => handleDrawSkillGacha(1)}
                disabled={isSkillGachaAnim || team.gerda < 1500}
                className="py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1"
              >
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>単発スキルガチャ</span>
                </div>
                <span className="text-[10px] font-mono text-slate-900 opacity-90">1,500 G</span>
              </button>

              <button
                onClick={() => handleDrawSkillGacha(5)}
                disabled={isSkillGachaAnim || team.gerda < 7000}
                className="py-3 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1 relative overflow-hidden"
              >
                <div className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>5連スキルガチャ</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono font-bold">
                  <span className="text-slate-900 line-through opacity-70">7,500 G</span>
                  <span className="text-rose-950 font-black bg-white/70 px-1 rounded">7,000 G</span>
                </div>
              </button>
            </div>
          </div>

          {/* Skill Gacha Animation */}
          {isSkillGachaAnim && (
            <div className="bg-slate-900 border border-indigo-400/40 p-6 rounded-2xl text-center space-y-2 animate-pulse shadow-xl">
              <Dices className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
              <span className="text-sm font-bold text-amber-300 block font-['M_PLUS_Rounded_1c']">
                秘伝スキルを抽出中…
              </span>
              <span className="text-[11px] text-slate-400">全国の名伯楽から秘伝の極意書・金特の秘伝書を取り寄せています</span>
            </div>
          )}

          {/* Pulled Skills Result Card */}
          {pulledSkills && (
            <div className="bg-slate-900 border border-indigo-400 rounded-2xl p-4 shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>ガチャ獲得結果（{pulledSkills.length}個）</span>
                </span>
                <button
                  onClick={() => setPulledSkills(null)}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
                >
                  閉じる
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {pulledSkills.map((sk, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 transition-all ${
                      sk.isRare
                        ? 'bg-amber-950/25 border-amber-500/60 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-black text-xs ${sk.isRare ? 'text-yellow-300' : 'text-amber-300'}`}>{sk.name}</span>
                        {sk.isRare && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 shadow-sm flex items-center gap-0.5">
                            ★レア
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-mono">
                          {sk.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1">{sk.description}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      sk.isRare
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse font-black'
                        : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    }`}>
                      {sk.isRare ? '★金特' : 'NEW'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  球団所持スキル: <strong className="text-amber-400 font-mono">{(team.inventory.ownedSkills || []).length} 個</strong>
                </span>
                <button
                  onClick={onGoToDugout}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs"
                >
                  ダグアウトで選手にセット
                </button>
              </div>
            </div>
          )}

          {/* 秘伝スキル提供割合 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200 font-['M_PLUS_Rounded_1c']">
                  秘伝スキルガチャ提供割合
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono font-bold">1回 1,500 G / 5連 7,000 G</span>
            </div>
            <div className="space-y-2 text-xs">
              {SKILL_GACHA_RATES.map(r => (
                <div
                  key={r.tier}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-black border shrink-0 ${r.color}`}>
                      {r.tier}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono shrink-0">
                      {r.countLabel}
                    </span>
                    <span className="text-slate-300 text-[10px] leading-tight truncate">{r.desc}</span>
                  </div>
                  <span className="font-mono font-black text-amber-400 text-sm shrink-0 pl-1">
                    {r.rate}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              ※★金特・レアスキルは極めて希少な伝説の能力です（※タイトル限定スキルおよびポストシーズン限定スキル「完全試合」を除く）。獲得したスキルはダグアウトで各選手の空きスキル枠へ自由に装着できます。
            </p>
          </div>

          {/* Owned Skills Showcase */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">
                球団が所持しているスキル一覧 ({(team.inventory.ownedSkills || []).length}個)
              </span>
            </div>

            {(team.inventory.ownedSkills || []).length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                現在所持しているスキルはありません。上のスキルガチャから獲得しましょう！
              </div>
            ) : (
              (() => {
                const counts: Record<string, number> = {};
                (team.inventory.ownedSkills || []).forEach(s => {
                  counts[s] = (counts[s] || 0) + 1;
                });

                return (
                  <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto pr-1">
                    {Object.entries(counts).map(([skId, count]) => {
                      const skDef = ALL_SKILLS.find(s => s.id === skId);
                      return (
                        <div key={skId} className="py-2 flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-bold ${skDef?.isRare ? 'text-yellow-300 font-black' : 'text-amber-300'}`}>{skDef?.name || skId}</span>
                              {skDef?.isRare && (
                                <span className="text-[9px] font-black px-1 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 shadow-sm">
                                  ★レア
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                ×{count}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400">
                                {skDef?.category}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                              {skDef?.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* 画面ポップアップ・スカウト特別演出モーダル */}
      <ScoutCutsceneModal
        isOpen={scoutModalState.isOpen}
        scoutType={scoutModalState.scoutType}
        isSSR={scoutModalState.isSSR}
        player={scoutModalState.player}
        team={team}
        onConfirmSign={handleConfirmSign}
        onSignAndScoutAgain={handleSignAndScoutAgain}
        onClose={() => setScoutModalState(prev => ({ ...prev, isOpen: false, player: null }))}
      />


      {/* Roster overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200">所属選手一覧 ({team.roster.length}名)</span>
          {team.roster.length >= 9 && (
            <button
              onClick={onGoToDugout}
              className="text-amber-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
            >
              <span>ダグアウトで編成する</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {team.roster.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            選手がまだいません。上のスカウトボタンから選手を獲得しましょう！
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
            {team.roster.map(p => (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className="py-2.5 px-1 flex items-center justify-between text-xs hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold text-amber-400/90 bg-slate-950 px-1.5 py-1 rounded border border-slate-800 shrink-0">
                    #{p.number}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-100">{p.name}</span>
                      <span className={`text-[10px] px-1 rounded font-bold border ${RARITY_BUDGET[p.rarity].color}`}>
                        {p.rarity}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.position === '投' ? '投手' : '野手'} · 枠:{p.skillSlots} · プロ{p.careerYears}年目
                    </span>
                  </div>
                </div>

                <div className="text-right text-[11px] font-mono text-slate-400">
                  {p.skills.length > 0 ? (
                    <span className="text-amber-400 font-bold">{p.skills[0]}</span>
                  ) : (
                    <span>スキルなし</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
