import React from 'react';
import { Users, Flag, Swords, UserPlus, ShoppingBag, ShoppingCart, Trophy } from 'lucide-react';

export type MainFacilityTab = 'dugout' | 'stadium' | 'postseason' | 'scout' | 'yorozuya' | 'market' | 'hall_of_fame';

interface Props {
  activeTab: MainFacilityTab;
  onChangeTab: (tab: MainFacilityTab) => void;
  scoutNotificationCount?: number;
}

export const BottomNav: React.FC<Props> = ({ activeTab, onChangeTab, scoutNotificationCount = 0 }) => {
  const tabs: { id: MainFacilityTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dugout', label: 'ダグアウト', icon: Users },
    { id: 'stadium', label: '球場', icon: Flag },
    { id: 'postseason', label: 'PS戦', icon: Swords },
    { id: 'scout', label: 'スカウト', icon: UserPlus },
    { id: 'yorozuya', label: '萬屋', icon: ShoppingBag },
    { id: 'market', label: '市場', icon: ShoppingCart },
    { id: 'hall_of_fame', label: '殿堂', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 app-bottom-nav">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 relative transition-colors ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.id === 'scout' && scoutNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {scoutNotificationCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-sans whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
