import React, { useState } from 'react';
import { UserAccount } from '../types/baseball';
import { Shield, Sparkles, LogIn, UserPlus, Zap, Crown } from 'lucide-react';
import { isSecretSeibuCommand } from '../utils/secretCommand';

interface Props {
  onRegister: (account: UserAccount) => void;
  onLogin: (account: UserAccount) => void;
}

export const AuthView: React.FC<Props> = ({ onRegister, onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSecretMatch = isSecretSeibuCommand(teamName, password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTeam = isSecretMatch ? '西武ライオンズ' : teamName.trim();
    const cleanManager = isSecretMatch ? (managerName.trim() || '森 祇晶') : managerName.trim();
    const cleanPass = isSecretMatch ? '6456' : password.trim();

    if (!isSecretMatch) {
      if (!cleanTeam) {
        setErrorMessage('球団名を入力してください。');
        return;
      }
      if (isRegisterMode && !cleanManager) {
        setErrorMessage('監督名を入力してください。');
        return;
      }
      if (!cleanPass || cleanPass.length < 4) {
        setErrorMessage('パスワードは4文字以上で入力してください。');
        return;
      }

      // 不適切ワードチェック簡易版
      const banned = ['admin', 'test', 'ばか', 'アホ', '死ね'];
      if (banned.some(b => cleanTeam.includes(b) || cleanManager.includes(b))) {
        setErrorMessage('不適切な文字列が含まれています。別の名称をご使用ください。');
        return;
      }
    }

    const account: UserAccount = {
      teamName: cleanTeam,
      managerName: isRegisterMode || isSecretMatch ? cleanManager : '監督',
      passwordHash: cleanPass,
      createdAt: Date.now(),
      hasClaimedInitialScouts: true,
    };

    if (isRegisterMode) {
      onRegister(account);
    } else {
      onLogin(account);
    }
  };

  return (
    <div className="w-full min-h-screen min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center text-slate-100 app-auth-container">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-400/10 border border-amber-400/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-amber-400 font-['M_PLUS_Rounded_1c']">
            {isRegisterMode ? '新たな球団を創設しますか？' : '球団へログイン'}
          </h1>
          <p className="text-xs text-slate-400">
            {isRegisterMode
              ? 'あなただけのオリジナル球団を設立し、ゼロから日本一を目指しましょう。'
              : 'オーナー・監督情報でサインインしてチーム運営を再開します。'}
          </p>
        </div>

        {/* Notice for new teams */}
        {isRegisterMode ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div className="leading-relaxed">
              <span className="font-bold block">球団設立メンバー</span>
              初期選手15名（<strong>投手6名・野手9名</strong>）を即時配備！すぐに公式戦に出場できます。
            </div>
          </div>
        ) : (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-xs text-cyan-300 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
            <div className="leading-relaxed">
              <span className="font-bold block">自動セーブ完全保持</span>
              球団名とパスワードを入力すると、前回のチーム編成・個人記録・獲得称号が完全に復元されます。
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-bold animate-pulse">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1.5 font-bold">球団名</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="例: 東京スターズ / 浪速ブレーブス"
              maxLength={14}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="text-slate-300 block mb-1.5 font-bold">監督名</label>
              <input
                type="text"
                value={managerName}
                onChange={e => setManagerName(e.target.value)}
                placeholder="例: 山田太郎"
                maxLength={10}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          <div>
            <label className="text-slate-300 block mb-1.5 font-bold">パスワード (認証キー)</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="4文字以上の英数字"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {/* Secret Command Easter Egg Detected Card */}
          {isSecretMatch && (
            <div className="bg-gradient-to-r from-blue-950/90 via-slate-900 to-amber-950/80 border-2 border-amber-400/80 rounded-xl p-3.5 shadow-[0_0_25px_rgba(251,191,36,0.3)] space-y-2 animate-pulse">
              <div className="flex items-center gap-1.5 text-amber-300 font-black text-xs">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="tracking-wide">【隠しコマンド検知】黄金期「西武ライオンズ」最強データ！</span>
              </div>
              <p className="text-[11px] text-slate-200 leading-relaxed font-sans">
                球団名「西武ライオンズ」＆パスワード「6456」を確認！<br />
                開始と同時に<strong>全選手伝説ユニーク・全能力値オールMAX・999,999ゲルダ・全スキル所持・全アイテム99個</strong>の究極最強データで即座にプレイを開始できます！
              </p>
              <div className="flex flex-wrap gap-1 pt-1 text-[10px] text-amber-300 font-mono">
                <span className="bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">★全選手 伝説ユニーク</span>
                <span className="bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">★能力値オール10 / 165km/h</span>
                <span className="bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">★999,999ゲルダ</span>
                <span className="bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">★全アイテム99個</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3.5 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-2 ${
              isSecretMatch
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.6)] animate-bounce'
                : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
            }`}
          >
            {isSecretMatch ? (
              <>
                <Crown className="w-5 h-5 text-slate-950" />
                <span>黄金期・最強西武ライオンズでスタート！</span>
              </>
            ) : isRegisterMode ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>球団を創設する</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>球団にログイン</span>
              </>
            )}
          </button>
        </form>

        {/* Switch link */}
        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage(null);
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
          >
            {isRegisterMode ? '既に球団をお持ちの方はこちら (ログイン)' : '新しい球団を創設する (新規登録)'}
          </button>
        </div>
      </div>
    </div>
  );
};
