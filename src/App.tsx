/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserAccount, League, Team, Player } from './types/baseball';
import {
  loadUserAccount,
  saveUserAccount,
  clearUserAccount,
  loadLeague,
  saveLeague
} from './utils/storage';
import { soundFx, bgm } from './utils/audio';

import { AuthView } from './components/AuthView';
import { Header } from './components/Header';
import { BottomNav, MainFacilityTab } from './components/BottomNav';
import { DugoutView } from './components/DugoutView';
import { StadiumView } from './components/StadiumView';
import { ScoutView } from './components/ScoutView';
import { YorozuyaView } from './components/YorozuyaView';
import { MarketView } from './components/MarketView';
import { HallOfFameView } from './components/HallOfFameView';
import { PlayerModal } from './components/PlayerModal';
import { ActivityLogModal } from './components/ActivityLogModal';
import { PostseasonView } from './components/PostseasonView';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { ContactModal } from './components/ContactModal';
import { AboutAuthorModal } from './components/AboutAuthorModal';
import { reconcilePostseasonRewards } from './utils/postseasonManager';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => loadUserAccount());
  const [league, setLeague] = useState<League | null>(() => {
    const user = loadUserAccount();
    return user ? loadLeague(user) : null;
  });

  const [activeTab, setActiveTab] = useState<MainFacilityTab>('dugout');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundFx.isEnabled());
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showAuthor, setShowAuthor] = useState(false);

  // Auto-save sync: リーグ状態の変化を即座に永続化
  useEffect(() => {
    if (league) {
      saveLeague(league);
    }
  }, [league]);

  // Sound sync
  useEffect(() => {
    soundFx.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // BGM sync: 球場(試合結果画面)以外の全メニュー施設ではメニューBGMを再生
  useEffect(() => {
    if (activeTab !== 'stadium') {
      bgm.setTrack('menu');
    }
  }, [activeTab]);

  // ポストシーズン初回クリア報酬の自動補填（過去の不具合による未反映分を救済）
  useEffect(() => {
    if (league) {
      const uTeam = league.teams.find(t => t.isUser);
      if (uTeam && uTeam.postseason) {
        const { updatedTeam, recoveredAmount } = reconcilePostseasonRewards(uTeam);
        if (recoveredAmount > 0) {
          handleUpdateUserTeam(updatedTeam);
        }
      }
    }
  }, [league]);

  // 新規球団創設 (投手6名＋野手9名でスタート)
  const handleRegister = (account: UserAccount) => {
    saveUserAccount(account);
    setCurrentUser(account);
    const newLeague = loadLeague(account);
    setLeague(newLeague);
    setActiveTab('dugout');
    soundFx.playVictory();
    bgm.setTrack('menu');
  };

  // ログイン
  const handleLogin = (account: UserAccount) => {
    saveUserAccount(account);
    setCurrentUser(account);
    const loaded = loadLeague(account);
    setLeague(loaded);
    setActiveTab('dugout');
    soundFx.playScore();
    bgm.setTrack('menu');
  };

  // ログアウト処理実行
  const handleConfirmLogout = () => {
    clearUserAccount();
    setCurrentUser(null);
    setLeague(null);
    setShowLogoutConfirm(false);
  };

  // リーグデータの更新
  const handleUpdateLeague = (updatedLeague: League) => {
    setLeague(updatedLeague);
    saveLeague(updatedLeague);
  };

  // ユーザー球団の更新
  const handleUpdateUserTeam = (updatedTeam: Team) => {
    setLeague(prev => {
      if (!prev) return null;
      const updatedTeams = prev.teams.map(t => (t.id === updatedTeam.id ? updatedTeam : t));
      const nextLeague = { ...prev, teams: updatedTeams };
      saveLeague(nextLeague);
      return nextLeague;
    });
  };

  // 未ログイン時：新規球団創設・ログイン画面
  if (!currentUser || !league) {
    return <AuthView onRegister={handleRegister} onLogin={handleLogin} />;
  }

  const userTeam = league.teams.find(t => t.isUser) || league.teams[0];
  const remainingScoutTickets = userTeam.pitcherScoutTickets + userTeam.fielderScoutTickets;

  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col">
      {/* 1. Header (Mobile-optimized info bar) */}
      <Header
        team={userTeam}
        league={league}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onLogout={() => setShowLogoutConfirm(true)}
        onOpenActivityLog={() => setShowActivityLog(true)}
      />

      {/* 2. Main Facility Content */}
      <main className="flex-1 px-3 sm:px-4 py-4 max-w-md w-full mx-auto min-w-0 overflow-x-hidden app-main-content">
        {activeTab === 'dugout' && (
          <DugoutView
            team={userTeam}
            onUpdateTeam={handleUpdateUserTeam}
            onSelectPlayer={setSelectedPlayer}
            onOpenActivityLog={() => setShowActivityLog(true)}
          />
        )}

        {activeTab === 'stadium' && (
          <StadiumView
            league={league}
            onUpdateLeague={handleUpdateLeague}
            onSelectPlayer={setSelectedPlayer}
          />
        )}

        {activeTab === 'postseason' && (
          <PostseasonView
            team={userTeam}
            onUpdateTeam={handleUpdateUserTeam}
            onSelectPlayer={setSelectedPlayer}
          />
        )}

        {activeTab === 'scout' && (
          <ScoutView
            team={userTeam}
            onUpdateTeam={handleUpdateUserTeam}
            onSelectPlayer={setSelectedPlayer}
            onGoToDugout={() => setActiveTab('dugout')}
          />
        )}

        {activeTab === 'yorozuya' && (
          <YorozuyaView
            team={userTeam}
            onUpdateTeam={handleUpdateUserTeam}
            onGoToMarket={() => setActiveTab('market')}
          />
        )}

        {activeTab === 'market' && (
          <MarketView
            team={userTeam}
            onUpdateTeam={handleUpdateUserTeam}
            onSelectPlayer={setSelectedPlayer}
          />
        )}

        {activeTab === 'hall_of_fame' && (
          <HallOfFameView
            league={league}
            team={userTeam}
            onSelectPlayer={setSelectedPlayer}
          />
        )}

        {/* Subtle Footer with Operator Info, Privacy Policy & Contact Form links */}
        <footer className="mt-8 mb-4 pt-3 border-t border-slate-900/60 text-center text-[11px] text-slate-500 space-x-2.5">
          <button
            type="button"
            onClick={() => setShowAuthor(true)}
            className="hover:text-slate-400 transition-colors underline decoration-slate-800 underline-offset-2"
          >
            運営者情報
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowPrivacyPolicy(true)}
            className="hover:text-slate-400 transition-colors underline decoration-slate-800 underline-offset-2"
          >
            プライバシーポリシー
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => setShowContact(true)}
            className="hover:text-slate-400 transition-colors underline decoration-slate-800 underline-offset-2"
          >
            お問い合わせ
          </button>
        </footer>
      </main>

      {/* 3. Player Card Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          team={userTeam}
          onClose={() => setSelectedPlayer(null)}
          onUpdateTeam={updatedTeam => {
            handleUpdateUserTeam(updatedTeam);
            const refresh = updatedTeam.roster.find(p => p.id === selectedPlayer.id);
            if (refresh) setSelectedPlayer(refresh);
          }}
        />
      )}

      {/* 4. Activity Log Modal */}
      {showActivityLog && (
        <ActivityLogModal
          logs={userTeam.activityLogs || []}
          onClose={() => setShowActivityLog(false)}
        />
      )}

      {/* 5. In-app Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in pt-safe pb-safe pl-safe pr-safe">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-100">球団からログアウトしますか？</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              現在のペナント成績や選手データはブラウザの保存領域に安全に保管されています。次回ログイン時にいつでも続きから再開できます。
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleConfirmLogout}
                className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition-transform active:scale-95"
              >
                ログアウトする
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Operator Info Modal */}
      <AboutAuthorModal
        isOpen={showAuthor}
        onClose={() => setShowAuthor(false)}
        onOpenContact={() => {
          setShowAuthor(false);
          setShowContact(true);
        }}
      />

      {/* 7. Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        onOpenContact={() => {
          setShowPrivacyPolicy(false);
          setShowContact(true);
        }}
      />

      {/* 7. Contact Modal */}
      <ContactModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
      />

      {/* 8. Bottom Navigation Bar (iPhone / Smartphone optimized) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        scoutNotificationCount={remainingScoutTickets}
      />
    </div>
  );
}
