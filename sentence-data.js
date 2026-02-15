// 厳選例文暗記のデータ（例：60問分）
const sentenceMemorizationData = [
    {
        id: 1,
        japanese: 'ナイル川は世界のほかのどの川よりも長いです。',
        english: 'The Nile is longer than any other river in the world.',
        grammar: '比較級 + than any other',
        explanation: '〈 比較級 + than any other + 単数名詞 〉で「ほかのどの～よりも…」という意味。最上級 The Nile is the longest river in the world. と同じ内容を比較級で表す。',
        blanks: [
            { index: 0, word: 'longer' },
            { index: 1, word: 'than' },
            { index: 2, word: 'any' },
            { index: 3, word: 'other' },
            { index: 4, word: 'river' }
        ],
        hint: '「ほかのどの～よりも...」は、〈 比較級 than any other 単数形の名詞 〉でしたね。'
    },
    // 最上級の文
    {
        id: 2,
        japanese: '富士山は日本で最も高い山です。',
        english: 'Mt. Fuji is the highest mountain in Japan.',
        grammar: '最上級（-est）',
        explanation: '〈 the + 形容詞の最上級（-est）+ in 場所 〉で「…の中で最も～」。high → highest のように短い語は -est をつける。',
        blanks: [
            { index: 0, word: 'the' },
            { index: 1, word: 'highest' },
            { index: 2, word: 'mountain' }
        ],
        hint: 'ヒント：\n1. t__ (3文字)\n2. h______ (7文字)\n3. m_______ (8文字)'
    },
    {
        id: 3,
        japanese: 'これは庭で最も美しい花です。',
        english: 'This is the most beautiful flower in the garden.',
        grammar: '最上級（most）',
        explanation: '〈 the most + 長い形容詞 〉で最上級を作る。beautiful のように音節が多い語は most を前に置く。',
        blanks: [
            { index: 0, word: 'the' },
            { index: 1, word: 'most' },
            { index: 2, word: 'beautiful' },
            { index: 3, word: 'flower' }
        ],
        hint: 'ヒント：\n1. t__ (3文字)\n2. m___ (4文字)\n3. b________ (9文字)\n4. f_____ (6文字)'
    },
    {
        id: 4,
        japanese: '彼女は私たちのクラスで最も背が高い女の子です。',
        english: 'She is the tallest girl in our class.',
        grammar: '最上級（-est）',
        explanation: '〈 the + -est + in 場所/グループ 〉。tall → tallest。「クラスの中で」は in our class。',
        blanks: [
            { index: 0, word: 'the' },
            { index: 1, word: 'tallest' },
            { index: 2, word: 'girl' }
        ],
        hint: 'ヒント：\n1. t__ (3文字)\n2. t______ (7文字)\n3. g___ (4文字)'
    },
    {
        id: 5,
        japanese: 'これは私が今まで見た中で最も面白い映画です。',
        english: 'This is the most interesting movie I have ever seen.',
        grammar: '最上級 + 現在完了',
        explanation: '〈 the most + 形容詞 + 名詞 + S have ever + 過去分詞 〉で「今まで…した中で最も～な」。ever は「今までに」という意味。',
        blanks: [
            { index: 0, word: 'the' },
            { index: 1, word: 'most' },
            { index: 2, word: 'interesting' },
            { index: 3, word: 'movie' }
        ],
        hint: 'ヒント：\n1. t__ (3文字)\n2. m___ (4文字)\n3. i_________ (11文字)\n4. m____ (5文字)'
    },
    {
        id: 6,
        japanese: '彼は学校で最も速く走れます。',
        english: 'He can run the fastest in the school.',
        grammar: '副詞の最上級',
        explanation: '副詞の最上級も形容詞と同じ形。fast → fastest。〈 動詞 + the + 副詞の最上級 〉の語順に注意。',
        blanks: [
            { index: 0, word: 'the' },
            { index: 1, word: 'fastest' }
        ],
        hint: 'ヒント：\n1. t__ (3文字)\n2. f______ (7文字)'
    },
    {
        id: 7,
        japanese: 'これは世界で最も古い建物の一つです。',
        english: 'This is one of the oldest buildings in the world.',
        grammar: 'one of the + 最上級',
        explanation: '〈 one of the + 最上級 + 複数名詞 〉で「最も～な…の一つ」。名詞は必ず複数形にする点に注意。',
        blanks: [
            { index: 0, word: 'one' },
            { index: 1, word: 'of' },
            { index: 2, word: 'the' },
            { index: 3, word: 'oldest' },
            { index: 4, word: 'buildings' }
        ],
        hint: 'ヒント：\n1. o__ (3文字)\n2. o_ (2文字)\n3. t__ (3文字)\n4. o_____ (6文字)\n5. b________ (9文字)'
    },
    // as...asの文
    {
        id: 8,
        japanese: 'この本はあの本と同じくらい面白いです。',
        english: 'This book is as interesting as that one.',
        grammar: 'as + 原級 + as',
        explanation: '〈 as + 形容詞の原級 + as 〉で「…と同じくらい～」。interesting は変化させずそのまま使う。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'interesting' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. i_________ (11文字)\n3. a_ (2文字)'
    },
    {
        id: 9,
        japanese: '彼は父親と同じくらい背が高いです。',
        english: 'He is as tall as his father.',
        grammar: 'as + 原級 + as',
        explanation: '〈 as + 原級 + as 〉の基本形。tall は比較級 taller でも最上級 tallest でもなく、原級のまま使う。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'tall' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. t___ (4文字)\n3. a_ (2文字)'
    },
    {
        id: 10,
        japanese: '英語は数学と同じくらい重要です。',
        english: 'English is as important as math.',
        grammar: 'as + 原級 + as',
        explanation: '長い形容詞でも as ~ as の間に原級をそのまま入れる。most important や more important にはしない。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'important' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. i________ (9文字)\n3. a_ (2文字)'
    },
    {
        id: 11,
        japanese: 'この問題は前の問題と同じくらい難しいです。',
        english: 'This problem is as difficult as the previous one.',
        grammar: 'as + 原級 + as',
        explanation: 'the previous one = 「前のもの（問題）」。one は前に出た名詞（problem）の繰り返しを避ける代名詞。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'difficult' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. d________ (9文字)\n3. a_ (2文字)'
    },
    {
        id: 12,
        japanese: '彼女は私と同じくらい上手にピアノを弾けます。',
        english: 'She can play the piano as well as I can.',
        grammar: 'as + 副詞の原級 + as',
        explanation: '副詞 well（上手に）を使った as ~ as。形容詞だけでなく副詞も原級で使える。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'well' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. w___ (4文字)\n3. a_ (2文字)'
    },
    {
        id: 13,
        japanese: 'この車はあの車と同じくらい速いです。',
        english: 'This car is as fast as that one.',
        grammar: 'as + 原級 + as',
        explanation: 'fast は形容詞としても副詞としても使える。ここでは「速い」という形容詞。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'fast' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. f___ (4文字)\n3. a_ (2文字)'
    },
    {
        id: 14,
        japanese: '彼は私と同じくらい一生懸命勉強します。',
        english: 'He studies as hard as I do.',
        grammar: 'as + 副詞の原級 + as',
        explanation: 'hard は副詞「一生懸命に」。I do の do は studies の代わり。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'hard' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. h___ (4文字)\n3. a_ (2文字)'
    },
    {
        id: 15,
        japanese: 'この町は東京と同じくらい大きいです。',
        english: 'This city is as large as Tokyo.',
        grammar: 'as + 原級 + as',
        explanation: '「大きい」には big と large がある。面積・規模が大きい場合は large を使うことが多い。',
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'large' },
            { index: 2, word: 'as' }
        ],
        hint: 'ヒント：\n1. a_ (2文字)\n2. l____ (5文字)\n3. a_ (2文字)'
    }
];
