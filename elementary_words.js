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
  // 助動詞・助動詞的表現
  {
    "id": 2001,
    "word": "can",
    "meaning": "（可能）〜できる、（許可）〜してもよい",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 374,
    "example": {
      "english": "I <strong>can</strong> play the piano.",
      "japanese": "私はピアノを弾けます。"
    }
  },
  {
    "id": 2002,
    "word": "could",
    "meaning": "〜できた",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 100,
    "example": {
      "english": "My father <strong>could</strong> speak English well.",
      "japanese": "父は英語を上手に話すことができました。"
    }
  },
  {
    "id": 2003,
    "word": "may",
    "meaning": "（推量）〜かもしれない、（許可）〜してもよい",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 71,
    "example": {
      "english": "I <strong>may</strong> be late for the party.",
      "japanese": "私はパーティーに遅れるかもしれません。"
    }
  },
  {
    "id": 2005,
    "word": "must",
    "meaning": "（義務）〜しなければならない",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 22,
    "example": {
      "english": "You <strong>must</strong> do your homework.",
      "japanese": "あなたは宿題をしなければなりません。"
    }
  },
  {
    "id": 2006,
    "word": "should",
    "meaning": "（義務）〜すべきである",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 63,
    "example": {
      "english": "We <strong>should</strong> take a break.",
      "japanese": "私たちは休憩を取るべきです。"
    }
  },
  {
    "id": 2007,
    "word": "will",
    "meaning": "（未来）〜するつもり、〜でしょう",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 323,
    "example": {
      "english": "I <strong>will</strong> go to the park next week.",
      "japanese": "私は来週公園に行くつもりです。"
    }
  },
  {"id": 2008,
    "word": "would",
    "meaning": "〜だろう、〜するつもりだ、(would like toで)〜したい",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 100,
    "example": {
      "english": "I <strong>would</strong> like to go abroad.",
      "japanese": "私は海外に行きたいです。"
    }
  },
  {
    "id": 2011,
    "word": "be able to",
    "meaning": "（可能）〜することができる",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 8,
    "example": {
      "english": "I <strong>am able to</strong> play the piano.",
      "japanese": "私はピアノを弾けます。"
    }
  },
  {
    "id": 2012,
    "word": "be going to",
    "meaning": "（未来）〜するつもり",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 14,
    "example": {
      "english": "I <strong>am going to</strong> go to the park next week.",
      "japanese": "私は来週公園に行くつもりです。"
    }
  },
  {
    "id": 2013,
    "word": "have to",
    "meaning": "（義務）〜しなければならない",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 22,
    "example": {
      "english": "I <strong>have to</strong> do my homework.",
      "japanese": "私は宿題をしなければなりません。"
    }
  },
  {
    "id": 2014,
    "word": "Will you～?(Can you～?)",
    "meaning": "（依頼）〜してくれませんか",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 31,
    "example": {
      "english": "<strong>Can you</strong> open the door?",
      "japanese": "ドアを開けてくれませんか。"
    }
  },
  {
    "id": 2015,
    "word": "Would you～?(Could you〜?)",
    "meaning": "（依頼）〜していただけませんか",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 2,
    "example": {
      "english": "<strong>Would you</strong> close the window?",
      "japanese": "窓を閉めていただけませんか。"
    }
  },
  {
    "id": 2016,
    "word": "Would you like 〜 ?",
    "meaning": "（勧誘）〜はいかがですか",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 1,
    "example": {
      "english": "<strong>Would you like</strong> some cake?",
      "japanese": "ケーキはいかがですか。"
    }
  },
  {
    "id": 2017,
    "word": "Can I～?(May I〜?)",
    "meaning": "（許可）〜してもいいですか",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 10,
    "example": {
      "english": "<strong>May I</strong> use the phone?",
      "japanese": "電話を使ってもいいですか。"
    }
  },
  {
    "id": 2018,
    "word": "Shall I 〜 ?",
    "meaning": "（提案）［私が］〜しましょうか",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 2,
    "example": {
      "english": "<strong>Shall I</strong> open the window?",
      "japanese": "窓を開けましょうか。"
    }
  },
  {
    "id": 2019,
    "word": "Shall we 〜 ?",
    "meaning": "（勧誘）［いっしょに］〜しませんか",
    "partOfSpeech": "助動詞",
    "category": "助動詞・助動詞的表現",
    "appearanceCount": 10,
    "example": {
      "english": "<strong>Shall we</strong> play tennis?",
      "japanese": "（いっしょに）テニスをしませんか。"
    }
  },
  // 冠詞（機能語：a / an / the / Mr. / Ms.）
  {
    "id": 2101,
    "word": "a",
    "meaning": "１つの〜、１人の〜",
    "partOfSpeech": "冠詞",
    "category": "冠詞",
    "appearanceCount": 1105,
    "example": {
      "english": "<strong>a</strong> bike",
      "japanese": "（１台の）自転車"
    }
  },
  {
    "id": 2102,
    "word": "an",
    "meaning": "１つの〜、１人の〜（母音の音の前で使う）",
    "partOfSpeech": "冠詞",
    "category": "冠詞",
    "appearanceCount": 119,
    "example": {
      "english": "<strong>an</strong> umbrella",
      "japanese": "（1本の）かさ"
    }
  },
  {
    "id": 2103,
    "word": "the",
    "meaning": "その〜",
    "partOfSpeech": "冠詞",
    "category": "冠詞",
    "appearanceCount": 2988,
    "example": {
      "english": "Please open <strong>the</strong> window.",
      "japanese": "その窓を開けてください。"
    }
  },
  {
    "id": 2104,
    "word": "Mr.",
    "meaning": "〜さん、〜先生（男性に対する敬称）",
    "partOfSpeech": "名詞",
    "category": "冠詞",
    "appearanceCount": 80,
    "example": {
      "english": "<strong>Mr.</strong> Sato",
      "japanese": "佐藤先生（男性）"
    }
  },
  {
    "id": 2105,
    "word": "Ms.",
    "meaning": "〜さん、〜先生（女性に対する敬称）",
    "partOfSpeech": "名詞",
    "category": "冠詞",
    "appearanceCount": 19,
    "example": {
      "english": "<strong>Ms.</strong> Brown",
      "japanese": "ブラウンさん（女性）"
    }
  },
  // 限定詞（数量）
  {
    "id": 2106,
    "word": "all",
    "meaning": "すべての",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 40,
    "example": {
      "english": "<strong>All</strong> boys in this class play soccer.",
      "japanese": "このクラスの男の子はすべてサッカーをします。"
    }
  },
  {
    "id": 2107,
    "word": "each",
    "meaning": "それぞれの、各々の",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 101,
    "example": {
      "english": "<strong>Each</strong> student has a book.",
      "japanese": "それぞれの学生が本を持っています。"
    }
  },
  {
    "id": 2108,
    "word": "every",
    "meaning": "すべての、毎〜",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 34,
    "example": {
      "english": "<strong>Every</strong> girl in this class is good at English.",
      "japanese": "このクラスの女の子はみんな英語が得意です。"
    }
  },
  {
    "id": 2110,
    "word": "some",
    "meaning": "いくつかの、いくらかの",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 287,
    "example": {
      "english": "I have <strong>some</strong> books.",
      "japanese": "私は本を何冊か（いくつか）持っています。"
    }
  },
  {
    "id": 2111,
    "word": "any",
    "meaning": "（疑問文・否定文で）いくつかの、どれでも",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 30,
    "example": {
      "english": "Do you have <strong>any</strong> questions?",
      "japanese": "何か質問はありますか。"
    }
  },
  {
    "id": 2112,
    "word": "no",
    "meaning": "〜が（まったく）ない",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 73,
    "example": {
      "english": "He has <strong>no</strong> money.",
      "japanese": "彼はお金がありません。"
    }
  },
  {
    "id": 2115,
    "word": "many",
    "meaning": "たくさんの（数えられる名詞に）",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 258,
    "example": {
      "english": "I have <strong>many</strong> books.",
      "japanese": "私はたくさんの本を持っています。"
    }
  },
  {
    "id": 2116,
    "word": "much",
    "meaning": "たくさんの（数えられない名詞に）",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 46,
    "example": {
      "english": "I want to drink <strong>much</strong> water.",
      "japanese": "私はたくさんの水を飲みたいです。"
    }
  },
  {
    "id": 2117,
    "word": "a few",
    "meaning": "少しの、いくつかの（数えられる名詞に、肯定的）",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 22,
    "example": {
      "english": "I have <strong>a few</strong> friends.",
      "japanese": "私は少しの友達がいます。"
    }
  },
  {
    "id": 2118,
    "word": "a little",
    "meaning": "少しの（数えられない名詞に、肯定的）",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 5,
    "example": {
      "english": "There is <strong>a little</strong> water in the glass.",
      "japanese": "コップに水が少し入っています。"
    }
  },
  {
    "id": 2119,
    "word": "few",
    "meaning": "ほとんどない、（数えられる名詞に、否定的）",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 23,
    "example": {
      "english": "I have <strong>few</strong> friends.",
      "japanese": "私はほとんど友達がいません。"
    }
  },
  {
    "id": 2120,
    "word": "little",
    "meaning": "ほとんどない、わずかな（数えられない名詞に、否定的）、小さい",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 15,
    "example": {
      "english": "I have <strong>little</strong> money.",
      "japanese": "私はほとんどお金がありません。"
    }
  },
  {
    "id": 2121,
    "word": "several",
    "meaning": "いくつかの、数個の",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 15,
    "example": {
      "english": "Ken bought <strong>several</strong> pens.",
      "japanese": "ケンはいくつかのペンを買いました。"
    }
  },
  {
    "id": 2122,
    "word": "a lot of",
    "meaning": "たくさんの、多くの",
    "partOfSpeech": "限定詞・形容詞",
    "category": "限定詞（数量）",
    "appearanceCount": 50,
    "example": {
      "english": "I have <strong>a lot of</strong> friends.",
      "japanese": "私はたくさんの友達がいます。"
    }
  },
  // 接続詞
  {
    "id": 3001,
    "word": "and",
    "meaning": "〜と…、そして",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 823,
    "example": {
      "english": "apples <strong>and</strong> oranges",
      "japanese": "りんごとオレンジ"
    }
  },
  {
    "id": 3002,
    "word": "but",
    "meaning": "しかし、だが",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 171,
    "example": {
      "english": "I was sick yesterday, <strong>but</strong> I went to school today.",
      "japanese": "昨日病気だったが、今日は学校に行った。"
    }
  },
  {
    "id": 3003,
    "word": "or",
    "meaning": "〜かもしくは…",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 99,
    "example": {
      "english": "English <strong>or</strong> Japanese",
      "japanese": "英語か日本語"
    }
  },
  {
    "id": 3004,
    "word": "so",
    "meaning": "だから",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 213,
    "example": {
      "english": "I'm tired, <strong>so</strong> I'm going to bed.",
      "japanese": "疲れているから、寝る"
    }
  },
  {
    "id": 3005,
    "word": "because",
    "meaning": "（理由や原因を説明して）〜なので、〜だから",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 95,
    "example": {
      "english": "I like summer <strong>because</strong> I can go to the beach.",
      "japanese": "私は海に行けるから、夏が好きです."
    }
  },
  {
    "id": 3006,
    "word": "if",
    "meaning": "もし〜なら",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 113,
    "example": {
      "english": "<strong>If</strong> it is sunny tomorrow, we will play tennis.",
      "japanese": "明日晴れたらテニスをするつもりです。"
    }
  },
  {
    "id": 3007,
    "word": "when",
    "meaning": "〜のとき",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 250,
    "example": {
      "english": "Tom was watching TV <strong>when</strong> his mother came home.",
      "japanese": "母が帰ってきたとき、トムはテレビを見ていました。"
    }
  },
  {
    "id": 3008,
    "word": "while",
    "meaning": "〜している間に",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 8,
    "example": {
      "english": "<strong>While</strong> I was eating breakfast, I was reading a newspaper.",
      "japanese": "朝食を食べながら、新聞を読んでいました。"
    }
  },
  {
    "id": 3009,
    "word": "though",
    "meaning": "〜けれども",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 27,
    "example": {
      "english": "I studied hard <strong>though</strong> I was tired.",
      "japanese": "疲れていたけれども、私は勉強を頑張りました。"
    }
  },
  {
    "id": 3010,
    "word": "although",
    "meaning": "〜けれども",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 27,
    "example": {
      "english": "I studied hard <strong>although</strong> I was tired.",
      "japanese": "疲れていたけれども、私は勉強を頑張りました。"
    }
  },
  {
    "id": 3011,
    "word": "since",
    "meaning": "〜から、～以来、〜なので",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 9,
    "example": {
      "english": "I have known him <strong>since</strong> I was a child.",
      "japanese": "私は子供の頃から、彼を知っています。"
    }
  },
  {
    "id": 3012,
    "word": "until",
    "meaning": "〜するまでずっと",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 12,
    "example": {
      "english": "I must wait here <strong>until</strong> he comes back.",
      "japanese": "彼が帰ってきたら、ここで待たなければなりません。"
    }
  },
  {
    "id": 3013,
    "word": "before",
    "meaning": "〜の前に",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 59,
    "example": {
      "english": "I will go home <strong>before</strong> it is dark.",
      "japanese": "暗くなる前に、家に帰るつもりです。"
    }
  },
  {
    "id": 3014,
    "word": "after",
    "meaning": "〜の後に",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 104,
    "example": {
      "english": "We met at the station <strong>after</strong> the party.",
      "japanese": "私たちはパーティーのあと、駅で会いました。"
    }
  },
  {
    "id": 3015,
    "word": "that",
    "meaning": "（ひとまとまりの内容を表して）～ということ・もの",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 628,
    "example": {
      "english": "I know <strong>that</strong> he is a doctor.",
      "japanese": "私は彼が医者であることを知っています。"
    }
  },
  {
    "id": 3016,
    "word": "as soon as",
    "meaning": "〜するとすぐに",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 2,
    "example": {
      "english": "I will play games <strong>as soon as</strong> I finish my homework.",
      "japanese": "宿題を終えたらすぐに、ゲームをするつもりです。"
    }
  },
  {
    "id": 3017,
    "word": "even if",
    "meaning": "たとえ〜でも",
    "partOfSpeech": "接続詞",
    "category": "接続詞",
    "appearanceCount": 6,
    "example": {
      "english": "I will go there <strong>even if</strong> it is raining.",
      "japanese": "たとえ雨が降っていても、そこに行くつもりです。"
    }
  },
  // 関係代名詞
  {
    "id": 3101,
    "word": "who",
    "meaning": "〈人〉について、後ろから説明する働きを持つ",
    "partOfSpeech": "関係代名詞",
    "category": "関係代名詞",
    "appearanceCount": 126,
    "example": {
      "english": "The boy <strong>who</strong> is singing is my brother.",
      "japanese": "歌っている少年は私の弟です。"
    }
  },
  {
    "id": 3102,
    "word": "which",
    "meaning": "〈物〉について、後ろから説明する働きを持つ",
    "partOfSpeech": "関係代名詞",
    "category": "関係代名詞",
    "appearanceCount": 186,
    "example": {
      "english": "This is the book <strong>which</strong> I bought yesterday.",
      "japanese": "これが私が昨日買った本です。"
    }
  },
  {
    "id": 3103,
    "word": "that",
    "meaning": "〈人/物〉について、後ろから説明する働きを持つ",
    "partOfSpeech": "関係代名詞",
    "category": "関係代名詞",
    "appearanceCount": 628,
    "example": {
      "english": "He is the teacher <strong>that</strong> I respect.",
      "japanese": "彼は私が尊敬している先生です。"
    }
  },
  // 前置詞
  {
    "id": 4001,
    "word": "in",
    "meaning": "①（場所・位置）〜の中に［で］ ②（時）〜に ③（手段）〜で ④（所要時間）〜後に",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 1337,
    "example": {
      "english": "<strong>in</strong> the library",
      "japanese": "図書館(の中)に"
    }
  },
  {
    "id": 4002,
    "word": "on",
    "meaning": "①（時・日）〜に ②（場所）〜の上に、〜に（接触） ③（状態）〜中で ④〜について",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 283,
    "example": {
      "english": "<strong>on</strong> the table",
      "japanese": "テーブル(の上)に"
    }
  },
  {
    "id": 4003,
    "word": "at",
    "meaning": "①（場所・位置）〜に（で）②（時刻）〜に",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 264,
    "example": {
      "english": "<strong>at</strong> the station",
      "japanese": "駅(に)で"
    }
  },
  {
    "id": 4004,
    "word": "by",
    "meaning": "①（場所）〜のそばに ②〜によって ③（締切）〜までに",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 214,
    "example": {
      "english": "<strong>by</strong> the park",
      "japanese": "公園のそばに"
    }
  },
  {
    "id": 4005,
    "word": "for",
    "meaning": "①〜のために ②〜に向かって ③〜にとって ④〜の間",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 507,
    "example": {
      "english": "<strong>for</strong> us",
      "japanese": "私たちのために"
    }
  },
  {
    "id": 4006,
    "word": "with",
    "meaning": "①〜と一緒に ②（道具）〜で、〜を使って ③〜のある、〜を身に付けて・所持して",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 322,
    "example": {
      "english": "<strong>with</strong> him",
      "japanese": "彼と一緒に"
    }
  },
  {
    "id": 4007,
    "word": "from",
    "meaning": "〜から、〜出身の",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 271,
    "example": {
      "english": "<strong>from</strong> Canada",
      "japanese": "カナダ出身の"
    }
  },
  {
    "id": 4008,
    "word": "to",
    "meaning": "（方向・到達点）〜へ・〜まで",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 1449,
    "example": {
      "english": "<strong>to</strong> Tokyo",
      "japanese": "東京へ"
    }
  },
  {
    "id": 4009,
    "word": "of",
    "meaning": "①（帰属）〜の ②（同格）〜という… ③（部分）〜の中の…",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 989,
    "example": {
      "english": "history <strong>of</strong> Japan ",
      "japanese": "日本の歴史"
    }
  },
  {
    "id": 4010,
    "word": "about",
    "meaning": "〜について、〜に関して（関する）、およそ、約〜",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 575,
    "example": {
      "english": "<strong>about</strong> music / about 40 years ago",
      "japanese": "音楽について / 約40年前"
    }
  },
  {
    "id": 4011,
    "word": "into",
    "meaning": "〜の中へ",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 22,
    "example": {
      "english": "<strong>into</strong> the room",
      "japanese": "部屋の中へ"
    }
  },
  {
    "id": 4013,
    "word": "over",
    "meaning": "①〜の上の方 ②〜じゅう、〜のいたるところに ③〜以上に、〜より多く",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 20,
    "example": {
      "english": "<strong>over</strong> the bridge",
      "japanese": "橋の上"
    }
  },
  {
    "id": 4014,
    "word": "under",
    "meaning": "〜の下に",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 20,
    "example": {
      "english": "<strong>under</strong> the table",
      "japanese": "テーブルの下"
    }
  },
  {
    "id": 4015,
    "word": "between",
    "meaning": "（2つ、2人）〜の間に",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 33,
    "example": {
      "english": "<strong>between</strong> the two buildings",
      "japanese": "2つの建物の間"
    }
  },
  {
    "id": 4016,
    "word": "among",
    "meaning": "（3つ、3人以上）〜の間に",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 20,
    "example": {
      "english": "<strong>among</strong> the trees",
      "japanese": "木々の間"
    }
  },
  {
    "id": 4017,
    "word": "through",
    "meaning": "①〜を通って ②（手段）〜を通じて",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 33,
    "example": {
      "english": "<strong>through</strong> the forest",
      "japanese": "森を通って"
    }
  },
  {
    "id": 4018,
    "word": "during",
    "meaning": "（特定の期間）の間じゅう",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 21,
    "example": {
      "english": "<strong>during</strong> the summer",
      "japanese": "夏の間"
    }
  },
  {
    "id": 4019,
    "word": "before",
    "meaning": "〜の前に",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 59,
    "example": {
      "english": "<strong>before</strong> the meeting",
      "japanese": "会議の前"
    }
  },
  {
    "id": 4020,
    "word": "after",
    "meaning": "〜のあとに（で）、〜してから",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 104,
    "example": {
      "english": "<strong>after</strong> the party",
      "japanese": "パーティーのあと"
    }
  },
  {
    "id": 4021,
    "word": "since",
    "meaning": "～から、〜以来",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 9,
    "example": {
      "english": "<strong>since</strong> yesterday",
      "japanese": "昨日から"
    }
  },
  {
    "id": 4022,
    "word": "until",
    "meaning": "〜までずっと",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 12,
    "example": {
      "english": "<strong>until</strong> tomorrow",
      "japanese": "明日まで"
    }
  },
  {
    "id": 4023,
    "word": "against",
    "meaning": "〜に反対して、〜に対して",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 1,
    "example": {
      "english": "<strong>against</strong> the law",
      "japanese": "法律に反対して"
    }
  },
  {
    "id": 4024,
    "word": "without",
    "meaning": "〜なしで",
    "partOfSpeech": "前置詞",
    "category": "前置詞",
    "appearanceCount": 57,
    "example": {
      "english": "<strong>without</strong> a word",
      "japanese": "一言も言わずに"
    }
  },
  // 副詞（否定・程度・焦点）
  {
    "id": 8021,
    "word": "not",
    "meaning": "（否定）〜でない",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 127,
    "example": {
      "english": "I do <strong>not</strong> like math.",
      "japanese": "私は数学が好きではありません。"
    }
  },
  {
    "id": 8005,
    "word": "never",
    "meaning": "決して〜ない、これまで一度も〜ない",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 18,
    "example": {
      "english": "I <strong>never</strong> study at home on Sunday.",
      "japanese": "私は日曜日に決して家で勉強しません。"
    }
  },
  {
    "id": 8006,
    "word": "very",
    "meaning": "とても",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 180,
    "example": {
      "english": "This dog is <strong>very</strong> big.",
      "japanese": "この犬はとても大きいです。"
    }
  },
  {
    "id": 8007,
    "word": "so",
    "meaning": "そんなに、とても、そのように",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 213,
    "example": {
      "english": "This movie isn't <strong>so</strong> interesting.",
      "japanese": "この映画はそんなに面白くありません。"
    }
  },
  {
    "id": 8008,
    "word": "too",
    "meaning": "〜すぎる、〜も［文末］",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 60,
    "example": {
      "english": "This box is <strong>too</strong> heavy.",
      "japanese": "この箱は重すぎます。"
    }
  },
  {
    "id": 8009,
    "word": "almost",
    "meaning": "ほとんど",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 11,
    "example": {
      "english": "<strong>Almost</strong> all the students like soccer.",
      "japanese": "ほとんどすべての学生がサッカーが好きです。"
    }
  },
  {
    "id": 8010,
    "word": "just",
    "meaning": "ちょうど、単に、ちょっと",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 21,
    "example": {
      "english": "I have <strong>just</strong> finished my homework.",
      "japanese": "私はちょうど宿題を終わらせたところです。"
    }
  },
  {
    "id": 8018,
    "word": "also",
    "meaning": "〜もまた",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 131,
    "example": {
      "english": "I <strong>also</strong> like music.",
      "japanese": "私も音楽が好きです。"
    }
  },
  {
    "id": 8019,
    "word": "only",
    "meaning": "〜だけ、唯一の",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 51,
    "example": {
      "english": "I have <strong>only</strong> one book.",
      "japanese": "私は本を１冊しか持っていません。"
    }
  },
  {
    "id": 8020,
    "word": "even",
    "meaning": "〜でさえ（すら）",
    "partOfSpeech": "副詞",
    "category": "副詞（否定・程度・焦点）",
    "appearanceCount": 27,
    "example": {
      "english": "He even forgot my name.",
      "japanese": "彼は私の名前さえ忘れてしまいました。"
    }
  },
  // 疑問詞（機能語）
  {
    "id": 5001,
    "word": "what",
    "meaning": "何、何の、どんな",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 211,
    "example": {
      "english": "<strong>What</strong> animal is that?",
      "japanese": "あれは何の動物ですか。"
    }
  },
  {
    "id": 5002,
    "word": "who",
    "meaning": "だれ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 126,
    "example": {
      "english": "<strong>Who</strong> is that man?",
      "japanese": "あの男性は誰ですか。"
    }
  },  
  {
    "id": 5003,
    "word": "which",
    "meaning": "どちら、どれ、どの",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 186,
    "example": {
      "english": "<strong>Which</strong> season do you like?",
      "japanese": "あなたはどの季節が好きですか。"
    }
  },
  {
    "id": 5004,
    "word": "when",
    "meaning": "いつ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 186,
    "example": {
      "english": "<strong>When</strong> did you arrive here?",
      "japanese": "あなたはいつここに到着しましたか。"
    }
  },
  {
    "id": 5005,
    "word": "where",
    "meaning": "どこに（で）、どこへ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 126,
    "example": {
      "english": "<strong>Where</strong> is the station?",
      "japanese": "駅はどこにありますか。"
    }
  },
  {
    "id": 5006,
    "word": "why",
    "meaning": "なぜ",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 47,
    "example": {
      "english": "<strong>Why</strong> do you like music?",
      "japanese": "あなたはなぜ音楽が好きなのですか。"
    }
  },
  {
    "id": 5007,
    "word": "how",
    "meaning": "どのように（どうやって）、どれくらい",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 171,
    "example": {
      "english": "<strong>How</strong> does he go to school every day?",
      "japanese": "彼は毎日どうやって学校に行きますか。"
    }
  },
  {
    "id": 5008,
    "word": "whose",
    "meaning": "だれの",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 5,
    "example": {
      "english": "<strong>Whose</strong> book is this?",
      "japanese": "この本は誰の本ですか。"
    }
  },
  {
    "id": 5009,
    "word": "how much",
    "meaning": "いくら（値段・料金をたずねる）",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 6,
    "example": {
      "english": "<strong>How much</strong> is this notebook?",
      "japanese": "このノートはいくらですか。"
    }
  },
　{
  "id": 5010,
  "word": "how many",
  "meaning": "いくつ（数をたずねる）",
  "partOfSpeech": "疑問詞",
  "category": "疑問詞",
  "appearanceCount": 6,
  "example": {
    "english": "<strong>How many</strong> books are there in the library?",
    "japanese": "その図書館には本が何冊ありますか。"
  }
  },
  {
  "id": 5011,
  "word": "how long",
  "meaning": "どれくらいの間（期間をたずねる）",
  "partOfSpeech": "疑問詞",
  "category": "疑問詞",
  "appearanceCount": 3,
  "example": {
    "english": "<strong>How long</strong> will you stay at the hotel?",
    "japanese": "あなたはホテルにどのくらい滞在するつもりですか。"
  }
  },
  {
    "id": 5012,
    "word": "how old",
    "meaning": "何歳（年齢をたずねる）",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 3,
    "example": {
      "english": "<strong>How old</strong> is your father?",
      "japanese": "あなたの父親は何歳ですか。"
   }
  },
  {
    "id": 5013,
    "word": "how far",
    "meaning": "どのくらいの距離（距離をたずねる）",
    "partOfSpeech": "疑問詞",
    "category": "疑問詞",
    "appearanceCount": 1,
    "example": {
      "english": "<strong>How far</strong> is it from here to the station?",
      "japanese": "ここから駅までどのくらいの距離がありますか。"
    }
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
  },
  // 間投詞
  {
    "id": 8001,
    "word": "hi",
    "meaning": "やあ、こんにちは",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 176,
    "example": {
      "english": "<strong>Hi</strong>! How are you?",
      "japanese": "やあ! お元気ですか。"
    }
  },
  {
    "id": 8002,
    "word": "hello",
    "meaning": "やあ、こんにちは",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 50,
    "example": {
      "english": "<strong>Hello</strong>, nice to meet you.",
      "japanese": "こんにちは、はじめまして。"
    }
  },
  {
    "id": 8003,
    "word": "hey",
    "meaning": "やあ、おい、ちょっと",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 0,
    "example": {
      "english": "<strong>Hey</strong>, wait for me!",
      "japanese": "おい、待って！"
    }
  },
  {
    "id": 8004,
    "word": "bye",
    "meaning": "さようなら",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 70,
    "example": {
      "english": "<strong>Bye</strong>, see you later.",
      "japanese": "さようなら、またお会いしましょう。"
    }
  },
  {
    "id": 8003,
    "word": "goodbye",
    "meaning": "さようなら",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 2,
    "example": {
      "english": "<strong>Goodbye</strong>, see you later.",
      "japanese": "さようなら、またお会いしましょう。"
    }
  },
  {
    "id": 8004,
    "word": "oh",
    "meaning": "ああ！、おお！",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 161,
    "example": {
      "english": "<strong>Oh</strong>, I see!",
      "japanese": "ああ、わかりました！"
    }
  },
  {
    "id": 8005,
    "word": "wow",
    "meaning": "わあ、おお（驚きや喜び）",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 15,
    "example": {
      "english": "<strong>Wow</strong>, that's nice!",
      "japanese": "わあ、それはいいですね！"
    }
  },
  {
    "id": 8007,
    "word": "yes",
    "meaning": "はい",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 191,
    "example": {
      "english": "<strong>Yes</strong>, I am.",
      "japanese": "はい、そうです。"
    }
  },
  {
    "id": 8008,
    "word": "no",
    "meaning": "いいえ、いや、だめだ",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 73,
    "example": {
      "english": "<strong>No</strong>, I don't.",
      "japanese": "いいえ、違います。"
    }
  },
  {
    "id": 8009,
    "word": "OK",
    "meaning": "わかりました、それでは、大丈夫な",
    "partOfSpeech": "間投詞・形容詞",
    "category": "間投詞",
    "appearanceCount": 70,
    "example": {
      "english": "<strong>Thank you</strong> for your help.",
    }
  },
  {
    "id": 8009,
    "word": "well",
    "meaning": "ええっと…（考え中）",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 151,
    "example": {
      "english": "<strong>Well</strong>, I'm not sure.",
      "japanese": "ええっと…、わかりません。"
    }
  },
  {
    "id": 8009,
    "word": "please",
    "meaning": "どうぞ、どうか（お願いします）",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 84,
    "example": {
      "english": "<strong>Please</strong> help me.",
      "japanese": "どうか、助けてください。"
    }
  },
  {
    "id": 8009,
    "word": "welcome",
    "meaning": "ようこそ、いらっしゃい（歓迎）",
    "partOfSpeech": "間投詞",
    "category": "間投詞",
    "appearanceCount": 11,
    "example": {
      "english": "<strong>Welcome</strong> to our party.",
      "japanese": "パーティーへようこそ。"
    }
  },
  // 不定代名詞
  {
    "id": 9001,
    "word": "something",
    "meaning": "何か（もの・こと）",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 36,
    "example": {
      "english": "I want <strong>something</strong> to drink.",
      "japanese": "私は何か飲みものがほしいです。"
    }
  },
  {
    "id": 9002,
    "word": "anything",
    "meaning": "（否定文で）何も～ない、（疑問文で）何か",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 21,
    "example": {
      "english": "Do you have <strong>anything</strong> to eat?",
      "japanese": "何か食べ物はありますか。"
    }
  },
  {
    "id": 9003,
    "word": "nothing",
    "meaning": "何も〜ない",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 8,
    "example": {
      "english": "There is <strong>nothing</strong> in the box.",
      "japanese": "箱の中には何もありません。"
    }
  },
  {
    "id": 9004,
    "word": "everything",
    "meaning": "すべてのもの、すべてのこと",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 12,
    "example": {
      "english": "<strong>Everything</strong> is ready.",
      "japanese": "すべての準備ができています。"
    }
  },
  {
    "id": 9004,
    "word": "everyone",
    "meaning": "みんな、すべての人",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 23,
    "example": {
      "english": "<strong>Everyone</strong> has a book.",
      "japanese": "みんな本を持っています。"
    }
  },
  {
    "id": 9005,
    "word": "someone",
    "meaning": "だれか（人）",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 8,
    "example": {
      "english": "<strong>Someone</strong> is calling you.",
      "japanese": "だれかがあなたを呼んでいます。"
    }
  },
  {
    "id": 9006,
    "word": "anyone",
    "meaning": "（肯定文で）誰でも、（否定文で）誰も、（疑問文で）誰か",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 1,
    "example": {
      "english": "Can <strong>anyone</strong> help me?",
      "japanese": "だれか手伝ってくれますか。"
    }
  },
  {
    "id": 9007,
    "word": "everybody",
    "meaning": "みんな、すべての人",
    "partOfSpeech": "代名詞",
    "category": "不定代名詞",
    "appearanceCount": 1,
    "example": {
      "english": "<strong>Everybody</strong> likes music.",
      "japanese": "みんな音楽が好きです。"
    }
  },
  // 代名詞（人称代名詞・指示代名詞）
  {
    "id": 9101,
    "word": "I",
    "meaning": "私は(主格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 1500,
    "example": {
      "english": "<strong>I</strong> like baseball very much.",
      "japanese": "私は野球が大好きです。"
    }
  },
  {
    "id": 9102,
    "word": "my",
    "meaning": "私の（所有格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 500,
    "example": {
      "english": "This is <strong>my</strong> book.",
      "japanese": "これは私の本です。"
    }
  },
  {
    "id": 9103,
    "word": "me",
    "meaning": "私を/に（目的格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 300,
    "example": {
      "english": "Please help <strong>me</strong>.",
      "japanese": "私を助けてください。"
    }
  },
  {
    "id": 9104,
    "word": "mine",
    "meaning": "私のもの（所有代名詞）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 50,
    "example": {
      "english": "This pen is <strong>mine</strong>.",
      "japanese": "このペンは私のものです。"
    }
  },
  {
    "id": 9105,
    "word": "you",
    "meaning": "あなた（たち）［は/を/に］（主格・目的格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 800,
    "example": {
      "english": "I love <strong>you</strong>.",
      "japanese": "私はあなたを愛しています。"
    }
  },
  {
    "id": 9106,
    "word": "your",
    "meaning": "あなた（たち）の（所有格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 400,
    "example": {
      "english": "Is this <strong>your</strong> bag?",
      "japanese": "これはあなたのかばんですか。"
    }
  },
  {
    "id": 9107,
    "word": "yours",
    "meaning": "あなた（たち）のもの（所有代名詞）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 30,
    "example": {
      "english": "This book is <strong>yours</strong>.",
      "japanese": "この本はあなたのものです。"
    }
  },
  {
    "id": 9108,
    "word": "he",
    "meaning": "彼は（主格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 600,
    "example": {
      "english": "<strong>He</strong> is an English teacher.",
      "japanese": "彼は英語の先生です。"
    }
  },
  {
    "id": 9109,
    "word": "his",
    "meaning": "彼の（所有格）、彼のもの（所有代名詞）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 350,
    "example": {
      "english": "That is <strong>his</strong> car.",
      "japanese": "あれは彼の車です。"
    }
  },
  {
    "id": 9110,
    "word": "him",
    "meaning": "彼を/に（目的格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 200,
    "example": {
      "english": "I gave <strong>him</strong> a present.",
      "japanese": "私は彼にプレゼントをあげました。"
    }
  },
  {
    "id": 9111,
    "word": "she",
    "meaning": "彼女は（主格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 400,
    "example": {
      "english": "<strong>She</strong> is my sister.",
      "japanese": "彼女は私の姉です。"
    }
  },
  {
    "id": 9112,
    "word": "her",
    "meaning": "彼女の（所有格）、彼女を/に（目的格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 300,
    "example": {
      "english": "I like <strong>her</strong> smile.",
      "japanese": "私は彼女の笑顔が好きです。"
    }
  },
  {
    "id": 9113,
    "word": "hers",
    "meaning": "彼女のもの（所有代名詞）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 20,
    "example": {
      "english": "This bag is <strong>hers</strong>.",
      "japanese": "このかばんは彼女のものです。"
    }
  },
  {
    "id": 9114,
    "word": "they",
    "meaning": "彼ら（彼女ら・それら）は（主格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 500,
    "example": {
      "english": "<strong>They</strong> are students.",
      "japanese": "彼らは学生です。"
    }
  },
  {
    "id": 9115,
    "word": "their",
    "meaning": "彼ら（彼女ら・それら）の（所有格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 250,
    "example": {
      "english": "<strong>Their</strong> house is big.",
      "japanese": "彼らの家は大きいです。"
    }
  },
  {
    "id": 9116,
    "word": "them",
    "meaning": "彼ら（彼女ら・それら）を/に（目的格",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 200,
    "example": {
      "english": "I met <strong>them</strong> yesterday.",
      "japanese": "私は昨日彼らに会いました。"
    }
  },
  {
    "id": 9117,
    "word": "theirs",
    "meaning": "彼ら（彼女ら）のもの（所有代名詞）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 15,
    "example": {
      "english": "This dog is <strong>theirs</strong>.",
      "japanese": "この犬は彼らのものです。"
    }
  },
  {
    "id": 9118,
    "word": "we",
    "meaning": "私たちは（主格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 400,
    "example": {
      "english": "<strong>We</strong> are friends.",
      "japanese": "私たちは友達です。"
    }
  },
  {
    "id": 9119,
    "word": "our",
    "meaning": "私たちの（所有格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 200,
    "example": {
      "english": "This is <strong>our</strong> school.",
      "japanese": "これは私たちの学校です。"
    }
  },
  {
    "id": 9120,
    "word": "us",
    "meaning": "私たちを/に（目的格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 150,
    "example": {
      "english": "Please tell <strong>us</strong> the story.",
      "japanese": "私たちにその話を聞かせてください。"
    }
  },
  {
    "id": 9121,
    "word": "ours",
    "meaning": "私たちのもの（所有代名詞）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 20,
    "example": {
      "english": "This land is <strong>ours</strong>.",
      "japanese": "この土地は私たちのものです。"
    }
  },
  {
    "id": 9122,
    "word": "it",
    "meaning": "それは（主格）、それを/に（目的格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 1000,
    "example": {
      "english": "<strong>It</strong> is a cat.",
      "japanese": "それは猫です。"
    }
  },
  {
    "id": 9123,
    "word": "its",
    "meaning": "それの、その（所有格）",
    "partOfSpeech": "代名詞",
    "category": "代名詞",
    "appearanceCount": 100,
    "example": {
      "english": "The dog wagged <strong>its</strong> tail.",
      "japanese": "その犬はしっぽを振りました。"
    }
  },
  {
    "id": 9124,
    "word": "this",
    "meaning": "これ、この",
    "partOfSpeech": "代名詞・限定詞",
    "category": "代名詞",
    "appearanceCount": 600,
    "example": {
      "english": "<strong>This</strong> is my pen.",
      "japanese": "これは私のペンです。"
    }
  },
  {
    "id": 9125,
    "word": "these",
    "meaning": "これら、これらの",
    "partOfSpeech": "代名詞・限定詞",
    "category": "代名詞",
    "appearanceCount": 100,
    "example": {
      "english": "<strong>These</strong> are my books.",
      "japanese": "これらは私の本です。"
    }
  },
  {
    "id": 9126,
    "word": "that",
    "meaning": "あれ、あの、それ",
    "partOfSpeech": "代名詞・限定詞",
    "category": "代名詞",
    "appearanceCount": 800,
    "example": {
      "english": "<strong>That</strong> is a bird.",
      "japanese": "あれは鳥です。"
    }
  },
  {
    "id": 9127,
    "word": "those",
    "meaning": "あれら、あれらの",
    "partOfSpeech": "代名詞・限定詞",
    "category": "代名詞",
    "appearanceCount": 80,
    "example": {
      "english": "<strong>Those</strong> are my friends.",
      "japanese": "あれらは私の友達です。"
    }
  }
];

