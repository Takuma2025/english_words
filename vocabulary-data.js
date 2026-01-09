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
  { id: 10001, word: "family", meaning: "家族", partOfSpeech: "名詞", category: "家族", appearanceCount: 48 },
  { id: 10003, word: "father", meaning: "父、父親", partOfSpeech: "名詞", category: "家族", appearanceCount: 4, kana: "*ファ*ーザー" },
  { id: 10004, word: "mother", meaning: "母、母親、お母さん", partOfSpeech: "名詞", category: "家族", appearanceCount: 1, kana: "*マ*ザー" },
  { id: 10005, word: "parent", meaning: "親　（parents:両親）", partOfSpeech: "名詞", category: "家族", appearanceCount: 1, kana: "*ペア*レント" },
  { id: 10012, word: "brother", meaning: "兄弟、兄、弟", partOfSpeech: "名詞", category: "家族", appearanceCount: 23, kana: "*ブラ*ザー" },
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
  { id: 10101, word: "zero", meaning: "ゼロ", partOfSpeech: "名詞・形容詞", category: "数字", appearanceCount: 2 },
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
  { id: 20635, word: "as", meaning: "〜として", partOfSpeech: "前置詞", category: "前置詞", appearanceCount: 95, example: { english: "<strong>as</strong> a teacher", japanese: "教師として" } },
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
  { id: 20001, word: "a", meaning: "１つの〜、１人の〜", partOfSpeech: "冠詞", category: "LEVEL1 冠詞", appearanceCount: 1105, example: { english: "<strong>a</strong> bike", japanese: "（１台の）自転車" } },
  { id: 20002, word: "an", meaning: "１つの〜、１人の〜（母音の音の前で使う）", partOfSpeech: "冠詞", category: "LEVEL1 冠詞", appearanceCount: 119, example: { english: "<strong>an</strong> umbrella", japanese: "（1本の）かさ" } },
  { id: 20003, word: "the", meaning: "その〜", partOfSpeech: "冠詞", category: "LEVEL1 冠詞", appearanceCount: 2988, example: { english: "Please open <strong>the</strong> window.", japanese: "その窓を開けてください。" } },
];

// レベル1 代名詞
const level1PronounWords = [
  { id: 20101, word: "I", meaning: "私は(主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 1441, example: { english: "<strong>I</strong> like baseball very much.", japanese: "私は野球が大好きです。" } },
  { id: 20102, word: "my", meaning: "私の（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 324, example: { english: "<strong>my</strong> book", japanese: "私の本" } },
  { id: 20103, word: "me", meaning: "私を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 178, example: { english: "Please help <strong>me</strong>.", japanese: "私を助けてください。" } },
  { id: 20104, word: "mine", meaning: "私のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 6, example: { english: "This pen is <strong>mine</strong>.", japanese: "このペンは私のものです。" } },
  { id: 20105, word: "you", meaning: "あなた（たち）［は/を/に］（主格・目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 923, example: { english: "I love <strong>you</strong>.", japanese: "私はあなたを愛しています。" } },
  { id: 20106, word: "your", meaning: "あなた（たち）の（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 232, example: { english: "Is this <strong>your</strong> bag?", japanese: "これはあなたのかばんですか。" } },
  { id: 20107, word: "yours", meaning: "あなた（たち）のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 9, example: { english: "This book is <strong>yours</strong>.", japanese: "この本はあなたのものです。" } },
  { id: 20108, word: "he", meaning: "彼は（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 600, example: { english: "<strong>He</strong> is an English teacher.", japanese: "彼は英語の先生です。" } },
  { id: 20109, word: "his", meaning: "彼の（所有格）、彼のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 350, example: { english: "That is <strong>his</strong> car.", japanese: "あれは彼の車です。" } },
  { id: 20110, word: "him", meaning: "彼を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 200, example: { english: "I gave <strong>him</strong> a present.", japanese: "私は彼にプレゼントをあげました。" } },
  { id: 20111, word: "she", meaning: "彼女は（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 400, example: { english: "<strong>She</strong> is my sister.", japanese: "彼女は私の姉です。" } },
  { id: 20112, word: "her", meaning: "彼女の（所有格）、彼女を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 300, example: { english: "I like <strong>her</strong> smile.", japanese: "私は彼女の笑顔が好きです。" } },
  { id: 20113, word: "hers", meaning: "彼女のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 20, example: { english: "This bag is <strong>hers</strong>.", japanese: "このかばんは彼女のものです。" } },
  { id: 20114, word: "they", meaning: "彼ら（彼女ら・それら）は（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 500, example: { english: "<strong>They</strong> are students.", japanese: "彼らは学生です。" } },
  { id: 20115, word: "their", meaning: "彼ら（彼女ら・それら）の（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 250, example: { english: "<strong>Their</strong> house is big.", japanese: "彼らの家は大きいです。" } },
  { id: 20116, word: "them", meaning: "彼ら（彼女ら・それら）を/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 200, example: { english: "I met <strong>them</strong> yesterday.", japanese: "私は昨日彼らに会いました。" } },
  { id: 20117, word: "theirs", meaning: "彼ら（彼女ら）のもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 15, example: { english: "This dog is <strong>theirs</strong>.", japanese: "この犬は彼らのものです。" } },
  { id: 20118, word: "we", meaning: "私たちは（主格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 400, example: { english: "<strong>We</strong> are friends.", japanese: "私たちは友達です。" } },
  { id: 20119, word: "our", meaning: "私たちの（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 200, example: { english: "This is <strong>our</strong> school.", japanese: "これは私たちの学校です。" } },
  { id: 20120, word: "us", meaning: "私たちを/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 150, example: { english: "Please tell <strong>us</strong> the story.", japanese: "私たちにその話を聞かせてください。" } },
  { id: 20121, word: "ours", meaning: "私たちのもの（所有代名詞）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 20, example: { english: "This land is <strong>ours</strong>.", japanese: "この土地は私たちのものです。" } },
  { id: 20122, word: "it", meaning: "それは（主格）、それを/に（目的格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 1000, example: { english: "<strong>It</strong> is a cat.", japanese: "それは猫です。" } },
  { id: 20123, word: "its", meaning: "それの、その（所有格）", partOfSpeech: "代名詞", category: "LEVEL1 代名詞", appearanceCount: 100, example: { english: "The dog wagged <strong>its</strong> tail.", japanese: "その犬はしっぽを振りました。" } },
  { id: 20124, word: "this", meaning: "これは、この", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 600, example: { english: "<strong>This</strong> is my pen.", japanese: "これは私のペンです。" } },
  { id: 20125, word: "these", meaning: "これらは、これらの", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 100, example: { english: "<strong>These</strong> are my books.", japanese: "これらは私の本です。" } },
  { id: 20126, word: "that", meaning: "あれは、あの、それは", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 800, example: { english: "<strong>That</strong> is a bird.", japanese: "あれは鳥です。" } },
  { id: 20127, word: "those", meaning: "あれらは、あれらの", partOfSpeech: "代名詞・限定詞", category: "LEVEL1 代名詞", appearanceCount: 80, example: { english: "<strong>Those</strong> are my friends.", japanese: "あれらは私の友達です。" } },
];

// レベル1 動詞（手入力でデータを追加してください）
const level1VerbWords = [
  // 例: { id: 20301, word: "be", meaning: "〜である、〜です", partOfSpeech: "動詞", category: "LEVEL1 動詞", appearanceCount: 0, example: { english: "I <strong>am</strong> a student.", japanese: "私は学生です。" } },
];

// レベル1 名詞（手入力でデータを追加してください）
const level1NounWords = [
  // 例: { id: 20351, word: "book", meaning: "本", partOfSpeech: "名詞", category: "LEVEL1 名詞", appearanceCount: 0, example: { english: "This is a <strong>book</strong>.", japanese: "これは本です。" } },
];

// レベル1 形容詞（手入力でデータを追加してください）
const level1AdjectiveWords = [
  // 例: { id: 20451, word: "good", meaning: "良い", partOfSpeech: "形容詞", category: "LEVEL1 形容詞", appearanceCount: 0, example: { english: "This is a <strong>good</strong> book.", japanese: "これは良い本です。" } },
];

// レベル1 副詞（手入力でデータを追加してください）
const level1AdverbWords = [
  // 例: { id: 20551, word: "very", meaning: "とても", partOfSpeech: "副詞", category: "LEVEL1 副詞", appearanceCount: 0, example: { english: "This is <strong>very</strong> good.", japanese: "これはとても良いです。" } },
];

// レベル1 前置詞（手入力でデータを追加してください）
const level1PrepositionWords = [
  // 例: { id: 20651, word: "in", meaning: "〜の中に", partOfSpeech: "前置詞", category: "LEVEL1 前置詞", appearanceCount: 0, example: { english: "The book is <strong>in</strong> the bag.", japanese: "本はかばんの中にあります。" } },
];

// レベル1 疑問詞
const level1QuestionWords = [
  { id: 20401, word: "what", meaning: "何、何の、どんな", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 211, example: { english: "<strong>What</strong> animal is that?", japanese: "あれは何の動物ですか。" } },
  { id: 20402, word: "who", meaning: "だれ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 126, example: { english: "<strong>Who</strong> is that man?", japanese: "あの男性は誰ですか。" } },
  { id: 20403, word: "which", meaning: "どちら、どれ、どの", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 186, example: { english: "<strong>Which</strong> season do you like?", japanese: "あなたはどの季節が好きですか。" } },
  { id: 20404, word: "when", meaning: "いつ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 186, example: { english: "<strong>When</strong> did you arrive here?", japanese: "あなたはいつここに到着しましたか。" } },
  { id: 20405, word: "where", meaning: "どこに（で）、どこへ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 126, example: { english: "<strong>Where</strong> is the station?", japanese: "駅はどこにありますか。" } },
  { id: 20406, word: "why", meaning: "なぜ", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 47, example: { english: "<strong>Why</strong> do you like music?", japanese: "あなたはなぜ音楽が好きなのですか。" } },
  { id: 20407, word: "how", meaning: "どのように（どうやって）、どれくらい", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 171, example: { english: "<strong>How</strong> does he go to school every day?", japanese: "彼は毎日どうやって学校に行きますか。" } },
  { id: 20408, word: "whose", meaning: "だれの、だれのもの", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 5, example: { english: "<strong>Whose</strong> book is this?", japanese: "この本は誰の本ですか。" } },
  { id: 20409, word: "how much", meaning: "いくら（値段・料金をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 6, example: { english: "<strong>How much</strong> is this notebook?", japanese: "このノートはいくらですか。" } },
  { id: 20410, word: "how many", meaning: "いくつ（数をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 6, example: { english: "<strong>How many</strong> books are there in the library?", japanese: "その図書館には本が何冊ありますか。" } },
  { id: 20411, word: "how long", meaning: "どれくらいの間（期間をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 3, example: { english: "<strong>How long</strong> will you stay at the hotel?", japanese: "あなたはホテルにどのくらい滞在するつもりですか。" } },
  { id: 20412, word: "how old", meaning: "何歳（年齢をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 3, example: { english: "<strong>How old</strong> is your father?", japanese: "あなたの父親は何歳ですか。" } },
  { id: 20413, word: "how far", meaning: "どのくらいの距離（距離をたずねる）", partOfSpeech: "疑問詞", category: "LEVEL1 疑問詞", appearanceCount: 1, example: { english: "<strong>How far</strong> is it from here to the station?", japanese: "ここから駅までどのくらいの距離がありますか。" } },
];

// レベル1 間投詞
const level1InterjectionWords = [
  { id: 21001, word: "hi", meaning: "やあ、こんにちは", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 176, example: { english: "<strong>Hi</strong>! How are you?", japanese: "やあ! お元気ですか。" } },
  { id: 21002, word: "hello", meaning: "やあ、こんにちは", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 50, example: { english: "<strong>Hello</strong>, nice to meet you.", japanese: "こんにちは、はじめまして。" } },
  { id: 21003, word: "hey", meaning: "やあ、おい、ちょっと", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 0, example: { english: "<strong>Hey</strong>, wait for me!", japanese: "おい、待って！" } },
  { id: 21004, word: "bye", meaning: "さようなら", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 70, example: { english: "<strong>Bye</strong>, see you later.", japanese: "さようなら、またお会いしましょう。" } },
  { id: 21005, word: "goodbye", meaning: "さようなら", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 2, example: { english: "<strong>Goodbye</strong>, see you later.", japanese: "さようなら、またお会いしましょう。" } },
  { id: 21006, word: "oh", meaning: "ああ！、おお！", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 161, example: { english: "<strong>Oh</strong>, I see!", japanese: "ああ、わかりました！" } },
  { id: 21007, word: "wow", meaning: "わあ、おお（驚きや喜び）", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 15, example: { english: "<strong>Wow</strong>, that's nice!", japanese: "わあ、それはいいですね！" } },
  { id: 21008, word: "yes", meaning: "はい", partOfSpeech: "間投詞・副詞", category: "LEVEL1 間投詞", appearanceCount: 191, example: { english: "<strong>Yes</strong>, I am.", japanese: "はい、そうです。" } },
  { id: 21009, word: "no", meaning: "いいえ、いや、だめだ", partOfSpeech: "間投詞・副詞", category: "LEVEL1 間投詞", appearanceCount: 73, example: { english: "<strong>No</strong>, I don't.", japanese: "いいえ、違います。" } },
  { id: 21010, word: "OK", meaning: "わかりました、それでは、大丈夫な", partOfSpeech: "間投詞・形容詞", category: "LEVEL1 間投詞", appearanceCount: 70, example: { english: "<strong>OK</strong>, let's go.", japanese: "わかりました、行きましょう。" } },
  { id: 21011, word: "well", meaning: "ええっと…（考え中）", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 151, example: { english: "<strong>Well</strong>, I'm not sure.", japanese: "ええっと…、わかりません。" } },
  { id: 21014, word: "yeah", meaning: "うん、ああ（yesのくだけた表現）", partOfSpeech: "間投詞", category: "LEVEL1 間投詞", appearanceCount: 5, example: { english: "<strong>Yeah</strong>, I think so.", japanese: "うん、そう思う。" } },
];

// ============================================
// レベル2の品詞別単語
// ============================================
// レベル2: 動詞、名詞、形容詞、副詞、前置詞、助動詞、接続詞、不定代名詞

// レベル2 動詞（手入力でデータを追加してください）
const level2VerbWords = [
  // 例: { id: 21301, word: "have", meaning: "持っている、〜がある", partOfSpeech: "動詞", category: "LEVEL2 動詞", appearanceCount: 0, example: { english: "I <strong>have</strong> a book.", japanese: "私は本を持っています。" } },
];

// レベル2 名詞（手入力でデータを追加してください）
const level2NounWords = [
  // 例: { id: 21351, word: "school", meaning: "学校", partOfSpeech: "名詞", category: "LEVEL2 名詞", appearanceCount: 0, example: { english: "I go to <strong>school</strong>.", japanese: "私は学校に行きます。" } },
];

// レベル2 形容詞（手入力でデータを追加してください）
const level2AdjectiveWords = [
  // 例: { id: 21451, word: "big", meaning: "大きい", partOfSpeech: "形容詞", category: "LEVEL2 形容詞", appearanceCount: 0, example: { english: "This is a <strong>big</strong> house.", japanese: "これは大きい家です。" } },
];

// レベル2 副詞（手入力でデータを追加してください）
const level2AdverbWords = [
  // 例: { id: 21551, word: "often", meaning: "しばしば", partOfSpeech: "副詞", category: "LEVEL2 副詞", appearanceCount: 0, example: { english: "I <strong>often</strong> go to the library.", japanese: "私はしばしば図書館に行きます。" } },
];

// レベル2 前置詞（手入力でデータを追加してください）
const level2PrepositionWords = [
  // 例: { id: 21651, word: "on", meaning: "〜の上に", partOfSpeech: "前置詞", category: "LEVEL2 前置詞", appearanceCount: 0, example: { english: "The book is <strong>on</strong> the table.", japanese: "本は机の上にあります。" } },
];

// レベル2 助動詞
const level2AuxiliaryWords = [
  { id: 20701, word: "can", meaning: "〜できる、〜してもよい", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 374, example: { english: "I <strong>can</strong> play the piano.", japanese: "私はピアノを弾けます。" } },
  { id: 20702, word: "could", meaning: "（canの過去形）〜できた", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 100, example: { english: "My father <strong>could</strong> speak English well.", japanese: "父は英語を上手に話すことができました。" } },
  { id: 20703, word: "may", meaning: "〜かもしれない、〜してもよい", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 71, example: { english: "I <strong>may</strong> be late for the party.", japanese: "私はパーティーに遅れるかもしれません。" } },
  { id: 20717, word: "might", meaning: "（mayの過去形）（ひょっとして）〜かもしれない", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 0, example: { english: "I <strong>might</strong> go to the party.", japanese: "ひょっとしてパーティーに行くかもしれません。" } },
  { id: 20704, word: "must", meaning: "〜しなければならない", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 22, example: { english: "You <strong>must</strong> do your homework.", japanese: "あなたは宿題をしなければなりません。" } },
  { id: 20705, word: "should", meaning: "〜すべきである", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 63, example: { english: "We <strong>should</strong> take a break.", japanese: "私たちは休憩を取るべきです。" } },
  { id: 20706, word: "will", meaning: "〜するつもり、〜でしょう", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 323, example: { english: "I <strong>will</strong> go to the park next week.", japanese: "私は来週公園に行くつもりです。" } },
  { id: 20707, word: "would", meaning: "（willの過去形）〜だろう、〜するつもりだ、(would like toで)〜したい", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 100, example: { english: "I <strong>would</strong> like to go abroad.", japanese: "私は海外に行きたいです。" } },
  { id: 20708, word: "be able to", meaning: "〜することができる", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 8, example: { english: "I <strong>am able to</strong> play the piano.", japanese: "私はピアノを弾けます。" } },
  { id: 20709, word: "be going to", meaning: "〜するつもり", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 14, example: { english: "I <strong>am going to</strong> go to the park next week.", japanese: "私は来週公園に行くつもりです。" } },
  { id: 20710, word: "have to", meaning: "〜しなければならない、（don't have to～：～する必要はない）", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 22, example: { english: "I <strong>have to</strong> do my homework.", japanese: "私は宿題をしなければなりません。" } },
  { id: 20711, word: "used to", meaning: "以前は～だった", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 2, example: { english: "This house <strong>used to</strong> be a shop.", japanese: "この家は以前は店でした。" } },
  { id: 20711, word: "Will you～?", meaning: "〜してくれませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 15, example: { english: "<strong>Can you</strong> open the door?", japanese: "ドアを開けてくれませんか。" } },
  { id: 20711, word: "Can you～?", meaning: "〜してくれませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 16, example: { english: "<strong>Can you</strong> open the door?", japanese: "ドアを開けてくれませんか。" } },
  { id: 20712, word: "Would you～?", meaning: "〜していただけませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 2, example: { english: "<strong>Would you</strong> close the window?", japanese: "窓を閉めていただけませんか。" } },
  { id: 20712, word: "Could you～?", meaning: "〜していただけませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 1, example: { english: "<strong>Would you</strong> close the window?", japanese: "窓を閉めていただけませんか。" } },
  { id: 20713, word: "Would you like 〜 ?", meaning: "〜はいかがですか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 1, example: { english: "<strong>Would you like</strong> some cake?", japanese: "ケーキはいかがですか。" } },
  { id: 20714, word: "Can I～?", meaning: "〜してもいいですか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 10, example: { english: "<strong>May I</strong> use the phone?", japanese: "電話を使ってもいいですか。" } },
  { id: 20714, word: "May I～?", meaning: "〜してもいいですか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 0, example: { english: "<strong>May I</strong> use the phone?", japanese: "電話を使ってもいいですか。" } },
  { id: 20715, word: "Shall I 〜 ?", meaning: "（私が）〜しましょうか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 2, example: { english: "<strong>Shall I</strong> open the window?", japanese: "窓を開けましょうか。" } },
  { id: 20716, word: "Shall we 〜 ?", meaning: "（いっしょに）〜しませんか", partOfSpeech: "助動詞", category: "LEVEL2 助動詞", appearanceCount: 10, example: { english: "<strong>Shall we</strong> play tennis?", japanese: "（いっしょに）テニスをしませんか。" } },
];

// レベル2 接続詞
const level2ConjunctionWords = [
  { id: 20801, word: "and", meaning: "〜と…、そして", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 823, example: { english: "apples <strong>and</strong> oranges", japanese: "りんごとオレンジ" } },
  { id: 20802, word: "but", meaning: "しかし、だが", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 171, example: { english: "I was sick yesterday, <strong>but</strong> I went to school today.", japanese: "昨日病気だったが、今日は学校に行った。" } },
  { id: 20803, word: "or", meaning: "〜かもしくは…", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 99, example: { english: "English <strong>or</strong> Japanese", japanese: "英語か日本語" } },
  { id: 20804, word: "so", meaning: "だから", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 213, example: { english: "I'm tired, <strong>so</strong> I'm going to bed.", japanese: "疲れているから、寝る" } },
  { id: 20818, word: "however", meaning: "しかし、けれども", partOfSpeech: "接続詞・副詞", category: "LEVEL2 接続詞", appearanceCount: 49, example: { english: "I wanted to go. <strong>however</strong>, I was too busy.", japanese: "行きたかったが、しかし忙しすぎた。" } },
  { id: 20805, word: "because", meaning: "（理由や原因を説明して）〜なので、〜だから", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 95, example: { english: "I like summer <strong>because</strong> I can go to the beach.", japanese: "私は海に行けるから、夏が好きです." } },
  { id: 20806, word: "if", meaning: "もし〜なら", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 113, example: { english: "<strong>If</strong> it is sunny tomorrow, we will play tennis.", japanese: "明日晴れたらテニスをするつもりです。" } },
  { id: 20807, word: "when", meaning: "〜のとき", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 250, example: { english: "Tom was watching TV <strong>when</strong> his mother came home.", japanese: "母が帰ってきたとき、トムはテレビを見ていました。" } },
  { id: 20808, word: "while", meaning: "〜している間に、（after a while：しばらくの間）", partOfSpeech: "接続詞・名詞", category: "LEVEL2 接続詞", appearanceCount: 8, example: { english: "<strong>While</strong> I was eating breakfast, I was reading a newspaper.", japanese: "朝食を食べながら、新聞を読んでいました。" } },
  { id: 20809, word: "though", meaning: "〜けれども", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 27, example: { english: "I studied hard <strong>though</strong> I was tired.", japanese: "疲れていたけれども、私は勉強を頑張りました。" } },
  { id: 20810, word: "although", meaning: "〜けれども", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 27, example: { english: "I studied hard <strong>although</strong> I was tired.", japanese: "疲れていたけれども、私は勉強を頑張りました。" } },
  { id: 20811, word: "since", meaning: "〜から、～以来、〜なので", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 9, example: { english: "I have known him <strong>since</strong> I was a child.", japanese: "私は子供の頃から、彼を知っています。" } },
  { id: 20812, word: "until", meaning: "〜するまでずっと", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 12, example: { english: "I must wait here <strong>until</strong> he comes back.", japanese: "彼が帰ってきたら、ここで待たなければなりません。" } },
  { id: 20813, word: "before", meaning: "〜の前に", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 59, example: { english: "I will go home <strong>before</strong> it is dark.", japanese: "暗くなる前に、家に帰るつもりです。" } },
  { id: 20814, word: "after", meaning: "〜の後に", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 104, example: { english: "We met at the station <strong>after</strong> the party.", japanese: "私たちはパーティーのあと、駅で会いました。" } },
  { id: 20815, word: "that", meaning: "（ひとまとまりの内容を表して）～ということ・もの", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 628, example: { english: "I know <strong>that</strong> he is a doctor.", japanese: "私は彼が医者であることを知っています。" } },
  { id: 20816, word: "as soon as", meaning: "〜するとすぐに", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 2, example: { english: "I will play games <strong>as soon as</strong> I finish my homework.", japanese: "宿題を終えたらすぐに、ゲームをするつもりです。" } },
  { id: 20817, word: "even if", meaning: "たとえ〜でも", partOfSpeech: "接続詞", category: "LEVEL2 接続詞", appearanceCount: 6, example: { english: "I will go there <strong>even if</strong> it is raining.", japanese: "たとえ雨が降っていても、そこに行くつもりです。" } },
];

// レベル2 不定代名詞
const level2IndefinitePronounWords = [
  { id: 20201, word: "something", meaning: "何か（もの・こと）", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 36, example: { english: "I want <strong>something</strong> to drink.", japanese: "私は何か飲みものがほしいです。" } },
  { id: 20202, word: "anything", meaning: "（否定文で）何も～ない、（疑問文で）何か", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 21, example: { english: "Do you have <strong>anything</strong> to eat?", japanese: "何か食べ物はありますか。" } },
  { id: 20203, word: "nothing", meaning: "何も〜ない", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 8, example: { english: "There is <strong>nothing</strong> in the box.", japanese: "箱の中には何もありません。" } },
  { id: 20204, word: "everything", meaning: "すべてのもの、すべてのこと", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 12, example: { english: "<strong>Everything</strong> is ready.", japanese: "すべての準備ができています。" } },
  { id: 20205, word: "everyone", meaning: "みんな、すべての人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 23, example: { english: "<strong>Everyone</strong> has a book.", japanese: "みんな本を持っています。" } },
  { id: 20206, word: "someone", meaning: "だれか、ある人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 8, example: { english: "<strong>Someone</strong> is calling you.", japanese: "だれかがあなたを呼んでいます。" } },
  { id: 20207, word: "anyone", meaning: "（肯定文で）誰でも、（否定文で）誰も、（疑問文で）誰か", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 1, example: { english: "Can <strong>anyone</strong> help me?", japanese: "だれか手伝ってくれますか。" } },
  { id: 20208, word: "everybody", meaning: "みんな、すべての人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 1, example: { english: "<strong>Everybody</strong> likes music.", japanese: "みんな音楽が好きです。" } },
  { id: 20209, word: "somebody", meaning: "だれか、ある人", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 0, example: { english: "<strong>Somebody</strong> is at the door.", japanese: "だれかがドアにいます。" } },
  { id: 20210, word: "nobody", meaning: "だれも〜ない", partOfSpeech: "代名詞", category: "LEVEL2 代名詞", appearanceCount: 0, example: { english: "<strong>Nobody</strong> knows the answer.", japanese: "だれも答えを知りません。" } },
];

// レベル2 数量を表す限定詞
const level2QuantifierWords = [
  { id: 20513, word: "several", meaning: "いくつかの、数個の", partOfSpeech: "限定詞・形容詞", category: "LEVEL2 限定詞（数量）", appearanceCount: 15, example: { english: "Ken bought <strong>several</strong> pens.", japanese: "ケンはいくつかのペンを買いました。" } },
];

// ============================================
// レベル3の品詞別単語
// ============================================
// レベル3: 動詞、名詞、形容詞、副詞、前置詞、接続詞

// レベル3 動詞（手入力でデータを追加してください）
const level3VerbWords = [
  // 例: { id: 22301, word: "understand", meaning: "理解する", partOfSpeech: "動詞", category: "LEVEL3 動詞", appearanceCount: 0, example: { english: "I <strong>understand</strong> English.", japanese: "私は英語を理解します。" } },
];

// レベル3 名詞（手入力でデータを追加してください）
const level3NounWords = [
  // 例: { id: 22351, word: "knowledge", meaning: "知識", partOfSpeech: "名詞", category: "LEVEL3 名詞", appearanceCount: 0, example: { english: "I have <strong>knowledge</strong> of English.", japanese: "私は英語の知識を持っています。" } },
];

// レベル3 形容詞（手入力でデータを追加してください）
const level3AdjectiveWords = [
  // 例: { id: 22451, word: "important", meaning: "重要な", partOfSpeech: "形容詞", category: "LEVEL3 形容詞", appearanceCount: 0, example: { english: "This is <strong>important</strong>.", japanese: "これは重要です。" } },
];

// レベル3 副詞（手入力でデータを追加してください）
const level3AdverbWords = [
  // 例: { id: 22551, word: "carefully", meaning: "注意深く", partOfSpeech: "副詞", category: "LEVEL3 副詞", appearanceCount: 0, example: { english: "Please read <strong>carefully</strong>.", japanese: "注意深く読んでください。" } },
];

// レベル3 前置詞（手入力でデータを追加してください）
const level3PrepositionWords = [
  // 例: { id: 22651, word: "through", meaning: "〜を通って", partOfSpeech: "前置詞", category: "LEVEL3 前置詞", appearanceCount: 0, example: { english: "I walked <strong>through</strong> the park.", japanese: "私は公園を通って歩きました。" } },
];

// レベル3 接続詞（手入力でデータを追加してください）
const level3ConjunctionWords = [
  // 例: { id: 22751, word: "although", meaning: "〜けれども", partOfSpeech: "接続詞", category: "LEVEL3 接続詞", appearanceCount: 0, example: { english: "<strong>Although</strong> it was raining, I went out.", japanese: "雨が降っていたけれども、私は出かけました。" } },
];

//レベル3 再帰代名詞
const level3RecursivePronounWords = [
  { id: 20128, word: "myself", meaning: "私自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 1, example: { english: "I came here by<strong>myself</strong>.", japanese: "私はひとりでここに来ました。" } },
  { id: 20129, word: "yourself", meaning: "あなた自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "Please help <strong>yourself</strong>.", japanese: "（飲食物などを）どうぞご自由にお取りください。" } },
  { id: 20130, word: "himself", meaning: "彼自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 2, example: { english: "\"She is very beautiful.\"he said to<strong>himself</strong>.", japanese: "「彼女は美しい」と彼は（心の中で）思いました。" } },
  { id: 20131, word: "herself", meaning: "彼女自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "She made it <strong>herself</strong>.", japanese: "彼女はそれを自分で作りました。" } },
  { id: 20132, word: "itself", meaning: "それ自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "The door opened by <strong>itself</strong>.", japanese: "ドアがひとりでに開きました。" } },
  { id: 20133, word: "ourselves", meaning: "私たち自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "We enjoyed <strong>ourselves</strong>.", japanese: "私たちは楽しみました。" } },
  { id: 20134, word: "themselves", meaning: "彼ら（彼女ら）自身（を/に）", partOfSpeech: "代名詞", category: "LEVEL3 再帰代名詞", appearanceCount: 0, example: { english: "They did it <strong>themselves</strong>.", japanese: "彼らはそれを自分たちでやりました。" } },
];

//レベル3 関係代名詞
const level3RelativePronounWords = [
  { id: 20901, word: "who", meaning: "〈人〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 126, example: { english: "The boy <strong>who</strong> is singing is my brother.", japanese: "歌っている少年は私の弟です。" } },
  { id: 20902, word: "which", meaning: "〈物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 186, example: { english: "This is the book <strong>which</strong> I bought yesterday.", japanese: "これが私が昨日買った本です。" } },
  { id: 20903, word: "that", meaning: "〈人/物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 628, example: { english: "He is the teacher <strong>that</strong> I respect.", japanese: "彼は私が尊敬している先生です。" } },
  { id: 20904, word: "whose", meaning: "〈人/物〉について、後ろから説明する働きを持つ", partOfSpeech: "関係代名詞", category: "LEVEL3 関係代名詞", appearanceCount: 0, example: { english: "Look at tha house <strong>whose</strong> roof is red.", japanese: "あの赤い屋根の家を見てください。"}},
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

