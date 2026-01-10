// C問題対策 大問1 整序英作文 四択問題データ
const choiceQuestions = [
    {
        id: 1,
        question: "Please tell me (       ) help you.",
        choices: [
            { label: "ア", text: "I can do what to me" },
            { label: "イ", text: "I can what to do me" },
            { label: "ウ", text: "me do what to I can" },
            { label: "エ", text: "me what I can do to" }
        ],
        correctIndex: 3,
        correctLabel: "エ",
        explanation: "「tell + 人 + 疑問詞節」の形。what I can do to help you（私があなたを助けるために何ができるか）が正しい語順です。"
    },
    {
        id: 2,
        question: "Please (       ) after her.",
        choices: [
            { label: "ア", text: "tell me why they named the school" },
            { label: "イ", text: "tell why they named me the school" },
            { label: "ウ", text: "named me why the school tell" },
            { label: "エ", text: "tell me why named they the shchool" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "「how to + 動詞」で「〜の仕方」という意味。get to the station で「駅に着く」となります。"
    },
    {
        id: 3,
        question: "Do you know (       ) tomorrow?",
        choices: [
            { label: "ア", text: "will it rain if" },
            { label: "イ", text: "if it will rain" },
            { label: "ウ", text: "it will if rain" },
            { label: "エ", text: "rain if it will" }
        ],
        correctIndex: 1,
        correctLabel: "イ",
        explanation: "間接疑問文では「if + 主語 + 動詞」の語順になります。if it will rain（雨が降るかどうか）。"
    },
    {
        id: 4,
        question: "The book (       ) was very interesting.",
        choices: [
            { label: "ア", text: "which I bought it" },
            { label: "イ", text: "I bought which" },
            { label: "ウ", text: "which I bought" },
            { label: "エ", text: "I which bought" }
        ],
        correctIndex: 2,
        correctLabel: "ウ",
        explanation: "関係代名詞whichの後は「主語 + 動詞」の語順。whichは目的格なので代名詞itは不要です。"
    },
    {
        id: 5,
        question: "I want to know (       ) English.",
        choices: [
            { label: "ア", text: "study how to" },
            { label: "イ", text: "to study how" },
            { label: "ウ", text: "how to study" },
            { label: "エ", text: "to how study" }
        ],
        correctIndex: 2,
        correctLabel: "ウ",
        explanation: "「how to + 動詞」で「〜の仕方」。how to study Englishで「英語の勉強の仕方」となります。"
    },
    {
        id: 6,
        question: "This is the park (       ) with my friends.",
        choices: [
            { label: "ア", text: "where I often play" },
            { label: "イ", text: "I often play where" },
            { label: "ウ", text: "often I where play" },
            { label: "エ", text: "play I often where" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "関係副詞whereの後は「主語 + 動詞」の語順。where I often play（私がよく遊ぶ場所）。"
    },
    {
        id: 7,
        question: "Could you tell me (       ) the library?",
        choices: [
            { label: "ア", text: "where is" },
            { label: "イ", text: "where it is" },
            { label: "ウ", text: "is where" },
            { label: "エ", text: "it where is" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "間接疑問文では疑問詞の後は「主語 + 動詞」の語順ですが、主語がthe libraryの場合はwhere isとなります。"
    },
    {
        id: 8,
        question: "I have a friend (       ) in Canada.",
        choices: [
            { label: "ア", text: "who live" },
            { label: "イ", text: "who lives" },
            { label: "ウ", text: "lives who" },
            { label: "エ", text: "live who" }
        ],
        correctIndex: 1,
        correctLabel: "イ",
        explanation: "関係代名詞whoの後の動詞は先行詞（a friend）に合わせて三人称単数形livesになります。"
    },
    {
        id: 9,
        question: "Please tell me (       ) this word.",
        choices: [
            { label: "ア", text: "what means" },
            { label: "イ", text: "what does mean" },
            { label: "ウ", text: "what it means" },
            { label: "エ", text: "means what" }
        ],
        correctIndex: 2,
        correctLabel: "ウ",
        explanation: "間接疑問文では「疑問詞 + 主語 + 動詞」の語順。what it means（それが何を意味するか）。"
    },
    {
        id: 10,
        question: "The woman (       ) is my teacher.",
        choices: [
            { label: "ア", text: "speaking English who" },
            { label: "イ", text: "who speaking English" },
            { label: "ウ", text: "who is speaking English" },
            { label: "エ", text: "English who speaking" }
        ],
        correctIndex: 2,
        correctLabel: "ウ",
        explanation: "関係代名詞whoの後は完全な文が続きます。who is speaking English（英語を話している人）。"
    },
    {
        id: 11,
        question: "I wonder (       ) late.",
        choices: [
            { label: "ア", text: "why he was" },
            { label: "イ", text: "why was he" },
            { label: "ウ", text: "he why was" },
            { label: "エ", text: "was why he" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "間接疑問文では「疑問詞 + 主語 + 動詞」の語順。why he was late（なぜ彼は遅れたのか）。"
    },
    {
        id: 12,
        question: "This is the city (       ) born.",
        choices: [
            { label: "ア", text: "where I was" },
            { label: "イ", text: "I was where" },
            { label: "ウ", text: "was I where" },
            { label: "エ", text: "where was I" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "関係副詞whereの後は「主語 + 動詞」の語順。where I was born（私が生まれた場所）。"
    },
    {
        id: 13,
        question: "Do you know (       ) it is?",
        choices: [
            { label: "ア", text: "what time" },
            { label: "イ", text: "time what" },
            { label: "ウ", text: "what is time" },
            { label: "エ", text: "is what time" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "間接疑問文の語順。what time it is（何時か）で「主語 + 動詞」の語順になります。"
    },
    {
        id: 14,
        question: "The girl (       ) is my sister.",
        choices: [
            { label: "ア", text: "standing there who" },
            { label: "イ", text: "who standing there" },
            { label: "ウ", text: "who is standing there" },
            { label: "エ", text: "there who standing" }
        ],
        correctIndex: 2,
        correctLabel: "ウ",
        explanation: "関係代名詞whoの後には完全な文が続きます。who is standing there（そこに立っている）。"
    },
    {
        id: 15,
        question: "I asked him (       ) the next day.",
        choices: [
            { label: "ア", text: "if he would come" },
            { label: "イ", text: "would he come if" },
            { label: "ウ", text: "if would he come" },
            { label: "エ", text: "he if would come" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "間接疑問文では「if + 主語 + 動詞」の語順。if he would come（彼が来るかどうか）。"
    },
    {
        id: 16,
        question: "The house (       ) is very old.",
        choices: [
            { label: "ア", text: "which stands on the hill" },
            { label: "イ", text: "stands which on the hill" },
            { label: "ウ", text: "on the hill which stands" },
            { label: "エ", text: "which on the hill stands" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "関係代名詞whichの後は「動詞 + 場所」の語順。which stands on the hill（丘の上に建っている）。"
    },
    {
        id: 17,
        question: "Can you tell me (       )?",
        choices: [
            { label: "ア", text: "where does he live" },
            { label: "イ", text: "where he lives" },
            { label: "ウ", text: "he lives where" },
            { label: "エ", text: "does where he live" }
        ],
        correctIndex: 1,
        correctLabel: "イ",
        explanation: "間接疑問文では「疑問詞 + 主語 + 動詞」の語順。where he lives（彼がどこに住んでいるか）。"
    },
    {
        id: 18,
        question: "I'll never forget the day (       ) her.",
        choices: [
            { label: "ア", text: "when I first met" },
            { label: "イ", text: "I first met when" },
            { label: "ウ", text: "when first I met" },
            { label: "エ", text: "first when I met" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "関係副詞whenの後は「主語 + 動詞」の語順。when I first met（初めて会った日）。"
    },
    {
        id: 19,
        question: "I want to know (       ) this problem.",
        choices: [
            { label: "ア", text: "solve how to" },
            { label: "イ", text: "how solve to" },
            { label: "ウ", text: "to how solve" },
            { label: "エ", text: "how to solve" }
        ],
        correctIndex: 3,
        correctLabel: "エ",
        explanation: "「how to + 動詞」で「〜の仕方」。how to solve this problem（この問題の解き方）。"
    },
    {
        id: 20,
        question: "This is the reason (       ) late.",
        choices: [
            { label: "ア", text: "why I was" },
            { label: "イ", text: "I was why" },
            { label: "ウ", text: "was why I" },
            { label: "エ", text: "why was I" }
        ],
        correctIndex: 0,
        correctLabel: "ア",
        explanation: "関係副詞whyの後は「主語 + 動詞」の語順。why I was late（私が遅れた理由）。"
    }
];
