// ====================================================
// 英文法中学３年間の総復習 問題データ
// ====================================================
//
// --- データ構造 ---
// chapter: 章番号
// title: 章タイトル
// explanation: HTML形式の解説文（<p>タグなど使用可）
// sections: セクションの配列
//   - title: セクションタイトル（例：「肯定文」「否定文」）
//   - point: HTML形式のPOINT（配列.join('\n')で複数行推奨）
//   - exercises: 演習問題の配列
//
// --- 穴埋め問題 ---
//   { id, japanese, english, blanks: [{index, word}], hint }
//
// --- 並び替え問題 ---
//   { id, type: "reorder", japanese, words: [...], answer: "正解文" }
//
// --- POINT内で表を使う場合のテンプレート ---
//   point: [
//       '<p>説明文</p>',
//       '<table>',
//       '  <tr><th>見出し1</th><th>見出し2</th></tr>',
//       '  <tr><td>データ1</td><td>データ2</td></tr>',
//       '  <tr><td>データ3</td><td class="table-highlight">強調</td></tr>',
//       '</table>'
//   ].join('\n'),
//
// ====================================================
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
                point: [
                    '<p>be動詞は<span class="grammar-important">主語によって形が変わる</span>。</p>',
                    '<table>',
                    '  <tr><th>主語</th><th>be動詞</th></tr>',
                    '  <tr><td>I</td><td class="table-highlight">am</td></tr>',
                    '  <tr><td>you, 複数形</td><td class="table-highlight">are</td></tr>',
                    '  <tr><td>he, she, it,</td><td class="table-highlight">is</td></tr>',
                    '</table>',
                    '<p>一般動詞は主語が<span class="grammar-important">三人称単数現在</span>の場合、語尾に -s / -es がつく。</p>'
                ].join('\n'),
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
            },
            {
                id: 101,
                type: "reorder",
                japanese: "彼女はとても親切です。",
                words: ["very", "is", "kind", "She"],
                answer: "She is very kind."
            },
            {
                id: 102,
                type: "reorder",
                japanese: "私は毎日学校に歩いて行きます。",
                words: ["to", "walk", "every", "I", "school", "day"],
                answer: "I walk to school every day."
            }
                ]
            },
            {
                title: "否定文",
                point: [
                    '<p>be動詞の否定文は、be動詞の後に <span class="grammar-important">not</span> を置く。</p>',
                    '<table>',
                    '  <tr><th>主語</th><th>否定形</th><th>短縮形</th></tr>',
                    '  <tr><td>I</td><td>am not</td><td>I\'m not</td></tr>',
                    '  <tr><td>You / We / They</td><td>are not</td><td>aren\'t</td></tr>',
                    '  <tr><td>He / She / It</td><td>is not</td><td>isn\'t</td></tr>',
                    '</table>',
                    '<p>一般動詞の否定文は、<span class="grammar-important">do not / does not</span> を動詞の前に置く。</p>',
                    '<table>',
                    '  <tr><th>主語</th><th>否定形</th><th>短縮形</th></tr>',
                    '  <tr><td>I / You / We / They</td><td>do not + 原形</td><td>don\'t</td></tr>',
                    '  <tr><td>He / She / It</td><td>does not + 原形</td><td>doesn\'t</td></tr>',
                    '</table>'
                ].join('\n'),
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
                    },
                    {
                        id: 111,
                        type: "reorder",
                        japanese: "彼女はここに住んでいません。",
                        words: ["live", "She", "not", "here", "does"],
                        answer: "She does not live here."
                    }
                ]
            },
            {
                title: "疑問文",
                point: [
                    '<p>be動詞の疑問文は、<span class="grammar-important">be動詞を文頭に移動</span>する。</p>',
                    '<table>',
                    '  <tr><th>肯定文</th><th>疑問文</th></tr>',
                    '  <tr><td>You are a student.</td><td class="table-highlight">Are you a student?</td></tr>',
                    '  <tr><td>He is tall.</td><td class="table-highlight">Is he tall?</td></tr>',
                    '</table>',
                    '<p>一般動詞の疑問文は、文頭に <span class="grammar-important">Do / Does</span> を置く。</p>',
                    '<table>',
                    '  <tr><th>主語</th><th>疑問文の形</th></tr>',
                    '  <tr><td>I / You / We / They</td><td class="table-highlight">Do + 主語 + 原形 ...?</td></tr>',
                    '  <tr><td>He / She / It</td><td class="table-highlight">Does + 主語 + 原形 ...?</td></tr>',
                    '</table>'
                ].join('\n'),
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
                    },
                    {
                        id: 121,
                        type: "reorder",
                        japanese: "あなたは英語を話しますか。",
                        words: ["speak", "you", "Do", "English"],
                        answer: "Do you speak English?"
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

