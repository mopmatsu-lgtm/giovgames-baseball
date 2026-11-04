import {
  Player,
  Position,
  Rarity,
  SkillId,
  SkillDefinition,
  EquipmentItem,
  ShopItem,
  PlayerStats,
  PlayerAvatarData
} from '../types/baseball';

export const RARITY_BUDGET: Record<Rarity, { budget: number; color: string; label: string }> = {
  'N': { budget: 16, color: 'text-slate-400 border-slate-600 bg-slate-800/40', label: 'N' },
  'R': { budget: 19, color: 'text-blue-400 border-blue-500/50 bg-blue-950/40', label: 'R' },
  'SR': { budget: 23, color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40', label: 'SR' },
  'SSR': { budget: 27, color: 'text-amber-400 border-amber-500/50 bg-amber-950/40', label: 'SSR' },
  'UR': { budget: 30, color: 'text-rose-400 border-rose-500/50 bg-rose-950/40', label: 'UR' },
  '伝説ユニーク': {
    budget: 33,
    color: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.5)] font-black',
    label: '伝説'
  },
};

// タイトル獲得者およびポストシーズン決勝制覇のみで獲得可能な限定スキル（スカウト・スキルガチャ排出除外）
export const TITLE_ONLY_SKILLS: SkillId[] = [
  '極首位打者', '極本塁打王', '三冠王', '完全試合',
  '首位打者⭐︎1', '首位打者⭐︎2', '首位打者⭐︎3', '首位打者⭐︎4', '首位打者⭐︎5', '首位打者⭐︎6',
  '打点王⭐︎1', '打点王⭐︎2', '打点王⭐︎3', '打点王⭐︎4', '打点王⭐︎5', '打点王⭐︎6',
  '本塁打王⭐︎1', '本塁打王⭐︎2', '本塁打王⭐︎3', '本塁打王⭐︎4', '本塁打王⭐︎5', '本塁打王⭐︎6',
  '盗塁王⭐︎1', '盗塁王⭐︎2', '盗塁王⭐︎3', '盗塁王⭐︎4', '盗塁王⭐︎5', '盗塁王⭐︎6',
  '奪三振王⭐︎1', '奪三振王⭐︎2', '奪三振王⭐︎3', '奪三振王⭐︎4', '奪三振王⭐︎5', '奪三振王⭐︎6',
  '最多勝⭐︎1', '最多勝⭐︎2', '最多勝⭐︎3', '最多勝⭐︎4', '最多勝⭐︎5', '最多勝⭐︎6',
  '最優秀防御率⭐︎1', '最優秀防御率⭐︎2', '最優秀防御率⭐︎3', '最優秀防御率⭐︎4', '最優秀防御率⭐︎5', '最優秀防御率⭐︎6',
  '最多セーブ⭐︎1', '最多セーブ⭐︎2', '最多セーブ⭐︎3', '最多セーブ⭐︎4', '最多セーブ⭐︎5', '最多セーブ⭐︎6',
  '三冠王⭐︎1', '三冠王⭐︎2', '三冠王⭐︎3', '三冠王⭐︎4', '三冠王⭐︎5', '三冠王⭐︎6',
  '沢村賞', '沢村賞⭐︎1', '沢村賞⭐︎2', '沢村賞⭐︎3', '沢村賞⭐︎4', '沢村賞⭐︎5', '沢村賞⭐︎6',
  'ハンク・アーロン賞', 'ハンク・アーロン賞⭐︎1', 'ハンク・アーロン賞⭐︎2', 'ハンク・アーロン賞⭐︎3', 'ハンク・アーロン賞⭐︎4', 'ハンク・アーロン賞⭐︎5', 'ハンク・アーロン賞⭐︎6',
  'サイ・ヤング賞', 'サイ・ヤング賞⭐︎1', 'サイ・ヤング賞⭐︎2', 'サイ・ヤング賞⭐︎3', 'サイ・ヤング賞⭐︎4', 'サイ・ヤング賞⭐︎5', 'サイ・ヤング賞⭐︎6'
];
export const GACHA_EXCLUDED_SKILLS: SkillId[] = TITLE_ONLY_SKILLS;

export const ALL_SKILLS: SkillDefinition[] = [
  // 打者
  { id: '三冠王', name: '三冠王', category: '打者', description: '【三冠王達成者限定】常時 ミート+20 / パワー+20（球界の歴史に刻まれる神話的打撃力）' },
  { id: '満塁神', name: '満塁神', category: '打者', description: '【満塁時】ミート+3 / パワー+4（満塁機で打率・長打率が劇的に上昇）' },
  { id: 'ヒーロー', name: 'ヒーロー', category: '打者', description: '【7回以降 同点・劣勢時】パワー+3（勝負どころで長打力大幅強化）' },
  { id: 'お立ち台', name: 'お立ち台', category: '打者', description: '【得点圏時】ミート+2（好機で勝負強さを発揮しタイムリー安打率上昇）' },
  { id: 'ポール弾', name: 'ポール弾', category: '打者', description: '【常時】パワー+2 / 長打率+15%（引っ張り方向への本塁打力強化）' },
  { id: 'テラス弾', name: 'テラス弾', category: '打者', description: '【常時】パワー+1 / 本塁打率+10%（フェンス越えスタンド直撃弾を量産）' },
  { id: '極首位打者', name: '極首位打者', category: '打者', description: '【タイトル限定】常時 ミート+3 / 安打率+15%（圧倒的なバットコントロール）' },
  { id: '極本塁打王', name: '極本塁打王', category: '打者', description: '【タイトル限定】常時 パワー+4 / 本塁打率+20%（驚異の長打破壊力）' },
  { id: '9者連続本塁打', name: '9者連続本塁打', category: '打者', description: '【得点直後・連打時】パワー+3 / ミート+1（勢いに乗り打線大爆発）' },
  { id: 'ツーランスクイズ', name: 'ツーランスクイズ', category: '打者', description: '【走者3塁時】ミート+3 / バント成功率特大上昇' },
  { id: '一点張り', name: '一点張り', category: '打者', description: '【追い込まれた時】パワー+2 / ミート+1（狙い球を強烈に叩き返す）' },
  { id: 'セルフジャッジ', name: 'セルフジャッジ', category: '打者', description: '【常時】選球眼+3 / 四球率+25%（ボール球を確実に見極める）' },
  { id: 'サインミス', name: 'サインミス', category: '打者', description: '【2ストライク時】パワー+3（予期せぬフルスイングで裏をかく）' },
  { id: '飛び出し', name: '飛び出し', category: '打者', description: '【常時】走力+3（積極果敢な走塁で進塁・盗塁成功率向上）' },
  { id: 'スラッガー', name: 'スラッガー', category: '打者', description: '【常時】パワー+3 / 弾道+1相当（豪快な長打力でスタンドへ放り込む）' },
  { id: 'チャンス', name: 'チャンス', category: '打者', description: '【得点圏時】ミート+2 / パワー+2（得点圏に走者がいる勝負所で能力覚醒）' },
  { id: '左キラー', name: '左キラー', category: '打者', description: '【対左投手時】ミート+3 / パワー+2（左腕の投球軌道を完璧に捉える）' },
  { id: 'チャンスメイク', name: 'チャンスメイク', category: '打者', description: '【走者なし時】ミート+2 / 出塁率+20%（鋭い安打や選球眼で好機を演出）' },
  { id: 'ムードメイカー', name: 'ムードメイカー', category: '打者', description: '【安打出塁時】後続打者全員のミート+1（チームの攻撃の口火を切る）' },
  { id: '技あり', name: '技あり', category: '打者', description: '【好投手・2ストライク時】ミート+3 / 三振率-30%（巧みなバット制御で安打量産）' },
  { id: '代打', name: '代打', category: '打者', description: '【代打起用時】ミート+3 / パワー+2（1打席の勝負所で絶大な勝負強さを発揮）' },
  { id: '内野安打', name: '内野安打', category: '打者', description: '【内野ゴロ時】走力+3 / セーフ判定率+35%（快足で一塁を駆け抜ける）' },
  { id: '盗塁', name: '盗塁', category: '打者', description: '【出塁時】走力+3 / 盗塁企図率+25% / 盗塁成功率+30%（相手バッテリーを翻弄）' },
  { id: 'スクイズ', name: 'スクイズ', category: '打者', description: '【走者3塁かつ2死未満時】ミート+3 / スクイズ成功率特大上昇（確実に1点をもぎ取る）' },

  // 投手
  { id: 'リリーバー', name: 'リリーバー', category: '投手', description: '【救援登板時】登板後2回 制球+2 / 変化+2（即座に本領発揮）' },
  { id: '火消し男', name: '火消し男', category: '投手', description: '【走者ありピンチ時】制球+2 / 変化+1（キレ味鋭い投球）' },
  { id: '超火消し男', name: '超火消し男', category: '投手', description: '【得点圏大ピンチ時】制球+3 / 変化+3 / 奪三振率+25%（絶体絶命で三振）' },
  { id: 'イニングイーター', name: 'イニングイーター', category: '投手', description: '【5回以降登板中】スタミナ+4（球数が増えても球威・制球維持）' },
  { id: '超完封', name: '超完封', category: '投手', description: '【7回以降 先発時】球速+2 / 制球+2（終盤になるほど球威増大）' },
  { id: 'ピンチで抑えたら吠える', name: 'ピンチで抑えたら吠える', category: '投手', description: '【ピンチ脱出後】次イニング味方打者全員のミート+1' },
  { id: '申告敬遠', name: '申告敬遠', category: '投手', description: '【強打者対峙時】次打者との対戦時 制球+3 / 併殺誘導率大幅上昇' },
  { id: '立ち上がり', name: '立ち上がり', category: '投手', description: '【1〜2回登板時】球速+2 / 制球+2（試合序盤の立ち上がりを完璧に抑え込む）' },
  { id: '回またぎ', name: '回またぎ', category: '投手', description: '【イニング跨ぎ救援時】制球+2 / 変化+1（複数回の登板でも安定感を維持）' },

  // 守備
  { id: 'ノーエラー', name: 'ノーエラー', category: '守備', description: '【守備時】守備+3 / 失策率95%カット（鉄壁の確実捕球）' },
  { id: '鉄壁', name: '鉄壁', category: '守備', description: '【守備時】守備+2 / 長打阻止率+20%（広大な守備範囲）' },
  { id: '外野適正', name: '外野適正', category: '守備', description: '【外野守備時】守備+2 / 走力+2（クッションボール処理抜群）' },
  { id: '極ホームランキャッチ', name: '極ホームランキャッチ', category: '守備', description: '【外野守備時】守備+4 / フェンス際本塁打阻止率+30%' },
  { id: '極爆肩', name: '極爆肩', category: '守備', description: '【守備時】送球・肩力+4 / 相手盗塁阻止率+40%（相手の進塁・盗塁を完全封殺）' },
  { id: '神の手', name: '神の手', category: '守備', description: '【クロスプレー時】走力+2 / 守備+2（アウト/セーフ判定優位）' },

  // 特殊
  { id: 'リクエスト', name: 'リクエスト', category: '特殊', description: '【判定時】きわどいアウト判定の覆り率+50%（有利な判定奪取）' },
  { id: '潮目', name: '潮目', category: '特殊', description: '【終盤勝負時】味方チーム全員の全能力+1（試合の流れを一変）' },

  // --- 追加打者スキル (22種) ---
  { id: '右キラー', name: '右キラー', category: '打者', description: '【対右投手時】ミート+2 / パワー+1（右投手の外角球を完璧にさばく）' },
  { id: '高速打球', name: '高速打球', category: '打者', description: '【常時】打球速度+20%（野手の間を抜く痛烈なライナー安打を量産）' },
  { id: '初球打ち', name: '初球打ち', category: '打者', description: '【初球時】ミート+3 / パワー+2（甘い入り球を逃さず一振りで仕留める）' },
  { id: '粘り打ち', name: '粘り打ち', category: '打者', description: '【2ストライク時】ミート+2 / 三振率-40%（巧みなファウルで粘り出塁）' },
  { id: '逆境○', name: '逆境○', category: '打者', description: '【3点以上劣勢時】ミート+3 / パワー+3（劣勢を跳ね返す反撃の狼煙）' },
  { id: 'サヨナラ男', name: 'サヨナラ男', category: '打者', description: '【9回以降 同点・劣勢時】パワー+4 / サヨナラ安打率激増' },
  { id: '広角打法', name: '広角打法', category: '打者', description: '【常時】ミート+2 / 流し方向への強い打球・長打率上昇' },
  { id: 'レーザー弾', name: 'レーザー弾', category: '打者', description: '【常時】パワー+2 / 弾丸ライナーでのスタンド直撃本塁打量産' },
  { id: 'プルヒッター', name: 'プルヒッター', category: '打者', description: '【引っ張り時】パワー+3（豪快な巻き込みスイングで強烈長打）' },
  { id: 'ライン際職人', name: 'ライン際職人', category: '打者', description: '【常時】ミート+2 / 1・3塁線を破る痛烈な二塁打発生率アップ' },
  { id: 'トップバッター', name: 'トップバッター', category: '打者', description: '【1回先頭打者時】ミート+3 / 出塁率+35%（試合の口火を切る）' },
  { id: 'クリーンアップ', name: 'クリーンアップ', category: '打者', description: '【3〜5番起用時】パワー+2 / 得点圏打率大幅向上' },
  { id: '下位打線の鬼', name: '下位打線の鬼', category: '打者', description: '【7〜9番起用時】ミート+2 / 出塁率+25%（油断した相手に痛打を浴びせる）' },
  { id: '選球眼', name: '選球眼', category: '打者', description: '【常時】選球眼+3 / 四球率+30%（きわどいボール球を確実に見送る）' },
  { id: '威圧感（打）', name: '威圧感（打）', category: '打者', description: '【打席時】相手投手の制球-2 / スタミナ消耗激増（圧倒的威圧感）' },
  { id: 'お祭り男', name: 'お祭り男', category: '打者', description: '【連打時】ミート+2 / パワー+2（勢いを加速させ打線大爆発）' },
  { id: 'バント職人', name: 'バント職人', category: '打者', description: '【犠打時】バント成功率+45%（絶妙な転がりで確実に走者を進塁）' },
  { id: 'カットマン', name: 'カットマン', category: '打者', description: '【2ストライク時】ファウル率+50%（相手投手の球数を削る粘り）' },
  { id: '電光石火', name: '電光石火', category: '打者', description: '【出塁時】走力+3 / 相手のクイックモーションを無効化し盗塁成功' },
  { id: 'ヘッスラ', name: 'ヘッスラ', category: '打者', description: '【内野ゴロ・クロスプレー時】ヘッドスライディングでセーフ率+30%' },
  { id: '韋駄天', name: '韋駄天', category: '打者', description: '【常時】走力+4 / 単打を二塁打にする驚異の快足' },
  { id: 'ランエンドヒット', name: 'ランエンドヒット', category: '打者', description: '【走者あり時】ミート+2 / 併殺を回避し確実に走者を進める' },

  // --- 追加投手スキル (18種) ---
  { id: '重い球', name: '重い球', category: '投手', description: '【常時】打者の芯を外して押し込み、被本塁打率を大幅に軽減' },
  { id: 'キレ○', name: 'キレ○', category: '投手', description: '【常時】変化球のキレ+2 / 空振り奪取率大幅向上' },
  { id: '奪三振王', name: '奪三振王', category: '投手', description: '【2ストライク時】球速+2 / 変化+2 / 決め球の奪三振率特大アップ' },
  { id: '低め〇', name: '低め〇', category: '投手', description: '【常時】制球+2 / 針の穴を通す低めへの制球でゴロを量産' },
  { id: '尻上がり', name: '尻上がり', category: '投手', description: '【先発時 5回以降】回が進むごとに球威・制球力向上' },
  { id: 'ポーカーフェイス', name: 'ポーカーフェイス', category: '投手', description: '【被安打時】動揺せず制球・変化球能力を完全維持' },
  { id: '剛速球', name: '剛速球', category: '投手', description: '【常時】球速+3（唸りを上げる剛速球でバットをへし折る）' },
  { id: '魔球', name: '魔球', category: '投手', description: '【常時】変化+3（打者の手元で鋭く曲がり落ちる魔球）' },
  { id: '闘志', name: '闘志', category: '投手', description: '【登板時】球威+2 / 打者の威圧感を無力化し気迫で抑え込む' },
  { id: 'クイック○', name: 'クイック○', category: '投手', description: '【走者背負い時】相手の盗塁企図率-40% / 盗塁刺殺率大幅向上' },
  { id: 'ギアチェンジ', name: 'ギアチェンジ', category: '投手', description: '【得点圏ピンチ時】球速+3 / 制球+2（ギアを一段上げてねじ伏せる）' },
  { id: 'ワンポイント', name: 'ワンポイント', category: '投手', description: '【救援登板後 1打席限定】制球+3 / 変化+3（必殺のピンポイントリリーフ）' },
  { id: '威圧感（投）', name: '威圧感（投）', category: '投手', description: '【登板時】相手打者全員のミート-2 / パワー-1（圧倒的なマウンド風格）' },
  { id: '奪三振マシン', name: '奪三振マシン', category: '投手', description: '【追い込んだ時】空振り三振率+35%（鋭いウイニングショット）' },
  { id: '打たせて取る', name: '打たせて取る', category: '投手', description: '【常時】制球+2 / 内野ゴロ・併殺打の誘導率大幅アップ' },
  { id: '牽制○', name: '牽制○', category: '投手', description: '【走者1塁時】鋭い牽制で相手走者のスタートを警戒・盗塁阻止率+25%' },
  { id: '絶対的守護神', name: '絶対的守護神', category: '投手', description: '【9回リード時 抑え登板】球速+2 / 制球+2 / セーブ成功率特大' },
  { id: 'マダックス', name: 'マダックス', category: '投手', description: '【完投・完封ペース時】球数激減 / テンポの良い投球で凡打の山' },

  // --- 追加守備スキル (6種) ---
  { id: '名手', name: '名手', category: '守備', description: '【守備時】守備+3 / 華麗なグラブさばきと送球でヒット性打球をアウトに' },
  { id: 'キャノン肩', name: 'キャノン肩', category: '守備', description: '【外野守備時】肩力+3 / 三塁・本塁へのタッチアップ進塁を完全阻止' },
  { id: '扇の要', name: '扇の要', category: '守備', description: '【捕手時】投手陣の全能力+1 / 盗塁阻止率+25%（チームを統率する名捕手）' },
  { id: 'ダイビングキャッチ', name: 'ダイビングキャッチ', category: '守備', description: '【守備時】飛び込み捕球成功率+40%（長打コースの当たりを好捕）' },
  { id: '併殺マスター', name: '併殺マスター', category: '守備', description: '【内野守備時】二遊間の素早い転送でダブルプレー完成率+35%' },
  { id: '壁役', name: '壁役', category: '守備', description: '【捕手時】後逸・捕逸・暴投の阻止率95%（ワンバウンドを完璧に止める）' },

  // --- 追加特殊・チームスキル (4種) ---
  { id: '激走', name: '激走', category: '特殊', description: '【走塁時】走力+2 / 浅い外野フライや内野ゴロでも果敢に次塁・本塁生還' },
  { id: '勝利の執念', name: '勝利の執念', category: '特殊', description: '【最終回劣勢時】チーム打者全員のミート+2（土壇場での猛追撃）' },
  { id: '球場の味方', name: '球場の味方', category: '特殊', description: '【ホーム球場試合時】味方チーム全員の全能力+1（大歓声を力に変える）' },
  { id: '名将の采配', name: '名将の采配', category: '特殊', description: '【代打・継投策時】起用された選手の能力+2（ズバリ的中する名采配）' },

  // ==========================================
  // ★★★ レアスキル（金特 50種） ★★★
  // ==========================================

  // --- 打者系レアスキル (22種) ---
  { id: 'アーチスト', name: 'アーチスト', category: '打者', isRare: true, description: '【★金特】放物線を描く本塁打の芸術家。パワー+4 / 弾道4固定 / 本塁打率極大アップ' },
  { id: '安打製造機', name: '安打製造機', category: '打者', isRare: true, description: '【★金特】異次元のバットコントロール。ミート+4 / 内外野の間を抜く安打を量産' },
  { id: '勝負師', name: '勝負師', category: '打者', isRare: true, description: '【★金特】得点圏で無類の強さを誇る鬼神。ミート+3 / パワー+3 / 得点圏適時打率激増' },
  { id: '不動の四番', name: '不動の四番', category: '打者', isRare: true, description: '【★金特】4番打者起用時、ミート+3 / パワー+3 / 重圧を跳ね返す圧倒的存在感' },
  { id: '乾坤一擲', name: '乾坤一擲', category: '打者', isRare: true, description: '【★金特】2死または終盤ビハインド時にフルスイング。長打・本塁打率極大アップ' },
  { id: '広角砲', name: '広角砲', category: '打者', isRare: true, description: '【★金特】左右広角へスタンドインさせる超打法。ミート+2 / パワー+3 / 二塁打・本塁打増' },
  { id: '切り込み隊長', name: '切り込み隊長', category: '打者', isRare: true, description: '【★金特】1番打者起用時、ミート+3 / 走力+3 / 出塁率と初回安打率が極大化' },
  { id: 'ロケットスタート', name: 'ロケットスタート', category: '打者', isRare: true, description: '【★金特】1〜3回序盤に打撃能力大覚醒。ミート+3 / パワー+2で電光石火の先制点' },
  { id: '伝説の代打', name: '伝説の代打', category: '打者', isRare: true, description: '【★金特】代打起用時、ミート+4 / パワー+4 / 代打逆転・適時打率が極大化' },
  { id: '驚異の切れ味', name: '驚異の切れ味', category: '打者', isRare: true, description: '【★金特】野手の正面を突く打球すら強烈に弾き飛ばす痛烈打球（安打率+3.5%）' },
  { id: '超ジャイロ打法', name: '超ジャイロ打法', category: '打者', isRare: true, description: '【★金特】猛烈なバックスピンで外野フェンスを越える長打・本塁打を量産' },
  { id: '高速スナイパー', name: '高速スナイパー', category: '打者', isRare: true, description: '【★金特】1・3塁ライン際を完璧に射抜く極限打撃。二塁打発生率特大アップ' },
  { id: '恐怖の下位打線', name: '恐怖の下位打線', category: '打者', isRare: true, description: '【★金特】7〜9番起用時にパワー+3 / ミート+2 / 上位打線に匹敵する破壊力' },
  { id: '神眼', name: '神眼', category: '打者', isRare: true, description: '【★金特】神の領域の選球眼。際どいボールを絶対に見送り四球率極大アップ' },
  { id: '覇王の威圧感', name: '覇王の威圧感', category: '打者', isRare: true, description: '【★金特】打席に立つだけで相手投手を圧倒。相手投手の球速-3 / 制球-3' },
  { id: 'ランナーズハイ', name: 'ランナーズハイ', category: '打者', isRare: true, description: '【★金特】塁上の走者が増えるほど集中力研ぎ澄まされ能力爆発（満塁時ミート+4/パワー+4）' },
  { id: '神速スプリンター', name: '神速スプリンター', category: '打者', isRare: true, description: '【★金特】走力+5。平凡な内野ゴロでも間一髪セーフにする驚異の神速' },
  { id: '疾風怒濤', name: '疾風怒濤', category: '打者', isRare: true, description: '【★金特】走者出塁時・連打時に打撃能力が究極覚醒。ミート+3 / パワー+3' },
  { id: 'ミラクル男', name: 'ミラクル男', category: '打者', isRare: true, description: '【★金特】終盤劣勢時に奇跡を呼び込む同点・逆転打率特大ブースト' },
  { id: '黄金の右足', name: '黄金の右足', category: '打者', isRare: true, description: '【★金特】完璧な踏み込みで右・左投手の左右苦手を完全克服しミート+3' },
  { id: '電光石火・改', name: '電光石火・改', category: '打者', isRare: true, description: '【★金特】走力+4。相手投手の牽制・クイックを無視して極めて高い確率で盗塁成功' },
  { id: 'サヨナラ劇場の主', name: 'サヨナラ劇場の主', category: '打者', isRare: true, description: '【★金特】9回以降同点・劣勢時、パワー+5 / ミート+3 / サヨナラ劇場の主役となる' },

  // --- 投手系レアスキル (18種) ---
  { id: '怪物', name: '怪物', category: '投手', isRare: true, description: '【★金特】唸りを上げる剛球と気迫で打者を粉砕。球速+4 / 被本塁打率大幅カット' },
  { id: 'ドクターK', name: 'ドクターK', category: '投手', isRare: true, description: '【★金特】ウイニングショットでバットに空を切らせる奪三振王。三振率極大アップ' },
  { id: '精密機械', name: '精密機械', category: '投手', isRare: true, description: '【★金特】針の穴を通すミリ単位の制球力。制球+4 / 無駄な四球を完全に排除' },
  { id: '昇り龍', name: '昇り龍', category: '投手', isRare: true, description: '【★金特】回が進むごとに球威・球速が極限突破。6回以降球速+3 / 制球+3 / 変化+2' },
  { id: '怪童', name: '怪童', category: '投手', isRare: true, description: '【★金特】初回から全開で相手打線を封殺。1〜3回球速+3 / 制球+3 / 被安打激減' },
  { id: '強心臓', name: '強心臓', category: '投手', isRare: true, description: '【★金特】満塁やサヨナラの危機でも微動だにせず完封。得点圏で制球+4 / 変化+3' },
  { id: '幻影魔球', name: '幻影魔球', category: '投手', isRare: true, description: '【★金特】打者の手元で消える魔球。変化+4 / 空振り三振率特大アップ' },
  { id: '金剛不壊', name: '金剛不壊', category: '投手', isRare: true, description: '【★金特】9回を投げ抜く無尽蔵のスタミナと安定感。終盤でも能力劣化ゼロ' },
  { id: '不屈の闘志', name: '不屈の闘志', category: '投手', isRare: true, description: '【★金特】連打やピンチでも決して崩れない鋼のメンタル。球速+2 / 制球+2' },
  { id: '守護神の領域', name: '守護神の領域', category: '投手', isRare: true, description: '【★金特】9回リード登板時、球速+3 / 制球+3 / 変化+3で完膚なきまでに抑え込む' },
  { id: 'ゴロキラー', name: 'ゴロキラー', category: '投手', isRare: true, description: '【★金特】鋭く沈む変化球で内野ゴロの山を築き、ダブルプレー誘導率極大化' },
  { id: '紫電一閃', name: '紫電一閃', category: '投手', isRare: true, description: '【★金特】2ストライクに追い込んだ瞬間に投じる究極のウイニングショット' },
  { id: '鉄腕リリーフ', name: '鉄腕リリーフ', category: '投手', isRare: true, description: '【★金特】どんな修羅場でも確実に火消し。救援登板時に制球+3 / 変化+3' },
  { id: '死角なし', name: '死角なし', category: '投手', isRare: true, description: '【★金特】左右打者を問わず完璧に抑え込み、相手のキラースキルを無力化' },
  { id: '覇気', name: '覇気', category: '投手', isRare: true, description: '【★金特】マウンドの圧倒的威圧感。相手打者全員のミート-3 / パワー-2' },
  { id: 'マダックス・極', name: 'マダックス・極', category: '投手', isRare: true, description: '【★金特】テンポ良く打たせて取る省エネ完投術。制球+4 / 与四球率極少化' },
  { id: '絶対零度', name: '絶対零度', category: '投手', isRare: true, description: '【★金特】相手クリーンアップを完全に凍りつかせる勝負球（中軸打者の長打率激減）' },
  { id: '火消しの帝王', name: '火消しの帝王', category: '投手', isRare: true, description: '【★金特】満塁ピンチの絶体絶命で登板し、無失点で切り抜ける驚異の生還阻止力' },
  { id: '完全試合', name: '完全試合', category: '投手', isRare: true, description: '【★最高峰金特】ポストシーズン決勝制覇の証。一人の走者も許さぬ絶対的支配力。球速+4 / 制球+5 / 変化+4 / 被安打・被本塁打率極小化' },

  // --- 守備系レアスキル (6種) ---
  { id: '魔術師', name: '魔術師', category: '守備', isRare: true, description: '【★金特】名手の域を超えた華麗な守備。失策ゼロ＆難打球捕球率極大アップ' },
  { id: 'レーザービーム', name: 'レーザービーム', category: '守備', isRare: true, description: '【★金特】外野からの超低空送球。本塁・三塁へのタッチアップ突入を完全阻止' },
  { id: '司令塔', name: '司令塔', category: '守備', isRare: true, description: '【★金特】捕手起用時、全投手能力+2 / 盗塁阻止率+35%の偉大な統率力' },
  { id: '鉄壁の要塞', name: '鉄壁の要塞', category: '守備', isRare: true, description: '【★金特】内野陣の電光石火の連係。二遊間ゲッツー完成率+45%' },
  { id: '超ファインプレー', name: '超ファインプレー', category: '守備', isRare: true, description: '【★金特】外野の頭上やフェンス際の打球をダイビングで強奪（安打強奪率25%）' },
  { id: '鉄人キャッチャー', name: '鉄人キャッチャー', category: '守備', isRare: true, description: '【★金特】捕手起用時、ワンバウンド完全ブロック＆本塁クロスプレー死守' },

  // --- 特殊・チーム系レアスキル (4種) ---
  { id: '神風', name: '神風', category: '特殊', isRare: true, description: '【★金特】7回以降ビハインド時、チーム全員のミート+3 / パワー+2の猛烈大逆転ブースト' },
  { id: '勝利の方程式', name: '勝利の方程式', category: '特殊', isRare: true, description: '【★金特】7回以降リード時、登板投手の球速+3 / 制球+3 / 変化+2で逃げ切り確定' },
  { id: '常勝軍団の誇り', name: '常勝軍団の誇り', category: '特殊', isRare: true, description: '【★金特】チーム全体の士気を極限まで高め、チーム全員の全能力+1' },
  { id: '奇跡の采配', name: '奇跡の采配', category: '特殊', isRare: true, description: '【★金特】終盤の代打・継投・スクイズ・エンドラン成功率が飛躍的向上' },

  // ==========================================
  // ★★★ 追加通常スキル (50種) ★★★
  // ==========================================

  // --- 打者系通常スキル (24種) ---
  { id: '安打警戒破り', name: '安打警戒破り', category: '打者', description: '【常時】相手の守備シフトや警戒網を破る鋭い打球。ミート+2' },
  { id: '流し打ち', name: '流し打ち', category: '打者', description: '【常時】外角球を逆方向へ巧打。安打率・進塁率向上' },
  { id: '内野警戒突破', name: '内野警戒突破', category: '打者', description: '【得点圏・前進守備時】前進守備の間を鋭く抜く打球を放ち適時打率アップ' },
  { id: 'インコースヒッター', name: 'インコースヒッター', category: '打者', description: '【常時】内角球を巧みに肘を畳んで引っ張る。内角球に対する長打力向上' },
  { id: 'アウトコースヒッター', name: 'アウトコースヒッター', category: '打者', description: '【常時】外角低めの球にしっかり踏み込んで逆方向へ長打を放つ' },
  { id: '高め打ち', name: '高め打ち', category: '打者', description: '【常時】高めの浮いた球を逃さず痛打する。長打・本塁打率向上' },
  { id: 'ローボールヒッター', name: 'ローボールヒッター', category: '打者', description: '【常時】低めの厳しい球をすくい上げて長打にする技術' },
  { id: 'フルカウント○', name: 'フルカウント○', category: '打者', description: '【カウント3-2時】ミート+2 / パワー+2。フルカウントで脅威の集中力' },
  { id: 'ファーストストライク', name: 'ファーストストライク', category: '打者', description: '【初球時】初球から積極的に強振し長打を狙う。初球安打率向上' },
  { id: '追い込まれ強打', name: '追い込まれ強打', category: '打者', description: '【2ストライク時】追い込まれてもコンパクトに芯で捉える。ミート+2' },
  { id: '連打の導火線', name: '連打の導火線', category: '打者', description: '【走者なし時】イニング先頭打者として安打で出塁し打線に火をつける' },
  { id: '足攻', name: '足攻', category: '打者', description: '【常時】走力+2 / プレッシャーをかけて相手守備の送球ミスを誘う' },
  { id: 'セーフティバント', name: 'セーフティバント', category: '打者', description: '【走者なし時】意表を突くセーフティバント成功率大幅アップ' },
  { id: '犠牲フライ職人', name: '犠牲フライ職人', category: '打者', description: '【3塁走者あり時】確実に外野フライを打ち上げ走者を生還させる' },
  { id: '進塁打名人', name: '進塁打名人', category: '打者', description: '【2塁走者あり時】右方向へ打球を転がし走者を3塁へ確実に進める' },
  { id: '一矢報いる', name: '一矢報いる', category: '打者', description: '【3点以上ビハインド時】打撃集中力アップ。ミート+2 / パワー+1' },
  { id: '先制攻撃', name: '先制攻撃', category: '打者', description: '【1〜2回時】序盤の打席でミート+2。先制点を奪う鋭い打撃' },
  { id: '満塁男', name: '満塁男', category: '打者', description: '【満塁時】ミート+3 / パワー+3。満塁の絶好機で無類の強さを誇る' },
  { id: '打撃開眼', name: '打撃開眼', category: '打者', description: '【常時】ミート+2 / パワー+1。打撃フォームが完成し打球の伸びが向上' },
  { id: '快足スプリンター', name: '快足スプリンター', category: '打者', description: '【常時】走力+3。俊足を活かして長打や内野安打をもぎ取る' },
  { id: 'ベース一周', name: 'ベース一周', category: '打者', description: '【出塁時】卓越したベースランニングで単打から一気に三塁へ進塁する' },
  { id: '盗塁警戒破り', name: '盗塁警戒破り', category: '打者', description: '【走者時】相手バッテリーの警戒や牽制をかいくぐり高い盗塁成功率' },
  { id: 'タフネスバッター', name: 'タフネスバッター', category: '打者', description: '【常時】ファウルで粘り投手に球数を投げさせ甘い球を仕留める' },
  { id: 'クラッチヒッター', name: 'クラッチヒッター', category: '打者', description: '【得点圏時】勝負強さを発揮しミート+2 / タイムリー安打率向上' },

  // --- 投手系通常スキル (18種) ---
  { id: '初球ストライク', name: '初球ストライク', category: '投手', description: '【初球時】初球からストライクゾーンへ強気に投げ込みカウント有利を作る' },
  { id: 'インローの鬼', name: 'インローの鬼', category: '投手', description: '【常時】内角低めへズバズバと投げ込む制球力。制球+2' },
  { id: 'バックドア', name: 'バックドア', category: '投手', description: '【見逃し奪取時】ボールからゾーンへ曲がり込む変化球で見逃し三振を奪う' },
  { id: 'フロントドア', name: 'フロントドア', category: '投手', description: '【見逃し奪取時】打者の懐からゾーンへ食い込む鋭い変化球で打者を釘付けにする' },
  { id: '緩急○', name: '緩急○', category: '投手', description: '【常時】緩い変化球と直球のスピード差で打者のタイミングを狂わせる' },
  { id: 'ナックル軌道', name: 'ナックル軌道', category: '投手', description: '【常時】不規則な変化で芯を外しバットを空振り・凡打に仕留める' },
  { id: 'フライボールピッチャー', name: 'フライボールピッチャー', category: '投手', description: '【常時】伸びのある直球でポップフライや外野フライに打ち取る' },
  { id: '球持ち○', name: '球持ち○', category: '投手', description: '【常時】リリースポイントを限界まで打者寄りにし球速以上の体感速度を与える' },
  { id: 'クロスファイアー', name: 'クロスファイアー', category: '投手', description: '【対角線投球時】対角線への厳しい角度の直球でバットをへし折る' },
  { id: 'ブレーキ○', name: 'ブレーキ○', category: '投手', description: '【変化球時】鋭いタテの変化球の落差とブレーキで空振りを量産' },
  { id: '逃げ切り体勢', name: '逃げ切り体勢', category: '投手', description: '【7回以降リード時】制球+2 / 相手に反撃の隙を与えない安定した投球' },
  { id: 'カウント稼ぎ', name: 'カウント稼ぎ', category: '投手', description: '【常時】制球+2 / カウントを悪くせず常に有利な投球を展開' },
  { id: '四球拒否', name: '四球拒否', category: '投手', description: '【3ボール時】無駄な四球を嫌い強気にゾーンへ投げ込んで打たせて取る' },
  { id: '雨天巧者', name: '雨天巧者', category: '投手', description: '【常時】悪条件や足場の悪いマウンドでも制球を乱さず実力を発揮' },
  { id: 'ロングリリーフ', name: 'ロングリリーフ', category: '投手', description: '【回またぎ時】3イニング以上の救援登板でも球威とスタミナが落ちない' },
  { id: 'セットアッパー○', name: 'セットアッパー○', category: '投手', description: '【8回登板時】8回を完璧に封じて守護神へバトンを繋ぐ。球速+2 / 制球+2' },
  { id: 'ピンチ脱出', name: 'ピンチ脱出', category: '投手', description: '【得点圏時】ギアを上げて制球+2 / 変化+2。失点を最小限に食い止める' },
  { id: 'マウンドの主', name: 'マウンドの主', category: '投手', description: '【先発完投時】堂々たる風格でゲームを支配し終盤まで球威を保つ' },

  // --- 守備・特殊系通常スキル (8種) ---
  { id: 'バックアップ', name: 'バックアップ', category: '守備', description: '【守備時】的確なカバーリングとバックアップで相手の余計な進塁を許さない' },
  { id: '送球精度', name: '送球精度', category: '守備', description: '【送球時】ノーバウンド・ストライク送球で走者を確実に刺す' },
  { id: '中継プレー○', name: '中継プレー○', category: '守備', description: '【外野中継時】カットマンへの素早い送球と正確な中継で本塁突入を阻止' },
  { id: '本塁死守', name: '本塁死守', category: '守備', description: '【捕手時】本塁クロスプレーで走者の突入を体を張ってブロック' },
  { id: 'フェンス恐怖心ゼロ', name: 'フェンス恐怖心ゼロ', category: '守備', description: '【外野守備時】フェンス激突を恐れぬ果敢な捕球で大飛球をアウトにする' },
  { id: 'ベースコーチの眼', name: 'ベースコーチの眼', category: '特殊', description: '【走塁時】三塁コーチャーの的確な指示で無謀な暴走を防ぎ得点力アップ' },
  { id: 'ベンチの活気', name: 'ベンチの活気', category: '特殊', description: '【チーム常時】ベンチからの熱い声援で出場選手の集中力を向上させる' },
  { id: '観察眼', name: '観察眼', category: '特殊', description: '【常時】相手投手の癖や配球パターンを見抜き甘い球を逃さない' },

  // ==========================================
  // ★★★ 追加レアスキル（金特 30種） ★★★
  // ==========================================

  // --- 打者系レアスキル (14種) ---
  { id: '神撃の主砲', name: '神撃の主砲', category: '打者', isRare: true, description: '【★金特】神の如きスイングスピード。パワー+5 / ミート+3 / 飛距離極大の本塁打' },
  { id: '超音速スライサー', name: '超音速スライサー', category: '打者', isRare: true, description: '【★金特】音速のバットコントロールで野手の間を裂く。ミート+4 / 二塁打率特大' },
  { id: '天下一品', name: '天下一品', category: '打者', isRare: true, description: '【★金特】天下無双の打撃力。ミート+4 / パワー+4 / 打率と長打率を極限まで引き上げる' },
  { id: 'フルスイングの極致', name: 'フルスイングの極致', category: '打者', isRare: true, description: '【★金特】一切の迷いなき超フルスイング。パワー+6 / 当たれば確実に柵越え' },
  { id: '電撃バント', name: '電撃バント', category: '打者', isRare: true, description: '【★金特】電光石火のバント技術。セーフティバント成功率90% / 相手内野陣を幻惑' },
  { id: 'サヨナラキング', name: 'サヨナラキング', category: '打者', isRare: true, description: '【★金特】サヨナラの好機で打席に立つとミート+5 / パワー+5 / 試合を自ら終わらせる劇打' },
  { id: '神速の韋駄天', name: '神速の韋駄天', category: '打者', isRare: true, description: '【★金特】走力+6。ダイヤモンドを駆け抜ける閃光。盗塁成功率極大＆三塁打量産' },
  { id: '鉄人スラッガー', name: '鉄人スラッガー', category: '打者', isRare: true, description: '【★金特】疲労を知らぬ無敵の肉体。連戦でも全ステータス最大維持＆長打連発' },
  { id: '連打の連鎖反応', name: '連打の連鎖反応', category: '打者', isRare: true, description: '【★金特】味方の安打に呼応して能力爆発。ミート+4 / チームのビッグイニングを牽引' },
  { id: '選球眼の極み', name: '選球眼の極み', category: '打者', isRare: true, description: '【★金特】ボール球には一切手を出さず甘い球のみを完璧に捉える。出塁率極大' },
  { id: 'ダイヤモンドの支配者', name: 'ダイヤモンドの支配者', category: '打者', isRare: true, description: '【★金特】走力+5 / 出塁時に相手投手の制球を大幅に乱し盗塁＆生還を自在に操る' },
  { id: '逆境の咆哮', name: '逆境の咆哮', category: '打者', isRare: true, description: '【★金特】5点差以上の大劣勢時にチームを鼓舞。ミート+5 / パワー+4で猛反撃開始' },
  { id: '不倒のクリーンアップ', name: '不倒のクリーンアップ', category: '打者', isRare: true, description: '【★金特】3〜5番起用時、ミート+3 / パワー+4 / 相手投手の決め球を粉砕' },
  { id: '代打の神髄', name: '代打の神髄', category: '打者', isRare: true, description: '【★金特】一振りに全てを賭ける代打の神。代打起用時ミート+5 / パワー+5 / 適時打率極大' },

  // --- 投手系レアスキル (11種) ---
  { id: '神速ストレート', name: '神速ストレート', category: '投手', isRare: true, description: '【★金特】160km/h超の異次元の剛速球。球速+5 / バットをへし折り空振りを量産' },
  { id: '魔神のチェンジアップ', name: '魔神のチェンジアップ', category: '投手', isRare: true, description: '【★金特】直球と同じ腕の振りから急減速して消えるチェンジアップ。変化+5' },
  { id: 'パーフェクトリリーフ', name: 'パーフェクトリリーフ', category: '投手', isRare: true, description: '【★金特】救援登板時、被安打率・与四球率を極限までゼロに近づける完璧な火消し' },
  { id: 'イニングイーター・極', name: 'イニングイーター・極', category: '投手', isRare: true, description: '【★金特】無尽蔵のスタミナで完投・無四球完封を連発。試合終盤でも球威維持' },
  { id: '絶対零度スライダー', name: '絶対零度スライダー', category: '投手', isRare: true, description: '【★金特】打者の視界から消え去る高速スライダー。変化+5 / 空振り三振率極大' },
  { id: 'ドクターフォーク', name: 'ドクターフォーク', category: '投手', isRare: true, description: '【★金特】落差1メートルの魔球フォーク。得点圏で空振りを奪う必殺技' },
  { id: '鉄壁のマウンド', name: '鉄壁のマウンド', category: '投手', isRare: true, description: '【★金特】マウンドに仁王立ちする大エース。球速+3 / 制球+4 / 変化+4' },
  { id: 'クローザーの誇り', name: 'クローザーの誇り', category: '投手', isRare: true, description: '【★金特】9回に登板した瞬間に相手打者の戦意を喪失させる。球速+4 / 制球+4' },
  { id: '百戦錬磨のエース', name: '百戦錬磨のエース', category: '投手', isRare: true, description: '【★金特】大舞台のプレッシャーを力に変える。ピンチ時全能力+3' },
  { id: '無双の制球', name: '無双の制球', category: '投手', isRare: true, description: '【★金特】針の穴に糸を通す極限コントロール。制球+6 / 与四球率ほぼゼロ' },
  { id: '剛腕シャットアウト', name: '剛腕シャットアウト', category: '投手', isRare: true, description: '【★金特】力でねじ伏せる圧倒的ピッチング。被安打率激減＆長打完全封殺' },

  // --- 守備・特殊系レアスキル (5種) ---
  { id: 'ゴールデングラブの極致', name: 'ゴールデングラブの極致', category: '守備', isRare: true, description: '【★金特】守備力+6。いかなる強烈なライナーやゴロも神業グラブさばきでアウトにする' },
  { id: '難攻不落の要塞', name: '難攻不落の要塞', category: '守備', isRare: true, description: '【★金特】内野陣の連携が神の領域へ。内野安打を許さず併殺打完成率+60%' },
  { id: 'キャノンレーザー', name: 'キャノンレーザー', category: '守備', isRare: true, description: '【★金特】肩力+6。外野フェンス際から本塁へ矢のような送球で走者をタッチアウト' },
  { id: '勝利への号令', name: '勝利への号令', category: '特殊', isRare: true, description: '【★金特】キャプテンシーの極致。チーム全体の士気を極限まで引き上げ全員の全能力+2' },
  { id: '奇跡のビッグイニング', name: '奇跡のビッグイニング', category: '特殊', isRare: true, description: '【★金特】一度火がつくと止まらない怒涛の連打。チーム全体の攻撃力大暴発' },

  // ==========================================
  // ★★★ リーグタイトル獲得栄誉スキル (⭐︎1〜⭐︎6) ★★★
  // ==========================================

  // --- 首位打者 (⭐︎1〜⭐︎6) ---
  { id: '首位打者⭐︎1', name: '首位打者⭐︎1', category: '打者', isRare: true, description: '【★1タイトル栄誉】常時 ミート+2 / 安打率+10%（卓越したバットコントロール）' },
  { id: '首位打者⭐︎2', name: '首位打者⭐︎2', category: '打者', isRare: true, description: '【★2タイトル栄誉】常時 ミート+3 / 安打率+15%（巧みな広角安打製造）' },
  { id: '首位打者⭐︎3', name: '首位打者⭐︎3', category: '打者', isRare: true, description: '【★3タイトル栄誉】常時 ミート+4 / 安打率+20%（野手の間を自在に射抜く）' },
  { id: '首位打者⭐︎4', name: '首位打者⭐︎4', category: '打者', isRare: true, description: '【★4タイトル栄誉】常時 ミート+5 / 安打率+25% / 内野安打率向上' },
  { id: '首位打者⭐︎5', name: '首位打者⭐︎5', category: '打者', isRare: true, description: '【★5タイトル栄誉】常時 ミート+6 / 安打率+30% / 三振率極小化' },
  { id: '首位打者⭐︎6', name: '首位打者⭐︎6', category: '打者', isRare: true, description: '【★6神域タイトル栄誉】常時 ミート+8 / 安打率+40%（神の領域の打撃技術）' },

  // --- 打点王 (⭐︎1〜⭐︎6) ---
  { id: '打点王⭐︎1', name: '打点王⭐︎1', category: '打者', isRare: true, description: '【★1タイトル栄誉】得点圏時 ミート+2 / パワー+2（勝負強さの証）' },
  { id: '打点王⭐︎2', name: '打点王⭐︎2', category: '打者', isRare: true, description: '【★2タイトル栄誉】得点圏時 ミート+3 / パワー+3 / タイムリー率向上' },
  { id: '打点王⭐︎3', name: '打点王⭐︎3', category: '打者', isRare: true, description: '【★3タイトル栄誉】得点圏時 ミート+4 / パワー+4（走者を確実に本塁へ還す勝負打）' },
  { id: '打点王⭐︎4', name: '打点王⭐︎4', category: '打者', isRare: true, description: '【★4タイトル栄誉】得点圏時 ミート+5 / パワー+5 / 長打・適時打率大上昇' },
  { id: '打点王⭐︎5', name: '打点王⭐︎5', category: '打者', isRare: true, description: '【★5タイトル栄誉】得点圏時 ミート+6 / パワー+6（好機で圧倒的威圧感を放つ主砲）' },
  { id: '打点王⭐︎6', name: '打点王⭐︎6', category: '打者', isRare: true, description: '【★6神域タイトル栄誉】得点圏時 ミート+8 / パワー+8 / 走者一掃の長打力' },

  // --- 本塁打王 (⭐︎1〜⭐︎6) ---
  { id: '本塁打王⭐︎1', name: '本塁打王⭐︎1', category: '打者', isRare: true, description: '【★1タイトル栄誉】常時 パワー+3 / 本塁打率+15%（豪快な放物線）' },
  { id: '本塁打王⭐︎2', name: '本塁打王⭐︎2', category: '打者', isRare: true, description: '【★2タイトル栄誉】常時 パワー+4 / 本塁打率+20%（スタンド上段へ突き刺す）' },
  { id: '本塁打王⭐︎3', name: '本塁打王⭐︎3', category: '打者', isRare: true, description: '【★3タイトル栄誉】常時 パワー+5 / 本塁打率+25%（相手投手を震え上がらせる長打力）' },
  { id: '本塁打王⭐︎4', name: '本塁打王⭐︎4', category: '打者', isRare: true, description: '【★4タイトル栄誉】常時 パワー+6 / 本塁打率+30% / 弾丸ライナー本塁打' },
  { id: '本塁打王⭐︎5', name: '本塁打王⭐︎5', category: '打者', isRare: true, description: '【★5タイトル栄誉】常時 パワー+7 / 本塁打率+35%（異次元の特大アーチ）' },
  { id: '本塁打王⭐︎6', name: '本塁打王⭐︎6', category: '打者', isRare: true, description: '【★6神域タイトル栄誉】常時 パワー+9 / 本塁打率+45%（場外へ消え去る破壊神）' },

  // --- 盗塁王 (⭐︎1〜⭐︎6) ---
  { id: '盗塁王⭐︎1', name: '盗塁王⭐︎1', category: '打者', isRare: true, description: '【★1タイトル栄誉】出塁時 走力+2 / 盗塁成功率+20%（電光石火のスタート）' },
  { id: '盗塁王⭐︎2', name: '盗塁王⭐︎2', category: '打者', isRare: true, description: '【★2タイトル栄誉】出塁時 走力+3 / 盗塁成功率+25% / 進塁率向上' },
  { id: '盗塁王⭐︎3', name: '盗塁王⭐︎3', category: '打者', isRare: true, description: '【★3タイトル栄誉】出塁時 走力+4 / 盗塁成功率+30%（バッテリーの警戒を切り裂く）' },
  { id: '盗塁王⭐︎4', name: '盗塁王⭐︎4', category: '打者', isRare: true, description: '【★4タイトル栄誉】出塁時 走力+5 / 盗塁成功率+35% / 三盗企図可能' },
  { id: '盗塁王⭐︎5', name: '盗塁王⭐︎5', category: '打者', isRare: true, description: '【★5タイトル栄誉】出塁時 走力+6 / 盗塁成功率+40%（塁上のスピードスター）' },
  { id: '盗塁王⭐︎6', name: '盗塁王⭐︎6', category: '打者', isRare: true, description: '【★6神域タイトル栄誉】出塁時 走力+8 / 盗塁成功率+50%（神速のダイヤモンド支配者）' },

  // --- 奪三振王 (⭐︎1〜⭐︎6) ---
  { id: '奪三振王⭐︎1', name: '奪三振王⭐︎1', category: '投手', isRare: true, description: '【★1タイトル栄誉】常時 球速+2 / 変化+2 / 奪三振率向上' },
  { id: '奪三振王⭐︎2', name: '奪三振王⭐︎2', category: '投手', isRare: true, description: '【★2タイトル栄誉】常時 球速+3 / 変化+3 / 空振り奪取率大上昇' },
  { id: '奪三振王⭐︎3', name: '奪三振王⭐︎3', category: '投手', isRare: true, description: '【★3タイトル栄誉】追い込み時 球速+4 / 変化+4（ドクターKの切れ味鋭い決め球）' },
  { id: '奪三振王⭐︎4', name: '奪三振王⭐︎4', category: '投手', isRare: true, description: '【★4タイトル栄誉】常時 球速+5 / 変化+5 / 相手打者を釘付けにする三振ショー' },
  { id: '奪三振王⭐︎5', name: '奪三振王⭐︎5', category: '投手', isRare: true, description: '【★5タイトル栄誉】常時 球速+6 / 変化+6（バットが空を切る魔球の領域）' },
  { id: '奪三振王⭐︎6', name: '奪三振王⭐︎6', category: '投手', isRare: true, description: '【★6神域タイトル栄誉】常時 球速+8 / 変化+8 / 毎イニング三振を奪う奪三振魔王' },

  // --- 最多勝 (⭐︎1〜⭐︎6) ---
  { id: '最多勝⭐︎1', name: '最多勝⭐︎1', category: '投手', isRare: true, description: '【★1タイトル栄誉】常時 球速+2 / 制球+2（白星を引き寄せるエースの風格）' },
  { id: '最多勝⭐︎2', name: '最多勝⭐︎2', category: '投手', isRare: true, description: '【★2タイトル栄誉】常時 球速+3 / 制球+3 / 勝負所での粘り腰' },
  { id: '最多勝⭐︎3', name: '最多勝⭐︎3', category: '投手', isRare: true, description: '【★3タイトル栄誉】常時 球速+4 / 制球+4 / チームに勝利をもたらす安定感' },
  { id: '最多勝⭐︎4', name: '最多勝⭐︎4', category: '投手', isRare: true, description: '【★4タイトル栄誉】常時 球速+5 / 制球+5 / ピンチでも崩れぬ大黒柱' },
  { id: '最多勝⭐︎5', name: '最多勝⭐︎5', category: '投手', isRare: true, description: '【★5タイトル栄誉】常時 球速+6 / 制球+6 / 圧倒的勝率を誇る大エース' },
  { id: '最多勝⭐︎6', name: '最多勝⭐︎6', category: '投手', isRare: true, description: '【★6神域タイトル栄誉】常時 球速+8 / 制球+8 / 登板すれば勝利確定の不敗神話' },

  // --- 最優秀防御率 (⭐︎1〜⭐︎6) ---
  { id: '最優秀防御率⭐︎1', name: '最優秀防御率⭐︎1', category: '投手', isRare: true, description: '【★1タイトル栄誉】常時 制球+2 / 変化+2 / 被安打・被長打率減少' },
  { id: '最優秀防御率⭐︎2', name: '最優秀防御率⭐︎2', category: '投手', isRare: true, description: '【★2タイトル栄誉】常時 制球+3 / 変化+3 / 走者を背負っても無失点' },
  { id: '最優秀防御率⭐︎3', name: '最優秀防御率⭐︎3', category: '投手', isRare: true, description: '【★3タイトル栄誉】常時 制球+4 / 変化+4（針の穴を通す制球で相手を無力化）' },
  { id: '最優秀防御率⭐︎4', name: '最優秀防御率⭐︎4', category: '投手', isRare: true, description: '【★4タイトル栄誉】常時 制球+5 / 変化+5 / 被本塁打・長打完全封殺' },
  { id: '最優秀防御率⭐︎5', name: '最優秀防御率⭐︎5', category: '投手', isRare: true, description: '【★5タイトル栄誉】常時 制球+6 / 変化+6（0点台の絶対的要塞ピッチング）' },
  { id: '最優秀防御率⭐︎6', name: '最優秀防御率⭐︎6', category: '投手', isRare: true, description: '【★6神域タイトル栄誉】常時 制球+8 / 変化+8（1点も許さぬ絶対零度の絶対防壁）' },

  // --- 最多セーブ (⭐︎1〜⭐︎6) ---
  { id: '最多セーブ⭐︎1', name: '最多セーブ⭐︎1', category: '投手', isRare: true, description: '【★1タイトル栄誉】9回以降リード時 球速+2 / 制球+2（最終回の門番）' },
  { id: '最多セーブ⭐︎2', name: '最多セーブ⭐︎2', category: '投手', isRare: true, description: '【★2タイトル栄誉】9回以降リード時 球速+3 / 制球+3（相手の反撃の芽を断つ）' },
  { id: '最多セーブ⭐︎3', name: '最多セーブ⭐︎3', category: '投手', isRare: true, description: '【★3タイトル栄誉】9回以降リード時 球速+4 / 制球+4 / 変化+3（絶対的クローザー）' },
  { id: '最多セーブ⭐︎4', name: '最多セーブ⭐︎4', category: '投手', isRare: true, description: '【★4タイトル栄誉】9回以降リード時 球速+5 / 制球+5 / 変化+4（完璧な三者凡退セーブ）' },
  { id: '最多セーブ⭐︎5', name: '最多セーブ⭐︎5', category: '投手', isRare: true, description: '【★5タイトル栄誉】9回以降リード時 球速+6 / 制球+6 / 変化+5（ゲームセットを告げる神）' },
  { id: '最多セーブ⭐︎6', name: '最多セーブ⭐︎6', category: '投手', isRare: true, description: '【★6神域タイトル栄誉】9回以降リード時 球速+8 / 制球+8 / 変化+8（劇場無縁・難攻不落の絶対守護神）' },

  // --- 三冠王 (⭐︎1〜⭐︎6) ---
  { id: '三冠王⭐︎1', name: '三冠王⭐︎1', category: '打者', isRare: true, description: '【★1最高峰打撃栄誉】常時 ミート+4 / パワー+4（首位打者・本塁打王・打点王制覇の証）' },
  { id: '三冠王⭐︎2', name: '三冠王⭐︎2', category: '打者', isRare: true, description: '【★2最高峰打撃栄誉】常時 ミート+5 / パワー+5 / 長打・適時打率特大上昇' },
  { id: '三冠王⭐︎3', name: '三冠王⭐︎3', category: '打者', isRare: true, description: '【★3最高峰打撃栄誉】常時 ミート+6 / パワー+6（球史に名を刻む圧倒的打棒）' },
  { id: '三冠王⭐︎4', name: '三冠王⭐︎4', category: '打者', isRare: true, description: '【★4最高峰打撃栄誉】常時 ミート+7 / パワー+7 / 全打席本塁打警戒の威圧感' },
  { id: '三冠王⭐︎5', name: '三冠王⭐︎5', category: '打者', isRare: true, description: '【★5最高峰打撃栄誉】常時 ミート+8 / パワー+8 / 異次元の超弩級スラッガー' },
  { id: '三冠王⭐︎6', name: '三冠王⭐︎6', category: '打者', isRare: true, description: '【★6神域最高峰打撃栄誉】常時 ミート+10 / パワー+10（バットに当たればすべて本塁打の神話）' },

  // --- 沢村賞 (⭐︎1〜⭐︎6) ---
  { id: '沢村賞', name: '沢村賞', category: '投手', description: '【投手三冠達成者限定】常時 球速+20 / 制球+20 / 変化+20（球界史に刻まれる神話的エースの支配投球）' },
  { id: '沢村賞⭐︎1', name: '沢村賞⭐︎1', category: '投手', isRare: true, description: '【★1最高峰投手栄誉】常時 球速+4 / 制球+4 / 変化+4（最多勝・最優秀防御率・奪三振王制覇の証）' },
  { id: '沢村賞⭐︎2', name: '沢村賞⭐︎2', category: '投手', isRare: true, description: '【★2最高峰投手栄誉】常時 球速+5 / 制球+5 / 変化+5 / 完封・完投能力向上' },
  { id: '沢村賞⭐︎3', name: '沢村賞⭐︎3', category: '投手', isRare: true, description: '【★3最高峰投手栄誉】常時 球速+6 / 制球+6 / 変化+6（名実ともに球界No.1エースの投球）' },
  { id: '沢村賞⭐︎4', name: '沢村賞⭐︎4', category: '投手', isRare: true, description: '【★4最高峰投手栄誉】常時 球速+7 / 制球+7 / 変化+7 / 被安打・失点を徹底的に拒絶' },
  { id: '沢村賞⭐︎5', name: '沢村賞⭐︎5', category: '投手', isRare: true, description: '【★5最高峰投手栄誉】常時 球速+8 / 制球+8 / 変化+8（一人の走者も出塁を許さぬ絶対支配力）' },
  { id: '沢村賞⭐︎6', name: '沢村賞⭐︎6', category: '投手', isRare: true, description: '【★6神域最高峰投手栄誉】常時 球速+10 / 制球+10 / 変化+10（球史最高の伝説的完全投球）' },

  // --- メジャーリーグ特別栄誉: ハンク・アーロン賞 (⭐︎1〜⭐︎6) ---
  { id: 'ハンク・アーロン賞', name: 'ハンク・アーロン賞', category: '打者', isRare: true, description: '【メジャー打撃三冠栄誉】常時 ミート+20 / パワー+20（全米MLBの歴史に君臨する本塁打王の神撃）' },
  { id: 'ハンク・アーロン賞⭐︎1', name: 'ハンク・アーロン賞⭐︎1', category: '打者', isRare: true, description: '【メジャー★1最高打撃栄誉】常時 ミート+4 / パワー+4（MLB三冠制覇の証・圧倒的打棒）' },
  { id: 'ハンク・アーロン賞⭐︎2', name: 'ハンク・アーロン賞⭐︎2', category: '打者', isRare: true, description: '【メジャー★2最高打撃栄誉】常時 ミート+5 / パワー+5 / 長打・適時打率特大上昇' },
  { id: 'ハンク・アーロン賞⭐︎3', name: 'ハンク・アーロン賞⭐︎3', category: '打者', isRare: true, description: '【メジャー★3最高打撃栄誉】常時 ミート+6 / パワー+6（全米が熱狂する神話的スラッガー）' },
  { id: 'ハンク・アーロン賞⭐︎4', name: 'ハンク・アーロン賞⭐︎4', category: '打者', isRare: true, description: '【メジャー★4最高打撃栄誉】常時 ミート+7 / パワー+7 / 全打席本塁打警戒の威圧感' },
  { id: 'ハンク・アーロン賞⭐︎5', name: 'ハンク・アーロン賞⭐︎5', category: '打者', isRare: true, description: '【メジャー★5最高打撃栄誉】常時 ミート+8 / パワー+8 / 異次元の超弩級メジャースラッガー' },
  { id: 'ハンク・アーロン賞⭐︎6', name: 'ハンク・アーロン賞⭐︎6', category: '打者', isRare: true, description: '【メジャー★6神域最高峰打撃栄誉】常時 ミート+10 / パワー+10（バットに当たればすべて本塁打の世界最強神話）' },

  // --- メジャーリーグ特別栄誉: サイ・ヤング賞 (⭐︎1〜⭐︎6) ---
  { id: 'サイ・ヤング賞', name: 'サイ・ヤング賞', category: '投手', isRare: true, description: '【メジャー投手三冠栄誉】常時 球速+20 / 制球+20 / 変化+20（通算511勝の伝説が宿る絶対支配）' },
  { id: 'サイ・ヤング賞⭐︎1', name: 'サイ・ヤング賞⭐︎1', category: '投手', isRare: true, description: '【メジャー★1最高投手栄誉】常時 球速+4 / 制球+4 / 変化+4（MLB投手三冠制覇の証）' },
  { id: 'サイ・ヤング賞⭐︎2', name: 'サイ・ヤング賞⭐︎2', category: '投手', isRare: true, description: '【メジャー★2最高投手栄誉】常時 球速+5 / 制球+5 / 変化+5 / 完封・完全投球能力向上' },
  { id: 'サイ・ヤング賞⭐︎3', name: 'サイ・ヤング賞⭐︎3', category: '投手', isRare: true, description: '【メジャー★3最高投手栄誉】常時 球速+6 / 制球+6 / 変化+6（名実ともに世界No.1メジャーエースの投球）' },
  { id: 'サイ・ヤング賞⭐︎4', name: 'サイ・ヤング賞⭐︎4', category: '投手', isRare: true, description: '【メジャー★4最高投手栄誉】常時 球速+7 / 制球+7 / 変化+7 / 被安打・失点を徹底的に拒絶' },
  { id: 'サイ・ヤング賞⭐︎5', name: 'サイ・ヤング賞⭐︎5', category: '投手', isRare: true, description: '【メジャー★5最高投手栄誉】常時 球速+8 / 制球+8 / 変化+8（一人の走者も出塁を許さぬ絶対支配力）' },
  { id: 'サイ・ヤング賞⭐︎6', name: 'サイ・ヤング賞⭐︎6', category: '投手', isRare: true, description: '【メジャー★6神域最高峰投手栄誉】常時 球速+10 / 制球+10 / 変化+10（球史最高の伝説的完全投球）' },
];

export const ALL_EQUIPMENTS: EquipmentItem[] = [
  { id: 'eq_wood_bat', name: '剛打の木製バット', type: 'バット', description: '職人が厳選したメイプル製。長打力と打球速度が強化される。', effectLabel: 'パワー +1相当', price: 1500 },
  { id: 'eq_carbon_bat', name: '軽量カーボンバット', type: 'バット', description: '鋭いスイングを可能にする超軽量設計。', effectLabel: 'ミート +1相当', price: 1500 },
  { id: 'eq_leather_glove', name: '名手仕込みの牛革グラブ', type: 'グラブ', description: '手によくなじむ極上の革。捕球の確実性が大幅に向上。', effectLabel: '守備 +1相当', price: 1200 },
  { id: 'eq_spike_pro', name: '超軽量プロスパイク', type: 'スパイク', description: '抜群のグリップ力で一歩目のスタートダッシュを加速。', effectLabel: '走力 +1相当', price: 1200 },
  { id: 'eq_pitch_glove', name: '剛腕投手用ウェブグラブ', type: 'グラブ', description: 'ボールの握りを隠し、球速と制球を安定させる。', effectLabel: '制球・球速 +1相当', price: 1800 },
];

// ★シーズン優勝報酬限定の超希少レア装備プール（萬屋での一般販売なし）
export const CHAMPION_EXCLUSIVE_EQUIPMENTS: EquipmentItem[] = [
  {
    id: 'eq_gold_torpedo',
    name: '黄金のトルピードバット',
    type: 'バット',
    description: 'リーグ制覇の覇者に贈られる特注黄金バット。異次元の反発力とスイングスピードで弾丸ライナーを叩き込む。',
    effectLabel: 'パワー+2 / ミート+1',
    price: 30000,
  },
  {
    id: 'eq_aero_spike',
    name: '神速のエアロスパイク',
    type: 'スパイク',
    description: '空力抵抗を徹底排除した超軽量特注スパイク。疾風怒濤の加速力でダイヤモンドを縦横無尽に駆け抜ける。',
    effectLabel: '走力+2 / 盗塁・進塁力極大',
    price: 25000,
  },
  {
    id: 'eq_platinum_glove',
    name: '白金のマエストログローブ',
    type: 'グラブ',
    description: '職人が白金箔を織り交ぜて仕立てた至高のグラブ。打球を魔法のように吸い込み、鉄壁の守備網を築く。',
    effectLabel: '守備+2 / 堅守補正',
    price: 25000,
  },
  {
    id: 'eq_overlord_pitch_glove',
    name: '覇王の守護神グラブ',
    type: 'グラブ',
    description: '剛腕エースに捧ぐ黒金仕上げの守護神グラブ。球威を逃さずフォームを安定させ、針の穴を通す制球と豪速球を両立。',
    effectLabel: '制球+2 / 球速+1相当',
    price: 30000,
  },
  {
    id: 'eq_true_slugger',
    name: '真・スラッガーバット',
    type: 'バット',
    description: '極太の芯と強烈な反発力を持つ特注ハードバット。ジャストミートした打球は遥かスタンドの彼方へ消え去る。',
    effectLabel: 'パワー+3 / 特大本塁打',
    price: 30000,
  },
];

export const SCOUT_RARITY_RATES = [
  { rarity: '伝説ユニーク' as Rarity, rate: '2.0%', budget: 33, label: '伝説ユニーク', color: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 border-cyan-400', desc: '能力合計33。極限の潜在能力を秘めた伝説の至宝' },
  { rarity: 'UR' as Rarity, rate: '6.0%', budget: 30, label: 'UR (ウルトラレア)', color: 'text-rose-400 border-rose-500/50 bg-rose-950/40', desc: '能力合計30。球界最高峰の超一流選手' },
  { rarity: 'SSR' as Rarity, rate: '14.0%', budget: 27, label: 'SSR (スーパースペシャル)', color: 'text-amber-400 border-amber-500/50 bg-amber-950/40', desc: '能力合計27。主軸・ローテの核となるスター選手' },
  { rarity: 'SR' as Rarity, rate: '23.0%', budget: 23, label: 'SR (スペシャルレア)', color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/40', desc: '能力合計23。堅実な主力戦力' },
  { rarity: 'R' as Rarity, rate: '30.0%', budget: 19, label: 'R (レア)', color: 'text-blue-400 border-blue-500/50 bg-blue-950/40', desc: '能力合計19。期待の成長株・ユーティリティ' },
  { rarity: 'N' as Rarity, rate: '25.0%', budget: 16, label: 'N (ノーマル)', color: 'text-slate-400 border-slate-600 bg-slate-800/40', desc: '能力合計16。基礎能力のルーキー' },
];

// 1回20,000Gの極・名門スカウト（SSR以上確定）提供割合
export const SSR_GUARANTEED_RATES = [
  { rarity: '伝説ユニーク' as Rarity, rate: '9.1%', budget: 33, label: '伝説ユニーク', color: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 border-cyan-400', desc: '能力合計33。神話級の怪物選手' },
  { rarity: 'UR' as Rarity, rate: '27.3%', budget: 30, label: 'UR (ウルトラレア)', color: 'text-rose-400 border-rose-500/50 bg-rose-950/40', desc: '能力合計30。超一流の天才選手' },
  { rarity: 'SSR' as Rarity, rate: '63.6%', budget: 27, label: 'SSR (スーパースペシャル)', color: 'text-amber-400 border-amber-500/50 bg-amber-950/40', desc: '能力合計27。即戦力のエース・主軸打者' },
];

// 秘伝スキルガチャ提供割合（レアスキル排出率を大幅に絞り込み希少価値を高める）
export const SKILL_GACHA_RATES = [
  { tier: '通常スキル', rate: '95.0%', countLabel: '全135種', color: 'text-slate-300 border-slate-700 bg-slate-800/40', desc: 'プロ野球のリアルな戦術と能力を支える各種スキル' },
  { tier: '★金特・レアスキル', rate: '5.0%', countLabel: '全77種', color: 'text-amber-300 border-amber-500/80 bg-amber-950/60 font-black', desc: '試合を決定づける超絶効果を秘めた伝説の秘伝能力（※限定スキル除く）' },
];

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'shop_rename_ticket', name: '改名手形', type: 'rename_ticket', description: '所属選手の登録名を変更できる由緒ある書状。（背番号の変更には消費されません）', price: 500 },
  { id: 'shop_skill_ticket', name: 'スキル変更券', type: 'skill_ticket', description: '選手の装着中スキルを別の所持スキルへ変更・再編成します。', price: 1000 },
];

const JAPANESE_SURNAMES = [
  '佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤',
  '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水',
  '山崎', '池田', '橋本', '阿部', '石川', '山下', '中島', '石井', '小川', '前田',
  '岡田', '長谷川', '後藤', '近藤', '村上', '遠藤', '青木', '坂本', '斉藤', '福田',
  '太田', '西村', '藤井', '岡本', '金子', '藤田', '中野', '三浦', '原田', '竹内',
  '中川', '松田', '杉山', '田村', '和田', '菊池', '平野', '柴田', '宮崎', '矢野',
  '工藤', '栗原', '西川', '岩本', '菅原', '牧', '宮城', '戸郷', '岡林', '森下',
  '清宮', '万波', '細川', '桑原', '今永', '則本', '岸', '源田', '近本', '塩見',
  '小園', '紅林', '栗山', '内川', '鳥谷', '福留', '糸井', '金本', '城島', '古田',
  '谷繁', '杉内', '新垣', '岩瀬', '五十嵐', '藤川', '久保田', '浅尾', '上原', '川上',
  '黒田', '松坂', '岩隈', '杉谷', '大谷', 'ダルビッシュ', '新庄', '落合', '王', '長嶋',
  '野茂', '松井', 'イチロー', '秋山', '清原', '掛布', '江夏', '稲尾', '江川', '野村',
  '衣笠', '門田', '張本', '福本', '東尾', '北別府', '槙原', '桑田', '津田', '緒方',
  '千賀', '山崎康', '甲斐', '森友', '山川', '柳田', '周東', '甲斐野', '高津', '栗林'
];

const JAPANESE_GIVEN_NAMES = [
  '翔太', '大輝', '蓮', '悠真', '陸', '陽翔', '湊', '一真', '健太', '拓也',
  '達也', '直樹', '浩二', '誠', '剛', '大輔', '博之', '哲也', '慎吾', '秀樹',
  '翔平', '朗希', '宗隆', '悠岐', '誠也', '健伸', '真吾', '勇人', '正尚', '光成',
  '悠斗', '颯太', '駿', '康晃', '裕也', '友哉', '勇樹', '竜馬', '智也', '健吾',
  '拓海', '泰成', '俊介', '裕貴', '亮太', '航平', '圭佑', '健司', '慎太郎', '賢人',
  '翔大', '陽介', '雄大', '晃', '雄星', '奨吾', '周平', '佳寿', '健太朗', '隼人',
  '昂大', '凱斗', '陸斗', '怜央', '巧', '拓実', '凌', '龍平', '隼平', '優斗',
  '拓斗', '雅也', '和真', '大樹', '裕樹', '勝己', '浩司', '伸之', '宏樹', '修平',
  '貴裕', '和樹', '涼太', '海斗', '陽太', '慶太', '奏汰', '創太', '蒼空', '琉生'
];

const FOREIGN_FIRST_NAMES = [
  'マイク', 'アーロン', 'ムーキー', 'フアン', 'フェルナンド', 'ブライス', 'フレディ', 'ロナルド',
  'マニー', 'ノーラン', 'ホセ', 'カルロス', 'マーカス', 'コーリー', 'ゲリット', 'コービン',
  'タイラー', 'ザック', 'マックス', 'ブレイク', 'ジョシュ', 'エドウィン', 'サンディ', 'ケビン',
  'ルイス', 'デイビッド', 'アレックス', 'クリス', 'アンソニー', 'ブランドン', 'ジャスティン', 'クレイトン',
  'ジェイコブ', 'スペンサー', 'ラファエル', 'フリオ', 'ワンダー', 'アドリス', 'オースティン', 'ランディ',
  'ポール', 'ジョー', 'アルバート', 'デレク', 'ペドロ', 'マリアノ', 'サミー', 'バリー', 'ケン'
];

const FOREIGN_LAST_NAMES = [
  'ジャッジ', 'トラウト', 'ベッツ', 'ソト', 'タティス', 'ハーパー', 'フリーマン', 'アクーニャ',
  'マチャド', 'アレナド', 'ラミレス', 'コレア', 'セミエン', 'シーガー', 'コール', 'バーンズ',
  'グラスノー', 'スネル', 'ウィーラー', 'ヘイダー', 'ディアス', 'ガウスマン', 'カスティヨ', 'ロドリゲス',
  'ゲレーロ', 'リンドア', 'オルト', 'カーショウ', 'シャーザー', 'バーランダー', 'バウアー', 'アルバレス',
  'ライリー', 'オルティス', 'プホルス', 'カブレラ', 'ローズ', 'ペタジーニ', 'ウッズ', 'シーツ',
  'クルーズ', 'メッセンジャー', 'サファテ', 'マシソン', 'バーネット', 'サンタナ', 'マルティネス', 'ポランコ',
  'モイネロ', 'ビシエド', 'オースティン', 'スチュワート', 'デスパイネ', 'レアード', 'バレンティン', 'ブランコ',
  'グリフィー', 'ジーター', 'リベラ', 'ソーサ', 'ボンズ', 'マグワイア', 'ピアザ', 'ジョンソン', 'クレメンス'
];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomPlayerName(isForeignPreferred?: boolean): { name: string; isForeign: boolean } {
  const isForeign = isForeignPreferred !== undefined ? isForeignPreferred : Math.random() < 0.20;
  if (isForeign) {
    if (Math.random() < 0.55) {
      return {
        name: `${getRandom(FOREIGN_FIRST_NAMES)}・${getRandom(FOREIGN_LAST_NAMES)}`,
        isForeign: true,
      };
    }
    return {
      name: getRandom(FOREIGN_LAST_NAMES),
      isForeign: true,
    };
  }
  return {
    name: `${getRandom(JAPANESE_SURNAMES)} ${getRandom(JAPANESE_GIVEN_NAMES)}`,
    isForeign: false,
  };
}

export function createRandomAvatar(isForeign?: boolean): PlayerAvatarData {
  const skins = isForeign
    ? ['#FFE0BD', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#5C3818', '#FFDFC4']
    : ['#FFDFC4', '#F0C2A2', '#DF9C75', '#B86F50', '#FFF0E5'];
  const hairColors = isForeign
    ? ['#1E1B18', '#3D2314', '#5A3D28', '#8B5A2B', '#D4AF37', '#E6C280', '#A52A2A']
    : ['#1E1B18', '#3D2314', '#5A3D28', '#8B5A2B', '#A52A2A', '#D4AF37'];

  return {
    skinColor: getRandom(skins),
    hairColor: getRandom(hairColors),
    hairStyle: getRandomInt(1, 6),
    eyesStyle: getRandomInt(1, 4),
    hasGlasses: Math.random() < 0.15,
    hasBeard: isForeign ? Math.random() < 0.25 : Math.random() < 0.08,
  };
}

// 予算を4つのパラメータにランダム分配する (各1〜10)
function distributeBudget(budget: number): [number, number, number, number] {
  // 初期値すべて1
  const vals = [1, 1, 1, 1];
  let remaining = budget - 4;

  while (remaining > 0) {
    const idx = Math.floor(Math.random() * 4);
    if (vals[idx] < 10) {
      vals[idx] += 1;
      remaining -= 1;
    }
  }
  return [vals[0], vals[1], vals[2], vals[3]];
}

// 選手生成 (スカウト時など)
export function generatePlayer(params: {
  position: Position;
  number?: number;
  fixedRarity?: Rarity;
  minRarity?: 'SSR';
  careerYears?: number;
  isForeign?: boolean;
  isMajorLeague?: boolean;
  statBoost?: number;
}): Player {
  const isPitcher = params.position === '投';

  // レアリティ決定 (指定がなければ確率抽選)
  let rarity: Rarity = params.fixedRarity || 'N';
  if (!params.fixedRarity) {
    if (params.minRarity === 'SSR') {
      // 20,000G確定スカウト: SSR以上確定 (SSR, UR, 伝説ユニーク)
      const roll = Math.random() * 100;
      if (roll < 9.1) rarity = '伝説ユニーク';
      else if (roll < 36.4) rarity = 'UR';
      else rarity = 'SSR';
    } else {
      const roll = Math.random() * 100;
      if (roll < 2) rarity = '伝説ユニーク';
      else if (roll < 8) rarity = 'UR';
      else if (roll < 22) rarity = 'SSR';
      else if (roll < 45) rarity = 'SR';
      else if (roll < 75) rarity = 'R';
      else rarity = 'N';
    }
  }

  const budget = RARITY_BUDGET[rarity].budget;
  const [s1, s2, s3, s4] = distributeBudget(budget);

  let stats: PlayerStats;
  if (isPitcher) {
    stats = {
      pitcher: {
        speed: s1,    // 球速 (1〜10)
        control: s2,  // 制球 (1〜10)
        stamina: s3,  // スタミナ (1〜10)
        breaking: s4, // 変化 (1〜10)
      }
    };
  } else {
    stats = {
      fielder: {
        meet: s1,     // ミート (1〜10)
        power: s2,    // パワー (1〜10)
        speed: s3,    // 走力 (1〜10)
        defense: s4,  // 守備 (1〜10)
        trajectory: (Math.floor(Math.random() * 4) + 1), // 弾道 (1〜4)
      }
    };
  }

  // ★重要仕様：レアリティとスキル枠数は別々に扱う！
  // スキル枠数: 1〜4枠 (URでも1枠、Rでも3枠など)
  const slotRoll = Math.random() * 100;
  let skillSlots = 1;
  if (slotRoll < 12) skillSlots = 4;
  else if (slotRoll < 35) skillSlots = 3;
  else if (slotRoll < 70) skillSlots = 2;
  else skillSlots = 1;

  // 初期スキル習得 (枠数のうち1〜2個習得済み、※極本塁打王・極首位打者などのタイトル限定スキルは除外！)
  const candidateNormalSkills = ALL_SKILLS.filter(s => {
    if (TITLE_ONLY_SKILLS.includes(s.id) || s.isRare) return false;
    return isPitcher
      ? s.category === '投手' || s.category === '特殊'
      : s.category === '打者' || s.category === '守備' || s.category === '特殊';
  });

  const candidateRareSkills = ALL_SKILLS.filter(s => {
    if (TITLE_ONLY_SKILLS.includes(s.id) || !s.isRare) return false;
    return isPitcher
      ? s.category === '投手' || s.category === '特殊'
      : s.category === '打者' || s.category === '守備' || s.category === '特殊';
  });

  // レアリティに応じたレアスキル（金特）初期所持確率（大幅に引き下げて希少性を確保）
  // N: 0% / R: 1% / SR: 3% / SSR: 7% / UR: 18% / 伝説ユニーク: 35%
  const rareSkillChances: Record<Rarity, number> = {
    'N': 0,
    'R': 0.01,
    'SR': 0.03,
    'SSR': 0.07,
    'UR': 0.18,
    '伝説ユニーク': 0.35,
  };
  const rareChance = rareSkillChances[rarity] || 0.02;

  const initialSkillCount = Math.min(skillSlots, Math.random() < 0.6 ? 1 : 2);
  const selectedSkills: SkillId[] = [];
  for (let i = 0; i < initialSkillCount; i++) {
    const isRare = Math.random() < rareChance;
    const pool = isRare && candidateRareSkills.length > 0 ? candidateRareSkills : candidateNormalSkills;
    const sk = getRandom(pool);
    if (!selectedSkills.includes(sk.id)) {
      selectedSkills.push(sk.id);
    }
  }

  const nameInfo = generateRandomPlayerName(params.isForeign);
  const name = nameInfo.name;
  const isForeign = nameInfo.isForeign;

  if (params.isMajorLeague) {
    skillSlots = Math.max(skillSlots, 4);
    if (stats.fielder) {
      stats.fielder.meet = Math.min(10, stats.fielder.meet + 2);
      stats.fielder.power = Math.min(10, stats.fielder.power + 2);
      stats.fielder.speed = Math.min(10, stats.fielder.speed + 1);
      stats.fielder.defense = Math.min(10, stats.fielder.defense + 1);
      stats.fielder.trajectory = Math.max(stats.fielder.trajectory, 3);
    }
    if (stats.pitcher) {
      stats.pitcher.speed = 10;
      stats.pitcher.control = Math.min(10, stats.pitcher.control + 2);
      stats.pitcher.stamina = Math.min(10, stats.pitcher.stamina + 2);
      stats.pitcher.breaking = Math.min(10, stats.pitcher.breaking + 2);
    }
  }

  if (params.statBoost) {
    if (stats.fielder) {
      stats.fielder.meet = Math.min(10, stats.fielder.meet + params.statBoost);
      stats.fielder.power = Math.min(10, stats.fielder.power + params.statBoost);
      stats.fielder.speed = Math.min(10, stats.fielder.speed + params.statBoost);
      stats.fielder.defense = Math.min(10, stats.fielder.defense + params.statBoost);
    }
    if (stats.pitcher) {
      stats.pitcher.speed = Math.min(10, stats.pitcher.speed + params.statBoost);
      stats.pitcher.control = Math.min(10, stats.pitcher.control + params.statBoost);
      stats.pitcher.stamina = Math.min(10, stats.pitcher.stamina + params.statBoost);
      stats.pitcher.breaking = Math.min(10, stats.pitcher.breaking + params.statBoost);
    }
  }

  return {
    id: `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    number: params.number || getRandomInt(1, 99),
    careerYears: params.careerYears || 1, // 新規スカウトはプロ1シーズン目から
    position: params.position,
    rarity,
    stats,
    skillSlots,
    skills: selectedSkills,
    battingHand: Math.random() < 0.35 ? '左打' : Math.random() < 0.05 ? '両打' : '右打',
    throwingHand: Math.random() < 0.25 ? '左投' : '右投',
    pitcherRole: isPitcher ? (Math.random() < 0.3 ? '抑え' : Math.random() < 0.5 ? '中継ぎ' : '先発') : undefined,
    record: {
      games: 0,
      atBats: 0,
      hits: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      rbi: 0,
      walks: 0,
      strikeouts: 0,
      stolenBases: 0,
      pitchGames: 0,
      wins: 0,
      losses: 0,
      saves: 0,
      holds: 0,
      inningsPitched: 0,
      earnedRuns: 0,
      pitchHits: 0,
      pitchHomeRuns: 0,
      pitchStrikeouts: 0,
      pitchWalks: 0,
    },
    avatar: createRandomAvatar(isForeign),
    titles: [],
    restGamesRemaining: 0,
  };
}

// 投手表示用球速 km/h
export function getPitcherKmh(speedStat: number): number {
  return Math.round(135 + speedStat * 2.8);
}
