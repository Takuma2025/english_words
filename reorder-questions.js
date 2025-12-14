// 整序英作文100本ノック 問題データ
const reorderQuestions = [
    {
        id: 1,
        japanese: "教室では静かにしてください。",
        words: ["quiet", "in", "please", "be", "the", "classroom"],
        correctOrder: ["Please", "be", "quiet", "in", "the", "classroom", "."],
        correctAnswer: "Please be quiet in the classroom."
    },
    {
        id: 2,
        japanese: "私は昨日公園でサッカーをしました。",
        words: ["yesterday", "I", "in", "played", "the", "park", "soccer"],
        correctOrder: ["I", "played", "soccer", "in", "the", "park", "yesterday", "."],
        correctAnswer: "I played soccer in the park yesterday."
    },
    {
        id: 3,
        japanese: "彼女は英語を上手に話します。",
        words: ["well", "speaks", "she", "English"],
        correctOrder: ["She", "speaks", "English", "well", "."],
        correctAnswer: "She speaks English well."
    },
    {
        id: 4,
        japanese: "この本はとても面白いです。",
        words: ["is", "this", "very", "book", "interesting"],
        correctOrder: ["This", "book", "is", "very", "interesting", "."],
        correctAnswer: "This book is very interesting."
    },
    {
        id: 5,
        japanese: "私は毎朝6時に起きます。",
        words: ["at", "I", "get", "six", "up", "every", "morning"],
        correctOrder: ["I", "get", "up", "at", "six", "every", "morning", "."],
        correctAnswer: "I get up at six every morning."
    }
    // 残りの95問は後で追加可能
];
