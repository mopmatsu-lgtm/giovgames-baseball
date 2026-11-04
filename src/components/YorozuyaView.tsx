import React, { useState } from 'react';
import { Team, EquipmentItem } from '../types/baseball';
import { SHOP_ITEMS, ALL_EQUIPMENTS } from '../utils/playerGenerator';
import { addActivityLog } from '../utils/storage';
import { soundFx } from '../utils/audio';
import { ShoppingBag, Sparkles, Shield, Coins, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  team: Team;
  onUpdateTeam: (updated: Team) => void;
  onGoToMarket?: () => void;
}

export const YorozuyaView: React.FC<Props> = ({ team, onUpdateTeam, onGoToMarket }) => {
  const [activeTab, setActiveTab] = useState<'items' | 'equipments'>('items');
  const [purchaseMsg, setPurchaseMsg] = useState<string | null>(null);

  const handleBuyShopItem = (itemId: string, price: number) => {
    setPurchaseMsg(null);
    if (team.gerda < price) {
      setPurchaseMsg('ゲルダが不足しています！');
      return;
    }

    let updated = { ...team };
    updated.gerda -= price;

    if (itemId === 'shop_skill_ticket') {
      updated.inventory.skillTickets += 1;
      setPurchaseMsg('【購入完了】「スキル変更券」を1枚購入しました！(ダグアウトで使用可能)');
      updated = addActivityLog(updated, `萬屋にて「スキル変更券」を1枚購入しました。(-${price.toLocaleString()}G)`, 'item');
    } else if (itemId === 'shop_rename_ticket') {
      updated.inventory.renameTickets = (updated.inventory.renameTickets || 0) + 1;
      setPurchaseMsg('【購入完了】「改名手形」を1枚購入しました！(ダグアウトで選手名変更に使用可能)');
      updated = addActivityLog(updated, `萬屋にて「改名手形」を1枚購入しました。(-${price.toLocaleString()}G)`, 'item');
    }

    soundFx.playScore();
    onUpdateTeam(updated);
  };

  const handleBuyEquipment = (eq: EquipmentItem) => {
    setPurchaseMsg(null);
    if (team.gerda < eq.price) {
      setPurchaseMsg('ゲルダが不足しています！');
      return;
    }

    let updated = { ...team };
    updated.gerda -= eq.price;
    updated.inventory.equipments.push({ ...eq, id: `eq_${Date.now()}_${Math.random()}` });

    updated = addActivityLog(updated, `萬屋にて野球装備「${eq.name}」(${eq.effectLabel})を購入しました。(-${eq.price.toLocaleString()}G)`, 'item');

    soundFx.playScore();
    confetti({ particleCount: 50, spread: 50 });
    setPurchaseMsg(`【購入完了】装備「${eq.name}」を購入しました！(ダグアウトで選手に装着可能)`);
    onUpdateTeam(updated);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24">
      {/* Yorozuya Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100 font-['M_PLUS_Rounded_1c']">
              萬屋（よろずや）
            </h2>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400">{team.gerda.toLocaleString()} G</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          選手の強化や特化に必要な道具、スキル変更券、装備具を調達できる伝統の店。
        </p>

        {purchaseMsg && (
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs font-bold text-amber-300 flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{purchaseMsg}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center justify-between text-xs font-bold">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            activeTab === 'items' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          特殊道具・消耗品
        </button>
        <button
          onClick={() => setActiveTab('equipments')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            activeTab === 'equipments' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          野球装備・用具
        </button>
      </div>

      {/* Inventory status preview */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl grid grid-cols-3 gap-2 text-center text-xs font-mono text-slate-300">
        <div>
          <span className="text-[10px] text-slate-500 block">所持スキル</span>
          <div className="flex items-center justify-center gap-1">
            <span className="font-bold text-amber-400">{(team.inventory.ownedSkills || []).length} 個</span>
            {onGoToMarket && (team.inventory.ownedSkills || []).length > 0 && (
              <button
                type="button"
                onClick={onGoToMarket}
                className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400 hover:text-slate-950 font-bold transition-colors"
                title="市場でスキルを売却"
              >
                売却
              </button>
            )}
          </div>
        </div>
        <div className="border-l border-slate-800">
          <span className="text-[10px] text-slate-500 block">改名手形</span>
          <span className="font-bold text-amber-300">{team.inventory.renameTickets || 0} 枚</span>
        </div>
        <div className="border-l border-slate-800">
          <span className="text-[10px] text-slate-500 block">所持装備</span>
          <span className="font-bold text-slate-100">{team.inventory.equipments.length} 点</span>
        </div>
      </div>

      {/* Catalog */}
      <div className="space-y-3">
        {activeTab === 'items' ? (
          SHOP_ITEMS.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
            >
              <div className="space-y-1">
                <span className="font-bold text-slate-100 text-xs block">{item.name}</span>
                <p className="text-[10px] text-slate-400 leading-snug">{item.description}</p>
                <span className="font-mono text-amber-400 font-bold text-xs block pt-0.5">
                  {item.price.toLocaleString()} G
                </span>
              </div>
              <button
                onClick={() => handleBuyShopItem(item.id, item.price)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow shrink-0 active:scale-95"
              >
                購入
              </button>
            </div>
          ))
        ) : (
          ALL_EQUIPMENTS.map(eq => (
            <div
              key={eq.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-100 text-xs">{eq.name}</span>
                  <span className="text-[9px] px-1 rounded bg-slate-800 text-cyan-400 font-mono font-bold">
                    {eq.type}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">{eq.description}</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="text-[10px] text-emerald-400 font-bold">[{eq.effectLabel}]</span>
                  <span className="font-mono text-amber-400 font-bold text-xs">
                    {eq.price.toLocaleString()} G
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleBuyEquipment(eq)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow shrink-0 active:scale-95"
              >
                購入
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
