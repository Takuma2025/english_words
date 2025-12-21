/**
 * 大阪府英単語コンプリート - 統合単語データベース
 * すべての英単語・熟語はこのファイルで管理します
 * 
 * 使い方:
 * 1. 各カテゴリーの配列に単語オブジェクトを追加
 * 2. getAllVocabulary() で全単語を取得
 * 3. getVocabularyByCategory(categoryName) でカテゴリー別に取得
 */

// ============================================
// 小学生で習った単語（カテゴリー別）
// ============================================

// 家族・家に関する単語
const familyHomeWords = [
  // 家族関係
  { id: 10001, word: "family", meaning: "家族", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 48 },
  { id: 10002, word: "parent", meaning: "親（複数形: parents 両親）", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 1 },
  { id: 10003, word: "father", meaning: "父、父親", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 4 },
  { id: 10004, word: "mother", meaning: "母、母親、お母さん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 1 },
  { id: 10005, word: "dad", meaning: "お父さん、パパ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10006, word: "mom", meaning: "お母さん、ママ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10007, word: "grandfather", meaning: "祖父、おじいさん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 16 },
  { id: 10008, word: "grandmother", meaning: "祖母、おばあさん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 13 },
  { id: 10009, word: "grandparent", meaning: "祖父母", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 7 },
  { id: 10010, word: "uncle", meaning: "おじ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 13 },
  { id: 10011, word: "aunt", meaning: "おば", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 7 },
  { id: 10012, word: "brother", meaning: "兄弟、兄、弟", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 23 },
  { id: 10013, word: "sister", meaning: "姉妹、姉、妹", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 52 },
  { id: 10014, word: "cousin", meaning: "いとこ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10015, word: "son", meaning: "息子", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 1 },
  { id: 10016, word: "daughter", meaning: "娘", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 4 },
  { id: 10017, word: "child", meaning: "子ども（複数形: children）", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 21 },
  { id: 10018, word: "baby", meaning: "赤ちゃん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 7 },
  { id: 10019, word: "husband", meaning: "夫", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10020, word: "wife", meaning: "妻", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  // 家全体
  { id: 10021, word: "house", meaning: "家", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 42 },
  { id: 10022, word: "home", meaning: "家、家庭、故郷、在宅の、家に(へ)", partOfSpeech: "名詞・形容詞・副詞", category: "家族・家に関する単語", appearanceCount: 36 },
  { id: 10023, word: "garden", meaning: "庭、庭園", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 11 },
  { id: 10024, word: "roof", meaning: "屋根、屋上", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  // 部屋
  { id: 10025, word: "room", meaning: "部屋、室", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 34 },
  { id: 10026, word: "bedroom", meaning: "寝室", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10027, word: "bathroom", meaning: "浴室、トイレ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10028, word: "kitchen", meaning: "台所、キッチン", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 3 },
  { id: 10029, word: "bath", meaning: "入浴、浴室、風呂場", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 3 },
  { id: 10030, word: "toilet", meaning: "トイレ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  // 家具・設備
  { id: 10031, word: "table", meaning: "①テーブル、食卓　②表、一覧表", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 27 },
  { id: 10032, word: "desk", meaning: "机", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 8 },
  { id: 10033, word: "chair", meaning: "いす", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 1 },
  { id: 10034, word: "sofa", meaning: "ソファ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10035, word: "bed", meaning: "ベッド", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10036, word: "light", meaning: "光、明るさ、明かり、照明、電灯", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 17 },
  { id: 10037, word: "lamp", meaning: "ランプ、明かり、電気スタンド", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10038, word: "shower", meaning: "シャワー", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10039, word: "sink", meaning: "洗面台、流し", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  // 建物の構造
  { id: 10040, word: "wall", meaning: "壁、へい", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 7 },
  { id: 10041, word: "window", meaning: "窓", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 6 },
  { id: 10042, word: "door", meaning: "ドア、扉", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 1 },
  { id: 10043, word: "floor", meaning: "ゆか、階", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 18 },
];

// 数字に関する単語
const numberWords = [
  // zero（最初に）
  { id: 10101, word: "zero", meaning: "ゼロ", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 2 },
  // 数字（順番に）
  { id: 10102, word: "one", meaning: "1（の）、1つ", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 210 },
  { id: 10103, word: "two", meaning: "2（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 131 },
  { id: 10104, word: "three", meaning: "3（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 29 },
  { id: 10105, word: "four", meaning: "4（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 30 },
  { id: 10106, word: "five", meaning: "5（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 24 },
  { id: 10107, word: "six", meaning: "6（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 14 },
  { id: 10108, word: "seven", meaning: "7（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 9 },
  { id: 10109, word: "eight", meaning: "8（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 7 },
  { id: 10110, word: "nine", meaning: "9（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 5 },
  { id: 10111, word: "ten", meaning: "10（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 8 },
  { id: 10112, word: "eleven", meaning: "11（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10113, word: "twelve", meaning: "12（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10114, word: "thirteen", meaning: "13（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10115, word: "fourteen", meaning: "14（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 3 },
  { id: 10116, word: "fifteen", meaning: "15（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 4 },
  { id: 10117, word: "sixteen", meaning: "16（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10118, word: "seventeen", meaning: "17（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10119, word: "eighteen", meaning: "18（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10120, word: "nineteen", meaning: "19（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 5 },
  { id: 10121, word: "twenty", meaning: "20（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 20 },
  { id: 10122, word: "thirty", meaning: "30（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 9 },
  { id: 10123, word: "forty", meaning: "40（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10124, word: "fifty", meaning: "50（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 10 },
  { id: 10125, word: "sixty", meaning: "60（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10126, word: "seventy", meaning: "70（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 4 },
  { id: 10127, word: "eighty", meaning: "80（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 3 },
  { id: 10128, word: "ninety", meaning: "90（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10129, word: "hundred", meaning: "100（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 18 },
  { id: 10130, word: "thousand", meaning: "1,000（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 9 },
  { id: 10131, word: "million", meaning: "100万", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 8 },
  { id: 10132, word: "billion", meaning: "10億", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 2 },
  // 序数（順番に）
  { id: 10133, word: "first", meaning: "1番目（の）、最初（の）、まず第一に、最初に、初めて", partOfSpeech: "名詞・形容詞・副詞", category: "数字に関する単語", appearanceCount: 115 },
  { id: 10134, word: "second", meaning: "2番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 17 },
  { id: 10135, word: "third", meaning: "3番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 8 },
  { id: 10136, word: "fourth", meaning: "4番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10137, word: "fifth", meaning: "5番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 6 },
  { id: 10138, word: "sixth", meaning: "6番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 3 },
  { id: 10139, word: "seventh", meaning: "7番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 4 },
  { id: 10140, word: "eighth", meaning: "8番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10141, word: "ninth", meaning: "9番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10142, word: "tenth", meaning: "10番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  // その他
  { id: 10143, word: "half", meaning: "半分（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 11 },
  { id: 10144, word: "quarter", meaning: "4分の1、15分", partOfSpeech: "名詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10145, word: "number", meaning: "数、番号", partOfSpeech: "名詞", category: "数字に関する単語", appearanceCount: 56 },
  { id: 10146, word: "twice", meaning: "2度・2回、2倍", partOfSpeech: "副詞", category: "数字に関する単語", appearanceCount: 13 },
];

// 日用品・楽器に関する単語
const dailyItemsInstrumentsWords = [
  // { id: 10201, word: "pen", meaning: "ペン", partOfSpeech: "名詞", category: "日用品・楽器に関する単語" },
];

// 体に関する単語
const bodyWords = [
  // 体全体
  { id: 10301, word: "body", meaning: "からだ", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 42 },
  // 頭部
  { id: 10302, word: "head", meaning: "頭", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 5 },
  { id: 10303, word: "face", meaning: "顔、面", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 2 },
  { id: 10304, word: "hair", meaning: "髪、毛", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10305, word: "brain", meaning: "脳", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // 顔の部位
  { id: 10306, word: "eye", meaning: "目", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 4 },
  { id: 10307, word: "ear", meaning: "耳", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 1 },
  { id: 10308, word: "nose", meaning: "鼻", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10309, word: "mouth", meaning: "口", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 3 },
  { id: 10310, word: "tooth", meaning: "歯（複数形: teeth）", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // 首・肩
  { id: 10311, word: "neck", meaning: "首", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10312, word: "shoulder", meaning: "肩", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10313, word: "throat", meaning: "のど", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // 上半身
  { id: 10314, word: "back", meaning: "背中", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 28 },
  { id: 10315, word: "arm", meaning: "腕", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 4 },
  { id: 10316, word: "hand", meaning: "手", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 9 },
  { id: 10317, word: "finger", meaning: "指（手の親指はthumb、足の指はtoe）", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // 胴体
  { id: 10318, word: "heart", meaning: "心臓、心", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10319, word: "stomach", meaning: "胃、おなか", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // 下半身
  { id: 10320, word: "leg", meaning: "脚", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 5 },
  { id: 10321, word: "knee", meaning: "ひざ", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10322, word: "foot", meaning: "足（足首から下）（複数形: feet）", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // その他
  { id: 10323, word: "skin", meaning: "皮膚、皮", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
];

// 色に関する単語
const colorWords = [
  // 基本色
  { id: 10401, word: "red", meaning: "赤", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 1 },
  { id: 10402, word: "blue", meaning: "青", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 2 },
  { id: 10403, word: "yellow", meaning: "黄色", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 2 },
  { id: 10404, word: "green", meaning: "緑", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 7 },
  { id: 10405, word: "black", meaning: "黒", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 5 },
  { id: 10406, word: "white", meaning: "白", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 12 },
  { id: 10407, word: "brown", meaning: "茶色", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 5 },
  // 特殊色
  { id: 10408, word: "orange", meaning: "オレンジ色", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 0 },
  { id: 10409, word: "pink", meaning: "ピンク", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 0 },
  { id: 10410, word: "purple", meaning: "紫", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 0 },
  { id: 10411, word: "gold", meaning: "金色、金", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 13 },
];

// 食べ物・飲み物に関する単語
const foodDrinkWords = [
  // 基本概念
  { id: 10501, word: "food", meaning: "食べ物、食物", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 138 },
  { id: 10502, word: "drink", meaning: "飲み物、飲む", partOfSpeech: "名詞・動詞", category: "食べ物・飲み物に関する単語", appearanceCount: 30 },
  { id: 10503, word: "dish", meaning: "料理、皿", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 4 },
  // 飲み物
  { id: 10504, word: "water", meaning: "水", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 64 },
  { id: 10505, word: "tea", meaning: "お茶", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 24 },
  { id: 10506, word: "coffee", meaning: "コーヒー", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 10 },
  { id: 10507, word: "milk", meaning: "牛乳", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 4 },
  { id: 10508, word: "juice", meaning: "ジュース", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10509, word: "soda", meaning: "ソーダ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  // 容器・食器
  { id: 10510, word: "cup", meaning: "カップ、コップ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 25 },
  { id: 10511, word: "glass", meaning: "グラス、コップ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10512, word: "bowl", meaning: "どんぶり、茶碗、ボウル", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10513, word: "plate", meaning: "皿", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10514, word: "knife", meaning: "ナイフ（複数形： knives)", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  // 主食・穀物
  { id: 10515, word: "rice", meaning: "ご飯、米", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 2 },
  { id: 10516, word: "bread", meaning: "パン", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10517, word: "noodle", meaning: "めん類、ヌードル", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  // 肉類
  { id: 10518, word: "meat", meaning: "肉", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 3 },
  { id: 10519, word: "chicken", meaning: "鶏肉、にわとり", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 1 },
  { id: 10520, word: "beef", meaning: "牛肉", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10521, word: "pork", meaning: "豚肉", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10522, word: "fish", meaning: "魚", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 10 },
  // 野菜
  { id: 10523, word: "cabbage", meaning: "キャベツ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10524, word: "carrot", meaning: "にんじん", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10525, word: "cucumber", meaning: "きゅうり", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10526, word: "lettuce", meaning: "レタス", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10527, word: "onion", meaning: "たまねぎ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10528, word: "potato", meaning: "じゃがいも", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10529, word: "tomato", meaning: "トマト", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  // 果物
  { id: 10530, word: "apple", meaning: "りんご", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 2 },
  { id: 10531, word: "banana", meaning: "バナナ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 1 },
  { id: 10532, word: "grape", meaning: "ぶどう", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 2 },
  { id: 10533, word: "lemon", meaning: "レモン", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10534, word: "melon", meaning: "メロン", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10535, word: "peach", meaning: "もも", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10536, word: "pineapple", meaning: "パイナップル", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10537, word: "strawberry", meaning: "いちご", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  // その他の食べ物
  { id: 10538, word: "egg", meaning: "卵", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 7 },
  { id: 10539, word: "salt", meaning: "塩", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 7 },
  { id: 10540, word: "chocolate", meaning: "チョコレート", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 7 },
  { id: 10541, word: "cake", meaning: "ケーキ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 6 },
  { id: 10542, word: "cookie", meaning: "クッキー", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10543, word: "soup", meaning: "スープ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 1 },
  { id: 10544, word: "bean", meaning: "豆", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10545, word: "corn", meaning: "とうもろこし", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10546, word: "hamburger", meaning: "ハンバーガー", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10547, word: "ice cream", meaning: "アイスクリーム", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10548, word: "pizza", meaning: "ピザ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10549, word: "salad", meaning: "サラダ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10550, word: "sandwich", meaning: "サンドイッチ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
];

// 町の施設に関する単語
const townFacilityWords = [
  // 交通施設
  { id: 10601, word: "station", meaning: "駅、署［局・所］", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 35 },
  { id: 10602, word: "road", meaning: "道路、道", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 18 },
  { id: 10603, word: "street", meaning: "通り、道、街路", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 4 },
  { id: 10604, word: "bridge", meaning: "橋", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  // 公共施設
  { id: 10605, word: "library", meaning: "図書館、図書室", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 15 },
  { id: 10606, word: "museum", meaning: "博物館、美術館", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 49 },
  { id: 10607, word: "park", meaning: "公園、遊園地", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 44 },
  { id: 10608, word: "post office", meaning: "郵便局", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 3 },
  { id: 10609, word: "police station(/office)", meaning: "警察署", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10610, word: "hospital", meaning: "病院", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  // 商業施設
  { id: 10611, word: "shop", meaning: "店、買い物をする", partOfSpeech: "名詞・動詞", category: "町の施設に関する単語", appearanceCount: 14 },
  { id: 10612, word: "store", meaning: "店、商店、～を蓄える", partOfSpeech: "名詞・動詞", category: "町の施設に関する単語", appearanceCount: 10 },
  { id: 10613, word: "supermarket", meaning: "スーパーマーケット", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 8 },
  { id: 10614, word: "convenience store", meaning: "コンビニエンスストア", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10615, word: "market", meaning: "市場", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10616, word: "restaurant", meaning: "レストラン、料理店", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 11 },
  { id: 10617, word: "cafe", meaning: "カフェ、喫茶店", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10618, word: "hotel", meaning: "ホテル", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10619, word: "bank", meaning: "銀行", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  // 娯楽施設
  { id: 10620, word: "movie", meaning: "映画", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 19 },
  { id: 10621, word: "theater", meaning: "劇場、映画館", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 19 },
  { id: 10622, word: "amusement park", meaning: "遊園地", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10623, word: "aquarium", meaning: "水族館", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  // 宗教施設
  { id: 10624, word: "temple", meaning: "寺、寺院、神殿", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 5 },
  { id: 10625, word: "shrine", meaning: "神社", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
];

// 乗り物に関する単語
const vehicleWords = [
  // 陸上交通
  { id: 10701, word: "bicycle", meaning: "自転車", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 54 },
  { id: 10702, word: "bike", meaning: "自転車、バイク", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 12 },
  { id: 10703, word: "car", meaning: "自動車、車", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 20 },
  { id: 10704, word: "taxi", meaning: "タクシー", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 0 },
  { id: 10705, word: "bus", meaning: "バス", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 6 },
  { id: 10706, word: "train", meaning: "電車、列車、（～を）訓練する", partOfSpeech: "名詞・動詞", category: "乗り物に関する単語", appearanceCount: 46 },
  { id: 10707, word: "subway", meaning: "地下鉄", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 0 },
  // 航空交通
  { id: 10708, word: "plane", meaning: "飛行機", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 4 },
  // 水上交通
  { id: 10709, word: "boat", meaning: "ボート、小船", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 3 },
  { id: 10710, word: "ship", meaning: "船", partOfSpeech: "名詞", category: "乗り物に関する単語", appearanceCount: 3 },
];

// 職業に関する単語
const occupationWords = [
  // 専門職・技術職
  { id: 10801, word: "scientist", meaning: "科学者", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 47 },
  { id: 10802, word: "engineer", meaning: "技術者、エンジニア", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 7 },
  { id: 10803, word: "doctor", meaning: "医者、博士", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 4 },
  { id: 10804, word: "lawyer", meaning: "弁護士", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10805, word: "judge", meaning: "審判、裁判官、～を判断する", partOfSpeech: "名詞・動詞", category: "職業に関する単語", appearanceCount: 7 },
  { id: 10806, word: "pilot", meaning: "パイロット、操縦士", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  // 教育・芸術
  { id: 10807, word: "teacher", meaning: "先生、教師", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 23 },
  { id: 10808, word: "artist", meaning: "芸術家、画家", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 21 },
  { id: 10809, word: "writer", meaning: "作家、筆者", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 3 },
  { id: 10810, word: "singer", meaning: "歌手", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 7 },
  { id: 10811, word: "actor", meaning: "俳優、男優", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 3 },
  // サービス業
  { id: 10812, word: "cook", meaning: "料理人、コック、料理する", partOfSpeech: "名詞・動詞", category: "職業に関する単語", appearanceCount: 10 },
  { id: 10813, word: "driver", meaning: "運転手", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 4 },
  { id: 10814, word: "nurse", meaning: "看護師", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10815, word: "clerk", meaning: "店員、係員、事務員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10816, word: "manager", meaning: "マネージャー、管理者、園長、監督", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  // 公務・法執行
  { id: 10817, word: "police", meaning: "警察", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10818, word: "officer", meaning: "事務員、係員、警察官、公務員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 1 },
  // その他
  { id: 10819, word: "farmer", meaning: "農民、農業をする人、農家、農業従事者", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 22 },
  { id: 10820, word: "worker", meaning: "労働者、作業員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 4 },
];

// スポーツに関する単語
const sportsWords = [
  // 基本概念
  { id: 10901, word: "sport", meaning: "スポーツ、運動競技（sports day 運動会)", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 5 },
  // 球技
  { id: 10902, word: "soccer", meaning: "サッカー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 9 },
  { id: 10903, word: "football", meaning: "アメリカンフットボール、サッカー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10904, word: "basketball", meaning: "バスケットボール", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 5 },
  { id: 10905, word: "volleyball", meaning: "バレーボール", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 2 },
  { id: 10906, word: "tennis", meaning: "テニス", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 10 },
  { id: 10907, word: "baseball", meaning: "野球", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 3 },
  { id: 10908, word: "rugby", meaning: "ラグビー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 5 },
  { id: 10909, word: "badminton", meaning: "バドミントン", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  // その他のスポーツ
  { id: 10910, word: "swimming", meaning: "水泳", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 11 },
  { id: 10911, word: "dance", meaning: "ダンス、踊り、踊る", partOfSpeech: "名詞・動詞", category: "スポーツに関する単語", appearanceCount: 3 },
  { id: 10912, word: "marathon", meaning: "マラソン", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10913, word: "skate", meaning: "スケート、スケートをする", partOfSpeech: "名詞・動詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10914, word: "skiing", meaning: "スキー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
];

// 曜日・月・季節に関する単語
const calendarWords = [
  // 基本概念
  { id: 11001, word: "year", meaning: "年", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 135 },
  { id: 11002, word: "season", meaning: "季節", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 25 },
  { id: 11003, word: "month", meaning: "（暦）月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 20 },
  // 曜日
  { id: 11004, word: "Sunday", meaning: "日曜日", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 23 },
  { id: 11005, word: "Monday", meaning: "月曜日", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11006, word: "Tuesday", meaning: "火曜日", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 3 },
  { id: 11007, word: "Wednesday", meaning: "水曜日", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11008, word: "Thursday", meaning: "木曜日", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11009, word: "Friday", meaning: "金曜日", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 11 },
  { id: 11010, word: "Saturday", meaning: "土曜日", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 28 },
  // 月
  { id: 11011, word: "January", meaning: "1月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 3 },
  { id: 11012, word: "February", meaning: "2月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 0 },
  { id: 11013, word: "March", meaning: "3月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11014, word: "April", meaning: "4月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11015, word: "May", meaning: "5月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 71 },
  { id: 11016, word: "June", meaning: "6月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 6 },
  { id: 11017, word: "July", meaning: "7月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11018, word: "August", meaning: "8月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11019, word: "September", meaning: "9月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 1 },
  { id: 11020, word: "October", meaning: "10月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11021, word: "November", meaning: "11月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 6 },
  { id: 11022, word: "December", meaning: "12月", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 6 },
  // 季節
  { id: 11023, word: "spring", meaning: "春、ばね・ぜんまい、泉", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 15 },
  { id: 11024, word: "summer", meaning: "夏", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 23 },
  { id: 11025, word: "autumn", meaning: "秋", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 8 },
  { id: 11026, word: "fall", meaning: "秋、滝、落ちる", partOfSpeech: "名詞・動詞", category: "曜日・月・季節に関する単語", appearanceCount: 1 },
  { id: 11027, word: "winter", meaning: "冬", partOfSpeech: "名詞", category: "曜日・月・季節に関する単語", appearanceCount: 18 },
];

// 動物に関する単語
const animalWords = [
  // 基本概念
  { id: 11101, word: "animal", meaning: "動物", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 18 },
  // ペット・家畜
  { id: 11102, word: "dog", meaning: "犬", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 14 },
  { id: 11103, word: "cat", meaning: "猫", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 2 },
  { id: 11104, word: "rabbit", meaning: "うさぎ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11105, word: "horse", meaning: "馬", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11106, word: "cow", meaning: "牛", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11107, word: "pig", meaning: "豚", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11108, word: "sheep", meaning: "羊（複数形: sheep）", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 11 },
  // 野生動物
  { id: 11109, word: "lion", meaning: "ライオン", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 2 },
  { id: 11110, word: "tiger", meaning: "トラ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11111, word: "bear", meaning: "クマ、～を産む", partOfSpeech: "名詞・動詞", category: "動物に関する単語", appearanceCount: 1 },
  { id: 11112, word: "elephant", meaning: "ゾウ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 1 },
  { id: 11113, word: "monkey", meaning: "サル", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11114, word: "giraffe", meaning: "キリン", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  // 鳥類
  { id: 11115, word: "bird", meaning: "鳥", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 28 },
  { id: 11116, word: "crane", meaning: "ツル", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  // その他
  { id: 11117, word: "snake", meaning: "ヘビ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11118, word: "frog", meaning: "カエル", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11119, word: "bee", meaning: "ミツバチ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11120, word: "butterfly", meaning: "チョウ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11121, word: "ant", meaning: "アリ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
];

// 自然・天気に関する単語
const natureWeatherWords = [
  // 天気・気候
  { id: 11201, word: "weather", meaning: "天気、天候", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 9 },
  { id: 11202, word: "temperature", meaning: "温度、気温", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 11 },
  { id: 11203, word: "hot", meaning: "暑い、熱い、辛い", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 12 },
  { id: 11204, word: "warm", meaning: "暖かい、温かい", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 10 },
  { id: 11205, word: "cool", meaning: "涼しい、冷たい", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 4 },
  { id: 11206, word: "cold", meaning: "寒い、冷たい、風邪", partOfSpeech: "形容詞・名詞", category: "自然・天気に関する単語", appearanceCount: 20 },
  { id: 11207, word: "sunny", meaning: "晴れた", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 4 },
  { id: 11208, word: "cloudy", meaning: "曇った", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 4 },
  { id: 11209, word: "rainy", meaning: "雨の", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 1 },
  { id: 11210, word: "snowy", meaning: "雪の", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 0 },
  { id: 11211, word: "rain", meaning: "雨、雨が降る", partOfSpeech: "名詞・動詞", category: "自然・天気に関する単語", appearanceCount: 8 },
  { id: 11212, word: "snow", meaning: "雪、雪が降る", partOfSpeech: "名詞・動詞", category: "自然・天気に関する単語", appearanceCount: 83 },
  { id: 11213, word: "cloud", meaning: "雲", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 3 },
  { id: 11214, word: "wind", meaning: "風", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 9 },
  { id: 11215, word: "typhoon", meaning: "台風", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 0 },
  // 自然（宇宙・地球）
  { id: 11216, word: "earth", meaning: "地球", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 38 },
  { id: 11217, word: "sky", meaning: "空", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 11 },
  { id: 11218, word: "sun", meaning: "太陽", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 21 },
  { id: 11219, word: "star", meaning: "星、スター、人気者", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 15 },
  // 自然（地形）
  { id: 11220, word: "mountain", meaning: "山［Mt.～ ～山］", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 19 },
  { id: 11221, word: "river", meaning: "川、河川", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 38 },
  { id: 11222, word: "lake", meaning: "湖、湖水", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 44 },
  { id: 11223, word: "sea", meaning: "海、海の", partOfSpeech: "名詞、形容詞", category: "自然・天気に関する単語", appearanceCount: 24 },
  { id: 11224, word: "ocean", meaning: "海、海洋、大洋", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 4 },
  // 自然（植物）
  { id: 11225, word: "forest", meaning: "森、森林", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 9 },
  { id: 11226, word: "tree", meaning: "木", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 115 },
  { id: 11227, word: "plant", meaning: "植物、草花を植える", partOfSpeech: "名詞・動詞", category: "自然・天気に関する単語", appearanceCount: 19 },
  { id: 11228, word: "flower", meaning: "花", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 5 },
];

// 学校に関する単語
const schoolWords = [
  // 基本概念
  { id: 11301, word: "school", meaning: "学校", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 144 },
  { id: 11302, word: "class", meaning: "クラス・学級、授業、", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 43 },
  { id: 11303, word: "lesson", meaning: "授業、レッスン、課、習い事", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 25 },
  { id: 11304, word: "subject", meaning: "科目、教科", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 1 },
  { id: 11305, word: "test", meaning: "試験、テスト、検査、～を試す", partOfSpeech: "名詞・動詞", category: "学校に関する単語", appearanceCount: 18 },
  { id: 11306, word: "exam", meaning: "試験、テスト", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  { id: 11307, word: "homework", meaning: "宿題", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 9 },
  // 科目
  { id: 11308, word: "English", meaning: "英語", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 82 },
  { id: 11309, word: "math", meaning: "数学", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 7 },
  { id: 11310, word: "science", meaning: "理科、科学", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 22 },
  { id: 11311, word: "history", meaning: "歴史", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 28 },
  { id: 11312, word: "music", meaning: "音楽", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 26 },
  { id: 11313, word: "art", meaning: "美術、芸術", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 12 },
  //人
  { id: 11316, word: "student", meaning: "生徒、学生", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 122 },
  { id: 11317, word: "teacher", meaning: "先生、教師", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 23 },
  // 文房具・教材
  { id: 11318, word: "book", meaning: "本", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 92 },
  { id: 11319, word: "notebook", meaning: "ノート", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 5 },
  { id: 11320, word: "pen", meaning: "ペン", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 1 },
  { id: 11321, word: "pencil", meaning: "鉛筆", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 1 },
  { id: 11322, word: "eraser", meaning: "消しゴム", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  // 場所
  { id: 11323, word: "classroom", meaning: "教室", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 13 },
];

// 国名や地域に関する単語
const countryWords = [
  // 基本概念
  { id: 11401, word: "country", meaning: "国、田舎", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 79 },
  // 大陸・地域
  { id: 11402, word: "Asia", meaning: "アジア", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 16 },
  { id: 11403, word: "Europe", meaning: "ヨーロッパ", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 11 },
  { id: 11404, word: "Africa", meaning: "アフリカ", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 7 },
  // 国名（入試登場回数の多い順）
  { id: 11405, word: "Japan", meaning: "日本", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 140 },
  { id: 11406, word: "America", meaning: "アメリカ（合衆国）", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 32 },
  { id: 11407, word: "U.S.", meaning: "（theを付けて）アメリカ合衆国", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
  { id: 11408, word: "Australia", meaning: "オーストラリア（大陸）", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 25 },
  { id: 11409, word: "Canada", meaning: "カナダ", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 15 },
  { id: 11410, word: "Germany", meaning: "ドイツ", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 10 },
  { id: 11411, word: "Korea", meaning: "韓国・朝鮮", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 10 },
  { id: 11412, word: "China", meaning: "中国", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 7 },
  { id: 11413, word: "France", meaning: "フランス", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 5 },
  { id: 11414, word: "U.K.", meaning: "（theを付けて）イギリス", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 2 },
  { id: 11415, word: "Brazil", meaning: "ブラジル", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 1 },
  { id: 11416, word: "India", meaning: "インド", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 1 },
  { id: 11417, word: "Italy", meaning: "イタリア", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
  { id: 11418, word: "Russia", meaning: "ロシア", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
  { id: 11419, word: "Spain", meaning: "スペイン", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
];

// ============================================
// 機能語（英文でよく登場する重要語）
// ============================================

// 冠詞
const articleWords = [
  // { id: 20001, word: "a", meaning: "1つの", partOfSpeech: "冠詞", category: "冠詞" },
];

// 代名詞
const pronounWords = [
  // { id: 20101, word: "I", meaning: "私は", partOfSpeech: "代名詞", category: "代名詞" },
];

// 不定代名詞
const indefinitePronounWords = [
  // { id: 20201, word: "something", meaning: "何か", partOfSpeech: "代名詞", category: "不定代名詞" },
];

// 副詞（否定・程度・焦点）
const adverbWords = [
  // { id: 20301, word: "not", meaning: "〜ない", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）" },
];

// 疑問詞
const questionWords = [
  // { id: 20401, word: "what", meaning: "何", partOfSpeech: "疑問詞", category: "疑問詞" },
];

// 限定詞（数量）
const quantifierWords = [
  // { id: 20501, word: "many", meaning: "たくさんの", partOfSpeech: "限定詞", category: "限定詞（数量）" },
];

// 前置詞
const prepositionWords = [
  // { id: 20601, word: "in", meaning: "〜の中に", partOfSpeech: "前置詞", category: "前置詞" },
];

// 助動詞・助動詞的表現
const auxiliaryWords = [
  // { id: 20701, word: "can", meaning: "〜できる", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現" },
];

// 接続詞
const conjunctionWords = [
  // { id: 20801, word: "and", meaning: "そして", partOfSpeech: "接続詞", category: "接続詞" },
];

// 関係代名詞
const relativeWords = [
  // { id: 20901, word: "which", meaning: "〜するところの", partOfSpeech: "関係代名詞", category: "関係代名詞" },
];

// 間投詞
const interjectionWords = [
  // { id: 21001, word: "hello", meaning: "こんにちは", partOfSpeech: "間投詞", category: "間投詞" },
];

// ============================================
// レベル別単語（入試対策）
// ============================================

// LEVEL1 超重要単語400
const level1Words = [
  // { id: 30001, word: "example", meaning: "例", partOfSpeech: "名詞", category: "Group1 超頻出600" },
];

// LEVEL2 重要単語300
const level2Words = [
  // { id: 30401, word: "example", meaning: "例", partOfSpeech: "名詞", category: "Group2 頻出200" },
];

// LEVEL3 差がつく単語200
const level3Words = [
  // { id: 30701, word: "example", meaning: "例", partOfSpeech: "名詞", category: "Group3 ハイレベル100" },
];

// LEVEL4 私立高校入試レベル
const level4Words = [
  // { id: 31001, word: "example", meaning: "例", partOfSpeech: "名詞", category: "Group3 ハイレベル100" },
];

// LEVEL5 難関私立高校入試レベル
const level5Words = [
  // { id: 31301, word: "example", meaning: "例", partOfSpeech: "名詞", category: "Group3 ハイレベル100" },
];

// ============================================
// ユーティリティ関数
// ============================================

/**
 * すべての単語を取得
 * @returns {Array} 全単語の配列
 */
function getAllVocabulary() {
  return [
    // 小学生で習った単語
    ...familyHomeWords,
    ...numberWords,
    ...dailyItemsInstrumentsWords,
    ...bodyWords,
    ...colorWords,
    ...foodDrinkWords,
    ...townFacilityWords,
    ...vehicleWords,
    ...occupationWords,
    ...sportsWords,
    ...calendarWords,
    ...animalWords,
    ...natureWeatherWords,
    ...schoolWords,
    ...countryWords,
    // 機能語
    ...articleWords,
    ...pronounWords,
    ...indefinitePronounWords,
    ...adverbWords,
    ...questionWords,
    ...quantifierWords,
    ...prepositionWords,
    ...auxiliaryWords,
    ...conjunctionWords,
    ...relativeWords,
    ...interjectionWords,
    // レベル別単語
    ...level1Words,
    ...level2Words,
    ...level3Words,
    ...level4Words,
    ...level5Words,
  ];
}

/**
 * カテゴリー名で単語を取得
 * @param {string} categoryName - カテゴリー名
 * @returns {Array} 該当カテゴリーの単語配列
 */
function getVocabularyByCategory(categoryName) {
  const categoryMap = {
    // 小学生で習った単語
    '家族・家に関する単語': familyHomeWords,
    '数字に関する単語': numberWords,
    '日用品・楽器に関する単語': dailyItemsInstrumentsWords,
    '体に関する単語': bodyWords,
    '色に関する単語': colorWords,
    '食べ物・飲み物に関する単語': foodDrinkWords,
    '町の施設に関する単語': townFacilityWords,
    '乗り物に関する単語': vehicleWords,
    '職業に関する単語': occupationWords,
    'スポーツに関する単語': sportsWords,
    '曜日・月・季節に関する単語': calendarWords,
    '動物に関する単語': animalWords,
    '自然・天気に関する単語': natureWeatherWords,
    '学校に関する単語': schoolWords,
    '国名や地域に関する単語': countryWords,
    // 機能語
    '冠詞': articleWords,
    '代名詞': pronounWords,
    '不定代名詞': indefinitePronounWords,
    '副詞（否定・程度・焦点）': adverbWords,
    '疑問詞': questionWords,
    '限定詞（数量）': quantifierWords,
    '前置詞': prepositionWords,
    '助動詞・助動詞的表現': auxiliaryWords,
    '接続詞': conjunctionWords,
    '関係代名詞': relativeWords,
    '間投詞': interjectionWords,
  };
  
  return categoryMap[categoryName] || [];
}

/**
 * 小学生で習った単語をすべて取得
 * @returns {Array} 小学生で習った単語の配列
 */
function getElementaryVocabulary() {
  return [
    ...familyHomeWords,
    ...numberWords,
    ...dailyItemsInstrumentsWords,
    ...bodyWords,
    ...colorWords,
    ...foodDrinkWords,
    ...townFacilityWords,
    ...vehicleWords,
    ...occupationWords,
    ...sportsWords,
    ...calendarWords,
    ...animalWords,
    ...natureWeatherWords,
    ...schoolWords,
    ...countryWords,
  ];
}

/**
 * 機能語をすべて取得
 * @returns {Array} 機能語の配列
 */
function getFunctionVocabulary() {
  return [
    ...articleWords,
    ...pronounWords,
    ...indefinitePronounWords,
    ...adverbWords,
    ...questionWords,
    ...quantifierWords,
    ...prepositionWords,
    ...auxiliaryWords,
    ...conjunctionWords,
    ...relativeWords,
    ...interjectionWords,
  ];
}

/**
 * レベル別単語を取得
 * @param {number} level - レベル番号（1-5）
 * @returns {Array} 該当レベルの単語配列
 */
function getVocabularyByLevel(level) {
  const levelMap = {
    1: level1Words,
    2: level2Words,
    3: level3Words,
    4: level4Words,
    5: level5Words,
  };
  
  return levelMap[level] || [];
}

// ============================================
// 単語データテンプレート（コピペ用）
// ============================================
/*
単語を追加する際は、以下のテンプレートをコピーして使用してください：

{
  "id": 10001,           // ユニークなID（必須）
  "word": "example",     // 英単語（必須）
  "meaning": "例",       // 日本語の意味（必須）
  "partOfSpeech": "名詞", // 品詞（必須）
  "category": "カテゴリー名", // カテゴリー名（必須）
  "appearanceCount": 0,  // 入試登場回数（オプション）
  "example": {           // 例文（オプション）
    "english": "This is an example.",
    "japanese": "これは例です。"
  }
}

ID番号の割り当てルール：
- 10001-10099: 家族・家に関する単語
- 10101-10199: 数字に関する単語
- 10201-10299: 日用品・楽器に関する単語
- 10301-10399: 体に関する単語
- 10401-10499: 色に関する単語
- 10501-10599: 食べ物・飲み物に関する単語
- 10601-10699: 町の施設に関する単語
- 10701-10799: 乗り物に関する単語
- 10801-10899: 職業に関する単語
- 10901-10999: スポーツに関する単語
- 11001-11099: 曜日・月・季節に関する単語
- 11101-11199: 動物に関する単語
- 11201-11299: 自然・天気に関する単語
- 11301-11399: 学校に関する単語
- 11401-11499: 国名や地域に関する単語
- 20001-20099: 冠詞
- 20101-20199: 代名詞
- 20201-20299: 不定代名詞
- 20301-20399: 副詞（否定・程度・焦点）
- 20401-20499: 疑問詞
- 20501-20599: 限定詞（数量）
- 20601-20699: 前置詞
- 20701-20799: 助動詞・助動詞的表現
- 20801-20899: 接続詞
- 20901-20999: 関係代名詞
- 21001-21099: 間投詞
- 30001-30399: LEVEL1 超重要単語400
- 30401-30699: LEVEL2 重要単語300
- 30701-30899: LEVEL3 差がつく単語200
- 31001-31299: LEVEL4 私立高校入試レベル
- 31301-31599: LEVEL5 難関私立高校入試レベル
*/

