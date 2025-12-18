// 英文法中学３年間の総復習 問題データ
// explanation: HTML形式で解説を記述（<p>タグなど使用可）
// point: HTML形式でPOINTを記述（<ul><li>など使用可）
// exercises: 演習問題の配列（厳選例文暗記60と同じ形式）
//   - id: 問題ID
//   - japanese: 日本語訳
//   - english: 英文（空所部分は空白で区切る）
//   - blanks: 空所の配列 [{index: 0, word: 'longer'}, ...]
//   - hint: ヒント文
// sections: セクションの配列（四角１、四角２など）
//   - title: セクションタイトル（例：「肯定文」「否定文」）
//   - point: HTML形式でPOINTを記述
//   - exercises: 演習問題の配列
const grammarData = [
    {
        chapter: 1,
        title: "第1章 be動詞と一般動詞",
        explanation: "<p>be動詞と一般動詞は、英語の文を作る上で<span class=\"grammar-important\">最も基本的な要素</span>です。</p>",
        // sections配列がある場合は、セクション構造で表示されます
        // sectionsがない場合は、従来のpointとexercisesが表示されます
        sections: [
            {
                title: "肯定文",
                point: "<ul><li>be動詞は<span class=\"grammar-important\">主語によって形が変わる</span>（I am, You are, He/She/It is）。</li><li>一般動詞は主語が<span class=\"grammar-important\">三人称単数現在</span>の場合、動詞の語尾に-sまたは-esがつく。</li></ul>",
                exercises: [
            {
                id: 1,
                japanese: "私は学生です。",
                english: "I am a student.",
                blanks: [
                    { index: 0, word: 'am' }
                ],
                hint: "主語が「I」のときは、be動詞は「am」を使います。"
            },
            {
                id: 2,
                japanese: "彼は医者です。",
                english: "He is a doctor.",
                blanks: [
                    { index: 0, word: 'is' }
                ],
                hint: "主語が「He」「She」「It」や単数形の名詞のときは、be動詞は「is」を使います。"
            },
            {
                id: 3,
                japanese: "私たちは友達です。",
                english: "We are friends.",
                blanks: [
                    { index: 0, word: 'are' }
                ],
                hint: "主語が「We」「You」「They」や複数形の名詞のときは、be動詞は「are」を使います。"
            },
            {
                id: 4,
                japanese: "私は毎日英語を勉強します。",
                english: "I study English every day.",
                blanks: [
                    { index: 0, word: 'study' }
                ],
                hint: "一般動詞の現在形は、主語が「I」「You」「We」「They」や複数形の名詞のときは、動詞の原形を使います。"
            },
            {
                id: 5,
                japanese: "彼は毎日英語を勉強します。",
                english: "He studies English every day.",
                blanks: [
                    { index: 0, word: 'studies' }
                ],
                hint: "一般動詞の現在形は、主語が「He」「She」「It」や単数形の名詞のときは、動詞に「s」または「es」をつけます。"
            },
            {
                id: 6,
                japanese: "あなたは本を読みますか。",
                english: "Do you read books?",
                blanks: [
                    { index: 0, word: 'Do' }
                ],
                hint: "一般動詞の疑問文は、文頭に「Do」または「Does」を置きます。主語が「you」のときは「Do」を使います。"
            },
            {
                id: 7,
                japanese: "彼女は本を読みますか。",
                english: "Does she read books?",
                blanks: [
                    { index: 0, word: 'Does' }
                ],
                hint: "主語が「He」「She」「It」や単数形の名詞のときは「Does」を使い、動詞は原形にします。"
            },
            {
                id: 8,
                japanese: "私は本を読みません。",
                english: "I do not read books.",
                blanks: [
                    { index: 0, word: 'do' },
                    { index: 1, word: 'not' }
                ],
                hint: "一般動詞の否定文は、「do not」または「does not」を動詞の前に置きます。主語が「I」のときは「do not」を使います。"
            },
            {
                id: 9,
                japanese: "彼は本を読みません。",
                english: "He does not read books.",
                blanks: [
                    { index: 0, word: 'does' },
                    { index: 1, word: 'not' }
                ],
                hint: "主語が「He」「She」「It」や単数形の名詞のときは「does not」を使い、動詞は原形にします。"
            },
            {
                id: 10,
                japanese: "あなたは学生ですか。",
                english: "Are you a student?",
                blanks: [
                    { index: 0, word: 'Are' }
                ],
                hint: "be動詞の疑問文は、be動詞を文頭に移動します。主語が「you」のときは「Are」を使います。"
            }
                ]
            },
            {
                title: "否定文",
                point: "<ul><li>be動詞の否定文は、be動詞の後に「not」を置く。</li><li>一般動詞の否定文は、「do not」または「does not」を動詞の前に置く。</li></ul>",
                exercises: [
                    {
                        id: 11,
                        japanese: "私は学生ではありません。",
                        english: "I am not a student.",
                        blanks: [
                            { index: 0, word: 'am' },
                            { index: 1, word: 'not' }
                        ],
                        hint: "be動詞の否定文は、be動詞の後に「not」を置きます。"
                    },
                    {
                        id: 12,
                        japanese: "彼は医者ではありません。",
                        english: "He is not a doctor.",
                        blanks: [
                            { index: 0, word: 'is' },
                            { index: 1, word: 'not' }
                        ],
                        hint: "主語が「He」のときは、be動詞は「is」を使います。"
                    }
                ]
            },
            {
                title: "疑問文",
                point: "<ul><li>be動詞の疑問文は、be動詞を文頭に移動する。</li><li>一般動詞の疑問文は、文頭に「Do」または「Does」を置く。</li></ul>",
                exercises: [
                    {
                        id: 13,
                        japanese: "私は学生ですか。",
                        english: "Are you a student?",
                        blanks: [
                            { index: 0, word: 'Are' }
                        ],
                        hint: "be動詞の疑問文は、be動詞を文頭に移動します。"
                    },
                    {
                        id: 14,
                        japanese: "彼は医者ですか。",
                        english: "Does he study English every day?",
                        blanks: [
                            { index: 0, word: 'Does' }
                        ],
                        hint: "主語が「He」「She」「It」や単数形の名詞のときは「Does」を使い、動詞は原形にします。"
                    }
                ]
            }
        ]
    },
    {
        chapter: 2,
        title: "第2章 形容詞・副詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 3,
        title: "第3章 名詞の複数形",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 4,
        title: "第4章 疑問詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 5,
        title: "第5章 命令文",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 6,
        title: "第6章 現在進行形",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 7,
        title: "第7章 一般動詞の過去形",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 8,
        title: "第8章 be動詞の過去形",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 9,
        title: "第9章 過去進行形",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 10,
        title: "第10章 助動詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 11,
        title: "第11章 There is(are)～の文",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 12,
        title: "第12章 感嘆文",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 13,
        title: "第13章 接続詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 14,
        title: "第13章 不定詞（基本３用法）",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 15,
        title: "第14章 動名詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 16,
        title: "第15章 文型",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 17,
        title: "第16章 比較",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 18,
        title: "第17章 付加疑問文",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 19,
        title: "第18章 前置詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 20,
        title: "第19章 受動態",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 21,
        title: "第20章 現在完了",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 22,
        title: "第21章 不定詞（応用）",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 23,
        title: "第22章 分詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 24,
        title: "第23章 関係代名詞",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 25,
        title: "第24章 間接疑問文",
        explanation: "",
        point: "",
        exercises: []
    },
    {
        chapter: 26,
        title: "第25章 仮定法",
        explanation: "",
        point: "",
        exercises: []
    }
];

