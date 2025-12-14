// 厳選例文暗記のデータ（例：60問分）
const sentenceMemorizationData = [
    {
        id: 1,
        japanese: 'ナイル川は世界のほかのどの川よりも長いです。',
        english: 'The Nile is longer than any other river in the world.',
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
        blanks: [
            { index: 0, word: 'as' },
            { index: 1, word: 'large' },
            { index: 2, word: 'as' }
        ],
        hint: '「ほかのどの～よりも...」は、〈 比較級 than any other 単数形の名詞 〉でしたね。'
    }
];

