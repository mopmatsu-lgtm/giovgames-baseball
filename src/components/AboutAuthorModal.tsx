import React from 'react';
import { User, X, Globe, Mail, ExternalLink } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
}

export const AboutAuthorModal: React.FC<Props> = ({ isOpen, onClose, onOpenContact }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe pl-safe pr-safe animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">運営者情報</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Operator Details Card */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold">運営者</span>
              <span className="font-bold text-slate-100">Giovanni</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span className="text-slate-400 font-bold">サイトURL</span>
              <a
                href="http://giovgames.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-mono text-[11px] underline inline-flex items-center gap-1"
              >
                <Globe className="w-3 h-3" />
                <span>http://giovgames.com</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* Self Introduction & Site Purpose */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span>自己紹介・サイトの目的</span>
            </h4>
            <p>
              ご覧いただきありがとうございます。当サイトの管理人のGiovanniです。
            </p>
            <p>
              普段からブラウザで手軽に遊べるHTML5ゲームの開発を行っています。
            </p>
            <p>
              当サイト（giovgames.com）では、仕事の合間やちょっとした隙間時間に、登録不要で誰でもすぐに楽しめる自作のブラウザゲームを公開しています。
            </p>
            <p>
              「シンプルだけど何度も遊びたくなるゲーム」をモットーに、プレイヤーの皆様に楽しんでいただけるような作品をアップデートしていきます。バグ報告やご感想などがありましたら、お問い合わせフォームよりお気軽にご連絡ください。
            </p>
          </div>

          {onOpenContact && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenContact();
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span>お問い合わせフォームを開く</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
