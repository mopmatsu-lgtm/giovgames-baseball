import React from 'react';
import { Shield, X, ExternalLink, Mail } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: () => void;
}

export const PrivacyPolicyModal: React.FC<Props> = ({ isOpen, onClose, onOpenContact }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe pl-safe pr-safe animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">プライバシーポリシー</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            title="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
          <div>
            <h4 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <span>1. 広告の配信について</span>
            </h4>
            <p>
              当サイト（ベースボールリーグWeb）では、第三者配信の広告サービス「Googleアドセンス（Google AdSense）」を利用しています。
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <span>2. Cookie（クッキー）の使用について</span>
            </h4>
            <p>
              Googleなどの第三者広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示（パーソナライズ広告）するため、Cookie（クッキー）を使用することがあります。
            </p>
            <p className="mt-1 text-slate-400">
              Cookieにより、当サイトや他のサイトへのアクセス情報に基づいた広告配信が可能となりますが、氏名、住所、メールアドレス、電話番号など、個人を特定できる情報が含まれることは一切ありません。
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <span>3. Cookieの無効化（オプトアウト）について</span>
            </h4>
            <p>
              ユーザーは、お使いのブラウザの設定を変更することにより、Cookieの受け入れを拒否（無効化）することができます。ブラウザ設定の手順は、各ブラウザのヘルプページ等をご確認ください。
            </p>
            <p className="mt-1.5">
              また、Googleの
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-0.5 mx-1"
              >
                広告設定
                <ExternalLink className="w-3 h-3 inline" />
              </a>
              にアクセスすることで、パーソナライズ広告に使用されるCookieを無効化できます。GoogleによるCookieの取り扱いやポリシーの詳細については、Googleの
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-0.5 mx-1"
              >
                ポリシーと規約
                <ExternalLink className="w-3 h-3 inline" />
              </a>
              をご覧ください。
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <span>4. お問い合わせ窓口</span>
            </h4>
            <p>
              本プライバシーポリシーや当サイトに関するご質問・ご意見がございましたら、お問い合わせフォームよりお気軽にご連絡ください。
            </p>
            {onOpenContact && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenContact();
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>お問い合わせフォームを開く</span>
                </button>
              </div>
            )}
          </div>
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
