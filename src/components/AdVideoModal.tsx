import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, X, Play } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface AdVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdCompleted: () => void;
}

interface SponsorAd {
  id: string;
  link: string;
  imageSrc: string;
  width: number;
  height: number;
  alt: string;
  beaconSrc: string;
}

const SPONSOR_ADS: SponsorAd[] = [
  {
    id: 'a8-sponsor-1',
    link: 'https://px.a8.net/svt/ejp?a8mat=4BGFJF+FHAIA+1WP2+6IHCX',
    imageSrc: 'https://www29.a8.net/svt/bgt?aid=261107115026&wid=001&eno=01&mid=s00000008903001094000&mc=1',
    width: 180,
    height: 180,
    alt: 'スポンサー広告',
    beaconSrc: 'https://www13.a8.net/0.gif?a8mat=4BGFJF+FHAIA+1WP2+6IHCX',
  },
  {
    id: 'a8-rakuten-2',
    link: 'https://rpx.a8.net/svt/ejp?a8mat=4BGFJF+EVUWI+2HOM+656YP&rakuten=y&a8ejpredirect=http%3A%2F%2Fhb.afl.rakuten.co.jp%2Fhgc%2F0ea62065.34400275.0ea62066.204f04c0%2Fa26110779512_4BGFJF_EVUWI_2HOM_656YP%3Fpc%3Dhttp%253A%252F%252Fwww.rakuten.co.jp%252F%26m%3Dhttp%253A%252F%252Fm.rakuten.co.jp%252F',
    imageSrc: 'https://hbb.afl.rakuten.co.jp/hsb/0ec09ba3.bc2429d5.0eb4bbaa.95151395/',
    width: 120,
    height: 120,
    alt: '楽天市場',
    beaconSrc: 'https://www16.a8.net/0.gif?a8mat=4BGFJF+EVUWI+2HOM+656YP',
  },
];

const STORAGE_LAST_AD_KEY = 'gekipawa_last_ad_index';

export const AdVideoModal: React.FC<AdVideoModalProps> = ({
  isOpen,
  onClose,
  onAdCompleted,
}) => {
  // 広告閲覧秒数（デフォルト: 5秒）
  const AD_DURATION = 5;
  const [timeLeft, setTimeLeft] = useState(AD_DURATION);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(AD_DURATION);
      setIsCompleted(false);
      setShowCancelConfirm(false);
      return;
    }

    // モーダルを開くたびに2つの広告を交互に切り替え（前回と違う広告を表示）
    let nextIndex = 0;
    try {
      const raw = localStorage.getItem(STORAGE_LAST_AD_KEY);
      if (raw !== null) {
        const last = parseInt(raw, 10);
        nextIndex = (last + 1) % SPONSOR_ADS.length;
      } else {
        nextIndex = Math.random() < 0.5 ? 0 : 1;
      }
      localStorage.setItem(STORAGE_LAST_AD_KEY, String(nextIndex));
    } catch {
      nextIndex = Math.random() < 0.5 ? 0 : 1;
    }
    setAdIndex(nextIndex);

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
  const ad = SPONSOR_ADS[adIndex] || SPONSOR_ADS[0];

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
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>スポンサー提供広告</span>
            </span>
          </div>

          <button
            onClick={handleCancelClick}
            className="text-slate-400 hover:text-rose-400 transition-colors p-1"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ad Display Area (A8.net Sponsor Banner with Alternating Rotation) */}
        <div className="relative min-h-[230px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-5 overflow-hidden">
          {/* Subtle background animated spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-indigo-500/5 to-transparent animate-pulse pointer-events-none" />
          
          {/* Grid lines decoration */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* A8.net Affiliate Banner Link (Alternating 2 sponsors) */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-700/80 shadow-2xl transition-transform hover:scale-105 flex items-center justify-center min-w-[200px] min-h-[200px]">
              <a
                href={ad.link}
                rel="nofollow noopener noreferrer"
                target="_blank"
                className="flex items-center justify-center"
              >
                <img
                  width={ad.width}
                  height={ad.height}
                  alt={ad.alt}
                  src={ad.imageSrc}
                  className="rounded-xl object-contain shadow-md mx-auto block border-0"
                  style={{ maxWidth: '180px', maxHeight: '180px' }}
                />
              </a>
              {/* A8.net Tracking Beacon */}
              <img
                key={ad.id}
                width={1}
                height={1}
                src={ad.beaconSrc}
                alt=""
                className="opacity-0 pointer-events-none w-[1px] h-[1px] border-0"
              />
            </div>
            <p className="text-[10px] text-amber-300/90 mt-2.5 font-medium flex items-center justify-center gap-1">
              <span>タップでスポンサーサイトを表示</span>
            </p>
          </div>

          {/* Countdown Overlay Badge (Top Right) */}
          <div className="absolute top-3 right-3 z-20">
            {isCompleted ? (
              <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>閲覧完了</span>
              </span>
            ) : (
              <span className="bg-black/75 backdrop-blur-sm text-slate-200 text-[11px] font-mono px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1.5 shadow-md">
                <span>報酬まで</span>
                <span className="font-bold text-amber-400">{timeLeft}秒</span>
              </span>
            )}
          </div>

          {/* Progress Bar (Bottom of Ad Area) */}
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
                  <span>広告の確認が完了しました！待ち時間なしで試合を開始できます</span>
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
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>広告を確認中…（あと {timeLeft} 秒）</span>
              </button>
              <p className="text-[10px] text-center text-slate-500">
                ※広告を閲覧すると、通常10分のクールダウンなしで即座に試合を開始できます。
              </p>
            </div>
          )}
        </div>

        {/* Cancel Confirmation Prompt */}
        {showCancelConfirm && !isCompleted && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center space-y-3 max-w-xs shadow-2xl">
              <div className="text-amber-400 text-sm font-bold">広告閲覧を中断しますか？</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                広告閲覧を途中で終了した場合、待ち時間は短縮されず試合は開始されません。
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-colors"
                >
                  閲覧を続ける
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
