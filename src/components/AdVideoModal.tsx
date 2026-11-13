import React, { useState, useEffect } from 'react';
import { Video, Sparkles, CheckCircle, X, Volume2, VolumeX, Shield, Play } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface AdVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
}

/**
 * 将来の広告動画（Google AdMob, Unity Ads, Google IMA SDK, VAST/VPAID等）を
 * スムーズに統合できるよう設計されたリワード動画広告プレイヤー。
 *
 * 現在はプレビュー・検証用の高精細シミュレーション動画プレイヤーとして動作し、
 * 動画視聴が完了するとクールダウンを全回復して即座に試合を開始できます。
 */
export const AdVideoModal: React.FC<AdVideoModalProps> = ({
  isOpen,
  onClose,
  onAdCompleted,
}) => {
  // 広告視聴秒数（デフォルト: 5秒）
  const AD_DURATION = 5;
  const [timeLeft, setTimeLeft] = useState(AD_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(AD_DURATION);
      setIsCompleted(false);
      setShowCancelConfirm(false);
      return;
    }

    // ============================================================
    // 【将来の動画広告SDK連携用エントリーポイント】
    // 将来 Google AdMob や Unity Ads, Google IMA SDK を導入する際は
    // ここで SDK の `showRewardedVideo()` 等を呼び出してください。
    // 例:
    // if (window.admobVideoSdk) {
    //   window.admobVideoSdk.show({
    //     onRewarded: () => { setIsCompleted(true); onAdCompleted(); },
    //     onError: () => { onClose(); }
    //   });
    // }
    // ============================================================

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCompleted(true);
          try {
            soundFx.playScore();
          } catch {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((AD_DURATION - timeLeft) / AD_DURATION) * 100));

  const handleClaimReward = () => {
    onAdCompleted();
  };

  const handleCancelClick = () => {
    if (isCompleted) {
      onClose();
    } else {
      setShowCancelConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 pt-safe pb-safe pl-safe pr-safe animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col relative text-slate-100">
        
        {/* Header Bar */}
        <div className="bg-slate-950/90 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow">
              広告
            </span>
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-amber-400" />
              <span>スポンサー提供動画</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title={isMuted ? 'ミュート解除' : '消音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
            </button>
            <button
              onClick={handleCancelClick}
              className="text-slate-400 hover:text-rose-400 transition-colors p-1"
              title="閉じる"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Area / Showcase Player */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 overflow-hidden">
          {/* Subtle background animated spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-indigo-500/5 to-transparent animate-pulse pointer-events-none" />
          
          {/* Grid lines decoration */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Dynamic Video Simulation Content */}
          <div className="relative z-10 text-center space-y-3 max-w-xs">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 mb-1">
              <Play className="w-7 h-7 fill-current translate-x-0.5" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase block">
                Official Game Partner
              </span>
              <h3 className="text-base font-black text-white tracking-wide">
                激闘！パワフルベースボール
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                メジャーリーグ参戦＆最強球団育成シミュレーション
              </p>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-[11px] text-amber-300 font-bold shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>動画視聴で10分待ち時間を完全スキップ！</span>
              </div>
            </div>
          </div>

          {/* Countdown Overlay Badge (Top Right) */}
          <div className="absolute top-3 right-3 z-20">
            {isCompleted ? (
              <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>視聴完了</span>
              </span>
            ) : (
              <span className="bg-black/75 backdrop-blur-sm text-slate-200 text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
                <span>報酬まで</span>
                <span className="font-bold text-amber-400">{timeLeft}秒</span>
              </span>
            )}
          </div>

          {/* Progress Bar (Bottom of Video) */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer / Action Area */}
        <div className="p-4 bg-slate-950 space-y-3 border-t border-slate-800">
          {isCompleted ? (
            <div className="space-y-2">
              <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-2.5 text-center">
                <span className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>動画視聴完了！待ち時間なしで試合を開始できます</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleClaimReward}
                className="w-full py-3 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 hover:from-emerald-300 hover:to-emerald-200 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 game-btn"
              >
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>今すぐ試合開始！</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                disabled={true}
                className="w-full py-3 bg-slate-800/80 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-700/50"
              >
                <Video className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                <span>動画を再生中…（あと {timeLeft} 秒）</span>
              </button>
              <p className="text-[10px] text-center text-slate-500">
                ※動画広告を最後まで視聴すると、通常10分のクールダウンなしで即座に試合を開始できます。
              </p>
            </div>
          )}
        </div>

        {/* Cancel Confirmation Prompt */}
        {showCancelConfirm && !isCompleted && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center space-y-3 max-w-xs shadow-2xl">
              <div className="text-amber-400 text-sm font-bold">動画視聴を中断しますか？</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                動画を最後まで視聴しない場合、クールダウンは短縮されず試合は開始されません。
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  視聴を続ける
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
