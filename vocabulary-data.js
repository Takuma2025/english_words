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
  { id: 10012, word: "brother", meaning: "兄弟、兄、弟", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 23 },
  { id: 10013, word: "sister", meaning: "姉妹、姉、妹", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 52 }, 
  { id: 10007, word: "grandfather", meaning: "祖父、おじいさん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 16 },
  { id: 10008, word: "grandmother", meaning: "祖母、おばあさん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 13 },
  { id: 10044, word: "grandpa", meaning: "おじいさん、おじいちゃん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 2 },
  { id: 10045, word: "grandma", meaning: "おばあさん、おばあちゃん", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 2 },
  { id: 10009, word: "grandparent", meaning: "祖父母", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 7 },
  { id: 10010, word: "uncle", meaning: "おじ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 13 },
  { id: 10011, word: "aunt", meaning: "おば", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 7 },
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
  { id: 10031, word: "table", meaning: "テーブル、食卓、表/一覧表", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 27 },
  { id: 10032, word: "desk", meaning: "机", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 8 },
  { id: 10033, word: "chair", meaning: "いす", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 1 },
  { id: 10034, word: "sofa", meaning: "ソファ", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10035, word: "bed", meaning: "ベッド", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10036, word: "light", meaning: "光、明るさ、明かり、照明、電灯", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 17 },
  { id: 10037, word: "lamp", meaning: "ランプ、明かり、電気スタンド", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10038, word: "shower", meaning: "シャワー", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10039, word: "sink", meaning: "洗面台、流し", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10046, word: "air conditioner", meaning: "エアコン、空調設備", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
  { id: 10047, word: "shelf", meaning: "棚、本棚", partOfSpeech: "名詞", category: "家族・家に関する単語", appearanceCount: 0 },
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
  { id: 10148, word: "eleventh", meaning: "11番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10149, word: "twelfth", meaning: "12番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10150, word: "thirteenth", meaning: "13番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10151, word: "fourteenth", meaning: "14番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10152, word: "fifteenth", meaning: "15番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10153, word: "sixteenth", meaning: "16番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10154, word: "seventeenth", meaning: "17番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 3 },
  { id: 10155, word: "eighteenth", meaning: "18番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 2 },
  { id: 10156, word: "nineteenth", meaning: "19番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10157, word: "twentieth", meaning: "20番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  { id: 10158, word: "thirtieth", meaning: "30番目（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 0 },
  // その他
  { id: 10143, word: "half", meaning: "半分（の）", partOfSpeech: "名詞・形容詞", category: "数字に関する単語", appearanceCount: 11 },
  { id: 10144, word: "quarter", meaning: "4分の1、15分", partOfSpeech: "名詞", category: "数字に関する単語", appearanceCount: 1 },
  { id: 10145, word: "number", meaning: "数、番号", partOfSpeech: "名詞", category: "数字に関する単語", appearanceCount: 56 },
  { id: 10146, word: "twice", meaning: "2度・2回、2倍", partOfSpeech: "副詞", category: "数字に関する単語", appearanceCount: 13 },
  { id: 10159, word: "double", meaning: "2人2倍（の）、2重（の）、2倍にする", partOfSpeech: "名詞・形容詞・動詞", category: "数字に関する単語", appearanceCount: 0 },
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
  { id: 10317, word: "finger", meaning: "指（手の親指はthumb）", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // 胴体
  { id: 10318, word: "heart", meaning: "心臓、心", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10319, word: "stomach", meaning: "胃、おなか", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // 下半身
  { id: 10320, word: "leg", meaning: "脚", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 5 },
  { id: 10321, word: "knee", meaning: "ひざ", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10322, word: "foot", meaning: "足（足首から下）（複数形: feet）", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  { id: 10324, word: "toe", meaning: "足の指", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
  // その他
  { id: 10323, word: "skin", meaning: "皮膚、皮", partOfSpeech: "名詞", category: "体に関する単語", appearanceCount: 0 },
];

// 色に関する単語
const colorWords = [
  // 基本概念
  { id: 10400, word: "color", meaning: "色、色彩", partOfSpeech: "名詞", category: "色に関する単語", appearanceCount: 7 },
  // 基本色
  { id: 10401, word: "red", meaning: "赤（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 1 },
  { id: 10402, word: "blue", meaning: "青（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 2 },
  { id: 10403, word: "yellow", meaning: "黄色（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 2 },
  { id: 10404, word: "green", meaning: "緑（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 7 },
  { id: 10405, word: "black", meaning: "黒（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 5 },
  { id: 10406, word: "white", meaning: "白（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 12 },
  { id: 10407, word: "brown", meaning: "茶色（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 5 },
  // 特殊色
  { id: 10408, word: "orange", meaning: "オレンジ色（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 0 },
  { id: 10409, word: "pink", meaning: "ピンク（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 0 },
  { id: 10410, word: "purple", meaning: "紫（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 0 },
  { id: 10411, word: "gold", meaning: "金色（の）", partOfSpeech: "名詞・形容詞", category: "色に関する単語", appearanceCount: 13 },
];

// 食べ物・飲み物に関する単語
const foodDrinkWords = [
  // 基本概念
  { id: 10501, word: "food", meaning: "食べ物、食物", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 138 },
  { id: 10502, word: "drink", meaning: "飲み物、飲む", partOfSpeech: "名詞・動詞", category: "食べ物・飲み物に関する単語", appearanceCount: 30 },
  { id: 10503, word: "dish", meaning: "皿、料理", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 4},
  { id: 10551, word: "fruit", meaning: "果物", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 3 },
  { id: 10552, word: "vegetable", meaning: "野菜", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 15 },
  { id: 10553, word: "cooking", meaning: "料理、調理", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 10 },
  { id: 10554, word: "snack", meaning: "おやつ、軽食", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10555, word: "seafood", meaning: "魚介類", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  // 飲み物
  { id: 10504, word: "water", meaning: "水", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 64 },
  { id: 10505, word: "tea", meaning: "お茶", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 24 },
  { id: 10506, word: "coffee", meaning: "コーヒー", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 10 },
  { id: 10507, word: "milk", meaning: "牛乳", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 4 },
  { id: 10508, word: "juice", meaning: "ジュース", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10509, word: "soda", meaning: "ソーダ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10556, word: "ice", meaning: "氷", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 3 },
  { id: 10557, word: "yogurt", meaning: "ヨーグルト", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
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
  { id: 10558, word: "spaghetti", meaning: "スパゲッティ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10559, word: "rice ball", meaning: "おにぎり", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
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
  { id: 10560, word: "pumpkin", meaning: "かぼちゃ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  // 果物
  { id: 10530, word: "apple", meaning: "りんご", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 2 },
  { id: 10531, word: "banana", meaning: "バナナ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 1 },
  { id: 10532, word: "grape", meaning: "ぶどう", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 2 },
  { id: 10533, word: "lemon", meaning: "レモン", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10534, word: "melon", meaning: "メロン", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10535, word: "peach", meaning: "もも", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10536, word: "pineapple", meaning: "パイナップル", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10537, word: "strawberry", meaning: "いちご", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10561, word: "cherry", meaning: "さくらんぼ", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 3 },
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
  { id: 10562, word: "curry", meaning: "カレー", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 10 },
  { id: 10563, word: "curry and rice", meaning: "カレーライス", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10564, word: "pudding", meaning: "プリン", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
  { id: 10565, word: "candy", meaning: "キャンディー", partOfSpeech: "名詞", category: "食べ物・飲み物に関する単語", appearanceCount: 0 },
];

// 町の施設に関する単語
const townFacilityWords = [
  // 交通施設
  { id: 10601, word: "station", meaning: "駅、署［局・所］", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 35 },
  { id: 10602, word: "road", meaning: "道路、道", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 18 },
  { id: 10603, word: "street", meaning: "通り、道、街路", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 4 },
  { id: 10604, word: "bridge", meaning: "橋", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10626, word: "airport", meaning: "空港", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 2 },
  // 公共施設
  { id: 10605, word: "library", meaning: "図書館、図書室", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 15 },
  { id: 10606, word: "museum", meaning: "博物館、美術館", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 49 },
  { id: 10607, word: "park", meaning: "公園、遊園地", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 44 },
  { id: 10608, word: "post office", meaning: "郵便局", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 3 },
  { id: 10609, word: "police station(/office)", meaning: "警察署", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10610, word: "hospital", meaning: "病院", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10627, word: "fire station", meaning: "消防署", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10628, word: "city hall", meaning: "市役所、市庁舎", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 4 },
  { id: 10629, word: "hall", meaning: "ホール、集会所、大広間、講堂", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 5 },
  // 商業施設
  { id: 10611, word: "shop", meaning: "店、買い物をする", partOfSpeech: "名詞・動詞", category: "町の施設に関する単語", appearanceCount: 14 },
  { id: 10612, word: "store", meaning: "店、商店、～を蓄える", partOfSpeech: "名詞・動詞", category: "町の施設に関する単語", appearanceCount: 10 },
  { id: 10613, word: "supermarket", meaning: "スーパーマーケット", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 8 },
  { id: 10636, word: "department store", meaning: "デパート、百貨店", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 7 },
  { id: 10614, word: "convenience store", meaning: "コンビニエンスストア", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10615, word: "market", meaning: "市場", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10616, word: "restaurant", meaning: "レストラン、料理店", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 11 },
  { id: 10617, word: "cafe", meaning: "カフェ、喫茶店", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10618, word: "hotel", meaning: "ホテル", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10619, word: "bank", meaning: "銀行", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10634, word: "company", meaning: "会社、企業", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 7 },
  { id: 10635, word: "office", meaning: "事務所、会社、オフィス", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 3 },
  { id: 10637, word: "bookstore", meaning: "本屋、書店", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10638, word: "cafeteria", meaning: "カフェテリア、食堂", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 3 },
  { id: 10639, word: "factory", meaning: "工場", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 2 },
  { id: 10640, word: "gas station", meaning: "ガソリンスタンド", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  // 娯楽施設
  { id: 10620, word: "movie", meaning: "映画", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 19 },
  { id: 10621, word: "theater", meaning: "劇場、映画館", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 19 },
  { id: 10622, word: "amusement park", meaning: "遊園地", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10623, word: "aquarium", meaning: "水族館", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10630, word: "stadium", meaning: "スタジアム、競技場", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 5 },
  { id: 10631, word: "zoo", meaning: "動物園", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 3 },
  { id: 10632, word: "castle", meaning: "城、お城", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 1 },
  { id: 10633, word: "tower", meaning: "塔、タワー", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
  { id: 10641, word: "hot spring", meaning: "温泉", partOfSpeech: "名詞", category: "町の施設に関する単語", appearanceCount: 0 },
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
  { id: 10821, word: "dentist", meaning: "歯科医、歯医者", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10822, word: "vet", meaning: "獣医", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10823, word: "astronaut", meaning: "宇宙飛行士", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 6 },
  { id: 10824, word: "photographer", meaning: "写真家、カメラマン", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 1 },
  { id: 10804, word: "lawyer", meaning: "弁護士", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10805, word: "judge", meaning: "審判、裁判官、～を判断する", partOfSpeech: "名詞・動詞", category: "職業に関する単語", appearanceCount: 7 },
  { id: 10806, word: "pilot", meaning: "パイロット、操縦士", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  // 教育・芸術
  { id: 10807, word: "teacher", meaning: "先生、教師", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 23 },
  { id: 10808, word: "artist", meaning: "芸術家、画家", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 21 },
  { id: 10809, word: "writer", meaning: "作家、筆者", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 3 },
  { id: 10810, word: "singer", meaning: "歌手", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 7 },
  { id: 10811, word: "actor", meaning: "俳優、男優", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 3 },
  { id: 10825, word: "pianist", meaning: "ピアニスト", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 2 },
  { id: 10826, word: "musician", meaning: "音楽家、ミュージシャン、演奏家", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 4 },
  { id: 10827, word: "dancer", meaning: "ダンサー、踊り手", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10828, word: "comedian", meaning: "コメディアン、お笑い芸人", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  // サービス業
  { id: 10812, word: "cook", meaning: "料理人、コック、料理する", partOfSpeech: "名詞・動詞", category: "職業に関する単語", appearanceCount: 10 },
  { id: 10813, word: "driver", meaning: "運転手", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 4 },
  { id: 10814, word: "nurse", meaning: "看護師", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10815, word: "clerk", meaning: "店員、係員、事務員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10816, word: "manager", meaning: "マネージャー、管理者、園長、監督", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10829, word: "flight attendant", meaning: "客室乗務員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10830, word: "florist", meaning: "花屋、花屋の店主（店員）", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  // 公務・法執行
  { id: 10817, word: "police", meaning: "警察", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  { id: 10818, word: "officer", meaning: "事務員、係員、警察官、公務員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 1 },
  { id: 10831, word: "police officer", meaning: "警察官", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 0 },
  // その他
  { id: 10819, word: "farmer", meaning: "農民、農業をする人、農家、農業従事者", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 22 },
  { id: 10820, word: "worker", meaning: "労働者、作業員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 4 },
  { id: 10832, word: "staff", meaning: "スタッフ、職員", partOfSpeech: "名詞", category: "職業に関する単語", appearanceCount: 2 },
];

// スポーツに関する単語
const sportsWords = [
  // 基本概念
  { id: 10901, word: "sport", meaning: "スポーツ、運動競技（sports day 運動会)", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 5 },
  { id: 10915, word: "game", meaning: "ゲーム、試合、競技", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 17 },
  { id: 10916, word: "match", meaning: "試合、マッチ", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 4 },
  { id: 10917, word: "athlete", meaning: "運動選手、アスリート", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  // 球技
  { id: 10902, word: "soccer", meaning: "サッカー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 9 },
  { id: 10903, word: "football", meaning: "アメリカンフットボール、サッカー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10904, word: "basketball", meaning: "バスケットボール", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 5 },
  { id: 10905, word: "volleyball", meaning: "バレーボール", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 2 },
  { id: 10906, word: "tennis", meaning: "テニス", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 10 },
  { id: 10907, word: "baseball", meaning: "野球", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 3 },
  { id: 10908, word: "rugby", meaning: "ラグビー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 5 },
  { id: 10909, word: "badminton", meaning: "バドミントン", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10918, word: "table tennis", meaning: "卓球", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  // その他のスポーツ
  { id: 10910, word: "swimming", meaning: "水泳", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 11 },
  { id: 10911, word: "dance", meaning: "ダンス、踊り、踊る", partOfSpeech: "名詞・動詞", category: "スポーツに関する単語", appearanceCount: 3 },
  { id: 10919, word: "dancing", meaning: "ダンス、踊ること", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10920, word: "cycling", meaning: "サイクリング、自転車競技", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 4 },
  { id: 10921, word: "surfing", meaning: "サーフィン", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10922, word: "relay", meaning: "リレー、中継", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10912, word: "marathon", meaning: "マラソン", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10913, word: "skate", meaning: "スケート、スケートをする", partOfSpeech: "名詞・動詞", category: "スポーツに関する単語", appearanceCount: 0 },
  { id: 10914, word: "skiing", meaning: "スキー", partOfSpeech: "名詞", category: "スポーツに関する単語", appearanceCount: 0 },
];

// 時間・曜日・月・季節に関する単語
const calendarWords = [
  // 基本概念
  { id: 11001, word: "year", meaning: "年", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 135 },
  { id: 11028, word: "century", meaning: "世紀、100年", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 16 },
  { id: 11002, word: "season", meaning: "季節", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 25 },
  { id: 11003, word: "month", meaning: "（暦）月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 20 },
  { id: 11029, word: "week", meaning: "週、1週間", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 35 },
  { id: 11030, word: "weekend", meaning: "週末", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 17 },
  { id: 11031, word: "day", meaning: "日、1日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 96 },
  { id: 11032, word: "date", meaning: "日付、デート", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 1 },
  { id: 11033, word: "calendar", meaning: "カレンダー、暦", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 0 },
  // 曜日
  { id: 11004, word: "Sunday", meaning: "日曜日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 23 },
  { id: 11005, word: "Monday", meaning: "月曜日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11006, word: "Tuesday", meaning: "火曜日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 3 },
  { id: 11007, word: "Wednesday", meaning: "水曜日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11008, word: "Thursday", meaning: "木曜日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11009, word: "Friday", meaning: "金曜日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 11 },
  { id: 11010, word: "Saturday", meaning: "土曜日", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 28 },
  // 月
  { id: 11011, word: "January", meaning: "1月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 3 },
  { id: 11012, word: "February", meaning: "2月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 0 },
  { id: 11013, word: "March", meaning: "3月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 4 },
  { id: 11014, word: "April", meaning: "4月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11015, word: "May", meaning: "5月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 71 },
  { id: 11016, word: "June", meaning: "6月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 6 },
  { id: 11017, word: "July", meaning: "7月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11018, word: "August", meaning: "8月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11019, word: "September", meaning: "9月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 1 },
  { id: 11020, word: "October", meaning: "10月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 2 },
  { id: 11021, word: "November", meaning: "11月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 6 },
  { id: 11022, word: "December", meaning: "12月", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 6 },
  // 季節
  { id: 11023, word: "spring", meaning: "春、ばね・ぜんまい、泉", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 15 },
  { id: 11024, word: "summer", meaning: "夏", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 23 },
  { id: 11025, word: "autumn", meaning: "秋", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 8 },
  { id: 11026, word: "fall", meaning: "秋、滝、落ちる", partOfSpeech: "名詞・動詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 1 },
  { id: 11027, word: "winter", meaning: "冬", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 18 },
  // 時間帯
  { id: 11034, word: "morning", meaning: "朝、午前", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 29 },
  { id: 11044, word: "a.m.", meaning: "午前（ante meridiem）", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 0 },
  { id: 11035, word: "noon", meaning: "正午、昼", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 6 },
  { id: 11036, word: "afternoon", meaning: "午後", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 13 },
  { id: 11045, word: "p.m.", meaning: "午後（post meridiem）", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 1 },
  { id: 11037, word: "evening", meaning: "夕方、晩", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 27 },
  { id: 11038, word: "night", meaning: "夜", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 12 },
  { id: 11039, word: "midnight", meaning: "真夜中、午前0時", partOfSpeech: "名詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 0 },
  { id: 11040, word: "tonight", meaning: "今夜、今晩", partOfSpeech: "名詞・副詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 1 },
  // 相対的な時間
  { id: 11041, word: "yesterday", meaning: "昨日、きのう", partOfSpeech: "名詞・副詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 15 },
  { id: 11042, word: "today", meaning: "今日、きょう", partOfSpeech: "名詞・副詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 64 },
  { id: 11043, word: "tomorrow", meaning: "明日、あした", partOfSpeech: "名詞・副詞", category: "時間・曜日・月・季節に関する単語", appearanceCount: 20 },
];

// 動物に関する単語
const animalWords = [
  // 基本概念
  { id: 11101, word: "animal", meaning: "動物", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 18 },
  { id: 11122, word: "pet", meaning: "ペット、愛玩動物", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 1 },
  // ペット・家畜
  { id: 11102, word: "dog", meaning: "犬", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 14 },
  { id: 11103, word: "cat", meaning: "猫", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 2 },
  { id: 11104, word: "rabbit", meaning: "うさぎ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11105, word: "horse", meaning: "馬", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11106, word: "cow", meaning: "牛", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11107, word: "pig", meaning: "豚", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11108, word: "sheep", meaning: "羊（複数形: sheep）", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 11 },
  { id: 11123, word: "mouse", meaning: "ネズミ（複数形: mice）", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11124, word: "turtle", meaning: "カメ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  // 野生動物
  { id: 11109, word: "lion", meaning: "ライオン", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 2 },
  { id: 11110, word: "tiger", meaning: "トラ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11111, word: "bear", meaning: "クマ、～を産む", partOfSpeech: "名詞・動詞", category: "動物に関する単語", appearanceCount: 1 },
  { id: 11112, word: "elephant", meaning: "ゾウ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 1 },
  { id: 11113, word: "monkey", meaning: "サル", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11114, word: "giraffe", meaning: "キリン", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11125, word: "deer", meaning: "シカ（複数形: deer）", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11126, word: "fox", meaning: "キツネ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11127, word: "koala", meaning: "コアラ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11128, word: "panda", meaning: "パンダ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  // 鳥類
  { id: 11115, word: "bird", meaning: "鳥", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 28 },
  { id: 11116, word: "crane", meaning: "ツル", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11129, word: "penguin", meaning: "ペンギン", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 18 },
  // その他
  { id: 11117, word: "snake", meaning: "ヘビ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11118, word: "frog", meaning: "カエル", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11119, word: "bee", meaning: "ミツバチ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11120, word: "butterfly", meaning: "チョウ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11121, word: "ant", meaning: "アリ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11130, word: "dolphin", meaning: "イルカ", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
  { id: 11131, word: "octopus", meaning: "タコ（複数形: octuses/octopi）", partOfSpeech: "名詞", category: "動物に関する単語", appearanceCount: 0 },
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
  { id: 11229, word: "windy", meaning: "風の強い、風のある", partOfSpeech: "形容詞", category: "自然・天気に関する単語", appearanceCount: 1 },
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
  { id: 11230, word: "planet", meaning: "惑星", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 5 },
  { id: 11231, word: "rainbow", meaning: "虹", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 0 },
  // 自然（地形）
  { id: 11220, word: "mountain", meaning: "山［Mt.～ ～山］", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 19 },
  { id: 11232, word: "hill", meaning: "丘", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 1 },
  { id: 11221, word: "river", meaning: "川、河川", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 38 },
  { id: 11222, word: "lake", meaning: "湖、湖水", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 44 },
  { id: 11233, word: "pond", meaning: "池", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 0 },
  { id: 11223, word: "sea", meaning: "海、海の", partOfSpeech: "名詞、形容詞", category: "自然・天気に関する単語", appearanceCount: 24 },
  { id: 11224, word: "ocean", meaning: "海、海洋、大洋", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 4 },
  { id: 11234, word: "beach", meaning: "砂浜、浜辺、海岸", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 5 },
  // 自然（植物）
  { id: 11225, word: "forest", meaning: "森、森林", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 9 },
  { id: 11226, word: "tree", meaning: "木", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 115 },
  { id: 11227, word: "plant", meaning: "植物、草花を植える", partOfSpeech: "名詞・動詞", category: "自然・天気に関する単語", appearanceCount: 19 },
  { id: 11228, word: "flower", meaning: "花", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 5 },
  { id: 11235, word: "leaf", meaning: "葉（複数形: leaves）", partOfSpeech: "名詞", category: "自然・天気に関する単語", appearanceCount: 12 },
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
  { id: 11337, word: "classmate", meaning: "クラスメート、同級生", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 3 },
  // 文房具・教材
  { id: 11318, word: "book", meaning: "本", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 92 },
  { id: 11319, word: "notebook", meaning: "ノート", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 5 },
  { id: 11340, word: "textbook", meaning: "教科書", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 4 },
   { id: 11320, word: "pen", meaning: "ペン", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 1 },
  { id: 11321, word: "pencil", meaning: "鉛筆", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 1 },
  { id: 11322, word: "eraser", meaning: "消しゴム", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  // 場所
  { id: 11323, word: "classroom", meaning: "教室", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 13 },
  { id: 11341, word: "blackboard", meaning: "黒板", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  { id: 11338, word: "gym", meaning: "体育館、ジム", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 10 },
  { id: 11339, word: "pool", meaning: "プール、池", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  // 科目
  { id: 11324, word: "Japanese", meaning: "日本語、国語", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 77 },
  { id: 11325, word: "social studies", meaning: "社会（社会科）", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  { id: 11326, word: "moral education", meaning: "道徳", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  { id: 11327, word: "home economics", meaning: "家庭科", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  { id: 11328, word: "P.E.", meaning: "体育（Physical Education）", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 1 },
  { id: 11342, word: "calligraphy", meaning: "書道、習字", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
  // 学校の種類・段階
  { id: 11329, word: "high school", meaning: "高校、高等学校", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 26 },
  { id: 11330, word: "elementary school", meaning: "小学校", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 15 },
  { id: 11331, word: "junior high school", meaning: "中学校", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 4 },
  { id: 11332, word: "university", meaning: "大学", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 5 },
  { id: 11333, word: "college", meaning: "大学、短大、専門学校", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 3 },
  // 活動・部活動
  { id: 11334, word: "club", meaning: "クラブ、部活動、同好会", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 58 },
  { id: 11335, word: "brass band", meaning: "吹奏楽部、ブラスバンド", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 3 },
  { id: 11336, word: "chorus", meaning: "合唱、合唱部、合唱団", partOfSpeech: "名詞", category: "学校に関する単語", appearanceCount: 0 },
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
  // 追加の国名・地域名（入試登場回数の多い順）
  { id: 11420, word: "New Zealand", meaning: "ニュージーランド", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 27 },
  { id: 11421, word: "London", meaning: "ロンドン", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 10 },
  { id: 11422, word: "Thailand", meaning: "タイ", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 4 },
  { id: 11423, word: "Egypt", meaning: "エジプト", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 2 },
  { id: 11424, word: "New York", meaning: "ニューヨーク", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 1 },
  { id: 11425, word: "Singapore", meaning: "シンガポール", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
  { id: 11426, word: "Kenya", meaning: "ケニア", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
  { id: 11427, word: "Peru", meaning: "ペルー", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
  { id: 11428, word: "Greece", meaning: "ギリシャ", partOfSpeech: "名詞", category: "国名や地域に関する単語", appearanceCount: 0 },
  // 形容詞・国籍（入試登場回数の多い順）
  { id: 11429, word: "Japanese", meaning: "日本人（の）、日本の、日本語", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 77 },
  { id: 11430, word: "Korean", meaning: "韓国人（の）、韓国の、韓国語", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 7 },
  { id: 11431, word: "French", meaning: "フランス人（の）、フランスの、フランス語", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 6 },
  { id: 11432, word: "Asian", meaning: "アジア人（の）、アジアの", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 4 },
  { id: 11433, word: "Chinese", meaning: "中国人（の）、中国の、中国語", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 4 },
  { id: 11434, word: "American", meaning: "アメリカ人（の）、アメリカの", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 3 },
  { id: 11435, word: "Spanish", meaning: "スペイン人（の）、スペインの、スペイン語", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 1 },
  { id: 11436, word: "Italian", meaning: "イタリア人（の）、イタリアの、イタリア語", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 0 },
  { id: 11437, word: "German", meaning: "①ドイツ人（の）、ドイツの、ドイツ語", partOfSpeech: "名形", category: "国名や地域に関する単語", appearanceCount: 0 },
];

// 方角・方向に関する単語
const directionWords = [
  // 基本方角
  { id: 11501, word: "north", meaning: "北", partOfSpeech: "名詞", category: "方角・方向に関する単語", appearanceCount: 0 },
  { id: 11502, word: "south", meaning: "南", partOfSpeech: "名詞", category: "方角・方向に関する単語", appearanceCount: 2 },
  { id: 11503, word: "east", meaning: "東", partOfSpeech: "名詞", category: "方角・方向に関する単語", appearanceCount: 4 },
  { id: 11504, word: "west", meaning: "西", partOfSpeech: "名詞", category: "方角・方向に関する単語", appearanceCount: 3 },
  // 方角の形容詞形
  { id: 11505, word: "northern", meaning: "北の、北にある、北部の", partOfSpeech: "形容詞", category: "方角・方向に関する単語", appearanceCount: 1 },
  { id: 11506, word: "southern", meaning: "南の、南にある、南部の", partOfSpeech: "形容詞", category: "方角・方向に関する単語", appearanceCount: 1 },
  { id: 11507, word: "eastern", meaning: "東の、東にある、東部の", partOfSpeech: "形容詞", category: "方角・方向に関する単語", appearanceCount: 1 },
  { id: 11508, word: "western", meaning: "西の、西にある、西部の", partOfSpeech: "形容詞", category: "方角・方向に関する単語", appearanceCount: 5 },
  // 方向
  { id: 11509, word: "straight", meaning: "まっすぐな、まっすぐに", partOfSpeech: "形容詞・副詞", category: "方角・方向に関する単語", appearanceCount: 5 },
  { id: 11510, word: "right", meaning: "右（の）、右に、右側", partOfSpeech: "名詞・形容詞・副詞", category: "方角・方向に関する単語", appearanceCount: 116 },
  { id: 11511, word: "left", meaning: "左（の）、左に、左側", partOfSpeech: "名詞・形容詞・副詞", category: "方角・方向に関する単語", appearanceCount: 33 },
];

// 行事・余暇に関する単語
const eventLeisureWords = [
  // 基本概念
  { id: 11601, word: "event", meaning: "行事、イベント、出来事", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 54 },
  { id: 11602, word: "travel", meaning: "旅行、旅行する", partOfSpeech: "名詞・動詞", category: "行事・余暇に関する単語", appearanceCount: 10 },
  { id: 11603, word: "trip", meaning: "旅行、旅", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 4 },
  // 行事・祝日
  { id: 11604, word: "birthday", meaning: "誕生日", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 17 },
  { id: 11605, word: "party", meaning: "パーティー、会、政党", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 13 },
  { id: 11606, word: "festival", meaning: "祭り、お祭り（school festival：文化祭）", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 12 },
  { id: 11607, word: "ceremony", meaning: "式典、儀式", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 10 },
  { id: 11608, word: "New Year", meaning: "新年、正月（New Year's Day：元日、１月１日、New Year's Eve：大みそか）", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 7 },
  { id: 11609, word: "Christmas", meaning: "クリスマス", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11622, word: "field trip", meaning: "遠足、校外学習", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11623, word: "school trip", meaning: "修学旅行、学校旅行", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  // 余暇活動
  { id: 11610, word: "tour", meaning: "ツアー、見学、旅行", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 21 },
  { id: 11611, word: "concert", meaning: "コンサート、演奏会", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 18 },
  { id: 11612, word: "shopping", meaning: "買い物、ショッピング", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 7 },
  { id: 11613, word: "sightseeing", meaning: "観光、見物", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 1 },
  { id: 11614, word: "tournament", meaning: "トーナメント、選手権大会", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 1 },
  { id: 11615, word: "camping", meaning: "キャンプ", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11616, word: "camp", meaning: "キャンプ、野営地、キャンプをする", partOfSpeech: "名詞・動詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11617, word: "firework", meaning: "花火", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11618, word: "hiking", meaning: "ハイキング、登山", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11619, word: "parade", meaning: "パレード、行列", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11620, word: "picnic", meaning: "ピクニック、遠足", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 0 },
  { id: 11621, word: "fishing", meaning: "釣り、魚釣り", partOfSpeech: "名詞", category: "行事・余暇に関する単語", appearanceCount: 10 },
];

// ============================================
// 機能語（英文でよく登場する重要語）
// ============================================

// 冠詞
const articleWords = [
  { id: 20001, word: "a", meaning: "１つの〜、１人の〜", partOfSpeech: "冠詞", category: "冠詞", appearanceCount: 1105, example: { english: "<strong>a</strong> bike", japanese: "（１台の）自転車" } },
  { id: 20002, word: "an", meaning: "１つの〜、１人の〜（母音の音の前で使う）", partOfSpeech: "冠詞", category: "冠詞", appearanceCount: 119, example: { english: "<strong>an</strong> umbrella", japanese: "（1本の）かさ" } },
  { id: 20003, word: "the", meaning: "その〜", partOfSpeech: "冠詞", category: "冠詞", appearanceCount: 2988, example: { english: "Please open <strong>the</strong> window.", japanese: "その窓を開けてください。" } },
  { id: 20004, word: "Mr.", meaning: "〜さん、〜先生（男性に対する敬称）", partOfSpeech: "名詞", category: "冠詞", appearanceCount: 80, example: { english: "<strong>Mr.</strong> Sato", japanese: "佐藤先生（男性）" } },
  { id: 20005, word: "Ms.", meaning: "〜さん、〜先生（女性に対する敬称）", partOfSpeech: "名詞", category: "冠詞", appearanceCount: 19, example: { english: "<strong>Ms.</strong> Brown", japanese: "ブラウンさん（女性）" } },
];

// 代名詞
const pronounWords = [
  { id: 20101, word: "I", meaning: "私は(主格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 1441, example: { english: "<strong>I</strong> like baseball very much.", japanese: "私は野球が大好きです。" } },
  { id: 20102, word: "my", meaning: "私の（所有格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 324, example: { english: "<strong>my</strong> book", japanese: "私の本" } },
  { id: 20103, word: "me", meaning: "私を/に（目的格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 178, example: { english: "Please help <strong>me</strong>.", japanese: "私を助けてください。" } },
  { id: 20104, word: "mine", meaning: "私のもの（所有代名詞）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 6, example: { english: "This pen is <strong>mine</strong>.", japanese: "このペンは私のものです。" } },
  { id: 20105, word: "you", meaning: "あなた（たち）［は/を/に］（主格・目的格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 923, example: { english: "I love <strong>you</strong>.", japanese: "私はあなたを愛しています。" } },
  { id: 20106, word: "your", meaning: "あなた（たち）の（所有格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 232, example: { english: "Is this <strong>your</strong> bag?", japanese: "これはあなたのかばんですか。" } },
  { id: 20107, word: "yours", meaning: "あなた（たち）のもの（所有代名詞）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 9, example: { english: "This book is <strong>yours</strong>.", japanese: "この本はあなたのものです。" } },
  { id: 20108, word: "he", meaning: "彼は（主格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 600, example: { english: "<strong>He</strong> is an English teacher.", japanese: "彼は英語の先生です。" } },
  { id: 20109, word: "his", meaning: "彼の（所有格）、彼のもの（所有代名詞）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 350, example: { english: "That is <strong>his</strong> car.", japanese: "あれは彼の車です。" } },
  { id: 20110, word: "him", meaning: "彼を/に（目的格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 200, example: { english: "I gave <strong>him</strong> a present.", japanese: "私は彼にプレゼントをあげました。" } },
  { id: 20111, word: "she", meaning: "彼女は（主格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 400, example: { english: "<strong>She</strong> is my sister.", japanese: "彼女は私の姉です。" } },
  { id: 20112, word: "her", meaning: "彼女の（所有格）、彼女を/に（目的格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 300, example: { english: "I like <strong>her</strong> smile.", japanese: "私は彼女の笑顔が好きです。" } },
  { id: 20113, word: "hers", meaning: "彼女のもの（所有代名詞）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 20, example: { english: "This bag is <strong>hers</strong>.", japanese: "このかばんは彼女のものです。" } },
  { id: 20114, word: "they", meaning: "彼ら（彼女ら・それら）は（主格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 500, example: { english: "<strong>They</strong> are students.", japanese: "彼らは学生です。" } },
  { id: 20115, word: "their", meaning: "彼ら（彼女ら・それら）の（所有格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 250, example: { english: "<strong>Their</strong> house is big.", japanese: "彼らの家は大きいです。" } },
  { id: 20116, word: "them", meaning: "彼ら（彼女ら・それら）を/に（目的格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 200, example: { english: "I met <strong>them</strong> yesterday.", japanese: "私は昨日彼らに会いました。" } },
  { id: 20117, word: "theirs", meaning: "彼ら（彼女ら）のもの（所有代名詞）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 15, example: { english: "This dog is <strong>theirs</strong>.", japanese: "この犬は彼らのものです。" } },
  { id: 20118, word: "we", meaning: "私たちは（主格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 400, example: { english: "<strong>We</strong> are friends.", japanese: "私たちは友達です。" } },
  { id: 20119, word: "our", meaning: "私たちの（所有格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 200, example: { english: "This is <strong>our</strong> school.", japanese: "これは私たちの学校です。" } },
  { id: 20120, word: "us", meaning: "私たちを/に（目的格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 150, example: { english: "Please tell <strong>us</strong> the story.", japanese: "私たちにその話を聞かせてください。" } },
  { id: 20121, word: "ours", meaning: "私たちのもの（所有代名詞）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 20, example: { english: "This land is <strong>ours</strong>.", japanese: "この土地は私たちのものです。" } },
  { id: 20122, word: "it", meaning: "それは（主格）、それを/に（目的格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 1000, example: { english: "<strong>It</strong> is a cat.", japanese: "それは猫です。" } },
  { id: 20123, word: "its", meaning: "それの、その（所有格）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 100, example: { english: "The dog wagged <strong>its</strong> tail.", japanese: "その犬はしっぽを振りました。" } },
  // 再帰代名詞
  { id: 20128, word: "myself", meaning: "私自身（を/に）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 1, example: { english: "I came here by<strong>myself</strong>.", japanese: "私はひとりでここに来ました。" } },
  { id: 20129, word: "yourself", meaning: "あなた自身（を/に）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 0, example: { english: "Please help <strong>yourself</strong>.", japanese: "（飲食物などを）どうぞご自由にお取りください。" } },
  { id: 20130, word: "himself", meaning: "彼自身（を/に）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 2, example: { english: "\"She is very beautiful.\"he said to<strong>himself</strong>.", japanese: "「彼女は美しい」と彼は（心の中で）思いました。" } },
  { id: 20131, word: "herself", meaning: "彼女自身（を/に）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 0, example: { english: "She made it <strong>herself</strong>.", japanese: "彼女はそれを自分で作りました。" } },
  { id: 20132, word: "itself", meaning: "それ自身（を/に）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 0, example: { english: "The door opened by <strong>itself</strong>.", japanese: "ドアがひとりでに開きました。" } },
  { id: 20133, word: "ourselves", meaning: "私たち自身（を/に）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 0, example: { english: "We enjoyed <strong>ourselves</strong>.", japanese: "私たちは楽しみました。" } },
  { id: 20134, word: "themselves", meaning: "彼ら（彼女ら）自身（を/に）", partOfSpeech: "代名詞", category: "代名詞", appearanceCount: 0, example: { english: "They did it <strong>themselves</strong>.", japanese: "彼らはそれを自分たちでやりました。" } },
  { id: 20124, word: "this", meaning: "これは、この", partOfSpeech: "代名詞・限定詞", category: "代名詞", appearanceCount: 600, example: { english: "<strong>This</strong> is my pen.", japanese: "これは私のペンです。" } },
  { id: 20125, word: "these", meaning: "これらは、これらの", partOfSpeech: "代名詞・限定詞", category: "代名詞", appearanceCount: 100, example: { english: "<strong>These</strong> are my books.", japanese: "これらは私の本です。" } },
  { id: 20126, word: "that", meaning: "あれは、あの、それは", partOfSpeech: "代名詞・限定詞", category: "代名詞", appearanceCount: 800, example: { english: "<strong>That</strong> is a bird.", japanese: "あれは鳥です。" } },
  { id: 20127, word: "those", meaning: "あれらは、あれらの", partOfSpeech: "代名詞・限定詞", category: "代名詞", appearanceCount: 80, example: { english: "<strong>Those</strong> are my friends.", japanese: "あれらは私の友達です。" } },
];

// 不定代名詞
const indefinitePronounWords = [
  { id: 20201, word: "something", meaning: "何か（もの・こと）", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 36, example: { english: "I want <strong>something</strong> to drink.", japanese: "私は何か飲みものがほしいです。" } },
  { id: 20202, word: "anything", meaning: "（否定文で）何も～ない、（疑問文で）何か", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 21, example: { english: "Do you have <strong>anything</strong> to eat?", japanese: "何か食べ物はありますか。" } },
  { id: 20203, word: "nothing", meaning: "何も〜ない", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 8, example: { english: "There is <strong>nothing</strong> in the box.", japanese: "箱の中には何もありません。" } },
  { id: 20204, word: "everything", meaning: "すべてのもの、すべてのこと", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 12, example: { english: "<strong>Everything</strong> is ready.", japanese: "すべての準備ができています。" } },
  { id: 20205, word: "everyone", meaning: "みんな、すべての人", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 23, example: { english: "<strong>Everyone</strong> has a book.", japanese: "みんな本を持っています。" } },
  { id: 20206, word: "someone", meaning: "だれか、ある人", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 8, example: { english: "<strong>Someone</strong> is calling you.", japanese: "だれかがあなたを呼んでいます。" } },
  { id: 20207, word: "anyone", meaning: "（肯定文で）誰でも、（否定文で）誰も、（疑問文で）誰か", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 1, example: { english: "Can <strong>anyone</strong> help me?", japanese: "だれか手伝ってくれますか。" } },
  { id: 20209, word: "somebody", meaning: "だれか、ある人", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 0, example: { english: "<strong>Somebody</strong> is at the door.", japanese: "だれかがドアにいます。" } },
  { id: 20210, word: "nobody", meaning: "だれも〜ない", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 0, example: { english: "<strong>Nobody</strong> knows the answer.", japanese: "だれも答えを知りません。" } },
  { id: 20208, word: "everybody", meaning: "みんな、すべての人", partOfSpeech: "代名詞", category: "不定代名詞", appearanceCount: 1, example: { english: "<strong>Everybody</strong> likes music.", japanese: "みんな音楽が好きです。" } },
];

// 副詞（否定・程度・焦点）
const adverbWords = [
  { id: 20301, word: "not", meaning: "（否定）〜でない", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 127, example: { english: "I do <strong>not</strong> like math.", japanese: "私は数学が好きではありません。" } },
  { id: 20302, word: "never", meaning: "決して〜ない、これまで一度も〜ない", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 18, example: { english: "I <strong>never</strong> study at home on Sunday.", japanese: "私は日曜日に決して家で勉強しません。" } },
  { id: 20303, word: "very", meaning: "とても", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 180, example: { english: "This dog is <strong>very</strong> big.", japanese: "この犬はとても大きいです。" } },
  { id: 20304, word: "so", meaning: "そんなに、とても、そのように", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 213, example: { english: "This movie isn't <strong>so</strong> interesting.", japanese: "この映画はそんなに面白くありません。" } },
  { id: 20305, word: "too", meaning: "〜すぎる、〜も［文末］", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 60, example: { english: "This box is <strong>too</strong> heavy.", japanese: "この箱は重すぎます。" } },
  { id: 20312, word: "quite", meaning: "かなり、まったく、相当、とても", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 2, example: { english: "It's <strong>quite</strong> cold today.", japanese: "今日はかなり寒いです。" } },
  { id: 20306, word: "almost", meaning: "ほとんど", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 11, example: { english: "<strong>Almost</strong> all the students like soccer.", japanese: "ほとんどすべての学生がサッカーが好きです。" } },
  { id: 20307, word: "just", meaning: "ちょうど、ぴったりの、単に、ちょっと", partOfSpeech: "副詞・形容詞", category: "副詞（否定・程度・焦点）", appearanceCount: 21, example: { english: "I have <strong>just</strong> finished my homework.", japanese: "私はちょうど宿題を終わらせたところです。" } },
  { id: 20308, word: "also", meaning: "〜もまた", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 131, example: { english: "I <strong>also</strong> like music.", japanese: "私も音楽が好きです。" } },
  { id: 20309, word: "only", meaning: "〜だけ、唯一の", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 51, example: { english: "I have <strong>only</strong> one book.", japanese: "私は本を１冊しか持っていません。" } },
  { id: 20310, word: "even", meaning: "〜でさえ（すら）", partOfSpeech: "副詞", category: "副詞（否定・程度・焦点）", appearanceCount: 27, example: { english: "He <strong>even</strong> forgot my name.", japanese: "彼は私の名前さえ忘れてしまいました。" } },
  { id: 20311, word: "else", meaning: "ほかに（の）、その他に（の）", partOfSpeech: "副詞・形容詞", category: "副詞（否定・程度・焦点）", appearanceCount: 5, example: { english: "I want to talk to someone <strong>else</strong>.", japanese: "私はほかのだれかと話したい。" } },
];

// 疑問詞
const questionWords = [
  { id: 20401, word: "what", meaning: "何、何の、どんな", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 211, example: { english: "<strong>What</strong> animal is that?", japanese: "あれは何の動物ですか。" } },
  { id: 20402, word: "who", meaning: "だれ", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 126, example: { english: "<strong>Who</strong> is that man?", japanese: "あの男性は誰ですか。" } },
  { id: 20403, word: "which", meaning: "どちら、どれ、どの", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 186, example: { english: "<strong>Which</strong> season do you like?", japanese: "あなたはどの季節が好きですか。" } },
  { id: 20404, word: "when", meaning: "いつ", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 186, example: { english: "<strong>When</strong> did you arrive here?", japanese: "あなたはいつここに到着しましたか。" } },
  { id: 20405, word: "where", meaning: "どこに（で）、どこへ", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 126, example: { english: "<strong>Where</strong> is the station?", japanese: "駅はどこにありますか。" } },
  { id: 20406, word: "why", meaning: "なぜ", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 47, example: { english: "<strong>Why</strong> do you like music?", japanese: "あなたはなぜ音楽が好きなのですか。" } },
  { id: 20407, word: "how", meaning: "どのように（どうやって）、どれくらい", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 171, example: { english: "<strong>How</strong> does he go to school every day?", japanese: "彼は毎日どうやって学校に行きますか。" } },
  { id: 20408, word: "whose", meaning: "だれの", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 5, example: { english: "<strong>Whose</strong> book is this?", japanese: "この本は誰の本ですか。" } },
  { id: 20409, word: "how much", meaning: "いくら（値段・料金をたずねる）", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 6, example: { english: "<strong>How much</strong> is this notebook?", japanese: "このノートはいくらですか。" } },
  { id: 20410, word: "how many", meaning: "いくつ（数をたずねる）", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 6, example: { english: "<strong>How many</strong> books are there in the library?", japanese: "その図書館には本が何冊ありますか。" } },
  { id: 20411, word: "how long", meaning: "どれくらいの間（期間をたずねる）", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 3, example: { english: "<strong>How long</strong> will you stay at the hotel?", japanese: "あなたはホテルにどのくらい滞在するつもりですか。" } },
  { id: 20412, word: "how old", meaning: "何歳（年齢をたずねる）", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 3, example: { english: "<strong>How old</strong> is your father?", japanese: "あなたの父親は何歳ですか。" } },
  { id: 20413, word: "how far", meaning: "どのくらいの距離（距離をたずねる）", partOfSpeech: "疑問詞", category: "疑問詞", appearanceCount: 1, example: { english: "<strong>How far</strong> is it from here to the station?", japanese: "ここから駅までどのくらいの距離がありますか。" } },
];

// 限定詞（数量）
const quantifierWords = [
  { id: 20501, word: "all", meaning: "すべての、すべてのもの", partOfSpeech: "限定詞・形容詞・代名詞", category: "限定詞（数量）", appearanceCount: 40, example: { english: "<strong>All</strong> boys in this class play soccer.", japanese: "このクラスの男の子はすべてサッカーをします。" } },
  { id: 20502, word: "each", meaning: "それぞれの、各々の", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 101, example: { english: "<strong>Each</strong> student has a book.", japanese: "それぞれの学生が本を持っています。" } },
  { id: 20503, word: "every", meaning: "すべての、毎〜", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 34, example: { english: "<strong>Every</strong> girl in this class is good at English.", japanese: "このクラスの女の子はみんな英語が得意です。" } },
  { id: 20504, word: "some", meaning: "いくつかの、いくらかの", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 287, example: { english: "I have <strong>some</strong> books.", japanese: "私は本を何冊か（いくつか）持っています。" } },
  { id: 20505, word: "any", meaning: "（疑問文・否定文で）いくつかの、どれでも", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 30, example: { english: "Do you have <strong>any</strong> questions?", japanese: "何か質問はありますか。" } },
  { id: 20506, word: "no", meaning: "〜が（まったく）ない", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 73, example: { english: "He has <strong>no</strong> money.", japanese: "彼はお金がありません。" } },
  { id: 20507, word: "many", meaning: "たくさんの（数えられる名詞に）", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 258, example: { english: "I have <strong>many</strong> books.", japanese: "私はたくさんの本を持っています。" } },
  { id: 20508, word: "much", meaning: "たくさんの（数えられない名詞に）", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 46, example: { english: "I want to drink <strong>much</strong> water.", japanese: "私はたくさんの水を飲みたいです。" } },
  { id: 20509, word: "a few", meaning: "少しの、いくつかの（数えられる名詞に、肯定的）", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 22, example: { english: "I have <strong>a few</strong> friends.", japanese: "私は少しの友達がいます。" } },
  { id: 20510, word: "a little", meaning: "少しの（数えられない名詞に、肯定的）", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 5, example: { english: "There is <strong>a little</strong> water in the glass.", japanese: "コップに水が少し入っています。" } },
  { id: 20511, word: "few", meaning: "ほとんどない、（数えられる名詞に、否定的）", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 23, example: { english: "I have <strong>few</strong> friends.", japanese: "私はほとんど友達がいません。" } },
  { id: 20512, word: "little", meaning: "ほとんどない、わずかな（数えられない名詞に、否定的）、小さい", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 15, example: { english: "I have <strong>little</strong> money.", japanese: "私はほとんどお金がありません。" } },
  { id: 20513, word: "several", meaning: "いくつかの、数個の", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 15, example: { english: "Ken bought <strong>several</strong> pens.", japanese: "ケンはいくつかのペンを買いました。" } },
  { id: 20514, word: "a lot of", meaning: "たくさんの、多くの", partOfSpeech: "限定詞・形容詞", category: "限定詞（数量）", appearanceCount: 50, example: { english: "I have <strong>a lot of</strong> friends.", japanese: "私はたくさんの友達がいます。" } },
];

// 前置詞
const prepositionWords = [
  { id: 20601, word: "in", meaning: "①（場所・位置）〜の中に［で］ ②（時）〜に ③（手段）〜で ④（所要時間）〜後に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1337, example: { english: "<strong>in</strong> the library", japanese: "図書館(の中)に" } },
  { id: 20602, word: "on", meaning: "①（時・日）〜に ②（場所）〜の上に、〜に（接触） ③（状態）〜中で ④〜について", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 283, example: { english: "<strong>on</strong> the table", japanese: "テーブル(の上)に" } },
  { id: 20603, word: "at", meaning: "①（場所・位置）〜に（で）②（時刻）〜に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 264, example: { english: "<strong>at</strong> the station", japanese: "駅(に)で" } },
  { id: 20604, word: "by", meaning: "①（場所）〜のそばに ②〜によって ③（締切）〜までに", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 214, example: { english: "<strong>by</strong> the park", japanese: "公園のそばに" } },
  { id: 20605, word: "for", meaning: "①〜のために ②〜に向かって ③〜にとって ④〜の間", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 507, example: { english: "<strong>for</strong> us", japanese: "私たちのために" } },
  { id: 20606, word: "with", meaning: "①〜と一緒に ②（道具）〜で、〜を使って ③〜のある、〜を身に付けて・所持して", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 322, example: { english: "<strong>with</strong> him", japanese: "彼と一緒に" } },
  { id: 20607, word: "from", meaning: "〜から、〜出身の", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 271, example: { english: "<strong>from</strong> Canada", japanese: "カナダ出身の" } },
  { id: 20608, word: "to", meaning: "（方向・到達点）〜へ・〜まで", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1449, example: { english: "<strong>to</strong> Tokyo", japanese: "東京へ" } },
  { id: 20609, word: "of", meaning: "①（帰属）〜の ②（同格）〜という… ③（部分）〜の中の…", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 989, example: { english: "history <strong>of</strong> Japan", japanese: "日本の歴史" } },
  { id: 20610, word: "about", meaning: "〜について、〜に関して（関する）、およそ、約〜", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 575, example: { english: "<strong>about</strong> music / about 40 years ago", japanese: "音楽について / 約40年前" } },
  { id: 20611, word: "into", meaning: "〜の中へ", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 22, example: { english: "<strong>into</strong> the room", japanese: "部屋の中へ" } },
  { id: 20612, word: "over", meaning: "①〜の上の方 ②〜じゅう、〜のいたるところに ③〜以上に、〜より多く", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 20, example: { english: "<strong>over</strong> the bridge", japanese: "橋の上" } },
  { id: 20628, word: "above", meaning: "〜の上に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1, example: { english: "<strong>above</strong>your head", japanese: "頭の上" } },
  { id: 20613, word: "under", meaning: "〜の下に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 20, example: { english: "<strong>under</strong> the table", japanese: "テーブルの下" } },
  { id: 20614, word: "between", meaning: "（2つ、2人）〜の間に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 33, example: { english: "<strong>between</strong> the two buildings", japanese: "2つの建物の間" } },
  { id: 20615, word: "among", meaning: "（3つ、3人以上）〜の間に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 20, example: { english: "<strong>among</strong> the trees", japanese: "木々の間" } },
  { id: 20616, word: "through", meaning: "①〜を通って ②（手段）〜を通じて", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 33, example: { english: "<strong>through</strong> the forest", japanese: "森を通って" } },
  { id: 20617, word: "during", meaning: "（特定の期間）の間じゅう", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 21, example: { english: "<strong>during</strong> the summer", japanese: "夏の間" } },
  { id: 20618, word: "before", meaning: "〜の前に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 59, example: { english: "<strong>before</strong> the meeting", japanese: "会議の前" } },
  { id: 20619, word: "after", meaning: "〜のあとに（で）、〜してから", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 104, example: { english: "<strong>after</strong> the party", japanese: "パーティーのあと" } },
  { id: 20620, word: "since", meaning: "～から、〜以来", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 9, example: { english: "<strong>since</strong> yesterday", japanese: "昨日から" } },
  { id: 20621, word: "until", meaning: "〜までずっと", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 12, example: { english: "<strong>until</strong> tomorrow", japanese: "明日まで" } },
  { id: 20622, word: "against", meaning: "〜に反対して、〜に対して", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1, example: { english: "<strong>against</strong> the law", japanese: "法律に反対して" } },
  { id: 20623, word: "without", meaning: "〜なしで", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 57, example: { english: "<strong>without</strong> a word", japanese: "一言も言わずに" } },
  { id: 20624, word: "along", meaning: "〜に沿って", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 16, example: { english: "walk <strong>along</strong> the river", japanese: "川に沿って歩く" } },
  { id: 20625, word: "across", meaning: "〜を横切って、〜の向こう側に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 2, example: { english: "walk <strong>across</strong> the street", japanese: "通りを横切って歩く" } },
  { id: 20626, word: "beside", meaning: "〜のそばに、〜の隣に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 7, example: { english: "sit <strong>beside</strong> me", japanese: "私の隣に座る" } },
  { id: 20627, word: "below", meaning: "下に・下記に（へ/を/の）", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 12, example: { english: "the room <strong>below</strong>", japanese: "下の部屋" } },
  { id: 20629, word: "toward", meaning: "〜の方へ、〜に向かって", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1, example: { english: "walk <strong>toward</strong> the station", japanese: "駅の方へ歩く" } },
  { id: 20630, word: "behind", meaning: "〜の後ろに", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "behind the house", japanese: "家の後ろに" } },
  { id: 20631, word: "beyond", meaning: "〜を越えて、〜の向こうに", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "beyond the mountain", japanese: "山を越えて" } },
  { id: 20632, word: "plus", meaning: "〜に加えて、〜プラス", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "Two <strong>plus</strong> three is five.", japanese: "2プラス3は5です。" } },
  { id: 20633, word: "till", meaning: "〜まで", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "from morning <strong>till</strong> night", japanese: "朝から夜まで" } },
  { id: 20634, word: "within", meaning: "〜以内に（で）", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "within a few minutes", japanese: "数分以内で" } },
];

// 助動詞・助動詞的表現
const auxiliaryWords = [
  { id: 20701, word: "can", meaning: "〜できる、〜してもよい", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 374, example: { english: "I <strong>can</strong> play the piano.", japanese: "私はピアノを弾けます。" } },
  { id: 20702, word: "could", meaning: "（canの過去形）〜できた", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 100, example: { english: "My father <strong>could</strong> speak English well.", japanese: "父は英語を上手に話すことができました。" } },
  { id: 20703, word: "may", meaning: "〜かもしれない、〜してもよい", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 71, example: { english: "I <strong>may</strong> be late for the party.", japanese: "私はパーティーに遅れるかもしれません。" } },
  { id: 20717, word: "might", meaning: "（mayの過去形）（ひょっとして）〜かもしれない", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 0, example: { english: "I <strong>might</strong> go to the party.", japanese: "ひょっとしてパーティーに行くかもしれません。" } },
  { id: 20704, word: "must", meaning: "〜しなければならない", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 22, example: { english: "You <strong>must</strong> do your homework.", japanese: "あなたは宿題をしなければなりません。" } },
  { id: 20705, word: "should", meaning: "〜すべきである", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 63, example: { english: "We <strong>should</strong> take a break.", japanese: "私たちは休憩を取るべきです。" } },
  { id: 20706, word: "will", meaning: "〜するつもり、〜でしょう", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 323, example: { english: "I <strong>will</strong> go to the park next week.", japanese: "私は来週公園に行くつもりです。" } },
  { id: 20707, word: "would", meaning: "（willの過去形）〜だろう、〜するつもりだ、(would like toで)〜したい", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 100, example: { english: "I <strong>would</strong> like to go abroad.", japanese: "私は海外に行きたいです。" } },
  { id: 20708, word: "be able to", meaning: "〜することができる", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 8, example: { english: "I <strong>am able to</strong> play the piano.", japanese: "私はピアノを弾けます。" } },
  { id: 20709, word: "be going to", meaning: "〜するつもり", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 14, example: { english: "I <strong>am going to</strong> go to the park next week.", japanese: "私は来週公園に行くつもりです。" } },
  { id: 20710, word: "have to", meaning: "〜しなければならない、（don't have to～：～する必要はない）", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 22, example: { english: "I <strong>have to</strong> do my homework.", japanese: "私は宿題をしなければなりません。" } },
  { id: 20711, word: "Will you～?(Can you～?)", meaning: "〜してくれませんか", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 31, example: { english: "<strong>Can you</strong> open the door?", japanese: "ドアを開けてくれませんか。" } },
  { id: 20712, word: "Would you～?(Could you〜?)", meaning: "〜していただけませんか", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 2, example: { english: "<strong>Would you</strong> close the window?", japanese: "窓を閉めていただけませんか。" } },
  { id: 20713, word: "Would you like 〜 ?", meaning: "〜はいかがですか", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 1, example: { english: "<strong>Would you like</strong> some cake?", japanese: "ケーキはいかがですか。" } },
  { id: 20714, word: "Can I～?(May I〜?)", meaning: "〜してもいいですか", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 10, example: { english: "<strong>May I</strong> use the phone?", japanese: "電話を使ってもいいですか。" } },
  { id: 20715, word: "Shall I 〜 ?", meaning: "（私が）〜しましょうか", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 2, example: { english: "<strong>Shall I</strong> open the window?", japanese: "窓を開けましょうか。" } },
  { id: 20716, word: "Shall we 〜 ?", meaning: "（いっしょに）〜しませんか", partOfSpeech: "助動詞", category: "助動詞・助動詞的表現", appearanceCount: 10, example: { english: "<strong>Shall we</strong> play tennis?", japanese: "（いっしょに）テニスをしませんか。" } },
];

// 接続詞
const conjunctionWords = [
  { id: 20801, word: "and", meaning: "〜と…、そして", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 823, example: { english: "apples <strong>and</strong> oranges", japanese: "りんごとオレンジ" } },
  { id: 20802, word: "but", meaning: "しかし、だが", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 171, example: { english: "I was sick yesterday, <strong>but</strong> I went to school today.", japanese: "昨日病気だったが、今日は学校に行った。" } },
  { id: 20803, word: "or", meaning: "〜かもしくは…", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 99, example: { english: "English <strong>or</strong> Japanese", japanese: "英語か日本語" } },
  { id: 20804, word: "so", meaning: "だから", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 213, example: { english: "I'm tired, <strong>so</strong> I'm going to bed.", japanese: "疲れているから、寝る" } },
  { id: 20818, word: "however", meaning: "しかし、けれども", partOfSpeech: "接続詞・副詞", category: "接続詞", appearanceCount: 49, example: { english: "I wanted to go; <strong>however</strong>, I was too busy.", japanese: "行きたかったが、しかし忙しすぎた。" } },
  { id: 20805, word: "because", meaning: "（理由や原因を説明して）〜なので、〜だから", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 95, example: { english: "I like summer <strong>because</strong> I can go to the beach.", japanese: "私は海に行けるから、夏が好きです." } },
  { id: 20806, word: "if", meaning: "もし〜なら", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 113, example: { english: "<strong>If</strong> it is sunny tomorrow, we will play tennis.", japanese: "明日晴れたらテニスをするつもりです。" } },
  { id: 20807, word: "when", meaning: "〜のとき", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 250, example: { english: "Tom was watching TV <strong>when</strong> his mother came home.", japanese: "母が帰ってきたとき、トムはテレビを見ていました。" } },
  { id: 20808, word: "while", meaning: "〜している間に、（after a while：しばらくの間）", partOfSpeech: "接続詞・名詞", category: "接続詞", appearanceCount: 8, example: { english: "<strong>While</strong> I was eating breakfast, I was reading a newspaper.", japanese: "朝食を食べながら、新聞を読んでいました。" } },
  { id: 20809, word: "though", meaning: "〜けれども", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 27, example: { english: "I studied hard <strong>though</strong> I was tired.", japanese: "疲れていたけれども、私は勉強を頑張りました。" } },
  { id: 20810, word: "although", meaning: "〜けれども", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 27, example: { english: "I studied hard <strong>although</strong> I was tired.", japanese: "疲れていたけれども、私は勉強を頑張りました。" } },
  { id: 20811, word: "since", meaning: "〜から、～以来、〜なので", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 9, example: { english: "I have known him <strong>since</strong> I was a child.", japanese: "私は子供の頃から、彼を知っています。" } },
  { id: 20812, word: "until", meaning: "〜するまでずっと", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 12, example: { english: "I must wait here <strong>until</strong> he comes back.", japanese: "彼が帰ってきたら、ここで待たなければなりません。" } },
  { id: 20813, word: "before", meaning: "〜の前に", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 59, example: { english: "I will go home <strong>before</strong> it is dark.", japanese: "暗くなる前に、家に帰るつもりです。" } },
  { id: 20814, word: "after", meaning: "〜の後に", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 104, example: { english: "We met at the station <strong>after</strong> the party.", japanese: "私たちはパーティーのあと、駅で会いました。" } },
  { id: 20815, word: "that", meaning: "（ひとまとまりの内容を表して）～ということ・もの", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 628, example: { english: "I know <strong>that</strong> he is a doctor.", japanese: "私は彼が医者であることを知っています。" } },
  { id: 20816, word: "as soon as", meaning: "〜するとすぐに", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 2, example: { english: "I will play games <strong>as soon as</strong> I finish my homework.", japanese: "宿題を終えたらすぐに、ゲームをするつもりです。" } },
  { id: 20817, word: "even if", meaning: "たとえ〜でも", partOfSpeech: "接続詞", category: "接続詞", appearanceCount: 6, example: { english: "I will go there <strong>even if</strong> it is raining.", japanese: "たとえ雨が降っていても、そこに行くつもりです。" } },
];

// 関係代名詞
const relativeWords = [
  { id: 20901, word: "who", meaning: "〈人〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "関係代名詞", appearanceCount: 126, example: { english: "The boy <strong>who</strong> is singing is my brother.", japanese: "歌っている少年は私の弟です。" } },
  { id: 20902, word: "which", meaning: "〈物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "関係代名詞", appearanceCount: 186, example: { english: "This is the book <strong>which</strong> I bought yesterday.", japanese: "これが私が昨日買った本です。" } },
  { id: 20903, word: "that", meaning: "〈人/物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "関係代名詞", appearanceCount: 628, example: { english: "He is the teacher <strong>that</strong> I respect.", japanese: "彼は私が尊敬している先生です。" } },
];

// 間投詞
const interjectionWords = [
  { id: 21001, word: "hi", meaning: "やあ、こんにちは", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 176, example: { english: "<strong>Hi</strong>! How are you?", japanese: "やあ! お元気ですか。" } },
  { id: 21002, word: "hello", meaning: "やあ、こんにちは", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 50, example: { english: "<strong>Hello</strong>, nice to meet you.", japanese: "こんにちは、はじめまして。" } },
  { id: 21003, word: "hey", meaning: "やあ、おい、ちょっと", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 0, example: { english: "<strong>Hey</strong>, wait for me!", japanese: "おい、待って！" } },
  { id: 21004, word: "bye", meaning: "さようなら", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 70, example: { english: "<strong>Bye</strong>, see you later.", japanese: "さようなら、またお会いしましょう。" } },
  { id: 21005, word: "goodbye", meaning: "さようなら", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 2, example: { english: "<strong>Goodbye</strong>, see you later.", japanese: "さようなら、またお会いしましょう。" } },
  { id: 21006, word: "oh", meaning: "ああ！、おお！", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 161, example: { english: "<strong>Oh</strong>, I see!", japanese: "ああ、わかりました！" } },
  { id: 21007, word: "wow", meaning: "わあ、おお（驚きや喜び）", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 15, example: { english: "<strong>Wow</strong>, that's nice!", japanese: "わあ、それはいいですね！" } },
  { id: 21008, word: "yes", meaning: "はい", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 191, example: { english: "<strong>Yes</strong>, I am.", japanese: "はい、そうです。" } },
  { id: 21009, word: "no", meaning: "いいえ、いや、だめだ", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 73, example: { english: "<strong>No</strong>, I don't.", japanese: "いいえ、違います。" } },
  { id: 21010, word: "OK", meaning: "わかりました、それでは、大丈夫な", partOfSpeech: "間投詞・形容詞", category: "間投詞", appearanceCount: 70, example: { english: "<strong>OK</strong>, let's go.", japanese: "わかりました、行きましょう。" } },
  { id: 21011, word: "well", meaning: "ええっと…（考え中）", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 151, example: { english: "<strong>Well</strong>, I'm not sure.", japanese: "ええっと…、わかりません。" } },
  { id: 21012, word: "please", meaning: "どうぞ、どうか（お願いします）", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 84, example: { english: "<strong>Please</strong> help me.", japanese: "どうか、助けてください。" } },
  { id: 21013, word: "welcome", meaning: "ようこそ、いらっしゃい（歓迎）", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 11, example: { english: "<strong>Welcome</strong> to our party.", japanese: "パーティーへようこそ。" } },
  { id: 21014, word: "yeah", meaning: "うん、ああ（yesのくだけた表現）", partOfSpeech: "間投詞", category: "間投詞", appearanceCount: 5, example: { english: "<strong>Yeah</strong>, I think so.", japanese: "うん、そう思う。" } },
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
    ...directionWords,
    ...eventLeisureWords,
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
    '時間・曜日・月・季節に関する単語': calendarWords,
    '曜日・月・季節に関する単語': calendarWords, // 後方互換性のため残す
    '動物に関する単語': animalWords,
    '自然・天気に関する単語': natureWeatherWords,
    '学校に関する単語': schoolWords,
    '国名や地域に関する単語': countryWords,
    '方角・方向に関する単語': directionWords,
    '行事・余暇に関する単語': eventLeisureWords,
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
 * 小学生で習った単語をすべて取得（カテゴリー別単語＋機能語）
 * @returns {Array} 小学生で習った単語の配列
 */
function getElementaryVocabulary() {
  return [
    // カテゴリー別単語
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
    ...directionWords,
    ...eventLeisureWords,
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
- 11001-11099: 時間・曜日・月・季節に関する単語
- 11101-11199: 動物に関する単語
- 11201-11299: 自然・天気に関する単語
- 11301-11399: 学校に関する単語
- 11401-11499: 国名や地域に関する単語
- 11501-11599: 方角・方向に関する単語
- 11601-11699: 行事・余暇に関する単語
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

