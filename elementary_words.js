// 小学生で習った単語とカテゴリー別に覚える単語データ
const elementaryWordData = [
  {
    "id": 1001,
    "word": "red",
    "meaning": "赤",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1002,
    "word": "blue",
    "meaning": "青",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1003,
    "word": "yellow",
    "meaning": "黄色",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1004,
    "word": "green",
    "meaning": "緑",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1005,
    "word": "orange",
    "meaning": "オレンジ色",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1006,
    "word": "purple",
    "meaning": "紫",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1007,
    "word": "pink",
    "meaning": "ピンク",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1008,
    "word": "black",
    "meaning": "黒",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1009,
    "word": "white",
    "meaning": "白",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1010,
    "word": "brown",
    "meaning": "茶色",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1011,
    "word": "cat",
    "meaning": "猫",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1012,
    "word": "dog",
    "meaning": "犬",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1013,
    "word": "bird",
    "meaning": "鳥",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1014,
    "word": "fish",
    "meaning": "魚",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1015,
    "word": "rabbit",
    "meaning": "うさぎ",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1016,
    "word": "elephant",
    "meaning": "象",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1017,
    "word": "lion",
    "meaning": "ライオン",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1018,
    "word": "tiger",
    "meaning": "トラ",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1019,
    "word": "bear",
    "meaning": "熊",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1020,
    "word": "monkey",
    "meaning": "サル",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1021,
    "word": "apple",
    "meaning": "りんご",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1022,
    "word": "banana",
    "meaning": "バナナ",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1023,
    "word": "orange",
    "meaning": "オレンジ",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1024,
    "word": "grape",
    "meaning": "ぶどう",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1025,
    "word": "strawberry",
    "meaning": "いちご",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1026,
    "word": "rice",
    "meaning": "ご飯、米",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1027,
    "word": "bread",
    "meaning": "パン",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1028,
    "word": "milk",
    "meaning": "牛乳",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1029,
    "word": "water",
    "meaning": "水",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1030,
    "word": "egg",
    "meaning": "卵",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1031,
    "word": "head",
    "meaning": "頭",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1032,
    "word": "eye",
    "meaning": "目",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1033,
    "word": "nose",
    "meaning": "鼻",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1034,
    "word": "mouth",
    "meaning": "口",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1035,
    "word": "ear",
    "meaning": "耳",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1036,
    "word": "hand",
    "meaning": "手",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1037,
    "word": "foot",
    "meaning": "足",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1038,
    "word": "leg",
    "meaning": "脚",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1039,
    "word": "arm",
    "meaning": "腕",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1040,
    "word": "finger",
    "meaning": "指",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1041,
    "word": "father",
    "meaning": "お父さん",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1042,
    "word": "mother",
    "meaning": "お母さん",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1043,
    "word": "brother",
    "meaning": "兄弟",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1044,
    "word": "sister",
    "meaning": "姉妹",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1045,
    "word": "grandfather",
    "meaning": "おじいさん",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1046,
    "word": "grandmother",
    "meaning": "おばあさん",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1047,
    "word": "school",
    "meaning": "学校",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1048,
    "word": "teacher",
    "meaning": "先生",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1049,
    "word": "student",
    "meaning": "生徒",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1050,
    "word": "book",
    "meaning": "本",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1051,
    "word": "pen",
    "meaning": "ペン",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1052,
    "word": "pencil",
    "meaning": "鉛筆",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1053,
    "word": "desk",
    "meaning": "机",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1054,
    "word": "chair",
    "meaning": "椅子",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1055,
    "word": "one",
    "meaning": "1",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1056,
    "word": "two",
    "meaning": "2",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1057,
    "word": "three",
    "meaning": "3",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1058,
    "word": "four",
    "meaning": "4",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1059,
    "word": "five",
    "meaning": "5",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1060,
    "word": "six",
    "meaning": "6",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1061,
    "word": "seven",
    "meaning": "7",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1062,
    "word": "eight",
    "meaning": "8",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1063,
    "word": "nine",
    "meaning": "9",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1064,
    "word": "ten",
    "meaning": "10",
    "partOfSpeech": "名詞・形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1065,
    "word": "sunny",
    "meaning": "晴れた",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1066,
    "word": "rainy",
    "meaning": "雨の",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1067,
    "word": "cloudy",
    "meaning": "曇りの",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1068,
    "word": "windy",
    "meaning": "風の強い",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1069,
    "word": "snowy",
    "meaning": "雪の",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1070,
    "word": "run",
    "meaning": "走る",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1071,
    "word": "walk",
    "meaning": "歩く",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1072,
    "word": "jump",
    "meaning": "跳ぶ",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1073,
    "word": "swim",
    "meaning": "泳ぐ",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1074,
    "word": "eat",
    "meaning": "食べる",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1075,
    "word": "drink",
    "meaning": "飲む",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1076,
    "word": "sleep",
    "meaning": "眠る",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1077,
    "word": "play",
    "meaning": "遊ぶ、演奏する",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1078,
    "word": "sing",
    "meaning": "歌う",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1079,
    "word": "dance",
    "meaning": "踊る",
    "partOfSpeech": "動詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1080,
    "word": "happy",
    "meaning": "幸せな",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1081,
    "word": "sad",
    "meaning": "悲しい",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1082,
    "word": "big",
    "meaning": "大きい",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1083,
    "word": "small",
    "meaning": "小さい",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1084,
    "word": "good",
    "meaning": "良い",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1085,
    "word": "bad",
    "meaning": "悪い",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1086,
    "word": "hot",
    "meaning": "熱い",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1087,
    "word": "cold",
    "meaning": "冷たい",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1088,
    "word": "new",
    "meaning": "新しい",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1089,
    "word": "old",
    "meaning": "古い",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1090,
    "word": "hello",
    "meaning": "こんにちは",
    "partOfSpeech": "間投詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1091,
    "word": "goodbye",
    "meaning": "さようなら",
    "partOfSpeech": "間投詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1092,
    "word": "thank you",
    "meaning": "ありがとう",
    "partOfSpeech": "間投詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1093,
    "word": "please",
    "meaning": "お願いします",
    "partOfSpeech": "副詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1094,
    "word": "sorry",
    "meaning": "ごめんなさい",
    "partOfSpeech": "形容詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1095,
    "word": "yes",
    "meaning": "はい",
    "partOfSpeech": "副詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1096,
    "word": "no",
    "meaning": "いいえ",
    "partOfSpeech": "副詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1097,
    "word": "house",
    "meaning": "家",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1098,
    "word": "room",
    "meaning": "部屋",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1099,
    "word": "bed",
    "meaning": "ベッド",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 1100,
    "word": "table",
    "meaning": "テーブル",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  // 助動詞
  {
    "id": 2001,
    "word": "can",
    "meaning": "〜できる",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2002,
    "word": "could",
    "meaning": "〜できた、〜できるかもしれない",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2003,
    "word": "may",
    "meaning": "〜してもよい、〜かもしれない",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2004,
    "word": "might",
    "meaning": "〜かもしれない",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2005,
    "word": "must",
    "meaning": "〜しなければならない、〜に違いない",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2006,
    "word": "should",
    "meaning": "〜すべきだ、〜するはずだ",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2007,
    "word": "will",
    "meaning": "〜するだろう、〜するつもりだ",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2008,
    "word": "would",
    "meaning": "〜するだろう、〜するつもりだった",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2009,
    "word": "shall",
    "meaning": "〜しましょう、〜するつもりだ",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  {
    "id": 2010,
    "word": "ought to",
    "meaning": "〜すべきだ",
    "partOfSpeech": "助動詞",
    "category": "助動詞"
  },
  // 接続詞
  {
    "id": 3001,
    "word": "and",
    "meaning": "そして、〜と",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3002,
    "word": "but",
    "meaning": "しかし、でも",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3003,
    "word": "or",
    "meaning": "または、それとも",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3004,
    "word": "so",
    "meaning": "だから、それで",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3005,
    "word": "because",
    "meaning": "なぜなら〜だから",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3006,
    "word": "if",
    "meaning": "もし〜なら",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3007,
    "word": "when",
    "meaning": "〜のとき",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3008,
    "word": "while",
    "meaning": "〜の間に、〜する一方で",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3009,
    "word": "though",
    "meaning": "〜だけれども",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3010,
    "word": "although",
    "meaning": "〜だけれども",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3011,
    "word": "since",
    "meaning": "〜以来、〜なので",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3012,
    "word": "until",
    "meaning": "〜まで",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3013,
    "word": "before",
    "meaning": "〜の前に",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3014,
    "word": "after",
    "meaning": "〜の後に",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  {
    "id": 3015,
    "word": "that",
    "meaning": "〜ということ、〜というもの",
    "partOfSpeech": "接続詞",
    "category": "接続詞"
  },
  // 前置詞
  {
    "id": 4001,
    "word": "in",
    "meaning": "〜の中に、〜で",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4002,
    "word": "on",
    "meaning": "〜の上に、〜について",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4003,
    "word": "at",
    "meaning": "〜に、〜で",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4004,
    "word": "by",
    "meaning": "〜によって、〜までに",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4005,
    "word": "for",
    "meaning": "〜のために、〜の間",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4006,
    "word": "with",
    "meaning": "〜と一緒に、〜を持って",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4007,
    "word": "from",
    "meaning": "〜から",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4008,
    "word": "to",
    "meaning": "〜へ、〜まで",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4009,
    "word": "of",
    "meaning": "〜の",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4010,
    "word": "about",
    "meaning": "〜について、〜の周りに",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4011,
    "word": "into",
    "meaning": "〜の中へ",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4012,
    "word": "onto",
    "meaning": "〜の上へ",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4013,
    "word": "over",
    "meaning": "〜の上に、〜を越えて",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4014,
    "word": "under",
    "meaning": "〜の下に",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4015,
    "word": "between",
    "meaning": "〜の間に",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4016,
    "word": "among",
    "meaning": "〜の間に（3つ以上）",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4017,
    "word": "through",
    "meaning": "〜を通って",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4018,
    "word": "during",
    "meaning": "〜の間に",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4019,
    "word": "before",
    "meaning": "〜の前に",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4020,
    "word": "after",
    "meaning": "〜の後に",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4021,
    "word": "since",
    "meaning": "〜以来",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4022,
    "word": "until",
    "meaning": "〜まで",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4023,
    "word": "against",
    "meaning": "〜に反対して、〜に対して",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4024,
    "word": "without",
    "meaning": "〜なしで",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  {
    "id": 4025,
    "word": "within",
    "meaning": "〜の内側に、〜以内に",
    "partOfSpeech": "前置詞",
    "category": "前置詞"
  },
  // 疑問詞
  {
    "id": 5001,
    "word": "what",
    "meaning": "何",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5002,
    "word": "who",
    "meaning": "誰",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5003,
    "word": "which",
    "meaning": "どちら、どれ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5004,
    "word": "when",
    "meaning": "いつ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5005,
    "word": "where",
    "meaning": "どこ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5006,
    "word": "why",
    "meaning": "なぜ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5007,
    "word": "how",
    "meaning": "どのように、どれくらい",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5008,
    "word": "whose",
    "meaning": "誰の",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  {
    "id": 5009,
    "word": "whom",
    "meaning": "誰を（目的格）",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞"
  },
  // 月（暦）
  {
    "id": 6001,
    "word": "January",
    "meaning": "1月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6002,
    "word": "February",
    "meaning": "2月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6003,
    "word": "March",
    "meaning": "3月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6004,
    "word": "April",
    "meaning": "4月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6005,
    "word": "May",
    "meaning": "5月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6006,
    "word": "June",
    "meaning": "6月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6007,
    "word": "July",
    "meaning": "7月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6008,
    "word": "August",
    "meaning": "8月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6009,
    "word": "September",
    "meaning": "9月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6010,
    "word": "October",
    "meaning": "10月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6011,
    "word": "November",
    "meaning": "11月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 6012,
    "word": "December",
    "meaning": "12月",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  // 曜日
  {
    "id": 7001,
    "word": "Monday",
    "meaning": "月曜日",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 7002,
    "word": "Tuesday",
    "meaning": "火曜日",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 7003,
    "word": "Wednesday",
    "meaning": "水曜日",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 7004,
    "word": "Thursday",
    "meaning": "木曜日",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 7005,
    "word": "Friday",
    "meaning": "金曜日",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 7006,
    "word": "Saturday",
    "meaning": "土曜日",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  },
  {
    "id": 7007,
    "word": "Sunday",
    "meaning": "日曜日",
    "partOfSpeech": "名詞",
    "category": "小学生で習った単語とカテゴリー別に覚える単語"
  }
];

