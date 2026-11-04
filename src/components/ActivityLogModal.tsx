import React, { useState } from 'react';
import { History, X, Sparkles, ShoppingBag, Trophy, Trash2, UserPlus, Shield, Swords } from 'lucide-react';
import { ActivityLog } from '../types/baseball';

interface Props {
  logs: ActivityLog[];
  onClose: () => void;
}

type CategoryFilter = 'all' | 'scout' | 'market' | 'match' | 'item' | 'system';

export const ActivityLogModal: React.FC<Props> = ({ logs, onClose }) => {
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.category === filter;
  });

  const getCategoryBadge = (category: ActivityLog['category']) => {
    switch (category) {
      case 'scout':
        return { label: 'スカウト', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: UserPlus };
      case 'market':
        return { label: '市場・FA', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: ShoppingBag };
      case 'match':
        return { label: '公式戦', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: Swords };
      case 'item':
        return { label: '萬屋・道具', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: Shield };
      case 'system':
      default:
        return { label: '球団運営', color: 'bg-slate-700/40 text-slate-300 border-slate-600/40', icon: Trophy };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 font-['M_PLUS_Rounded_1c']">
                球団活動・獲得履歴ログ
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                直近の獲得・取引・試合ログ（全{logs.length}件）
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-bold">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              filter === 'all'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            すべて ({logs.length})
          </button>
          <button
            onClick={() => setFilter('scout')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              filter === 'scout'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            スカウト
          </button>
          <button
            onClick={() => setFilter('market')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              filter === 'market'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            市場・FA
          </button>
          <button
            onClick={() => setFilter('match')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              filter === 'match'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            公式戦
          </button>
          <button
            onClick={() => setFilter('item')}
            className={`px-2.5 py-1 rounded-lg shrink-0 transition-colors ${
              filter === 'item'
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            道具・萬屋
          </button>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <History className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">表示できる活動履歴はありません。</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const badge = getCategoryBadge(log.category);
              const IconComp = badge.icon;
              return (
                <div
                  key={log.id}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold border ${badge.color}`}
                    >
                      <IconComp className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                    <span className="text-slate-500 font-mono">
                      {log.timestampLabel || '最近'}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed font-sans font-medium">
                    {log.message}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
