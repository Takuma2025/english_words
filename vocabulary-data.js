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
// カテゴリー別
// ============================================

// 家族に関する単語
const familyWords = [
  { id: 10001, word: "family", meaning: "【副】もっと…　【形】もっと多く", partOfSpeech: "名詞", category: "家族", appearanceCount: 48, kana: "*ファ*ミリー" },
  { id: 10003, word: "father", meaning: "【代】父；父親", partOfSpeech: "名詞", category: "家族", appearanceCount: 4, kana: "*ファ*ーザー" },
  { id: 10004, word: "mother", meaning: "母；母親；お母さん", partOfSpeech: "名詞", category: "家族", appearanceCount: 1, kana: "*マ*ザー" },
  { id: 10005, word: "parent", meaning: "親　（parents:両親）", partOfSpeech: "名詞", category: "家族", appearanceCount: 1, kana: "*ペア*レント" },
  { id: 10012, word: "brother", meaning: "兄弟；兄；弟", partOfSpeech: "名詞", category: "家族", appearanceCount: 23, kana: "*ブラ*ザー" },
  { id: 10013, word: "sister", meaning: "姉妹、姉、妹", partOfSpeech: "名詞", category: "家族", appearanceCount: 52, kana: "*スィ*スター" },
  { id: 10015, word: "son", meaning: "息子", partOfSpeech: "名詞", category: "家族", appearanceCount: 1, kana: "*サ*ン" },
  { id: 10014, word: "daughter", meaning: "娘", partOfSpeech: "名詞", category: "家族", appearanceCount: 4, kana: "*ドー*ター" },
  { id: 10007, word: "grandfather", meaning: "祖父、おじいさん", partOfSpeech: "名詞", category: "家族", appearanceCount: 16, kana: "*グラ*ンドファーザー" },
  { id: 10008, word: "grandmother", meaning: "祖母、おばあさん", partOfSpeech: "名詞", category: "家族", appearanceCount: 13, kana: "*グラ*ンドマザー" },
  { id: 10023, word: "uncle", meaning: "おじ", partOfSpeech: "名詞", category: "家族", appearanceCount: 13, kana: "*ア*ンクル" },
  { id: 10026, word: "aunt", meaning: "おば", partOfSpeech: "名詞", category: "家族", appearanceCount: 7, kana: "*ア*ーント" },
  { id: 10027, word: "grandpa", meaning: "おじいちゃん、祖父", partOfSpeech: "名詞", category: "家族", appearanceCount: 2, kana: "*グラ*ンパ" },
  { id: 10028, word: "grandma", meaning: "おばあちゃん、祖母", partOfSpeech: "名詞", category: "家族", appearanceCount: 2, kana: "*グラ*ンマ" },
  { id: 10029, word: "mom", meaning: "ママ、お母さん", partOfSpeech:"名詞", category: "家族", appearanceCount: 0, kana: "*マ*ム" },
  { id: 10029, word: "dad", meaning: "パパ、お父さん", partOfSpeech:"名詞", category: "家族", appearanceCount: 0, kana: "*ダ*ッド" },
  { id: 10029, word: "grandparent", meaning: "祖父母", partOfSpeech: "名詞", category: "家族", appearanceCount: 7, kana: "*グラ*ンドペアレント" },
  { id: 10030, word: "cousin", meaning: "いとこ", partOfSpeech: "名詞", category: "家族", appearanceCount: 0, kana: "*カ*ズン" },
  ];

// 数字に関する単語
const numberWords = [
  { id: 10100, word: "number", meaning: "数、数字", partOfSpeech: "名詞", category: "数字", appearanceCount: 56 },
  // zero（最初に）
  { id: 10101, word: "zero", meaning: "〖名〗ゼロ；〖形〗ゼロの", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 2 },
  // 数字（順番に）
  { id: 10102, word: "one", meaning: "1（の）、1つ", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 210 },
  { id: 10103, word: "two", meaning: "2（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 131 },
  { id: 10104, word: "three", meaning: "3（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 29 },
  { id: 10105, word: "four", meaning: "4（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 30 },
  { id: 10106, word: "five", meaning: "5（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 24 },
  { id: 10107, word: "six", meaning: "6（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 14 },
  { id: 10108, word: "seven", meaning: "7（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 9 },
  { id: 10109, word: "eight", meaning: "8（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 7 },
  { id: 10110, word: "nine", meaning: "9（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 5 },
  { id: 10111, word: "ten", meaning: "10（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 8 },
  { id: 10112, word: "eleven", meaning: "11（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10113, word: "twelve", meaning: "12（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 1 },
  { id: 10114, word: "thirteen", meaning: "13（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10115, word: "fourteen", meaning: "14（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 3 },
  { id: 10116, word: "fifteen", meaning: "15（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 4 },
  { id: 10117, word: "sixteen", meaning: "16（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 1 },
  { id: 10118, word: "seventeen", meaning: "17（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 1 },
  { id: 10119, word: "eighteen", meaning: "18（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10120, word: "nineteen", meaning: "19（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 5 },
  { id: 10121, word: "twenty", meaning: "20（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 20 },
  { id: 10122, word: "thirty", meaning: "30（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 9 },
  { id: 10123, word: "forty", meaning: "40（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 1 },
  { id: 10124, word: "fifty", meaning: "50（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 10 },
  { id: 10125, word: "sixty", meaning: "60（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10126, word: "seventy", meaning: "70（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 4 },
  { id: 10127, word: "eighty", meaning: "80（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 3 },
  { id: 10128, word: "ninety", meaning: "90（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10129, word: "hundred", meaning: "100（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 18 },
  { id: 10130, word: "thousand", meaning: "1,000（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 9 },
  { id: 10131, word: "million", meaning: "100万", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 8 },
  { id: 10132, word: "billion", meaning: "10億", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 2 },
  { id: 10133, word: "half", meaning: "２分の1、半分", partOfSpeech: "名詞・形容詞・副詞", category: "数字", appearanceCount: 0 },
  { id: 10133, word: "quarter", meaning: "４分の１", partOfSpeech: "名詞", category: "数字", appearanceCount: 0 }, // 序数（順番に）
  { id: 10133, word: "first", meaning: "1番目（の）、最初（の）、まず第一に、最初に、初めて", partOfSpeech: "名詞・形容詞・副詞", category: "数字", appearanceCount: 115 },
  { id: 10134, word: "second", meaning: "2番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 17 },
  { id: 10135, word: "third", meaning: "3番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 8 },
  { id: 10136, word: "fourth", meaning: "4番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 1 },
  { id: 10137, word: "fifth", meaning: "5番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 6 },
  { id: 10138, word: "sixth", meaning: "6番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 3 },
  { id: 10139, word: "seventh", meaning: "7番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 4 },
  { id: 10140, word: "eighth", meaning: "8番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10141, word: "ninth", meaning: "9番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10142, word: "tenth", meaning: "10番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10148, word: "eleventh", meaning: "11番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10149, word: "twelfth", meaning: "12番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10150, word: "thirteenth", meaning: "13番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10151, word: "fourteenth", meaning: "14番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10152, word: "fifteenth", meaning: "15番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10153, word: "sixteenth", meaning: "16番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 1 },
  { id: 10154, word: "seventeenth", meaning: "17番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 3 },
  { id: 10155, word: "eighteenth", meaning: "18番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 2 },
  { id: 10156, word: "nineteenth", meaning: "19番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 1 },
  { id: 10157, word: "twentieth", meaning: "20番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
  { id: 10158, word: "thirtieth", meaning: "30番目（の）", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 0 },
 ];

// 楽器に関する単語
const instrumentWords = [
  { id: 10225, word: "guitar", meaning: "ギター", partOfSpeech: "名詞", category: "楽器", appearanceCount: 0 },
  { id: 10226, word: "piano", meaning: "ピアノ", partOfSpeech: "名詞", category: "楽器", appearanceCount: 10 },
  { id: 10227, word: "violin", meaning: "バイオリン", partOfSpeech: "名詞", category: "楽器", appearanceCount: 0 },
  { id: 10228, word: "drum", meaning: "ドラム、太鼓", partOfSpeech: "名詞", category: "楽器", appearanceCount: 0 },
  { id: 10229, word: "flute", meaning: "フルート", partOfSpeech: "名詞", category: "楽器", appearanceCount: 0 },
  { id: 10230, word: "trunmpet", meaning: "トランペット", partOfSpeech: "名詞", category: "楽器", appearanceCount: 1 },
];

// 衣類に関する単語
const clothingWords = [
  { id: 10231, word: "cap", meaning: "(縁なしの)帽子、キャップ", partOfSpeech: "名詞", category: "衣類", appearanceCount: 1 },
  { id: 10232, word: "hat", meaning: "(縁のある)帽子", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10233, word: "T-shirt", meaning: "Tシャツ", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10233, word: "shirt", meaning: "シャツ", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10234, word: "pants", meaning: "ズボン", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10235, word: "sweater", meaning: "セーター", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10236, word: "jacket", meaning: "上着、ジャケット", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10236, word: "coat", meaning: "コート", partOfSpeech: "名詞", category: "衣類", appearanceCount: 2 },
  { id: 10237, word: "dress", meaning: "ドレス、服装", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10237, word: "glove", meaning: "手ぶくろ", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10237, word: "shoe", meaning: "（通例 ～s)くつ", partOfSpeech: "名詞", category: "衣類", appearanceCount: 5 },
  { id: 10237, word: "tie", meaning: "ネクタイ", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10237, word: "scarf", meaning: "スカーフ、マフラー", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
  { id: 10237, word: "apron", meaning: "エプロン", partOfSpeech: "名詞", category: "衣類", appearanceCount: 0 },
];

// 単位に関する単語
const unitWords = [
  { id: 10243, word: "meter", meaning: "メートル(長さの単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 7 },
  { id: 10244, word: "kilometer", meaning: "キロメートル(長さの単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 0 },
  { id: 10245, word: "gram", meaning: "グラム(重さの単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 0 },
  { id: 10246, word: "kilogram", meaning: "キログラム(重さの単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 0 },
  { id: 10247, word: "yen", meaning: "円(日本の貨幣の単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 0 },
  { id: 10248, word: "dollar", meaning: "ドル(アメリカなどの貨幣の単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 2 },
  { id: 10240, word: "second", meaning: "～秒(時間の単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 8 },
  { id: 10241, word: "minute", meaning: "～分(時間の単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 17 },
  { id: 10242, word: "hour", meaning: "～時間(時間の単位)", partOfSpeech: "名詞", category: "単位", appearanceCount: 23 },
   { id: 11031, word: "day", meaning: "～日（時間の単位）", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 96 },
  { id: 11032, word: "week", meaning: "～週間（時間の単位）", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 35 },
  { id: 11033, word: "month", meaning: "～か月（時間の単位）", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 20 },
  { id: 11034, word: "year", meaning: "～年（時間の単位）", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 135 },
  { id: 11035, word: "century", meaning: "～世紀（時間の単位", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 16 },
  { id: 10249, word: "percent", meaning: "パーセント", partOfSpeech: "名詞", category: "単位", appearanceCount: 11 },
];

// 体に関する単語
const bodyWords = [
  { id: 10300, word: "body", meaning: "体", partOfSpeech: "名詞", category: "体", appearanceCount: 42 },
  { id: 10301, word: "head", meaning: "頭", partOfSpeech: "名詞", category: "体", appearanceCount: 5 },
  { id: 10302, word: "face", meaning: "顔", partOfSpeech: "名詞", category: "体", appearanceCount: 2 },
  { id: 10303, word: "eye", meaning: "目", partOfSpeech: "名詞", category: "体", appearanceCount: 4 },
  { id: 10304, word: "ear", meaning: "耳", partOfSpeech: "名詞", category: "体", appearanceCount: 1 },
  { id: 10305, word: "nose", meaning: "鼻", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10306, word: "mouth", meaning: "口", partOfSpeech: "名詞", category: "体", appearanceCount: 3 },
  { id: 10307, word: "tooth", meaning: "歯（複数形：teeth）", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10308, word: "throat", meaning: "のど", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10309, word: "neck", meaning: "首", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10310, word: "shoulder", meaning: "肩", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10311, word: "arm", meaning: "腕", partOfSpeech: "名詞", category: "体", appearanceCount: 4 },
  { id: 10312, word: "hand", meaning: "手", partOfSpeech: "名詞", category: "体", appearanceCount: 9 },
  { id: 10313, word: "finger", meaning: "指", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10317, word: "leg", meaning: "足、脚", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10318, word: "foot", meaning: "足（くるぶし以下の部分）", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10319, word: "knee", meaning: "ひざ", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10319, word: "toe", meaning: "つま先、足の指", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10320, word: "heart", meaning: "心臓、心", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10321, word: "stomach", meaning: "胃", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
  { id: 10322, word: "brain", meaning: "脳", partOfSpeech: "名詞", category: "体", appearanceCount: 0 },
];

// 色に関する単語
const colorWords = [
  { id: 10400, word: "color", meaning: "色", partOfSpeech: "名詞", category: "色", appearanceCount: 7 },
  { id: 10401, word: "red", meaning: "赤（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 1 },
  { id: 10402, word: "blue", meaning: "青（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 2 },
  { id: 10403, word: "yellow", meaning: "黄色（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 2 },
  { id: 10404, word: "green", meaning: "緑（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 7 },
  { id: 10405, word: "black", meaning: "黒（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 5 },
  { id: 10406, word: "white", meaning: "白（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 12 },
  { id: 10407, word: "brown", meaning: "茶色（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 5 },
  { id: 10408, word: "orange", meaning: "オレンジ色（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 0 },
  { id: 10409, word: "pink", meaning: "ピンク（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 0 },
  { id: 10410, word: "purple", meaning: "紫（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 0 },
  { id: 10411, word: "gold", meaning: "金色（の）", partOfSpeech: "名詞・形容詞", category: "色", appearanceCount: 13 },
];

// 食べ物・飲み物に関する単語
const foodDrinkWords = [
  { id: 10501, word: "food", meaning: "食べ物", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 138 },
  { id: 10515, word: "rice", meaning: "ご飯、米", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 2 },
  { id: 10516, word: "bread", meaning: "パン", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10571, word: "noodle", meaning: "麺類、ヌードル", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10558, word: "spaghetti", meaning: "スパゲッティ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10538, word: "egg", meaning: "卵", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 7 }, 
  { id: 10519, word: "chicken", meaning: "鶏肉、にわとり", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 1 },
  { id: 10562, word: "pork", meaning: "豚肉", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10564, word: "beef", meaning: "牛肉", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10567, word: "rice ball", meaning: "おにぎり", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10546, word: "hamburger", meaning: "ハンバーガー", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10547, word: "ice cream", meaning: "アイスクリーム", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10548, word: "pizza", meaning: "ピザ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10569, word: "curry", meaning: "カレー", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 10 },
  { id: 10568, word: "curry and rice", meaning: "カレーライス", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10549, word: "salad", meaning: "サラダ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10576, word: "soup", meaning: "スープ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 1 },
  { id: 10550, word: "sandwich", meaning: "サンドイッチ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10541, word: "cake", meaning: "ケーキ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 6 },
  { id: 10540, word: "chocolate", meaning: "チョコレート", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 7 },
  { id: 10574, word: "cookie", meaning: "クッキー", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10566, word: "pudding", meaning: "プリン", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { can: 10573, word: "candy", meaning: "キャンディー", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10565, word: "cheese", meaning: "チーズ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10575, word: "yogurt", meaning: "ヨーグルト", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10570, word: "pie", meaning: "パイ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10572, word: "jam", meaning: "ジャム", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10573, salt: "salt", meaning: "塩", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 7 },
  // 野菜
  { id: 10522, word: "vegetable", meaning: "野菜", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 15 },
  { id: 10523, word: "cabbage", meaning: "キャベツ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10524, word: "carrot", meaning: "にんじん", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10525, word: "cucumber", meaning: "きゅうり", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10526, word: "lettuce", meaning: "レタス", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10527, word: "onion", meaning: "たまねぎ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10528, word: "potato", meaning: "じゃがいも", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10529, word: "tomato", meaning: "トマト", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10560, word: "pumpkin", meaning: "かぼちゃ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10545, word: "corn", meaning: "とうもろこし", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10563, word: "bean", meaning: "豆", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  // 果物
  { id: 10521, word: "fruit", meaning: "果物", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 3 },
  { id: 10530, word: "apple", meaning: "りんご", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 2 },
  { id: 10531, word: "banana", meaning: "バナナ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 1 },
  { id: 10532, word: "grape", meaning: "ぶどう", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 2 },
  { id: 10533, word: "lemon", meaning: "レモン", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10534, word: "melon", meaning: "メロン", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10535, word: "peach", meaning: "もも", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10536, word: "pineapple", meaning: "パイナップル", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10537, word: "strawberry", meaning: "いちご", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10561, word: "cherry", meaning: "さくらんぼ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 3 },
  // 飲み物
  { id: 10504, word: "water", meaning: "水", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 64 },
  { id: 10505, word: "tea", meaning: "紅茶", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 24 },
  { id: 10506, word: "coffee", meaning: "コーヒー", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 10 },
  { id: 10507, word: "milk", meaning: "牛乳", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 4 },
  { id: 10508, word: "juice", meaning: "ジュース", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
  { id: 10509, word: "soda", meaning: "ソーダ", partOfSpeech: "名詞", category: "食べ物・飲み物", appearanceCount: 0 },
];

// 町の施設に関する単語
const townFacilityWords = [
  { id: 10601, word: "station", meaning: "駅、署［局・所］", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 35 },
  { id: 10602, word: "airport", meaning: "空港", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 2 },
  { id: 10605, word: "library", meaning: "図書館、図書室", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 15 },
  { id: 10606, word: "museum", meaning: "博物館、美術館", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 49 },
  { id: 10607, word: "park", meaning: "公園", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 44 },
  { id: 10608, word: "post office", meaning: "郵便局", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 3 },
  { id: 10609, word: "police station", meaning: "警察署", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 0 },
  { id: 10610, word: "hospital", meaning: "病院", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 1 },
  { id: 10627, word: "fire station", meaning: "消防署", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 0 },
  { id: 10613, word: "supermarket", meaning: "スーパーマーケット", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 8 },
  { id: 10636, word: "department store", meaning: "デパート、百貨店", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 7 },
  { id: 10614, word: "convenience store", meaning: "コンビニエンスストア", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 0 },
  { id: 10616, word: "restaurant", meaning: "レストラン、料理店", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 11 },
  { id: 10637, word: "bookstore", meaning: "本屋、書店", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 1 },
  { id: 10640, word: "gas station", meaning: "ガソリンスタンド", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 0 },
  { id: 10644, word: "bank", meaning: "銀行", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 0 },
  { id: 10641, word: "cafe", meaning: "カフェ、喫茶店", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 1 },
  { id: 10641, word: "cafeteria", meaning: "カフェテリア", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 3 },
  { id: 10622, word: "amusement park", meaning: "遊園地", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 1 },
  { id: 10623, word: "aquarium", meaning: "水族館", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 0 },
  { id: 10630, word: "stadium", meaning: "スタジアム、競技場", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 5 },
  { id: 10631, word: "zoo", meaning: "動物園", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 3 },
  { id: 10624, word: "temple", meaning: "寺、寺院、神殿", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 5 },
  { id: 10625, word: "shrine", meaning: "神社", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 0 },
  { id: 10643, word: "factory", meaning: "工場", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 3 },
  { id: 10645, word: "farm", meaning: "農場", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 12 },
  { id: 10642, word: "city hall", meaning: "市役所、市庁舎", partOfSpeech: "名詞", category: "町の施設", appearanceCount: 4 },
];

// 乗り物に関する単語
const vehicleWords = [
  { id: 10702, word: "bike", meaning: "自転車", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 12 },
  { id: 10702, word: "bicycle", meaning: "自転車", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 54 },
  { id: 10703, word: "car", meaning: "車", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 20 },
  { id: 10704, word: "taxi", meaning: "タクシー", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 0 },
  { id: 10705, word: "bus", meaning: "バス", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 6 },
  { id: 10706, word: "train", meaning: "電車、列車、（～を）訓練する", partOfSpeech: "名詞・動詞", category: "乗り物", appearanceCount: 46 },
  { id: 10707, word: "subway", meaning: "地下鉄", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 0 },
  { id: 10708, word: "plane", meaning: "飛行機", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 4 },
  { id: 10709, word: "boat", meaning: "ボート、小船", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 3 },
  { id: 10710, word: "ship", meaning: "船", partOfSpeech: "名詞", category: "乗り物", appearanceCount: 3 },
];

// 職業に関する単語
const occupationWords = [
  { id: 10801, word: "scientist", meaning: "科学者", partOfSpeech: "名詞", category: "職業", appearanceCount: 47 },
  { id: 10803, word: "doctor", meaning: "医者、博士", partOfSpeech: "名詞", category: "職業", appearanceCount: 4 },
  { id: 10814, word: "nurse", meaning: "看護師", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10821, word: "dentist", meaning: "歯科医、歯医者", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10822, word: "vet", meaning: "獣医", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10823, word: "astronaut", meaning: "宇宙飛行士", partOfSpeech: "名詞", category: "職業", appearanceCount: 6 },
  { id: 10807, word: "teacher", meaning: "先生、教師", partOfSpeech: "名詞", category: "職業", appearanceCount: 23 },
  { id: 10808, word: "artist", meaning: "芸術家、画家", partOfSpeech: "名詞", category: "職業", appearanceCount: 21 },
  { id: 10810, word: "singer", meaning: "歌手", partOfSpeech: "名詞", category: "職業", appearanceCount: 7 },
  { id: 10826, word: "musician", meaning: "音楽家、ミュージシャン、演奏家", partOfSpeech: "名詞", category: "職業", appearanceCount: 4 },
  { id: 10828, word: "comedian", meaning: "コメディアン、お笑い芸人", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10829, word:"actor", meaning: "俳優、男優", partOfSpeech: "名詞", category: "職業", appearanceCount: 3 },
  { id: 10829, word: "cook", meaning: "料理人、コック、料理する", partOfSpeech: "名詞・動詞", category: "職業", appearanceCount: 10 },
  { id: 10834, word: "pilot", meaning: "パイロット、操縦士", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10829, word: "flight attendant", meaning: "客室乗務員、キャビンアテンダント", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10830, word: "florist", meaning: "花屋、花屋の店主（店員）", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10831, word: "police officer", meaning: "警察官", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10832, word: "dancer", meaning: "ダンサー、踊る人", partOfSpeech: "名詞", category: "職業", appearanceCount: 0 },
  { id: 10833, word: "photographer", meaning: "写真家", partOfSpeech: "名詞", category: "職業", appearanceCount: 1 },
  { id: 10835, word: "writer", meaning: "作家、筆者", partOfSpeech: "名詞", category: "職業", appearanceCount: 3 },
];

// スポーツに関する単語
const sportsWords = [
  { id: 10901, word: "sport", meaning: "スポーツ、運動競技", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 5 },
  { id: 10902, word: "soccer", meaning: "サッカー", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 9 },
  { id: 10903, word: "football", meaning: "アメリカンフットボール、サッカー", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
  { id: 10904, word: "basketball", meaning: "バスケットボール", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 5 },
  { id: 10905, word: "volleyball", meaning: "バレーボール", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 2 },
  { id: 10906, word: "tennis", meaning: "テニス", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 10 },
  { id: 10907, word: "baseball", meaning: "野球", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 3 },
  { id: 10908, word: "rugby", meaning: "ラグビー", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 5 },
  { id: 10909, word: "badminton", meaning: "バドミントン", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
  { id: 10918, word: "table tennis", meaning: "卓球", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
  { id: 10910, word: "swimming", meaning: "水泳", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 11 },
  { id: 10911, word: "track and field", meaning: "陸上競技", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
  { id: 10912, word: "dancing", meaning: "ダンス、踊り", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
  { id: 10913, word: "surfing", meaning: "サーフィン、波乗り", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
  { id: 10914, word: "skiing", meaning: "スキー", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
  { id: 10915, word: "cycling", meaning: "サイクリング", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 4},
  { id: 10916, word: "hiking", meaning: "ハイキング", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0},
  { id: 10915, word: "marathon", meaning: "マラソン", partOfSpeech: "名詞", category: "スポーツ", appearanceCount: 0 },
];

// 曜日・月・季節に関する単語
const calendarWords = [
  // 曜日
  { id: 11004, word: "Sunday", meaning: "日曜日", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 23 },
  { id: 11005, word: "Monday", meaning: "月曜日", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 4 },
  { id: 11006, word: "Tuesday", meaning: "火曜日", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 3 },
  { id: 11007, word: "Wednesday", meaning: "水曜日", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 4 },
  { id: 11008, word: "Thursday", meaning: "木曜日", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 4 },
  { id: 11009, word: "Friday", meaning: "金曜日", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 11 },
  { id: 11010, word: "Saturday", meaning: "土曜日", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 28 },
  // 月
  { id: 11011, word: "January", meaning: "1月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 3 },
  { id: 11012, word: "February", meaning: "2月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 0 },
  { id: 11013, word: "March", meaning: "3月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 4 },
  { id: 11014, word: "April", meaning: "4月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 2 },
  { id: 11015, word: "May", meaning: "5月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 71 },
  { id: 11016, word: "June", meaning: "6月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 6 },
  { id: 11017, word: "July", meaning: "7月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 2 },
  { id: 11018, word: "August", meaning: "8月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 2 },
  { id: 11019, word: "September", meaning: "9月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 1 },
  { id: 11020, word: "October", meaning: "10月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 2 },
  { id: 11021, word: "November", meaning: "11月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 6 },
  { id: 11022, word: "December", meaning: "12月", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 6 },
  // 季節
  { id: 11022, word: "season", meaning: "季節", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 25 },
  { id: 11023, word: "spring", meaning: "春、ばね・ぜんまい、泉", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 15 },
  { id: 11024, word: "summer", meaning: "夏", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 23 },
  { id: 11025, word: "autumn", meaning: "秋", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 8 },
  { id: 11026, word: "fall", meaning: "秋、滝、落ちる", partOfSpeech: "名詞・動詞", category: "曜日・月・季節", appearanceCount: 1 },
  { id: 11027, word: "winter", meaning: "冬", partOfSpeech: "名詞", category: "曜日・月・季節", appearanceCount: 18 },
];

//時間・時間帯に関する単語
const timeWords = [
  { id: 11036, word: "today", meaning: "今日、本日、現在、このごろ", partOfSpeech: "名詞・副詞", category: "時間・時間帯", appearanceCount: 64 },
  { id: 11037, word: "tomorrow", meaning: "明日", partOfSpeech: "名詞・副詞", category: "時間・時間帯", appearanceCount: 20 },
  { id: 11038, word: "yesterday", meaning: "昨日", partOfSpeech: "副詞", category: "時間・時間帯", appearanceCount: 15 },
  { id: 11039, word: "weekend", meaning: "週末", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 17 },
  { id: 11040, word: "morning", meaning: "朝、午前", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 29 },
  { id: 11041, word: "noon", meaning: "正午、真昼", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 6 },
  { id: 11049, word: "afternoon", meaning: "午後", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 13 },
  { id: 11042, word: "evening", meaning: "夕方、晩", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 27 },
  { id: 11043, word: "night", meaning: "夜、晩", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 12 },
  { id: 11044, word: "midnight", meaning: "深夜、真夜中", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 0 },
  { id: 11045, word: "tonight", meaning: "今夜、今晩", partOfSpeech: "名詞・副詞", category: "時間・時間帯", appearanceCount: 1 },
  { id: 11045, word: "a.m.", meaning: "午前", partOfSpeech: "副詞", category: "時間・時間帯", appearanceCount: 0 },
  { id: 11045, word: "p.m.", meaning: "午後", partOfSpeech: "副詞", category: "時間・時間帯", appearanceCount: 1 },
　{ id: 11046, word: "breakfast", meaning: "朝食", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 1 },
  { id: 11047, word: "lunch", meaning: "昼食、ランチ", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 15 },
  { id: 11048, word: "dinner", meaning: "夕食、ディナー", partOfSpeech: "名詞", category: "時間・時間帯", appearanceCount: 16 },
];  

// 動物に関する単語
const animalWords = [
  { id: 11101, word: "animal", meaning: "動物", partOfSpeech: "名詞", category: "動物", appearanceCount: 18 },
  { id: 11102, word: "dog", meaning: "犬", partOfSpeech: "名詞", category: "動物", appearanceCount: 14 },
  { id: 11103, word: "cat", meaning: "猫", partOfSpeech: "名詞", category: "動物", appearanceCount: 2 },
  { id: 11105, word: "fish", meaning: "魚 （複数形： fish)、釣りをする", partOfSpeech: "名詞・動詞", category: "動物", appearanceCount: 0 },
  { id: 11104, word: "rabbit", meaning: "うさぎ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11105, word: "horse", meaning: "馬", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11106, word: "cow", meaning: "牛", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11107, word: "pig", meaning: "豚", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11108, word: "sheep", meaning: "羊（複数形: sheep)", partOfSpeech: "名詞", category: "動物", appearanceCount: 11 },
  { id: 11123, word: "mouse", meaning: "ネズミ（複数形: mice)", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11124, word: "turtle", meaning: "カメ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11109, word: "lion", meaning: "ライオン", partOfSpeech: "名詞", category: "動物", appearanceCount: 2 },
  { id: 11110, word: "tiger", meaning: "トラ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11111, word: "bear", meaning: "クマ、～を産む", partOfSpeech: "名詞・動詞", category: "動物", appearanceCount: 1 },
  { id: 11112, word: "elephant", meaning: "ゾウ", partOfSpeech: "名詞", category: "動物", appearanceCount: 1 },
  { id: 11113, word: "monkey", meaning: "サル", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11114, word: "giraffe", meaning: "キリン", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11125, word: "deer", meaning: "シカ（複数形: deer)", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11126, word: "fox", meaning: "キツネ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11127, word: "koala", meaning: "コアラ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11128, word: "panda", meaning: "パンダ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11115, word: "bird", meaning: "鳥", partOfSpeech: "名詞", category: "動物", appearanceCount: 28 },
  { id: 11116, word: "crane", meaning: "ツル", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11129, word: "penguin", meaning: "ペンギン", partOfSpeech: "名詞", category: "動物", appearanceCount: 18 },
  { id: 11117, word: "snake", meaning: "ヘビ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11118, word: "frog", meaning: "カエル", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11119, word: "bee", meaning: "ミツバチ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11120, word: "butterfly", meaning: "チョウ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11121, word: "ant", meaning: "アリ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11130, word: "dolphin", meaning: "イルカ", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
  { id: 11131, word: "octopus", meaning: "タコ（複数形: octuses/octopi）", partOfSpeech: "名詞", category: "動物", appearanceCount: 0 },
];

// 自然、天気、方角に関する単語
// 自然に関する単語
const natureWords = [
    { id: 11200, word: "nature", meaning: "自然", partOfSpeech: "名詞", category: "自然", appearanceCount: 21 },
    { id: 11220, word: "mountain", meaning: "山［Mt.～ ～山］", partOfSpeech: "名詞", category: "自然", appearanceCount: 19 },
    { id: 11223, word: "sea", meaning: "海、海の", partOfSpeech: "名詞、形容詞", category: "自然", appearanceCount: 24 },
    { id: 11221, word: "river", meaning: "川、河川", partOfSpeech: "名詞", category: "自然", appearanceCount: 38 },
    { id: 11222, word: "lake", meaning: "湖、湖水", partOfSpeech: "名詞", category: "自然", appearanceCount: 44 },
    { id: 11224, word: "pond", meaning: "池", partOfSpeech: "名詞", category: "自然", appearanceCount: 0 },
    { id: 11247, word: "hill", meaning: "丘、小山", partOfSpeech: "名詞", category: "自然", appearanceCount: 1 },
    { id: 11227, word: "beach", meaning: "砂浜、浜辺、海岸", partOfSpeech: "名詞", category: "自然", appearanceCount: 5 },
    { id: 11235, word: "ocean", meaning: "海、大洋", partOfSpeech: "名詞", category: "自然", appearanceCount: 4 },
    { id: 11248, word: "island", meaning: "島", partOfSpeech: "名詞", category: "自然", appearanceCount: 2 },
    { id: 11225, word: "forest", meaning: "森、森林", partOfSpeech: "名詞", category: "自然", appearanceCount: 9 },
    { id: 11226, word: "tree", meaning: "木", partOfSpeech: "名詞", category: "自然", appearanceCount: 115 },
    { id: 11228, word: "flower", meaning: "花", partOfSpeech: "名詞", category: "自然", appearanceCount: 5 },
    { id: 11237, word: "leaf", meaning: "葉、葉っぱ（複数形:leaves)", partOfSpeech: "名詞", category: "自然", appearanceCount: 12 },
    { id: 11229, word: "rock", meaning: "岩、岩石、ロック（音楽）", partOfSpeech: "名詞", category: "自然", appearanceCount: 4 },
    { id: 11230, word: "stone", meaning: "石", partOfSpeech: "名詞", category: "自然", appearanceCount: 0 },
    { id: 12221, word: "sky", meaning: "空", partOfSpeech: "名詞", category: "自然", appearanceCount: 11 },
    { id: 11234, word: "cloud", meaning: "雲", partOfSpeech: "名詞", category: "自然", appearanceCount: 4 },
    { id: 11231, word: "rainbow", meaning: "虹", partOfSpeech: "名詞", category: "自然", appearanceCount: 0 },
    { id: 11236, word: "sun", meaning: "太陽", partOfSpeech: "名詞", category: "自然", appearanceCount: 21 },
    { id: 11238, word: "earth", meaning: "地球", partOfSpeech: "名詞", category: "自然", appearanceCount: 38 },
    { id: 11239, word: "star", meaning: "星", partOfSpeech: "名詞", category: "自然", appearanceCount: 15 },
  ];

// 天気に関する単語
const weatherWords = [
  { id: 11200, word: "weather", meaning: "天気", partOfSpeech: "名詞", category: "天気", appearanceCount: 1 },
  { id: 11207, word: "sunny", meaning: "晴れた", partOfSpeech: "形容詞", category: "天気", appearanceCount: 4 },
  { id: 11208, word: "cloudy", meaning: "曇った", partOfSpeech: "形容詞", category: "天気", appearanceCount: 4 },
  { id: 11209, word: "rainy", meaning: "雨の", partOfSpeech: "形容詞", category: "天気", appearanceCount: 1 },
  { id: 11210, word: "snowy", meaning: "雪の", partOfSpeech: "形容詞", category: "天気", appearanceCount: 0 },
  { id: 11229, word: "windy", meaning: "風の強い、風のある", partOfSpeech: "形容詞", category: "天気", appearanceCount: 1 },
  { id: 11232, word: "rain", meaning: "雨、雨が降る", partOfSpeech: "名詞・動詞", category: "天気", appearanceCount: 8 },
  { id: 11233, word: "snow", meaning: "雪、雪が降る", partOfSpeech: "名詞・動詞", category: "天気", appearanceCount: 83 },
  { id: 11207, word: "wind", meaning: "風", partOfSpeech: "名詞", category: "天気", appearanceCount: 9 },
  { id: 11207, word: "typhoon", meaning: "台風", partOfSpeech: "名詞", category: "天気", appearanceCount: 0 },
   ];

// 方角・方向に関する単語
const directionWords = [
  { id: 11232, word: "north", meaning: "北", partOfSpeech: "名詞", category: "方角・方向", appearanceCount: 0 },
  { id: 11233, word: "south", meaning: "南", partOfSpeech: "名詞", category: "方角・方向", appearanceCount: 2 },
  { id: 11234, word: "east", meaning: "東", partOfSpeech: "名詞", category: "方角・方向", appearanceCount: 4 },
  { id: 11235, word: "west", meaning: "西", partOfSpeech: "名詞", category: "方角・方向", appearanceCount: 3 },
  { id: 11236, word: "northern", meaning: "北の、北にある、北部地方の", partOfSpeech: "形容詞", category: "方角・方向", appearanceCount: 1 },
  { id: 11237, word: "southern", meaning: "南の、南にある、南部地方の", partOfSpeech: "形容詞", category: "方角・方向", appearanceCount: 1 },
  { id: 11238, word: "eastern", meaning: "東の、東にある、東部地方の", partOfSpeech: "形容詞", category: "方角・方向", appearanceCount: 1 },
  { id: 11239, word: "western", meaning: "西の、西にある、西部地方の", partOfSpeech: "形容詞", category: "方角・方向", appearanceCount: 5 },
  { id: 11240, word: "up", meaning: "上へ（に）、上がって", partOfSpeech: "副詞・形容詞", category: "方角・方向", appearanceCount: 16 },
  { id: 11241, word: "down", meaning: "下へ（に）、落ち込んだ", partOfSpeech: "副詞・形容詞", category: "方角・方向", appearanceCount: 11 },
  { id: 11242, word: "right", meaning: "右、右へ（に）", partOfSpeech: "名詞・副詞", category: "方角・方向", appearanceCount: 116 },
  { id: 11243, word: "left", meaning: "左、左へ（に）", partOfSpeech: "名詞・副詞", category: "方角・方向", appearanceCount: 33 },
  { id: 11246, word: "straight", meaning: "まっすぐな、まっすぐに", partOfSpeech: "形容詞・副詞", category: "方角・方向", appearanceCount: 5 },
  { id: 11244, word: "forward", meaning: "前へ（に）、前に進んで", partOfSpeech: "副詞", category: "方角・方向", appearanceCount: 4 },
  { id: 11245, word: "back", meaning: "後ろへ（に）、戻って", partOfSpeech: "副詞", category: "方角・方向", appearanceCount: 28 },
];

// 教科に関する単語
const subjectWords = [
  { id: 11300, word: "subject", meaning: "教科", partOfSpeech: "名詞", category: "教科", appearanceCount: 1 },
  { id: 11308, word: "English", meaning: "英語", partOfSpeech: "名詞", category: "教科", appearanceCount: 82 },
  { id: 11309, word: "math", meaning: "数学、算数", partOfSpeech: "名詞", category: "教科", appearanceCount: 7 },
  { id: 11310, word: "science", meaning: "理科、科学", partOfSpeech: "名詞", category: "教科", appearanceCount: 22 },
  { id: 11312, word: "music", meaning: "音楽", partOfSpeech: "名詞", category: "教科", appearanceCount: 26 },
  { id: 11313, word: "arts and crafts", meaning: "図画工作", partOfSpeech: "名詞", category: "教科", appearanceCount: 12 },
  { id: 11324, word: "Japanese", meaning: "国語、日本語", partOfSpeech: "名詞", category: "教科", appearanceCount: 77 },
  { id: 11325, word: "social studies", meaning: "社会（社会科）", partOfSpeech: "名詞", category: "教科", appearanceCount: 0 },
  { id: 11326, word: "moral education", meaning: "道徳", partOfSpeech: "名詞", category: "教科", appearanceCount: 0 },
  { id: 11327, word: "home economics", meaning: "家庭科", partOfSpeech: "名詞", category: "教科", appearanceCount: 0 },
  { id: 11328, word: "P.E.", meaning: "体育（Physical Education）", partOfSpeech: "名詞", category: "教科", appearanceCount: 1 },
  { id: 11342, word: "calligraphy", meaning: "書道、書写、習字", partOfSpeech: "名詞", category: "教科", appearanceCount: 0 },
];

// 文房具に関する単語
const stationeryWords = [
  { id: 11340, word: "stationery", meaning: "文具", partOfSpeech: "名詞", category: "文房具", appearanceCount: 0 },
  { id: 11344, word: "pen", meaning: "ペン", partOfSpeech: "名詞", category: "文房具", appearanceCount: 1 },
  { id: 11345, word: "pencil", meaning: "鉛筆", partOfSpeech: "名詞", category: "文房具", appearanceCount: 1 },
  { id: 11346, word: "eraser", meaning: "消しゴム", partOfSpeech: "名詞", category: "文房具", appearanceCount: 0 },
  { id: 11347, word: "notebook", meaning: "ノート", partOfSpeech: "名詞", category: "文房具", appearanceCount: 5 },
  { id: 11348, word: "ruler", meaning: "定規", partOfSpeech: "名詞", category: "文房具", appearanceCount: 1 },
  { id: 11349, word: "scissors", meaning: "はさみ", partOfSpeech: "名詞", category: "文房具", appearanceCount: 0 },
  { id: 11350, word: "stapler", meaning: "ホチキス", partOfSpeech: "名詞", category: "文房具", appearanceCount: 0 },
];

// 学校（の種類）に関する単語
const schoolTypeWords = [
  { id: 11329, word: "school", meaning: "学校", partOfSpeech: "名詞", category: "学校（の種類）", appearanceCount: 144 },
  { id: 11330, word: "elementary school", meaning: "小学校", partOfSpeech: "名詞", category: "学校（の種類）", appearanceCount: 15 },
  { id: 11331, word: "junior high school", meaning: "中学校", partOfSpeech: "名詞", category: "学校（の種類）", appearanceCount: 4 },
  { id: 11329, word: "high school", meaning: "高校、高等学校", partOfSpeech: "名詞", category: "学校（の種類）", appearanceCount: 26 },
  { id: 11332, word: "university", meaning: "大学", partOfSpeech: "名詞", category: "学校（の種類）", appearanceCount: 5 },
  { id: 11333, word: "college", meaning: "大学、短大、専門学校", partOfSpeech: "名詞", category: "学校（の種類）", appearanceCount: 3 },
];


// 国名や地域に関する単語
const countryWords = [
  // 大陸・地域
  { id: 11402, word: "Asia", meaning: "アジア", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 16 },
  { id: 11403, word: "Europe", meaning: "ヨーロッパ", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 11 },
  { id: 11404, word: "Africa", meaning: "アフリカ", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 7 },
  // 国名
  { id: 11405, word: "Japan", meaning: "日本", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 140 },
  { id: 11406, word: "America", meaning: "アメリカ（合衆国）", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 32 },
  { id: 11407, word: "U.S.", meaning: "（theを付けて）アメリカ合衆国", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  { id: 11408, word: "Australia", meaning: "オーストラリア（大陸）", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 25 },
  { id: 11409, word: "Canada", meaning: "カナダ", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 15 },
  { id: 11410, word: "Germany", meaning: "ドイツ", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 10 },
  { id: 11411, word: "Korea", meaning: "韓国・朝鮮", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 10 },
  { id: 11412, word: "China", meaning: "中国", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 7 },
  { id: 11413, word: "France", meaning: "フランス", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 5 },
  { id: 11414, word: "U.K.", meaning: "（theを付けて）イギリス", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 2 },
  { id: 11415, word: "Brazil", meaning: "ブラジル", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 1 },
  { id: 11416, word: "India", meaning: "インド", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 1 },
  { id: 11417, word: "Italy", meaning: "イタリア", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  { id: 11418, word: "Russia", meaning: "ロシア", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  { id: 11419, word: "Spain", meaning: "スペイン", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  { id: 11420, word: "New Zealand", meaning: "ニュージーランド", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 27 },
  { id: 11422, word: "Thailand", meaning: "タイ", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 4 },
  { id: 11423, word: "Egypt", meaning: "エジプト", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 2 },
  { id: 11425, word: "Singapore", meaning: "シンガポール", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  { id: 11426, word: "Kenya", meaning: "ケニア", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  { id: 11427, word: "Peru", meaning: "ペルー", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  { id: 11428, word: "Greece", meaning: "ギリシャ", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 0 },
  // 都市
  { id: 11424, word: "New York", meaning: "ニューヨーク", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 1 },
  { id: 11421, word: "London", meaning: "ロンドン", partOfSpeech: "名詞", category: "国や地域", appearanceCount: 10 },
  // 国籍
  { id: 11429, word: "Japanese", meaning: "日本人（の）、日本の、日本語", partOfSpeech: "名形", category: "国や地域", appearanceCount: 77 },
  { id: 11430, word: "Korean", meaning: "韓国人（の）、韓国の、韓国語", partOfSpeech: "名形", category: "国や地域", appearanceCount: 7 },
  { id: 11431, word: "French", meaning: "フランス人（の）、フランスの、フランス語", partOfSpeech: "名形", category: "国や地域", appearanceCount: 6 },
  { id: 11432, word: "Asian", meaning: "アジア人（の）、アジアの", partOfSpeech: "名形", category: "国や地域", appearanceCount: 4 },
  { id: 11433, word: "Chinese", meaning: "中国人（の）、中国の、中国語", partOfSpeech: "名形", category: "国や地域", appearanceCount: 4 },
  { id: 11434, word: "American", meaning: "アメリカ人（の）、アメリカの", partOfSpeech: "名形", category: "国や地域", appearanceCount: 3 },
  { id: 11435, word: "Spanish", meaning: "スペイン人（の）、スペインの、スペイン語", partOfSpeech: "名形", category: "国や地域", appearanceCount: 1 },
  { id: 11436, word: "Italian", meaning: "イタリア人（の）、イタリアの、イタリア語", partOfSpeech: "名形", category: "国や地域", appearanceCount: 0 },
  { id: 11437, word: "German", meaning: "ドイツ人（の）、ドイツの、ドイツ語", partOfSpeech: "名形", category: "国や地域", appearanceCount: 0 },
];

// 後方互換性のため空配列として保持（実際のデータはレベル別配列を使用）
const adverbWords = [];
const relativeWords = [];
const eventLeisureWords = [];

// 機能語の後方互換性用エイリアス（レベル別配列を参照）
const articleWords = [];
const pronounWords = [];
const indefinitePronounWords = [];
const questionWords = [];
const quantifierWords = [];
const auxiliaryWords = [];
const conjunctionWords = [];
const interjectionWords = [];

// 前置詞
const prepositionWords = [
  { id: 20601, word: "in", meaning: "①（場所・位置）〜の中に［で］ ②（時）〜に ③（手段）〜で ④（所要時間）〜後に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1337, example: { english: "<strong>in</strong> the library", japanese: "図書館(<strong>の中</strong>)(<strong>に</strong>)" } },
  { id: 20602, word: "on", meaning: "①（時・日）〜に ②（場所）〜の上に、〜に（接触） ③（状態）〜中で ④〜について", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 283, example: { english: "<strong>on</strong> the table", japanese: "テーブル(<strong>の上</strong>)(<strong>に</strong>)" } },
  { id: 20603, word: "at", meaning: "①（場所・位置）〜に（で）②（時刻）〜に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 264, example: { english: "<strong>at</strong> the station", japanese: "駅(<strong>に</strong>)(<strong>で</strong>)" } },
  { id: 20604, word: "by", meaning: "①（場所）〜のそばに ②〜によって ③（締切）〜までに", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 214, example: { english: "<strong>by</strong> the park", japanese: "公園(<strong>のそばに</strong>)" } },
  { id: 20605, word: "for", meaning: "①〜のために ②〜に向かって ③〜にとって ④〜の間", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 507, example: { english: "<strong>for</strong> us", japanese: "私たちの(<strong>ために</strong>)" } },
  { id: 20606, word: "with", meaning: "①〜と一緒に ②（道具）〜で、〜を使って ③〜のある、〜を身に付けて・所持して", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 322, example: { english: "<strong>with</strong> him", japanese: "彼(<strong>と一緒に</strong>)" } },
  { id: 20607, word: "from", meaning: "〜から、〜出身の", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 271, example: { english: "<strong>from</strong> Canada", japanese: "カナダ(<strong>出身の</strong>)" } },
  { id: 20608, word: "to", meaning: "（方向・到達点）〜へ・〜まで", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1449, example: { english: "<strong>to</strong> Tokyo", japanese: "東京(<strong>へ</strong>)" } },
  { id: 20609, word: "of", meaning: "①（帰属）〜の ②（同格）〜という… ③（部分）〜の中の…", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 989, example: { english: "history <strong>of</strong> Japan", japanese: "日本(<strong>の</strong>)歴史" } },
  { id: 20610, word: "about", meaning: "〜について、〜に関して（関する）、およそ、約〜", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 575, example: { english: "<strong>about</strong> music / about 40 years ago", japanese: "音楽(<strong>について</strong>) / (<strong>約</strong>)40年前" } },
  { id: 20635, word: "as", meaning: "〜として", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 95, example: { english: "<strong>as</strong> a teacher", japanese: "教師(<strong>として</strong>)" } },
  { id: 20611, word: "into", meaning: "〜の中へ", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 22, example: { english: "<strong>into</strong> the room", japanese: "部屋(<strong>の中へ</strong>)" } },
  { id: 20612, word: "over", meaning: "①〜の上の方 ②〜じゅう、〜のいたるところに ③〜以上に、〜より多く", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 20, example: { english: "<strong>over</strong> the bridge", japanese: "橋(<strong>の上</strong>)" } },
  { id: 20628, word: "above", meaning: "〜の上に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1, example: { english: "<strong>above</strong>your head", japanese: "頭(<strong>の上</strong>)" } },
  { id: 20613, word: "under", meaning: "〜の下に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 20, example: { english: "<strong>under</strong> the table", japanese: "テーブル(<strong>の下に</strong>)" } },
  { id: 20614, word: "between", meaning: "（2つ、2人）〜の間に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 33, example: { english: "<strong>between</strong> the two buildings", japanese: "2つの建物の(<strong>間</strong>)" } },
  { id: 20615, word: "among", meaning: "（3つ、3人以上）〜の間に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 20, example: { english: "<strong>among</strong> the trees", japanese: "木々の(<strong>間</strong>)" } },
  { id: 20616, word: "through", meaning: "①〜を通って ②（手段）〜を通じて", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 33, example: { english: "<strong>through</strong> the forest", japanese: "森(<strong>を通って</strong>)" } },
  { id: 20617, word: "during", meaning: "（特定の期間）の間じゅう", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 21, example: { english: "<strong>during</strong> the summer", japanese: "夏(<strong>の間</strong>)" } },
  { id: 20618, word: "before", meaning: "〜の前に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 59, example: { english: "<strong>before</strong> the meeting", japanese: "会議(<strong>の前</strong>)" } },
  { id: 20619, word: "after", meaning: "〜のあとに（で）、〜してから", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 104, example: { english: "<strong>after</strong> the party", japanese: "パーティー(<strong>のあと</strong>)" } },
  { id: 20620, word: "since", meaning: "～から、〜以来", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 9, example: { english: "<strong>since</strong> yesterday", japanese: "昨日(<strong>から</strong>)" } },
  { id: 20621, word: "until", meaning: "〜までずっと", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 12, example: { english: "<strong>until</strong> tomorrow", japanese: "明日(<strong>まで</strong>)" } },
  { id: 20622, word: "against", meaning: "〜に反対して、〜に対して", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1, example: { english: "<strong>against</strong> the law", japanese: "法律(<strong>に反対して</strong>)" } },
  { id: 20623, word: "without", meaning: "〜なしで", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 57, example: { english: "<strong>without</strong> a word", japanese: "一言も(<strong>言わずに</strong>)" } },
  { id: 20624, word: "along", meaning: "〜に沿って", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 16, example: { english: "walk <strong>along</strong> the river", japanese: "川(<strong>に沿って</strong>)歩く" } },
  { id: 20625, word: "across", meaning: "〜を横切って、〜の向こう側に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 2, example: { english: "walk <strong>across</strong> the street", japanese: "通り(<strong>を横切って</strong>)歩く" } },
  { id: 20626, word: "beside", meaning: "〜のそばに、〜の隣に", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 7, example: { english: "sit <strong>beside</strong> me", japanese: "私の(<strong>隣に</strong>)座る" } },
  { id: 20627, word: "below", meaning: "下に・下記に（へ/を/の）", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 12, example: { english: "the room <strong>below</strong>", japanese: "(<strong>下の</strong>)部屋" } },
  { id: 20629, word: "toward", meaning: "〜の方へ、〜に向かって", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 1, example: { english: "walk <strong>toward</strong> the station", japanese: "駅(<strong>の方へ</strong>)歩く" } },
  { id: 20630, word: "behind", meaning: "〜の後ろに", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "behind the house", japanese: "家(<strong>の後ろに</strong>)" } },
  { id: 20631, word: "beyond", meaning: "〜を越えて、〜の向こうに", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "beyond the mountain", japanese: "山(<strong>を越えて</strong>)" } },
  { id: 20632, word: "plus", meaning: "〜に加えて、〜プラス", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "Two <strong>plus</strong> three is five.", japanese: "2(<strong>プラス</strong>)3は5です。" } },
  { id: 20633, word: "till", meaning: "〜まで", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "from morning <strong>till</strong> night", japanese: "朝から夜(<strong>まで</strong>)" } },
  { id: 20634, word: "within", meaning: "〜以内に（で）", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 0, example: { english: "within a few minutes", japanese: "数分(<strong>以内で</strong>)" } },
];


// ============================================
// レベル別単語（品詞ごとに分類）
// ============================================
// カテゴリ別の下に、レベル別の品詞カテゴリーを配置
// 単語を追加する場合は、対応する品詞の配列に追加してください

// ============================================
// レベル1の品詞別単語
// ============================================
// レベル1: 冠詞、代名詞、動詞、名詞、形容詞、副詞、前置詞、疑問詞、間投詞

// レベル1 冠詞
const level1ArticleWords = [
  { id: 20001, word: "a", meaning: "１つの〜、１人の〜", partOfSpeech: "冠詞", category: "LEVEL1 冠詞", appearanceCount: 1105, example: { english: "<strong>a</strong> bike", japanese: "（<strong>１台の</strong>）自転車" } },
  { id: 20002, word: "an", meaning: "１つの〜、１人の〜（母音の音の前で使う）", partOfSpeech: "冠詞", category: "LEVEL1 冠詞", appearanceCount: 119, example: { english: "<strong>an</strong> umbrella", japanese: "（<strong>1本の</strong>）かさ" } },
  { id: 20003, word: "the", meaning: "その〜", partOfSpeech: "冠詞", category: "LEVEL1 冠詞", appearanceCount: 2988, example: { english: "Please open <strong>the</strong> window.", japanese: "(<strong>その</strong>)窓を開けてください。" } },
];

// レベル1 代名詞
const level1PronounWords = [
  { id: 20101, word: "I", meaning: "【代】私は(主格）　《活用》am - am - am 〖連〗be able to～ ～することができる", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 1441, example: { english: "<strong>I</strong> like baseball very much.", japanese: "(<strong>私は</strong>)野球が大好きです。" } },
  { id: 20102, word: "my", meaning: "私の（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 324, example: { english: "<strong>my</strong> book", japanese: "(<strong>私の</strong>)本" } },
  { id: 20103, word: "me", meaning: "私を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 178, example: { english: "Please help <strong>me</strong>.", japanese: "(<strong>私を</strong>)助けてください。" } },
  { id: 20104, word: "mine", meaning: "私のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 6, example: { english: "This pen is <strong>mine</strong>.", japanese: "このペンは(<strong>私のもの</strong>)です。" } },
  { id: 20105, word: "you", meaning: "あなた（たち）［は/を/に］（主格・目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 923, example: { english: "I love <strong>you</strong>.", japanese: "私は(<strong>あなたを</strong>)愛しています。" } },
  { id: 20106, word: "your", meaning: "あなた（たち）の（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 232, example: { english: "Is this <strong>your</strong> bag?", japanese: "これは(<strong>あなたの</strong>)かばんですか。" } },
  { id: 20107, word: "yours", meaning: "あなた（たち）のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 9, example: { english: "This book is <strong>yours</strong>.", japanese: "この本は(<strong>あなたのもの</strong>)です。" } },
  { id: 20108, word: "he", meaning: "彼は（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 600, example: { english: "<strong>He</strong> is an English teacher.", japanese: "(<strong>彼は</strong>)英語の先生です。" } },
  { id: 20109, word: "his", meaning: "彼の（所有格）、彼のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 350, example: { english: "That is <strong>his</strong> car.", japanese: "あれは(<strong>彼の</strong>)車です。" } },
  { id: 20110, word: "him", meaning: "彼を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 200, example: { english: "I gave <strong>him</strong> a present.", japanese: "私は(<strong>彼に</strong>)プレゼントをあげました。" } },
  { id: 20111, word: "she", meaning: "彼女は（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 400, example: { english: "<strong>She</strong> is my sister.", japanese: "(<strong>彼女は</strong>)私の姉です。" } },
  { id: 20112, word: "her", meaning: "彼女の（所有格）、彼女を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 300, example: { english: "I like <strong>her</strong> smile.", japanese: "私は(<strong>彼女の</strong>)笑顔が好きです。" } },
  { id: 20113, word: "hers", meaning: "彼女のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 20, example: { english: "This bag is <strong>hers</strong>.", japanese: "このかばんは(<strong>彼女のもの</strong>)です。" } },
  { id: 20114, word: "they", meaning: "彼ら（彼女ら・それら）は（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 500, example: { english: "<strong>They</strong> are students.", japanese: "(<strong>彼らは</strong>)学生です。" } },
  { id: 20115, word: "their", meaning: "彼ら（彼女ら・それら）の（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 250, example: { english: "<strong>Their</strong> house is big.", japanese: "(<strong>彼らの</strong>)家は大きいです。" } },
  { id: 20116, word: "them", meaning: "彼ら（彼女ら・それら）を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 200, example: { english: "I met <strong>them</strong> yesterday.", japanese: "私は昨日(<strong>彼らに</strong>)会いました。" } },
  { id: 20117, word: "theirs", meaning: "彼ら（彼女ら）のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 15, example: { english: "This dog is <strong>theirs</strong>.", japanese: "この犬は(<strong>彼らのもの</strong>)です。" } },
  { id: 20118, word: "we", meaning: "私たちは（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 400, example: { english: "<strong>We</strong> are friends.", japanese: "(<strong>私たちは</strong>)友達です。" } },
  { id: 20119, word: "our", meaning: "私たちの（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 200, example: { english: "This is <strong>our</strong> school.", japanese: "これは(<strong>私たちの</strong>)学校です。" } },
  { id: 20120, word: "us", meaning: "私たちを/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 150, example: { english: "Please tell <strong>us</strong> the story.", japanese: "(<strong>私たちに</strong>)その話を聞かせてください。" } },
  { id: 20121, word: "ours", meaning: "私たちのもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 20, example: { english: "This land is <strong>ours</strong>.", japanese: "この土地は(<strong>私たちのもの</strong>)です。" } },
  { id: 20122, word: "it", meaning: "それは（主格）、それを/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 1000, example: { english: "<strong>It</strong> is a cat.", japanese: "(<strong>それは</strong>)猫です。" } },
  { id: 20123, word: "its", meaning: "それの、その（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 100, example: { english: "The dog wagged <strong>its</strong> tail.", japanese: "その犬は(<strong>しっぽを</strong>)振りました。" } },
  { id: 20124, word: "this", meaning: "これは、この", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 600, example: { english: "<strong>This</strong> is my pen.", japanese: "(<strong>これは</strong>)私のペンです。" } },
  { id: 20125, word: "these", meaning: "これらは、これらの", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 100, example: { english: "<strong>These</strong> are my books.", japanese: "(<strong>これらは</strong>)私の本です。" } },
  { id: 20126, word: "that", meaning: "あれは、あの、それは", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 800, example: { english: "<strong>That</strong> is a bird.", japanese: "(<strong>あれは</strong>)鳥です。" } },
  { id: 20127, word: "those", meaning: "あれらは、あれらの", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 80, example: { english: "<strong>Those</strong> are my friends.", japanese: "(<strong>あれらは</strong>)私の友達です。" } },
];

// レベル1 動詞
const level1VerbWords = [
  { id: 30301, word: "is", meaning: "(beの三人称・単数・現在形) ～です、～だ、(～に)いる、ある", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1976 },
  { id: 30302, word: "was", meaning: "～だった、あった、いた(is, amの過去形)", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1976 },
  { id: 30303, word: "were", meaning: "～だった、あった、いた(areの過去形)", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1976 },
  { id: 30304, word: "be", meaning: "～です、～だ、(～に)いる、ある 《活用》be-was/were-been", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1976 },
  { id: 30305, word: "am", meaning: "(beの一人称・単数・現在形) ～です、～だ、(～に)いる、ある", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1976 },
  { id: 30306, word: "are", meaning: "(beの二人称・複数現在形) ～です、～だ、(～に)いる、ある", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1976 },
  { id: 30307, word: "do", meaning: "～をする、やっていく、うまくいく 《活用》do-did-done", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 460 },
  { id: 30308, word: "have", meaning: "～を持っている、～を食べる、～を飼っている 《活用》had-had", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 455 },
  { id: 30309, word: "like", meaning: "～が好きである、～を好む", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 139 },
  { id: 30310, word: "want", meaning: "～が欲しい、～を望む", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 182 },
  { id: 30311, word: "play", meaning: "①(運動)をする ②(～を)演奏する ③遊ぶ ④(～を)演じる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 38 },
  { id: 30312, word: "practice", meaning: "(～を)練習する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 31 },
  { id: 30313, word: "go", meaning: "①行く ②(事が)進行する 《活用》went-gone", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 198 },
  { id: 30314, word: "study", meaning: "(～を)勉強する、(～を)研究する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 54 },
  { id: 30315, word: "learn", meaning: "①～を学ぶ、～を習う、～を覚える ②知る、聞く", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 151 },
  { id: 30316, word: "teach", meaning: "(…に)(～を)教える 《活用》teach-taught-taught", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 23 },
  { id: 30317, word: "make", meaning: "①～を作る ②～を...にする ③～に...させる 《活用》made-made", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 290 },
  { id: 30318, word: "eat", meaning: "～を食べる、食事をする 《活用》ate-eaten", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 65 },
  { id: 30319, word: "drink", meaning: "～を飲む、酒を飲む 《活用》drank-drunk", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 30 },
  { id: 30320, word: "use", meaning: "～を使う、～を利用する、～を消費する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 285 },
  { id: 30321, word: "know", meaning: "～を知る、～を知っている、～がわかる 《活用》knew-known", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 213 },
  { id: 30322, word: "read", meaning: "～を読む、読書する 《活用》read-read", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 92 },
  { id: 30323, word: "write", meaning: "①～を書く ②手紙を書く 《活用》wrote-written", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 80 },
  { id: 30324, word: "live", meaning: "住む、生きる、暮らす", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 58 },
  { id: 30325, word: "speak", meaning: "～を話す、話をする 《活用》spoke-spoken", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 55 },
  { id: 30326, word: "talk", meaning: "話す、話をする", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 91 },
  { id: 30327, word: "say", meaning: "①(～と)言う ②～と書いてある 《活用》said-said", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 88 },
  { id: 30328, word: "tell", meaning: "(…に)～を言う、(…に)～を教える 《活用》told-told", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 96 },
  { id: 30329, word: "love", meaning: "～を愛する、～のことが大好きである、～をとても気に入る", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 7 },
  { id: 30330, word: "watch", meaning: "①～を(注意してじっと)見る ②～に注意する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 57 },
  { id: 30331, word: "see", meaning: "①わかる、理解する ②～を見る、～が見える ③～に会う 《活用》saw-seen", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 253 },
  { id: 30332, word: "look", meaning: "①見る ②～に見える", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 137 },
  { id: 30333, word: "sing", meaning: "歌う、～を歌う 《活用》sang-sung", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 11 },
  { id: 30334, word: "swim", meaning: "泳ぐ 《活用》swam-swum", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 11 },
  { id: 30335, word: "run", meaning: "①走る、運行する ②～を経営する、～を運営する 《活用》ran-run", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 8 },
  { id: 30336, word: "walk", meaning: "①歩く、散歩する ②～を散歩させる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 41 },
  { id: 30337, word: "work", meaning: "①働く、取り組む ②機能する、(うまく)いく", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 64 },
  { id: 30338, word: "dance", meaning: "ダンスをする、踊る", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 3 },
  { id: 30339, word: "stand", meaning: "①立つ、立っている、建つ、ある ②～に耐える 《活用》stood-stood", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 7 },
  { id: 30340, word: "sit", meaning: "すわる 《活用》sat-sat", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 12 },
  { id: 30341, word: "clean", meaning: "～を掃除する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 19 },
  { id: 30342, word: "wash", meaning: "～を洗う、～を洗濯する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0 },
  { id: 30343, word: "think", meaning: "(～と)思う、(～と)考える 《活用》thought-thought", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 282 },
  { id: 30344, word: "get", meaning: "①～を得る ②～になる ③～に着く ④～を理解する 《活用》got-got/gotten", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 161 },
  { id: 30345, word: "sleep", meaning: "眠る、寝ている 《活用》slept-slept", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 5 },
  { id: 30346, word: "choose", meaning: "～を選ぶ、～を選択する 《活用》chose-chosen", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 141 },
  { id: 30347, word: "take", meaning: "①(～を)とる ②～を持っていく ③(時間が)かかる ④～に乗る 《活用》took-taken", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 124 },
  { id: 30348, word: "enjoy", meaning: "～を楽しむ", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 112 },
  { id: 30349, word: "show", meaning: "①(…に)～を見せる、～を示す ②～を案内する 《活用》showed-shown/showed", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 111 },
  { id: 30350, word: "listen", meaning: "聞く", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 35 },
  { id: 30351, word: "hear", meaning: "～を聞く、～が聞こえる 《活用》heard-heard", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 104 },
  { id: 30352, word: "help", meaning: "～を助ける、～を手伝う", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 104 },
  { id: 30353, word: "meet", meaning: "～に〔と〕会う、(～と)出会う、～と知り合いになる 《活用》met-met", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 30 },
  { id: 30354, word: "come", meaning: "①(話し手の方へ)来る、(聞き手の方へ)行く ②(もの・ことが)～になる 《活用》came-come", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 84 },
  { id: 30355, word: "visit", meaning: "～を訪ねる、～を訪れる、～に行く", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 84 },
  { id: 30356, word: "begin", meaning: "～を始める、～をし始める、始まる 《活用》began-begun", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 30 },
  { id: 30357, word: "start", meaning: "①～を始める ②始まる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 67 },
  { id: 30358, word: "stop", meaning: "①止まる ②～を止める、～をやめる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 18 },
  { id: 30359, word: "open", meaning: "①～を開ける、(店などを)始める ②(店などが)開く", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 8 },
  { id: 30360, word: "close", meaning: "～を閉じる、～を閉める", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 8 },
  { id: 30361, word: "ask", meaning: "①(…に)～をたずねる ②(…に)～するように頼む", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 61 },
  { id: 30362, word: "answer", meaning: "(～に)答える、(～に)返事をする、(～に)応答する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 102 },
  { id: 30363, word: "mean", meaning: "～を意味する、～のことを言う 《活用》meant-meant", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 77 },
  { id: 30364, word: "give", meaning: "(…に)～を与える、～をあげる 《活用》gave-given", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 40 },
  { id: 30365, word: "buy", meaning: "～を買う 《活用》bought-bought", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 46 },
  { id: 30366, word: "need", meaning: "～を必要とする", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 61 },
  { id: 30367, word: "hope", meaning: "～だと望む、～だと願う、～だとよいと思う", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 26 },
  { id: 30368, word: "try", meaning: "(～を)試す、(～を)やってみる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 84 },
  { id: 30369, word: "keep", meaning: "①～のままである、～にしておく、～を続ける ②(日記や記録を)つける ③～を飼う 《活用》kept-kept", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 54 },
  { id: 30370, word: "leave", meaning: "①(～を)去る、(～を)出発する ②～を置いて〔残して〕いく ③～を置き忘れる 《活用》left-left", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 33 },
  { id: 30371, word: "become", meaning: "～になる 《活用》became-become", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 78 },
  { id: 30372, word: "feel", meaning: "～と感じる、～と思う 《活用》felt-felt", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 73 },
  { id: 30373, word: "join", meaning: "～に参加する、～に加わる、～をつなぐ、つながる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 71 },
  { id: 30374, word: "put", meaning: "①～を置く、～を載せる、～をつける ②～の状態にする 《活用》put-put", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 71 },
  { id: 30375, word: "thank", meaning: "～に感謝する、礼を言う", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 100 },
  { id: 30376, word: "sound", meaning: "～に聞こえる、～のように思われる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 49 },
  { id: 30377, word: "change", meaning: "～を変える、変わる、変化する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 48 },
  { id: 30378, word: "wear", meaning: "～を身に付けている、～を着ている 《活用》wore-worn", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 40 },
  { id: 30379, word: "hold", meaning: "～を持っている、～をつかむ、～を開催する 《活用》held-held", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 39 },
  { id: 30380, word: "send", meaning: "～を送る 《活用》sent-sent", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 30 },
  { id: 30381, word: "wait", meaning: "待つ", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 23 },
  { id: 30382, word: "stay", meaning: "①とどまる ②～のままでいる ③滞在する、泊まる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 30 },
  { id: 30383, word: "remember", meaning: "～を思い出す、～を覚えている", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 33 },
  { id: 30384, word: "forget", meaning: "～を忘れる、～を置き忘れる 《活用》forgot-forgot/forgotten", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 2 },
  { id: 30385, word: "carry", meaning: "～を運ぶ、～を持っていく", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 25 },
  { id: 30386, word: "call", meaning: "①～に電話をかける ②～を(…と)呼ぶ、～を(…と)名づける", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 17 },
  { id: 30387, word: "plan", meaning: "～の計画(予定)を立てる、計画する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 17 },
  { id: 30388, word: "lose", meaning: "①～を失う、～をなくす ②～に負ける 《活用》lost-lost", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 15 },
  { id: 30389, word: "cut", meaning: "～を切る、～の供給をとめる 《活用》cut-cut", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 15 },
  { id: 30390, word: "experience", meaning: "～を経験する、～を体験する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 49 },
  { id: 30391, word: "bring", meaning: "～を持ってくる、～を連れてくる、～をもたらす 《活用》brought-brought", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 13 },
  { id: 30392, word: "find", meaning: "～を見つける、～を発見する、～に気づく 《活用》found-found", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 140 },
  { id: 30393, word: "understand", meaning: "～を理解する、(～と)わかる 《活用》understood-understood", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 57 },
  { id: 30394, word: "wake", meaning: "①起きる、目が覚める ②～を起こす 《活用》woke-woken", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0 },
  { id: 30395, word: "move", meaning: "①動く、移動する、～を動かす ②引っ越す ③感動させる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 49 },
  { id: 30396, word: "grow", meaning: "成長する、育つ、～を栽培する、～を育てる 《活用》grew-grown", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 23 },
  { id: 30397, word: "build", meaning: "～を建てる、～を建築する 《活用》built-built", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 18 },
  { id: 30398, word: "drive", meaning: "～を運転する、～を車で送る、車を運転する 《活用》drove-driven", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 4 },
  { id: 30399, word: "check", meaning: "～を調べる、～をチェックする", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 3 },
  { id: 30400, word: "hit", meaning: "～を打つ、～にぶつかる、～を襲う 《活用》hit-hit", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 2 },
  { id: 30401, word: "climb", meaning: "～を登る", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 2 },
  { id: 30402, word: "skate", meaning: "スケートをする", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0 },
  { id: 30403, word: "touch", meaning: "①(～を)さわる ②～を感動させる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1 },
  { id: 30404, word: "ride", meaning: "(～に)乗る、(～に)乗っていく 《活用》rode-ridden", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 17 },
  { id: 30405, word: "cry", meaning: "泣く、鳴く", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1 },
  { id: 30406, word: "perform", meaning: "(～を)行う、(～を)演じる、(～を)上演する、(～を)演奏する", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 1 },
  { id: 30407, word: "spread", meaning: "①～を広げる、～を広める ②広がる、広まる 《活用》spread-spread", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 18 },
  { id: 30408, word: "win", meaning: "①(～に)勝つ ②～を勝ち取る、～を受賞する 《活用》won-won", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0 },
  { id: 30409, word: "belong", meaning: "～のものである、～に所属している", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0 },
  { id: 30410, word: "jump", meaning: "跳ぶ、はねる、ジャンプする", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 2 },
  { id: 30411, word: "die", meaning: "死ぬ", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0 },
  { id: 30412, word: "protect", meaning: "～を保護する、～を守る", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 28 },
  { id: 30413, word: "save", meaning: "①～を救う、～を守る、～を助ける ②～を節約する、～をためる", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0 },
];

// レベル1 名詞
const level1NounWords = [
  { id: 30001, word: "student", meaning: "生徒、学生", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 122 },
  { id: 30002, word: "teacher", meaning: "先生、教師", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 23 },
  { id: 30003, word: "boy", meaning: "少年", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 5 },
  { id: 30004, word: "girl", meaning: "女の子、少女", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30005, word: "man", meaning: "男の人、男性 《複数》men", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 48 },
  { id: 30006, word: "woman", meaning: "女の人、女性 《複数》women", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 41 },
  { id: 30007, word: "Mr.", meaning: "～さん、～先生(男性に対する敬称)", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 80 },
  { id: 30008, word: "Ms.", meaning: "～さん、～先生(女性に対する敬称)", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 19 },
  { id: 30009, word: "child", meaning: "子ども 《複数》children", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 21 },
  { id: 30010, word: "baby", meaning: "赤ちゃん", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30011, word: "pet", meaning: "ペット", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30012, word: "friend", meaning: "友だち、友人", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 36 },
  { id: 30013, word: "classmate", meaning: "同級生、クラスメート", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30014, word: "people", meaning: "人々、国民", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 467 },
  { id: 30015, word: "bag", meaning: "かばん", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 28 },
  { id: 30016, word: "ball", meaning: "ボール", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30017, word: "bat", meaning: "(野球などの)バット", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30018, word: "racket", meaning: "(テニスや卓球の)ラケット", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30019, word: "book", meaning: "本", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 92 },
  { id: 30020, word: "textbook", meaning: "教科書", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30021, word: "dictionary", meaning: "辞書", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 9 },
  { id: 30022, word: "page", meaning: "ページ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30023, word: "camera", meaning: "カメラ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 13 },
  { id: 30024, word: "picture", meaning: "①絵 ②写真", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 72 },
  { id: 30025, word: "time", meaning: "①時間・時刻 ②～回、～度 ③(複数形で)時代", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 196 },
  { id: 30026, word: "photo", meaning: "写真(photographの短縮形)", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 43 },
  { id: 30027, word: "album", meaning: "アルバム", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30028, word: "clock", meaning: "時計", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 21 },
  { id: 30029, word: "o'clock", meaning: "～時", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30030, word: "TV", meaning: "テレビ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 19 },
  { id: 30031, word: "CD", meaning: "ＣＤ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30032, word: "DVD", meaning: "ＤＶＤ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30033, word: "video", meaning: "動画、映像、ビデオ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30034, word: "anime", meaning: "アニメ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30035, word: "comic", meaning: "マンガ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30036, word: "radio", meaning: "ラジオ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30037, word: "drama", meaning: "ドラマ、劇、演劇", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 9 },
  { id: 30038, word: "movie", meaning: "映画", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 19 },
  { id: 30039, word: "game", meaning: "試合、競技、ゲーム", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 17 },
  { id: 30040, word: "contest", meaning: "試合、競技、コンテスト、競争", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30041, word: "ticket", meaning: "切符、券、チケット", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 5 },
  { id: 30042, word: "map", meaning: "地図", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 25 },
  { id: 30043, word: "news", meaning: "ニュース、知らせ、報道", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 111 },
  { id: 30044, word: "newspaper", meaning: "新聞", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30045, word: "letter", meaning: "①文字 ②手紙", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 12 },
  { id: 30046, word: "box", meaning: "箱", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 9 },
  { id: 30047, word: "house", meaning: "家", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 42 },
  { id: 30048, word: "roof", meaning: "屋根、屋上", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30049, word: "wall", meaning: "壁、へい", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30050, word: "window", meaning: "窓", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30051, word: "door", meaning: "ドア、扉", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30052, word: "key", meaning: "①かぎ ②手がかり、秘けつ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30053, word: "room", meaning: "部屋、室", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 34 },
  { id: 30054, word: "classroom", meaning: "教室", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 13 },
  { id: 30055, word: "blackboard", meaning: "黒板", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30056, word: "class", meaning: "授業、学級、(クラスの)みなさん", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 43 },
  { id: 30057, word: "lesson", meaning: "授業、レッスン、課、習い事", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 25 },
  { id: 30058, word: "test", meaning: "試験、テスト、検査", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 18 },
  { id: 30059, word: "club", meaning: "クラブ、部", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 58 },
  { id: 30060, word: "table", meaning: "①テーブル、食卓 ②表、一覧表", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 27 },
  { id: 30061, word: "desk", meaning: "机", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 8 },
  { id: 30062, word: "chair", meaning: "いす", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30063, word: "bed", meaning: "ベッド", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30064, word: "sofa", meaning: "ソファ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30065, word: "umbrella", meaning: "かさ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30066, word: "computer", meaning: "コンピュータ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 32 },
  { id: 30067, word: "machine", meaning: "機械、装置、機具", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 38 },
  { id: 30068, word: "robot", meaning: "ロボット", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30069, word: "homework", meaning: "宿題", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 9 },
  { id: 30070, word: "garden", meaning: "庭、庭園", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 11 },
  { id: 30071, word: "kitchen", meaning: "台所、キッチン", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30072, word: "cooking", meaning: "料理", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30073, word: "recipe", meaning: "レシピ、調理法、(料理などの)作り方", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30074, word: "knife", meaning: "包丁、ナイフ 《複数》knives", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30075, word: "dish", meaning: "①皿、食器類 ②料理、食べ物", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30076, word: "plate", meaning: "皿、取り皿", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30077, word: "cup", meaning: "カップ、茶わん、カップ１杯分", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 25 },
  { id: 30078, word: "glass", meaning: "コップ、グラス", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30079, word: "phone", meaning: "電話", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30080, word: "smartphone", meaning: "スマートフォン", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 22 },
  { id: 30081, word: "tablet", meaning: "タブレット", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30082, word: "e-mail", meaning: "Eメール、電子メール", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30083, word: "Internet", meaning: "インターネット", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 35 },
  { id: 30084, word: "website", meaning: "ウェブサイト", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30085, word: "message", meaning: "伝言、メッセージ、伝えたいこと", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 24 },
  { id: 30086, word: "question", meaning: "質問、疑問、問題", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 131 },
  { id: 30087, word: "language", meaning: "言語、言葉、(ある国の)国語", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 49 },
  { id: 30088, word: "problem", meaning: "問題、課題", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 47 },
  { id: 30089, word: "thing", meaning: "もの、こと", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 60 },
  { id: 30090, word: "world", meaning: "世界", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 57 },
  { id: 30091, word: "home", meaning: "①家、家庭 ②故郷", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 36 },
  { id: 30092, word: "city", meaning: "市、都市、都会", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 53 },
  { id: 30093, word: "town", meaning: "町", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 37 },
  { id: 30094, word: "hometown", meaning: "ふるさと、故郷", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 8 },
  { id: 30095, word: "place", meaning: "①場所、ところ ②順位、立場", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 78 },
  { id: 30096, word: "earth", meaning: "地球", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 38 },
  { id: 30097, word: "money", meaning: "お金、通貨、金銭", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30098, word: "coin", meaning: "硬貨、コイン", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30099, word: "store", meaning: "店", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30100, word: "shop", meaning: "店", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 14 },
  { id: 30101, word: "shopping", meaning: "買い物、ショッピング", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30102, word: "life", meaning: "①生活、暮らし ②人生、一生 ③生命、命、寿命 《複数》lives", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 50 },
  { id: 30103, word: "event", meaning: "出来事、行事、催し物、イベント", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 54 },
  { id: 30104, word: "team", meaning: "チーム、部、組、団", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 21 },
  { id: 30105, word: "teammate", meaning: "チームメイト、仲間", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30106, word: "uniform", meaning: "制服、ユニフォーム", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30107, word: "member", meaning: "一員、メンバー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 41 },
  { id: 30108, word: "group", meaning: "集団、グループ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 26 },
  { id: 30109, word: "communication", meaning: "意思疎通、コミュニケーション", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 5 },
  { id: 30110, word: "point", meaning: "点、ポイント、要点、考え、点数", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 43 },
  { id: 30111, word: "story", meaning: "話、物語", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 33 },
  { id: 30112, word: "paper", meaning: "紙、用紙、レポート、論文", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 34 },
  { id: 30113, word: "history", meaning: "歴史", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 28 },
  { id: 30114, word: "future", meaning: "将来、未来", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 32 },
  { id: 30115, word: "dream", meaning: "夢、希望、理想", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30116, word: "chance", meaning: "機会、チャンス", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 22 },
  { id: 30117, word: "choice", meaning: "選択、選ぶこと", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 20 },
  { id: 30118, word: "New Year", meaning: "新年、正月", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30119, word: "Christmas", meaning: "クリスマス", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30120, word: "birthday", meaning: "誕生日", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 17 },
  { id: 30121, word: "present", meaning: "贈り物、プレゼント", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 15 },
  { id: 30122, word: "party", meaning: "パーティー、(社交の)会", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 13 },
  { id: 30123, word: "festival", meaning: "祭り、祭典、催し物", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 12 },
  { id: 30124, word: "concert", meaning: "コンサート", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 18 },
  { id: 30125, word: "song", meaning: "歌", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 12 },
  { id: 30126, word: "fun", meaning: "楽しみ、楽しさ、喜び、おもしろいもの", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 19 },
  { id: 30127, word: "vacation", meaning: "休暇、休日、休み", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30128, word: "holiday", meaning: "休日、休暇、祝日", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30129, word: "hobby", meaning: "趣味", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30130, word: "fishing", meaning: "釣り", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30131, word: "picnic", meaning: "ピクニック、遠足", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30132, word: "camp", meaning: "キャンプ場、キャンプ生活", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30133, word: "camping", meaning: "キャンプ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30134, word: "lamp", meaning: "ランプ、明かり、電気スタンド", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30135, word: "light", meaning: "光、明るさ、明かり、照明、電灯", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 17 },
  { id: 30136, word: "fire", meaning: "火、火事", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30137, word: "firework", meaning: "花火", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30138, word: "tent", meaning: "テント", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30139, word: "way", meaning: "①道 ②方法、やり方 ③点〔観点〕", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 189 },
  { id: 30140, word: "trip", meaning: "旅行", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30141, word: "field trip", meaning: "遠足、校外学習", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30142, word: "school trip", meaning: "修学旅行", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30143, word: "tour", meaning: "旅行、見学、ツアー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 21 },
  { id: 30144, word: "passport", meaning: "パスポート", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30145, word: "hotel", meaning: "ホテル", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30146, word: "bedroom", meaning: "寝室", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30147, word: "bath", meaning: "入浴、浴室、風呂場", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30148, word: "bathroom", meaning: "浴室、トイレ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30149, word: "shower", meaning: "シャワー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30150, word: "toilet", meaning: "トイレ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30151, word: "mirror", meaning: "鏡", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30152, word: "name", meaning: "名前", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 21 },
  { id: 30153, word: "age", meaning: "①年齢 ②時代", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 14 },
  { id: 30154, word: "clothes", meaning: "衣服、服", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 11 },
  { id: 30155, word: "gym", meaning: "体育館、ジム", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30156, word: "pool", meaning: "プール", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30157, word: "last", meaning: "結末、終わり、最後", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 60 },
  { id: 30158, word: "project", meaning: "計画、企画、事業、プロジェクト", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 27 },
  { id: 30159, word: "tool", meaning: "道具、工具、手段", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 21 },
  { id: 30160, word: "plant", meaning: "植物、草花", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 19 },
  { id: 30161, word: "person", meaning: "人、個人", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 26 },
  { id: 30162, word: "program", meaning: "計画、(テレビやラジオの)番組(表)", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30163, word: "power", meaning: "①力、エネルギー、動力、電力 ②能力、才能", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 7 },
  { id: 30164, word: "card", meaning: "①グリーティングカード、挨拶状 ②(トランプの)カード", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30165, word: "bottle", meaning: "びん、ボトル", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30166, word: "ground", meaning: "地面、土地", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30167, word: "corner", meaning: "角、コーナー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30168, word: "ink", meaning: "インク", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 6 },
  { id: 30169, word: "player", meaning: "①選手、競技者 ②演奏者", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 17 },
  { id: 30170, word: "volunteer", meaning: "ボランティア", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 10 },
  { id: 30171, word: "driver", meaning: "運転手、ドライバー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30172, word: "speaker", meaning: "演説者、話者、話す人", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30173, word: "speech", meaning: "演説、講演、スピーチ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 17 },
  { id: 30174, word: "runner", meaning: "走者、ランナー、走る人", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30175, word: "athlete", meaning: "運動選手、アスリート", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30176, word: "goal", meaning: "目標、ゴール", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30177, word: "race", meaning: "競争、レース", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30178, word: "worker", meaning: "労働者、作業員、仕事〔勉強〕をする人", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30179, word: "office", meaning: "会社、事務所、役所、オフィス", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30180, word: "partner", meaning: "パートナー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30181, word: "police", meaning: "警察", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30182, word: "street", meaning: "通り、道、街路", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 4 },
  { id: 30183, word: "road", meaning: "道路、道", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 18 },
  { id: 30184, word: "bridge", meaning: "橋", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30185, word: "hall", meaning: "ホール、玄関、集会所、大広間", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 5 },
  { id: 30186, word: "opening", meaning: "始まり、開くこと", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 8 },
  { id: 30187, word: "ice", meaning: "氷", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30188, word: "floor", meaning: "ゆか、階", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 18 },
  { id: 30189, word: "top", meaning: "一番上の部分、頂上、てっぺん", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30190, word: "center", meaning: "中心、真ん中、センター", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30191, word: "bell", meaning: "ベルや鈴(の音)", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30192, word: "quiz", meaning: "クイズ、小テスト", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30193, word: "fan", meaning: "①扇風機、扇、うちわ ②ファン、熱心な愛好者", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30194, word: "poster", meaning: "ポスター", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30195, word: "king", meaning: "王", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30196, word: "queen", meaning: "女王、王妃", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30197, word: "castle", meaning: "城", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30198, word: "tower", meaning: "塔、タワー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30199, word: "case", meaning: "①箱、容器、～入れ ②場合、状況", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 5 },
  { id: 30200, word: "belt", meaning: "ベルト、帯", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30201, word: "magic", meaning: "魔法、奇術", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30202, word: "calendar", meaning: "カレンダー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30203, word: "square", meaning: "正方形", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30204, word: "level", meaning: "①水準、段階 ②水平面の高さ、水平、水位", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30205, word: "hair", meaning: "毛、髪の毛", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30206, word: "cleaner", meaning: "掃除機、クリーナー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30207, word: "seat", meaning: "座席、座るところ、シート", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30208, word: "blog", meaning: "ブログ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30209, word: "laundry", meaning: "洗濯、洗濯物", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30210, word: "bench", meaning: "ベンチ、長いす", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30211, word: "peace", meaning: "平和", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30212, word: "wood", meaning: "①木、林 ②木材", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30213, word: "can", meaning: "缶、容器", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30214, word: "lot", meaning: "①たくさん、たくさんのこと ②(一区画の)土地、敷地", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 71 },
  { id: 30215, word: "chorus", meaning: "合唱、合唱部", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30216, word: "brass band", meaning: "吹奏楽部、ブラスバンド", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 3 },
  { id: 30217, word: "example", meaning: "例、実例", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 79 },
  { id: 30218, word: "country", meaning: "郊外、国、いなか", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 79 },
  { id: 30219, word: "idea", meaning: "考え、アイディア", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 62 },
  { id: 30220, word: "culture", meaning: "文化", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 37 },
  { id: 30221, word: "area", meaning: "地域、区域、面積", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 78 },
  { id: 30222, word: "cloth", meaning: "布、布地、布切れ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 37 },
  { id: 30223, word: "stick", meaning: "杖、棒、棒上のもの", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 9 },
  { id: 30224, word: "line", meaning: "①線、路線 ②列、行列、並び ③せりふ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 12 },
  { id: 30225, word: "topic", meaning: "話題、トピック、テーマ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 12 },
  { id: 30226, word: "step", meaning: "①歩み、足元 ②ステップ、段 ③階段", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30227, word: "speed", meaning: "スピード、速度", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30228, word: "doll", meaning: "人形", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30229, word: "pair", meaning: "(二つ１組になっているもの)の１対、１組", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30230, word: "activity", meaning: "活動", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 59 },
  { id: 30231, word: "set", meaning: "セット、組、そろい", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30232, word: "surprise", meaning: "驚き、びっくりさせること〔もの〕", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 1 },
  { id: 30233, word: "technology", meaning: "科学技術、テクノロジー", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 30 },
  { id: 30234, word: "rope", meaning: "ロープ、縄、綱", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0 },
  { id: 30235, word: "block", meaning: "区画、ブロック", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 2 },
  { id: 30236, word: "type", meaning: "型、種類、タイプ", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 30 },
  { id: 30237, word: "information", meaning: "情報", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 86 },
  { id: 30238, word: "design", meaning: "デザイン、図案、設計、設計図", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 26 },
];

// レベル1 形容詞
const level1AdjectiveWords = [
  { id: 30501, word: "good", meaning: "良い、すぐれた、おいしい、上手な 《活用》better-best", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 181 },
  { id: 30502, word: "nice", meaning: "すてきな、すばらしい、よい、親切な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 43 },
  { id: 30503, word: "bad", meaning: "悪い 《活用》worse-worst", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 9 },
  { id: 30504, word: "big", meaning: "大きい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 31 },
  { id: 30505, word: "large", meaning: "大きい、広い、多い、多数の、大規模な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 13 },
  { id: 30506, word: "small", meaning: "小さい、狭い、わずかな、ささいな", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 24 },
  { id: 30507, word: "new", meaning: "新しい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 111 },
  { id: 30508, word: "old", meaning: "①古い、昔からの ②年をとった ③～歳の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 68 },
  { id: 30509, word: "young", meaning: "若い、幼い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 4 },
  { id: 30510, word: "long", meaning: "①長い ②長さが～で", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 53 },
  { id: 30511, word: "short", meaning: "①短い ②背の低い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 4 },
  { id: 30512, word: "tall", meaning: "①高い ②身長〔高さ〕が～で", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 4 },
  { id: 30513, word: "heavy", meaning: "①重い ②ひどい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 14 },
  { id: 30514, word: "hot", meaning: "①暑い、熱い ②辛い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 12 },
  { id: 30515, word: "cold", meaning: "寒い、冷たい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 20 },
  { id: 30516, word: "warm", meaning: "あたたかい、温暖な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 10 },
  { id: 30517, word: "cool", meaning: "①涼しい、冷えた ②かっこいい、すばらしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 4 },
  { id: 30518, word: "easy", meaning: "簡単な、やさしい、くつろいだ", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 17 },
  { id: 30519, word: "kind", meaning: "親切な、やさしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 94 },
  { id: 30520, word: "friendly", meaning: "友好的な、人なつこい、優しい、親切な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 3 },
  { id: 30521, word: "difficult", meaning: "難しい、困難な、苦しい、厳しい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 55 },
  { id: 30522, word: "popular", meaning: "①人気のある、流行の ②大衆的な、一般的な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 35 },
  { id: 30523, word: "famous", meaning: "有名な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 17 },
  { id: 30524, word: "high", meaning: "①高い、高等の ②高さが～の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 41 },
  { id: 30525, word: "low", meaning: "低い、少ない", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 4 },
  { id: 30526, word: "strong", meaning: "①強い、じょうぶな ②濃い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 15 },
  { id: 30527, word: "weak", meaning: "弱い、薄い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 1 },
  { id: 30528, word: "exciting", meaning: "興奮させる、わくわくさせる、刺激的な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 26 },
  { id: 30529, word: "important", meaning: "大切な、重要な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 67 },
  { id: 30530, word: "useful", meaning: "便利な、役に立つ", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 22 },
  { id: 30531, word: "funny", meaning: "おかしな、おもしろい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 1 },
  { id: 30532, word: "interesting", meaning: "おもしろい、興味深い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 135 },
  { id: 30533, word: "interested", meaning: "興味がある、興味をもっている、関心がある", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 135 },
  { id: 30534, word: "happy", meaning: "幸せな、楽しい、(～して)うれしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 20 },
  { id: 30535, word: "glad", meaning: "(～して)うれしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 22 },
  { id: 30536, word: "sad", meaning: "悲しい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 4 },
  { id: 30537, word: "angry", meaning: "怒った、腹を立てた", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 1 },
  { id: 30538, word: "surprised", meaning: "驚いた、びっくりした、(～して)驚く", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 24 },
  { id: 30539, word: "surprising", meaning: "驚かせるような、驚くべき、意外な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 24 },
  { id: 30540, word: "sorry", meaning: "①残念で ②すまなく思って ③気の毒で", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 12 },
  { id: 30541, word: "free", meaning: "ただの、自由な、ひまな、無料の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 7 },
  { id: 30542, word: "busy", meaning: "忙しい、にぎやかな", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 5 },
  { id: 30543, word: "tired", meaning: "疲れた、くたびれた", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 22 },
  { id: 30544, word: "beautiful", meaning: "美しい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 40 },
  { id: 30545, word: "cute", meaning: "かわいい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 9 },
  { id: 30546, word: "pretty", meaning: "かわいい、きれいな", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 3 },
  { id: 30547, word: "hungry", meaning: "お腹の空いた、空腹の、飢えた", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 2 },
  { id: 30548, word: "thirsty", meaning: "のどが渇いた", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 0 },
  { id: 30549, word: "sleepy", meaning: "眠い、眠そうな", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 1 },
  { id: 30550, word: "fine", meaning: "①すばらしい、元気な、健康な、満足できる ②晴れた", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 3 },
  { id: 30551, word: "wrong", meaning: "①間違った、誤った ②具合の悪い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 6 },
  { id: 30552, word: "true", meaning: "本当の、真実の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 23 },
  { id: 30553, word: "special", meaning: "特別の、特殊な、大事な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 61 },
  { id: 30554, word: "great", meaning: "偉大な、すぐれた、大きな、すばらしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 38 },
  { id: 30555, word: "wonderful", meaning: "すばらしい、すてきな、見事な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 15 },
  { id: 30556, word: "fantastic", meaning: "すばらしい、すてきな", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 1 },
  { id: 30557, word: "perfect", meaning: "完全な、完璧な、申し分ない", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 1 },
  { id: 30558, word: "different", meaning: "違った、異なる、いろいろな、様々な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 69 },
  { id: 30559, word: "same", meaning: "同じ、同一の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 46 },
  { id: 30560, word: "favorite", meaning: "お気に入りの、大好きな、いちばん好きな", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 19 },
  { id: 30561, word: "all", meaning: "すべての", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 40 },
  { id: 30562, word: "quiet", meaning: "静かな、無口な、おとなしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 0 },
  { id: 30563, word: "sure", meaning: "(～を)確信して", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 24 },
  { id: 30564, word: "careful", meaning: "注意深い、用心深い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 2 },
  { id: 30565, word: "smart", meaning: "かしこい、頭のよい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 9 },
  { id: 30566, word: "delicious", meaning: "おいしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 14 },
  { id: 30567, word: "sweet", meaning: "①甘い ②心地よい、やさしい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 4 },
  { id: 30568, word: "bitter", meaning: "苦い、つらい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 1 },
  { id: 30569, word: "real", meaning: "本当の、本物の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 9 },
  { id: 30570, word: "full", meaning: "いっぱいの、満ちた、満腹の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 6 },
  { id: 30571, word: "main", meaning: "主な、主要な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 5 },
  { id: 30572, word: "slow", meaning: "ゆっくりな、遅い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 3 },
  { id: 30573, word: "soft", meaning: "やわらかい", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 0 },
  { id: 30574, word: "next", meaning: "①次の、来～、今度の ②隣の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 52 },
  { id: 30575, word: "final", meaning: "最後の、最終の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 0 },
  { id: 30576, word: "traditional", meaning: "伝統的な", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 34 },
  { id: 30577, word: "every", meaning: "①すべての、あらゆる ②毎～、～ごとに", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 34 },
  { id: 30578, word: "each", meaning: "それぞれの、各自の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 101 },
  { id: 30579, word: "many", meaning: "(数えられる名詞の前で)たくさんの、多くの 《活用》more-most", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 258 },
  { id: 30580, word: "much", meaning: "(数えられない名詞の前で)たくさんの、多量の 《活用》more-most", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 46 },
  { id: 30581, word: "some", meaning: "①いくつかの、いくらかの ②～もある", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 287 },
  { id: 30582, word: "any", meaning: "(疑問文などで)いくらかの、何らかの", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 30 },
  { id: 30583, word: "no", meaning: "無の、少しの〔一つの・一人の〕…も～ない", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 73 },
  { id: 30584, word: "only", meaning: "唯一の、ただ一つ〔一人〕の、ただ～だけ", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 51 },
  { id: 30585, word: "own", meaning: "①自身の、独自の ②(代名詞的に)自分自身のもの", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 9 },
  { id: 30586, word: "such", meaning: "そのような、そんな、あんな", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 57 },
  { id: 30587, word: "other", meaning: "①ほかの、別の ②もう一方の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 148 },
  { id: 30588, word: "another", meaning: "もう一つの、別の", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 40 },
];

// レベル1 副詞
const level1AdverbWords = [
  { id: 30601, word: "fast", meaning: "速く", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 7 },
  { id: 30602, word: "slowly", meaning: "ゆっくりと、遅く", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 3 },
  { id: 30603, word: "quickly", meaning: "速く、急いで、すばやく、すぐに", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 20 },
  { id: 30604, word: "early", meaning: "(時間的・時期的に)早く、早めに", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 9 },
  { id: 30605, word: "late", meaning: "遅く", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 12 },
  { id: 30606, word: "well", meaning: "①上手に、うまく ②よく、十分に 《活用》better-best", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 151 },
  { id: 30607, word: "hard", meaning: "いっしょうけんめいに、熱心に", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 12 },
  { id: 30608, word: "carefully", meaning: "注意深く、用心深く", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 6 },
  { id: 30609, word: "easily", meaning: "簡単に、容易に", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 34 },
  { id: 30610, word: "always", meaning: "いつも、常に", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 20 },
  { id: 30611, word: "usually", meaning: "ふつう、たいてい、いつもは", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 29 },
  { id: 30612, word: "often", meaning: "しばしば、よく、たびたび", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 37 },
  { id: 30613, word: "sometimes", meaning: "ときどき、ときには", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 35 },
  { id: 30614, word: "never", meaning: "①これまで一度も～ない ②決して～ない", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 18 },
  { id: 30615, word: "there", meaning: "そこに〔へ・で〕", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 261 },
  { id: 30616, word: "here", meaning: "ここに〔へ・で〕", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 37 },
  { id: 30617, word: "abroad", meaning: "外国に〔へ・で〕、海外に〔へ・で〕", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 17 },
  { id: 30618, word: "very", meaning: "①とても、非常に ②(否定文で)あまり", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 180 },
  { id: 30619, word: "so", meaning: "そんなに、とても、非常に、そのように", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 30 },
  { id: 30620, word: "now", meaning: "①今、現在は、今では、今すぐ ②さて、ところで、さあ", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 161 },
  { id: 30621, word: "then", meaning: "①そのとき、その〔あの〕ころ、当時 ②それから、そうすると", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 66 },
  { id: 30622, word: "ago", meaning: "(今から)～前に", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 45 },
  { id: 30623, word: "also", meaning: "～もまた、そのうえ", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 131 },
  { id: 30624, word: "too", meaning: "①～もまた ②あまりにも～すぎる", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 60 },
  { id: 30625, word: "really", meaning: "①とても ②本当に、実際に", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 64 },
  { id: 30626, word: "soon", meaning: "まもなく、すぐに、早く", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 18 },
  { id: 30627, word: "again", meaning: "もう一度", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 31 },
  { id: 30628, word: "together", meaning: "いっしょに、共に", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 22 },
  { id: 30629, word: "maybe", meaning: "もしかすると、たぶん", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 21 },
  { id: 30630, word: "already", meaning: "すでに、もう", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 15 },
  { id: 30631, word: "just", meaning: "①ちょうど、まさに ②ただ～だけ、ちょっと", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 21 },
  { id: 30632, word: "still", meaning: "①まだ、今でも ②それでも(なお)", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 20 },
  { id: 30633, word: "later", meaning: "あとで、のちに、もっと遅く、～後", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 18 },
  { id: 30634, word: "back", meaning: "戻って、帰って", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 28 },
  { id: 30635, word: "almost", meaning: "ほとんど、ほぼ、もう少しで", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 11 },
  { id: 30636, word: "please", meaning: "どうぞ、どうか、お願いします", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 84 },
  { id: 30637, word: "not", meaning: "～でない", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 124 },
  { id: 30638, word: "out", meaning: "①外へ〔に〕 ②なくなって、消えて、離れて", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 21 },
  { id: 30639, word: "off", meaning: "①～から離れて、離されて、降りて ②止めて、消して ③脱いで、はずして", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 5 },
  { id: 30640, word: "even", meaning: "①～でさえ ②さらにいっそう", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 27 },
];

// レベル1 前置詞
const level1PrepositionWords = [
  { id: 30701, word: "in", meaning: "①(場所・位置)～(の中)に〔で・の〕 ②(範囲)～において ③(時間)～に、～の間に、～後に ④(方法・道具・材料)～で", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 1337 },
  { id: 30702, word: "to", meaning: "①～へ、～まで ②～に ③...まで～分前 ④～に合って", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 1449 },
  { id: 30703, word: "of", meaning: "①(所有・所属・範囲)～の ②(同格)～という ③(内容)～のことを ④(原材料・構成要素)～で ⑤(起源・原因)～から(出た)", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 989 },
  { id: 30704, word: "about", meaning: "～について(の)、～に関して", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 575 },
  { id: 30705, word: "for", meaning: "①～のために〔の〕 ②～に向けて ③～にとって ④～の間 ⑤～を求めて", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 507 },
  { id: 30706, word: "with", meaning: "①～と一緒に ②～で、～を使って ③～のある、～の付いた、～を所持して ④～があれば", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 322 },
  { id: 30707, word: "on", meaning: "①(時・日)～に ②(場所)～の上に、～に(接触) ③(状態)～中で、身に着けて ④～について ⑤(対象)～に ⑥(方法)～で", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 278 },
  { id: 30708, word: "from", meaning: "～から(の)、～で", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 271 },
  { id: 30709, word: "at", meaning: "①(場所・位置)～に〔で〕、～のところに ②(時刻)～に", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 264 },
  { id: 30710, word: "by", meaning: "①～のそばに ②～を使って ③～によって ④～までに", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 214 },
  { id: 30711, word: "under", meaning: "①～の下に、～のもとに ②～未満で", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 20 },
  { id: 30712, word: "near", meaning: "～の近くに〔で・の〕", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 38 },
  { id: 30713, word: "after", meaning: "①～のあとに〔で〕 ②～にならって、ちなんで", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 104 },
  { id: 30714, word: "before", meaning: "～よりも前に〔先に・早く〕", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 59 },
  { id: 30715, word: "as", meaning: "～として、～の時に、～のような", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 95 },
  { id: 30716, word: "around", meaning: "～のあちこちに〔で・を〕、～のまわりに、～の周囲に、～の近くに", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 41 },
  { id: 30717, word: "into", meaning: "①～の中へ、中に向かって ②～(の状態)に(なって)", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 22 },
  { id: 30718, word: "through", meaning: "①～を通って、～をつらぬいて ②～を通じて、～によって ③～の間中", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 33 },
];

// レベル1 疑問詞
const level1QuestionWords = [
  { id: 20401, word: "what", meaning: "何、何の、どんな", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 211, example: { english: "<strong>What</strong> animal is that?", japanese: "あれは(<strong>何の</strong>)動物ですか。" } },
  { id: 20402, word: "who", meaning: "だれ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 126, example: { english: "<strong>Who</strong> is that man?", japanese: "あの男性は(<strong>だれ</strong>)ですか。" } },
  { id: 20403, word: "which", meaning: "どちら、どれ、どの", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 186, example: { english: "<strong>Which</strong> season do you like?", japanese: "あなたは(<strong>どの</strong>)季節が好きですか。" } },
  { id: 20404, word: "when", meaning: "いつ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 186, example: { english: "<strong>When</strong> did you arrive here?", japanese: "あなたは(<strong>いつ</strong>)ここに到着しましたか。" } },
  { id: 20405, word: "where", meaning: "どこに（で）、どこへ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 126, example: { english: "<strong>Where</strong> is the station?", japanese: "駅は(<strong>どこに</strong>)ありますか。" } },
  { id: 20406, word: "why", meaning: "なぜ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 47, example: { english: "<strong>Why</strong> do you like music?", japanese: "あなたは(<strong>なぜ</strong>)音楽が好きなのですか。" } },
  { id: 20407, word: "how", meaning: "どのように（どうやって）、どれくらい", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 171, example: { english: "<strong>How</strong> does he go to school every day?", japanese: "彼は毎日(<strong>どうやって</strong>)学校に行きますか。" } },
  { id: 20408, word: "whose", meaning: "だれの、だれのもの", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 5, example: { english: "<strong>Whose</strong> book is this?", japanese: "この本は(<strong>だれの</strong>)本ですか。" } },
  { id: 20409, word: "how much", meaning: "いくら（値段・料金をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 6, example: { english: "<strong>How much</strong> is this notebook?", japanese: "このノートは(<strong>いくら</strong>)ですか。" } },
  { id: 20410, word: "how many", meaning: "いくつ（数をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 6, example: { english: "<strong>How many</strong> books are there in the library?", japanese: "その図書館には本が(<strong>何冊</strong>)ありますか。" } },
  { id: 20411, word: "how long", meaning: "どれくらいの間（期間をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 3, example: { english: "<strong>How long</strong> will you stay at the hotel?", japanese: "あなたはホテルに(<strong>どのくらい</strong>)滞在するつもりですか。" } },
  { id: 20412, word: "how old", meaning: "何歳（年齢をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 3, example: { english: "<strong>How old</strong> is your father?", japanese: "あなたの父親は(<strong>何歳</strong>)ですか。" } },
  { id: 20413, word: "how far", meaning: "どのくらいの距離（距離をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 1, example: { english: "<strong>How far</strong> is it from here to the station?", japanese: "ここから駅まで(<strong>どのくらいの距離</strong>)がありますか。" } },
];

// レベル1 間投詞
const level1InterjectionWords = [
  { id: 21001, word: "hi", meaning: "やあ、こんにちは", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 176, example: { english: "<strong>Hi</strong>! How are you?", japanese: "(<strong>やあ</strong>)! お元気ですか。" } },
  { id: 21002, word: "hello", meaning: "やあ、こんにちは", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 50, example: { english: "<strong>Hello</strong>, nice to meet you.", japanese: "(<strong>こんにちは</strong>)、はじめまして。" } },
  { id: 21003, word: "hey", meaning: "やあ、おい、ちょっと", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 0, example: { english: "<strong>Hey</strong>, wait for me!", japanese: "(<strong>おい</strong>)、待って！" } },
  { id: 21004, word: "bye", meaning: "さようなら", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 70, example: { english: "<strong>Bye</strong>, see you later.", japanese: "(<strong>さようなら</strong>)、またお会いしましょう。" } },
  { id: 21005, word: "goodbye", meaning: "さようなら", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 2, example: { english: "<strong>Goodbye</strong>, see you later.", japanese: "(<strong>さようなら</strong>)、またお会いしましょう。" } },
  { id: 21006, word: "oh", meaning: "ああ！、おお！", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 161, example: { english: "<strong>Oh</strong>, I see!", japanese: "(<strong>ああ</strong>)、わかりました！" } },
  { id: 21007, word: "wow", meaning: "わあ、おお（驚きや喜び）", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 15, example: { english: "<strong>Wow</strong>, that's nice!", japanese: "(<strong>わあ</strong>)、それはいいですね！" } },
  { id: 21008, word: "yes", meaning: "はい", partOfSpeech: "間投詞・副詞", category: "LEVEL1 間投詞", appearanceCount: 191, example: { english: "<strong>Yes</strong>, I am.", japanese: "(<strong>はい</strong>)、そうです。" } },
  { id: 21009, word: "no", meaning: "いいえ、いや、だめだ", partOfSpeech: "間投詞・副詞", category: "LEVEL1 間投詞", appearanceCount: 73, example: { english: "<strong>No</strong>, I don't.", japanese: "(<strong>いいえ</strong>)、違います。" } },
  { id: 21010, word: "OK", meaning: "わかりました、それでは、大丈夫な", partOfSpeech: "間投詞・形容詞", category: "LEVEL1 間投詞", appearanceCount: 70, example: { english: "<strong>OK</strong>, let's go.", japanese: "(<strong>わかりました</strong>)、行きましょう。" } },
  { id: 21011, word: "well", meaning: "ええっと…（考え中）", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 151, example: { english: "<strong>Well</strong>, I'm not sure.", japanese: "(<strong>ええっと…</strong>)、わかりません。" } },
  { id: 21014, word: "yeah", meaning: "うん、ああ（yesのくだけた表現）", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 5, example: { english: "<strong>Yeah</strong>, I think so.", japanese: "(<strong>うん</strong>)、そう思う。" } },
];

// ============================================
// レベル2の品詞別単語
// ============================================
// レベル2: 動詞、名詞、形容詞、副詞、前置詞、助動詞、接続詞、不定代名詞

// レベル2 動詞（手入力でデータを追加してください）
const level2VerbWords = [
  // 例: { id: 21301, word: "have", meaning: "持っている、〜がある", partOfSpeech: "動詞", category: "LEVEL2 動詞", appearanceCount: 0, example: { english: "I <strong>have</strong> a book.", japanese: "私は本を(<strong>持っています</strong>)。" } },
];

// レベル2 名詞（手入力でデータを追加してください）
const level2NounWords = [
  // 例: { id: 21351, word: "school", meaning: "学校", partOfSpeech: "名詞", category: "LEVEL2 名詞", appearanceCount: 0, example: { english: "I go to <strong>school</strong>.", japanese: "私は(<strong>学校</strong>)に行きます。" } },
];

// レベル2 形容詞（手入力でデータを追加してください）
const level2AdjectiveWords = [
  // 例: { id: 21451, word: "big", meaning: "大きい", partOfSpeech: "形容詞", category: "LEVEL2 形容詞", appearanceCount: 0, example: { english: "This is a <strong>big</strong> house.", japanese: "これは(<strong>大きい</strong>)家です。" } },
];

// レベル2 副詞（手入力でデータを追加してください）
const level2AdverbWords = [
  // 例: { id: 21551, word: "often", meaning: "しばしば", partOfSpeech: "副詞", category: "LEVEL2 副詞", appearanceCount: 0, example: { english: "I <strong>often</strong> go to the library.", japanese: "私は(<strong>しばしば</strong>)図書館に行きます。" } },
];

// レベル2 前置詞（手入力でデータを追加してください）
const level2PrepositionWords = [
  // 例: { id: 21651, word: "on", meaning: "〜の上に", partOfSpeech: "前置詞", category: "LEVEL2 前置詞", appearanceCount: 0, example: { english: "The book is <strong>on</strong> the table.", japanese: "本は机(<strong>の上に</strong>)あります。" } },
];

// レベル2 助動詞
const level2AuxiliaryWords = [
  { id: 20701, word: "can", meaning: "〜できる、〜してもよい", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 374, example: { english: "I <strong>can</strong> play the piano.", japanese: "私はピアノを(<strong>弾けます</strong>)。" } },
  { id: 20702, word: "could", meaning: "（canの過去形）〜できた", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 100, example: { english: "My father <strong>could</strong> speak English well.", japanese: "父は英語を上手に話すことが(<strong>できました</strong>)。" } },
  { id: 20703, word: "may", meaning: "〜かもしれない、〜してもよい", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 71, example: { english: "I <strong>may</strong> be late for the party.", japanese: "私はパーティーに遅れる(<strong>かもしれません</strong>)。" } },
  { id: 20717, word: "might", meaning: "（mayの過去形）（ひょっとして）〜かもしれない", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 0, example: { english: "I <strong>might</strong> go to the party.", japanese: "ひょっとしてパーティーに行く(<strong>かもしれません</strong>)。" } },
  { id: 20704, word: "must", meaning: "〜しなければならない", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 22, example: { english: "You <strong>must</strong> do your homework.", japanese: "あなたは宿題を(<strong>しなければなりません</strong>)。" } },
  { id: 20705, word: "should", meaning: "〜すべきである", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 63, example: { english: "We <strong>should</strong> take a break.", japanese: "私たちは休憩を(<strong>取るべきです</strong>)。" } },
  { id: 20706, word: "will", meaning: "～でしょう；～するつもりである　＊Will you ～?　＊～してくれませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 323, example: { english: "I <strong>will</strong> go to the park next week.", japanese: "私は来週公園に(<strong>行くつもりです</strong>)。" } },
  { id: 20707, word: "would", meaning: "（willの過去形）〜だろう、〜するつもりだ、(would like toで)〜したい", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 100, example: { english: "I <strong>would</strong> like to go abroad.", japanese: "私は海外に(<strong>行きたいです</strong>)。" } },
  { id: 20708, word: "be able to", meaning: "〜することができる", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 8, example: { english: "I <strong>am able to</strong> play the piano.", japanese: "私はピアノを(<strong>弾けます</strong>)。" } },
  { id: 20709, word: "be going to", meaning: "〜するつもり", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 14, example: { english: "I <strong>am going to</strong> go to the park next week.", japanese: "私は来週公園に(<strong>行くつもりです</strong>)。" } },
  { id: 20710, word: "have to", meaning: "〜しなければならない、（don't have to～：～する必要はない）", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 22, example: { english: "I <strong>have to</strong> do my homework.", japanese: "私は宿題を(<strong>しなければなりません</strong>)。" } },
  { id: 20711, word: "used to", meaning: "以前は～だった", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 2, example: { english: "This house <strong>used to</strong> be a shop.", japanese: "この家は以前は店(<strong>でした</strong>)。" } },
  { id: 20711, word: "Will you～?", meaning: "〜してくれませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 15, example: { english: "<strong>Can you</strong> open the door?", japanese: "ドアを(<strong>開けてくれませんか</strong>)。" } },
  { id: 20711, word: "Can you～?", meaning: "〜してくれませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 16, example: { english: "<strong>Can you</strong> open the door?", japanese: "ドアを(<strong>開けてくれませんか</strong>)。" } },
  { id: 20712, word: "Would you～?", meaning: "〜していただけませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 2, example: { english: "<strong>Would you</strong> close the window?", japanese: "窓を(<strong>閉めていただけませんか</strong>)。" } },
  { id: 20712, word: "Could you～?", meaning: "〜していただけませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 1, example: { english: "<strong>Would you</strong> close the window?", japanese: "窓を(<strong>閉めていただけませんか</strong>)。" } },
  { id: 20713, word: "Would you like 〜 ?", meaning: "〜はいかがですか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 1, example: { english: "<strong>Would you like</strong> some cake?", japanese: "ケーキは(<strong>いかがですか</strong>)。" } },
  { id: 20714, word: "Can I～?", meaning: "〜してもいいですか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 10, example: { english: "<strong>May I</strong> use the phone?", japanese: "電話を(<strong>使ってもいいですか</strong>)。" } },
  { id: 20714, word: "May I～?", meaning: "〜してもいいですか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 0, example: { english: "<strong>May I</strong> use the phone?", japanese: "電話を(<strong>使ってもいいですか</strong>)。" } },
  { id: 20715, word: "Shall I 〜 ?", meaning: "（私が）〜しましょうか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 2, example: { english: "<strong>Shall I</strong> open the window?", japanese: "窓を(<strong>開けましょうか</strong>)。" } },
  { id: 20716, word: "Shall we 〜 ?", meaning: "（いっしょに）〜しませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 10, example: { english: "<strong>Shall we</strong> play tennis?", japanese: "（いっしょに）テニスを(<strong>しませんか</strong>)。" } },
];

// レベル2 接続詞
const level2ConjunctionWords = [
  { id: 20801, word: "and", meaning: "〜と…、そして", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 823, example: { english: "apples <strong>and</strong> oranges", japanese: "りんご(<strong>と</strong>)オレンジ" } },
  { id: 20802, word: "but", meaning: "しかし、だが", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 171, example: { english: "I was sick yesterday, <strong>but</strong> I went to school today.", japanese: "昨日病気だった(<strong>が</strong>)、今日は学校に行った。" } },
  { id: 20803, word: "or", meaning: "〜かもしくは…", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 99, example: { english: "English <strong>or</strong> Japanese", japanese: "英語(<strong>か</strong>)日本語" } },
  { id: 20804, word: "so", meaning: "だから", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 213, example: { english: "I'm tired, <strong>so</strong> I'm going to bed.", japanese: "疲れている(<strong>から</strong>)、寝る" } },
  { id: 20818, word: "however", meaning: "しかし、けれども", partOfSpeech: "接続詞・副詞", category: "LEVEL2 接続詞", appearanceCount: 49, example: { english: "I wanted to go. <strong>however</strong>, I was too busy.", japanese: "行きたかったが、(<strong>しかし</strong>)忙しすぎた。" } },
  { id: 20805, word: "because", meaning: "（理由や原因を説明して）〜なので、〜だから", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 95, example: { english: "I like summer <strong>because</strong> I can go to the beach.", japanese: "私は海に行ける(<strong>から</strong>)、夏が好きです." } },
  { id: 20806, word: "if", meaning: "もし〜なら", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 113, example: { english: "<strong>If</strong> it is sunny tomorrow, we will play tennis.", japanese: "(<strong>もし</strong>)明日晴れた(<strong>ら</strong>)テニスをするつもりです。" } },
  { id: 20807, word: "when", meaning: "〜のとき", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 250, example: { english: "Tom was watching TV <strong>when</strong> his mother came home.", japanese: "母が帰ってきた(<strong>とき</strong>)、トムはテレビを見ていました。" } },
  { id: 20808, word: "while", meaning: "〜している間に、（after a while：しばらくの間）", partOfSpeech: "接続詞・名詞", category: "LEVEL2 接続詞", appearanceCount: 8, example: { english: "<strong>While</strong> I was eating breakfast, I was reading a newspaper.", japanese: "朝食を(<strong>食べている間に</strong>)、新聞を読んでいました。" } },
  { id: 20809, word: "though", meaning: "〜けれども", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 27, example: { english: "I studied hard <strong>though</strong> I was tired.", japanese: "疲れていた(<strong>けれども</strong>)、私は勉強を頑張りました。" } },
  { id: 20810, word: "although", meaning: "〜けれども", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 27, example: { english: "I studied hard <strong>although</strong> I was tired.", japanese: "疲れていた(<strong>けれども</strong>)、私は勉強を頑張りました。" } },
  { id: 20811, word: "since", meaning: "〜から、～以来、〜なので", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 9, example: { english: "I have known him <strong>since</strong> I was a child.", japanese: "私は子供の頃(<strong>から</strong>)、彼を知っています。" } },
  { id: 20812, word: "until", meaning: "〜するまでずっと", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 12, example: { english: "I must wait here <strong>until</strong> he comes back.", japanese: "彼が帰ってくる(<strong>までずっと</strong>)、ここで待たなければなりません。" } },
  { id: 20813, word: "before", meaning: "〜の前に", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 59, example: { english: "I will go home <strong>before</strong> it is dark.", japanese: "暗くなる(<strong>前に</strong>)、家に帰るつもりです。" } },
  { id: 20814, word: "after", meaning: "〜の後に", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 104, example: { english: "We met at the station <strong>after</strong> the party.", japanese: "私たちはパーティー(<strong>のあと</strong>)、駅で会いました。" } },
  { id: 20815, word: "that", meaning: "（ひとまとまりの内容を表して）～ということ・もの", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 628, example: { english: "I know <strong>that</strong> he is a doctor.", japanese: "私は彼が医者である(<strong>ということ</strong>)を知っています。" } },
  { id: 20816, word: "as soon as", meaning: "〜するとすぐに", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 2, example: { english: "I will play games <strong>as soon as</strong> I finish my homework.", japanese: "宿題を終え(<strong>たらすぐに</strong>)、ゲームをするつもりです。" } },
  { id: 20817, word: "even if", meaning: "たとえ〜でも", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 6, example: { english: "I will go there <strong>even if</strong> it is raining.", japanese: "(<strong>たとえ</strong>)雨が降って(<strong>いても</strong>)、そこに行くつもりです。" } },
];

// レベル2 不定代名詞
const level2IndefinitePronounWords = [
  { id: 20201, word: "something", meaning: "何か（もの・こと）", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 36, example: { english: "I want <strong>something</strong> to drink.", japanese: "私は(<strong>何か</strong>)飲みものがほしいです。" } },
  { id: 20202, word: "anything", meaning: "（否定文で）何も～ない、（疑問文で）何か", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 21, example: { english: "Do you have <strong>anything</strong> to eat?", japanese: "(<strong>何か</strong>)食べ物はありますか。" } },
  { id: 20203, word: "nothing", meaning: "何も〜ない", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 8, example: { english: "There is <strong>nothing</strong> in the box.", japanese: "箱の中には(<strong>何もありません</strong>)。" } },
  { id: 20204, word: "everything", meaning: "すべてのもの、すべてのこと", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 12, example: { english: "<strong>Everything</strong> is ready.", japanese: "(<strong>すべてのこと</strong>)が準備できています。" } },
  { id: 20205, word: "everyone", meaning: "みんな、すべての人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 23, example: { english: "<strong>Everyone</strong> has a book.", japanese: "(<strong>みんな</strong>)本を持っています。" } },
  { id: 20206, word: "someone", meaning: "だれか、ある人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 8, example: { english: "<strong>Someone</strong> is calling you.", japanese: "(<strong>だれか</strong>)があなたを呼んでいます。" } },
  { id: 20207, word: "anyone", meaning: "（肯定文で）誰でも、（否定文で）誰も、（疑問文で）誰か", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 1, example: { english: "Can <strong>anyone</strong> help me?", japanese: "(<strong>だれか</strong>)手伝ってくれますか。" } },
  { id: 20208, word: "everybody", meaning: "みんな、すべての人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 1, example: { english: "<strong>Everybody</strong> likes music.", japanese: "(<strong>みんな</strong>)音楽が好きです。" } },
  { id: 20209, word: "somebody", meaning: "だれか、ある人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 0, example: { english: "<strong>Somebody</strong> is at the door.", japanese: "(<strong>だれか</strong>)がドアにいます。" } },
  { id: 20210, word: "nobody", meaning: "だれも〜ない", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 0, example: { english: "<strong>Nobody</strong> knows the answer.", japanese: "(<strong>だれも</strong>)答えを知りません。" } },
];

// レベル2 数量を表す限定詞
const level2QuantifierWords = [
  { id: 20513, word: "several", meaning: "いくつかの、数個の", partOfSpeech: "限定詞・形容詞", category: "LEVEL2 限定詞（数量）", appearanceCount: 15, example: { english: "Ken bought <strong>several</strong> pens.", japanese: "ケンは(<strong>いくつかの</strong>)ペンを買いました。" } },
];

// ============================================
// レベル3の品詞別単語
// ============================================
// レベル3: 動詞、名詞、形容詞、副詞、前置詞、接続詞

// レベル3 動詞（手入力でデータを追加してください）
const level3VerbWords = [
  // 例: { id: 22301, word: "understand", meaning: "理解する", partOfSpeech: "動詞", category: "LEVEL3 動詞", appearanceCount: 0, example: { english: "I <strong>understand</strong> English.", japanese: "私は英語を(<strong>理解します</strong>)。" } },
];

// レベル3 名詞（手入力でデータを追加してください）
const level3NounWords = [
  // 例: { id: 22351, word: "knowledge", meaning: "知識", partOfSpeech: "名詞", category: "LEVEL3 名詞", appearanceCount: 0, example: { english: "I have <strong>knowledge</strong> of English.", japanese: "私は英語の(<strong>知識</strong>)を持っています。" } },
];

// レベル3 形容詞（手入力でデータを追加してください）
const level3AdjectiveWords = [
  // 例: { id: 22451, word: "important", meaning: "重要な", partOfSpeech: "形容詞", category: "LEVEL3 形容詞", appearanceCount: 0, example: { english: "This is <strong>important</strong>.", japanese: "これは(<strong>重要です</strong>)。" } },
];

// レベル3 副詞（手入力でデータを追加してください）
const level3AdverbWords = [
  // 例: { id: 22551, word: "carefully", meaning: "注意深く", partOfSpeech: "副詞", category: "LEVEL3 副詞", appearanceCount: 0, example: { english: "Please read <strong>carefully</strong>.", japanese: "(<strong>注意深く</strong>)読んでください。" } },
];

// レベル3 前置詞（手入力でデータを追加してください）
const level3PrepositionWords = [
  // 例: { id: 22651, word: "through", meaning: "〜を通って", partOfSpeech: "前置詞", category: "LEVEL3 前置詞", appearanceCount: 0, example: { english: "I walked <strong>through</strong> the park.", japanese: "私は公園を(<strong>通って</strong>)歩きました。" } },
];

// レベル3 接続詞（手入力でデータを追加してください）
const level3ConjunctionWords = [
  // 例: { id: 22751, word: "although", meaning: "〜けれども", partOfSpeech: "接続詞", category: "LEVEL3 接続詞", appearanceCount: 0, example: { english: "<strong>Although</strong> it was raining, I went out.", japanese: "雨が降っていた(<strong>けれども</strong>)、私は出かけました。" } },
];

//レベル3 再帰代名詞
const level3RecursivePronounWords = [
  { id: 20128, word: "myself", meaning: "私自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 1, example: { english: "I came here by<strong>myself</strong>.", japanese: "私は(<strong>ひとりで</strong>)ここに来ました。" } },
  { id: 20129, word: "yourself", meaning: "あなた自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "Please help <strong>yourself</strong>.", japanese: "（飲食物などを）どうぞ(<strong>ご自由にお取りください</strong>)。" } },
  { id: 20130, word: "himself", meaning: "彼自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 2, example: { english: "\"She is very beautiful.\"he said to<strong>himself</strong>.", japanese: "「彼女は美しい」と彼は（<strong>心の中で</strong>）思いました。" } },
  { id: 20131, word: "herself", meaning: "彼女自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "She made it <strong>herself</strong>.", japanese: "彼女はそれを(<strong>自分で</strong>)作りました。" } },
  { id: 20132, word: "itself", meaning: "それ自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "The door opened by <strong>itself</strong>.", japanese: "ドアが(<strong>ひとりでに</strong>)開きました。" } },
  { id: 20133, word: "ourselves", meaning: "私たち自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "We enjoyed <strong>ourselves</strong>.", japanese: "私たちは(<strong>楽しみました</strong>)。" } },
  { id: 20134, word: "themselves", meaning: "彼ら（彼女ら）自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "They did it <strong>themselves</strong>.", japanese: "彼らはそれを(<strong>自分たちで</strong>)やりました。" } },
];

//レベル3 関係代名詞
const level3RelativePronounWords = [
  { id: 20901, word: "who", meaning: "〈人〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 126, example: { english: "The boy <strong>who</strong> is singing is my brother.", japanese: "(<strong>歌っている</strong>)少年は私の弟です。" } },
  { id: 20902, word: "which", meaning: "〈物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 186, example: { english: "This is the book <strong>which</strong> I bought yesterday.", japanese: "これが私が昨日(<strong>買った</strong>)本です。" } },
  { id: 20903, word: "that", meaning: "〈人/物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 628, example: { english: "He is the teacher <strong>that</strong> I respect.", japanese: "彼は私が(<strong>尊敬している</strong>)先生です。" } },
  { id: 20904, word: "whose", meaning: "〈人/物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 0, example: { english: "Look at tha house <strong>whose</strong> roof is red.", japanese: "あの屋根が(<strong>赤い</strong>)家を見てください。"}},
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
    // 小学生で習った単語（指定順）
    ...familyWords,
    ...calendarWords,
    ...timeWords,
    ...numberWords,
    ...colorWords,
    ...bodyWords,
    ...stationeryWords,
    ...instrumentWords,
    ...foodDrinkWords,
    ...sportsWords,
    ...animalWords,
    ...subjectWords,
    ...schoolTypeWords,
    ...vehicleWords,
    ...townFacilityWords,
    ...occupationWords,
    ...countryWords,
    ...natureWords,
    ...weatherWords,
    ...directionWords,
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
    // レベル別単語（品詞別配列を使用）
    // レベル1
    ...level1ArticleWords,
    ...level1PronounWords,
    ...level1VerbWords,
    ...level1NounWords,
    ...level1AdjectiveWords,
    ...level1AdverbWords,
    ...level1PrepositionWords,
    ...level1QuestionWords,
    ...level1InterjectionWords,
    // レベル2
    ...level2VerbWords,
    ...level2NounWords,
    ...level2AdjectiveWords,
    ...level2AdverbWords,
    ...level2PrepositionWords,
    ...level2AuxiliaryWords,
    ...level2ConjunctionWords,
    ...level2IndefinitePronounWords,
    ...level2QuantifierWords,
    // レベル3
    ...level3VerbWords,
    ...level3NounWords,
    ...level3AdjectiveWords,
    ...level3AdverbWords,
    ...level3PrepositionWords,
    ...level3ConjunctionWords,
    ...level3RecursivePronounWords,
    ...level3RelativePronounWords,
  ];
}

/**
 * カテゴリー名で単語を取得
 * @param {string} categoryName - カテゴリー名
 * @returns {Array} 該当カテゴリーの単語配列
 */
function getVocabularyByCategory(categoryName) {
  const categoryMap = {
    // カテゴリー別に覚える単語（指定順）
    '家族': familyWords,
    '曜日・月・季節': calendarWords,
    '時間・時間帯': timeWords,
    '数字': numberWords,
    '色': colorWords,
    '体': bodyWords,
    '文房具': stationeryWords,
    '楽器': instrumentWords,
    '衣類': clothingWords,
    '単位': unitWords,
    '食べ物・飲み物': foodDrinkWords,
    'スポーツ': sportsWords,
    '動物': animalWords,
    '教科': subjectWords,
    '学校（の種類）': schoolTypeWords,
    '乗り物': vehicleWords,
    '町の施設': townFacilityWords,
    '職業': occupationWords,
    '国や地域': countryWords,
    '自然': natureWords,
    '天気': weatherWords,
    '方角・方向': directionWords,
    // 後方互換性のため旧カテゴリ名も保持
    '家族・家に関する単語': familyWords,
    '数字に関する単語': numberWords,
    '日用品・楽器に関する単語': instrumentWords,
    '体に関する単語': bodyWords,
    '色に関する単語': colorWords,
    '食べ物・飲み物に関する単語': foodDrinkWords,
    '町の施設に関する単語': townFacilityWords,
    '乗り物に関する単語': vehicleWords,
    '職業に関する単語': occupationWords,
    'スポーツに関する単語': sportsWords,
    '曜日・月・季節に関する単語': calendarWords,
    '動物に関する単語': animalWords,
    '自然・天気、方角に関する単語': [...natureWords, ...weatherWords, ...directionWords],
    '学校に関する単語': [...subjectWords, ...stationeryWords, ...schoolTypeWords],
    '国名や地域に関する単語': countryWords,
    '行事・余暇に関する単語': eventLeisureWords,
    // 機能語（後方互換性のため保持、レベル別のカテゴリー名を優先）
    '冠詞': level1ArticleWords, // レベル1に移動
    '代名詞': level1PronounWords, // レベル1に移動
    '疑問詞': level1QuestionWords, // レベル1に移動
    '限定詞（数量）': level2QuantifierWords, // レベル2に移動
    '前置詞': prepositionWords,
    '助動詞・助動詞的表現': level2AuxiliaryWords, // レベル2に移動
    '接続詞': level2ConjunctionWords, // レベル2に移動
    '関係代名詞': relativeWords,
    '間投詞': level1InterjectionWords, // レベル1に移動
    // レベル2の品詞別（追加）
    'LEVEL2 限定詞（数量）': level2QuantifierWords,
    // レベル1の品詞別
    'LEVEL1 冠詞': level1ArticleWords,
    'LEVEL1 代名詞': level1PronounWords,
    'LEVEL1 動詞': level1VerbWords,
    'LEVEL1 名詞': level1NounWords,
    'LEVEL1 形容詞': level1AdjectiveWords,
    'LEVEL1 副詞': level1AdverbWords,
    'LEVEL1 前置詞': level1PrepositionWords,
    'LEVEL1 疑問詞': level1QuestionWords,
    'LEVEL1 間投詞': level1InterjectionWords,
    // レベル2の品詞別
    'LEVEL2 動詞': level2VerbWords,
    'LEVEL2 名詞': level2NounWords,
    'LEVEL2 形容詞': level2AdjectiveWords,
    'LEVEL2 副詞': level2AdverbWords,
    'LEVEL2 前置詞': level2PrepositionWords,
    'LEVEL2 助動詞': level2AuxiliaryWords,
    'LEVEL2 接続詞': level2ConjunctionWords,
    'LEVEL2 代名詞': level2IndefinitePronounWords,
    '代名詞': level2IndefinitePronounWords,
    // レベル3の品詞別
    'LEVEL3 動詞': level3VerbWords,
    'LEVEL3 名詞': level3NounWords,
    'LEVEL3 形容詞': level3AdjectiveWords,
    'LEVEL3 副詞': level3AdverbWords,
    'LEVEL3 前置詞': level3PrepositionWords,
    'LEVEL3 接続詞': level3ConjunctionWords,
    'LEVEL3 再帰代名詞': level3RecursivePronounWords,
    'LEVEL3 関係代名詞': level3RelativePronounWords,
  };
  
  return categoryMap[categoryName] || [];
}

/**
 * 小学生で習った単語をすべて取得（カテゴリー別単語＋機能語）
 * @returns {Array} 小学生で習った単語の配列
 */
function getElementaryVocabulary() {
  return [
    // カテゴリー別単語（指定順）
    ...familyWords,
    ...calendarWords,
    ...numberWords,
    ...colorWords,
    ...bodyWords,
    ...stationeryWords,
    ...instrumentWords,
    ...clothingWords,
    ...unitWords,
    ...foodDrinkWords,
    ...sportsWords,
    ...animalWords,
    ...subjectWords,
    ...schoolTypeWords,
    ...vehicleWords,
    ...townFacilityWords,
    ...occupationWords,
    ...countryWords,
    ...natureWords,
    ...weatherWords,
    ...directionWords,
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
 * 日常生活でよく使う生活語彙を取得（機能語を除く）
 * @returns {Array} 生活語彙の配列
 */
function getDailyLifeVocabulary() {
  return [
    // カテゴリー別単語（指定順）
    ...familyWords,
    ...calendarWords,
    ...timeWords,
    ...numberWords,
    ...colorWords,
    ...bodyWords,
    ...stationeryWords,
    ...instrumentWords,
    ...foodDrinkWords,
    ...sportsWords,
    ...animalWords,
    ...subjectWords,
    ...schoolTypeWords,
    ...vehicleWords,
    ...townFacilityWords,
    ...occupationWords,
    ...countryWords,
    ...natureWords,
    ...weatherWords,
    ...directionWords,
  ];
}

/**
 * レベル別単語を取得（品詞別配列を使用）
 * @param {number} level - レベル番号（1-5）
 * @returns {Array} 該当レベルの単語配列
 */
function getVocabularyByLevel(level) {
  const levelMap = {
    1: [
      ...level1ArticleWords,
      ...level1PronounWords,
      ...level1VerbWords,
      ...level1NounWords,
      ...level1AdjectiveWords,
      ...level1AdverbWords,
      ...level1PrepositionWords,
      ...level1QuestionWords,
      ...level1InterjectionWords,
    ],
    2: [
      ...level2VerbWords,
      ...level2NounWords,
      ...level2AdjectiveWords,
      ...level2AdverbWords,
      ...level2PrepositionWords,
      ...level2AuxiliaryWords,
      ...level2ConjunctionWords,
      ...level2IndefinitePronounWords,
      ...level2QuantifierWords,
    ],
    3: [
      ...level3VerbWords,
      ...level3NounWords,
      ...level3AdjectiveWords,
      ...level3AdverbWords,
      ...level3PrepositionWords,
      ...level3ConjunctionWords,
      ...level3RecursivePronounWords,
      ...level3RelativePronounWords,
    ],
    4: [], // レベル4は空
    5: [], // レベル5は空
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
- 11201-11299: 自然・天気、方角に関する単語
- 11301-11399: 学校に関する単語
- 11401-11499: 国名や地域に関する単語
- 11501-11599: 方角・方向に関する単語
- 11601-11699: 行事・余暇に関する単語
- 20001-20099: 冠詞
- 20101-20199: 代名詞
- 20201-20299: 代名詞（レベル2）
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

