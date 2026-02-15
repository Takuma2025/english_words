/**
 * 兵庫県公立入試 整序英作（予想問題）データ
 * 
 * 各問題は passage（英文）の中に〔あ〕〔い〕の空所があり、
 * それぞれの語群から4語を選んで正しい順に並べる形式。
 * 
 * level: "basic"（基本編）, "standard"（標準編）, "advanced"（発展編）
 */
const hyogoSeijoQuestions = [
    // ===== 基本編 =====
    {
        id: 1,
        level: "basic",
        instruction: "次の案内文の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Library Notice", style: "title" },
            { text: "Thank you for using the library." },
            { text: "Books borrowed this week ", blankId: "a", after: " Friday." },
            { text: "Also, the library ", blankId: "b", after: " cleaning next Monday." },
            { text: "We are sorry for the inconvenience." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["must", "be", "returned", "by", "for", "in"],
                correctOrder: ["must", "be", "returned", "by"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["will", "be", "closed", "for", "to", "many"],
                correctOrder: ["will", "be", "closed", "for"],
                slotCount: 4
            }
        },
        translation: "図書館からのお知らせ\n図書館をご利用いただきありがとうございます。\n今週借りた本は金曜日までに返却しなければなりません。\nまた、来週の月曜日は清掃のため図書館は閉館します。\nご不便をおかけして申し訳ございません。",
        explanation: "〔あ〕must be returned by：「～までに返却されなければならない」助動詞 must + 受動態 be returned + 期限を示す by の組み合わせ。\n〔い〕will be closed for：「～のために閉館される予定」未来の受動態 will be closed + 理由を示す for の組み合わせ。"
    },
    {
        id: 2,
        level: "basic",
        instruction: "次の掲示の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "School Festival — October 15", style: "title" },
            { text: "Our school festival will be held next Saturday." },
            { text: "Each class ", blankId: "a", after: " to visitors." },
            { text: "If you want to join the singing contest, please ", blankId: "b", after: " by Wednesday." },
            { text: "Let's make this the best festival ever!" }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["will", "show", "something", "special", "very", "been"],
                correctOrder: ["will", "show", "something", "special"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["tell", "your", "teacher", "about", "it", "from"],
                correctOrder: ["tell", "your", "teacher", "about"],
                slotCount: 4
            }
        },
        translation: "学園祭 — 10月15日\n来週の土曜日に学園祭が開催されます。\n各クラスは来場者に特別なものを見せます。\n歌のコンテストに参加したい場合は、水曜日までに先生に伝えてください。\n最高の学園祭にしましょう！",
        explanation: "〔あ〕will show something special：「何か特別なものを見せる」will + 動詞の原形で未来を表す。something + 形容詞の語順に注意。\n〔い〕tell your teacher about：「先生に～について伝える」tell + 人 + about の形。命令文なので動詞の原形で始まる。"
    },
    {
        id: 3,
        level: "basic",
        instruction: "次のメールの空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Hi Tom,", style: "title" },
            { text: "Thank you for your email." },
            { text: "I'm glad to hear you ", blankId: "a", after: " in Japan." },
            { text: "I ", blankId: "b", after: " at the station." },
            { text: "See you soon!" },
            { text: "Yuki" }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["are", "interested", "in", "living", "to", "at"],
                correctOrder: ["are", "interested", "in", "living"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["will", "pick", "you", "up", "for", "on"],
                correctOrder: ["will", "pick", "you", "up"],
                slotCount: 4
            }
        },
        translation: "トムへ\nメールありがとう。\n日本での生活に興味があると聞いてうれしいです。\n駅に迎えに行きます。\nまた会えるのを楽しみにしています！\nユキ",
        explanation: "〔あ〕are interested in living：「住むことに興味がある」be interested in ～ing で「～することに興味がある」。\n〔い〕will pick you up：「あなたを迎えに行く」pick up は「迎えに行く」の句動詞。目的語が代名詞のとき pick + 代名詞 + up の語順になる。"
    },
    {
        id: 4,
        level: "basic",
        instruction: "次の対話の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Ms. Tanaka: What do you want to be in the future?" },
            { text: "Ken: I ", blankId: "a", after: " a teacher." },
            { text: "Ms. Tanaka: That's a wonderful dream." },
            { text: "Ken: Thank you. I think ", blankId: "b", after: " children." },
            { text: "Ms. Tanaka: I agree. Keep working hard!" }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["want", "to", "become", "be", "for", "am"],
                correctOrder: ["want", "to", "become", "be"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["teaching", "is", "important", "for", "at", "been"],
                correctOrder: ["teaching", "is", "important", "for"],
                slotCount: 4
            }
        },
        translation: "田中先生：将来何になりたいですか？\nケン：先生になりたいです。\n田中先生：素晴らしい夢ですね。\nケン：ありがとうございます。教えることは子どもたちにとって大切だと思います。\n田中先生：そう思います。頑張り続けてね！",
        explanation: "〔あ〕want to become：「～になりたい」want to + 動詞の原形で希望を表す。become は「～になる」。\n〔い〕teaching is important for：「教えることは～にとって重要だ」動名詞 teaching が主語。important for ～ で「～にとって重要な」。"
    },
    {
        id: 5,
        level: "basic",
        instruction: "次の案内の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Cooking Class for Beginners", style: "title" },
            { text: "We are going to have a cooking class this Sunday." },
            { text: "You ", blankId: "a", after: " anything." },
            { text: "Our teacher ", blankId: "b", after: " for everyone." },
            { text: "Please come and enjoy cooking!" }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["don't", "have", "to", "bring", "for", "been"],
                correctOrder: ["don't", "have", "to", "bring"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["has", "prepared", "all", "materials", "been", "at"],
                correctOrder: ["has", "prepared", "all", "materials"],
                slotCount: 4
            }
        },
        translation: "初心者向け料理教室\n今週の日曜日に料理教室を開きます。\n何も持ってくる必要はありません。\n先生が皆さんのために全ての材料を準備しています。\nぜひ来て、料理を楽しんでください！",
        explanation: "〔あ〕don't have to bring：「持ってくる必要がない」don't have to で「～する必要がない」という不必要を表す表現。\n〔い〕has prepared all materials：「全ての材料を準備した」現在完了形 has prepared で「すでに準備し終えた」ことを表す。"
    },

    // ===== 標準編 =====
    {
        id: 6,
        level: "standard",
        instruction: "次の会話の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Nao: Our tennis club is planning a one-day trip next month." },
            { text: "Koki: Sounds fun. Where are we going?" },
            { text: "Nao: We'll visit a sports center and watch a match." },
            { text: "Koki: Nice! ", blankId: "a", after: " us?" },
            { text: "Nao: Of course. Everyone can join." },
            { text: "Koki: Great. By the way, I heard you're tired lately." },
            { text: "Nao: Yeah, my sister ", blankId: "b", after: " every night for her exams." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["would", "like", "to", "join", "for", "in"],
                correctOrder: ["would", "like", "to", "join"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["has", "been", "working", "hard", "will", "many"],
                correctOrder: ["has", "been", "working", "hard"],
                slotCount: 4
            }
        },
        translation: "ナオ：テニス部で来月日帰り旅行を計画してるんだ。\nコキ：楽しそう。どこに行くの？\nナオ：スポーツセンターに行って試合を観るよ。\nコキ：いいね！僕たちも参加していい？\nナオ：もちろん。みんな参加できるよ。\nコキ：よかった。ところで、最近疲れてるって聞いたけど。\nナオ：うん、姉が毎晩試験のために一生懸命勉強してるんだ。",
        explanation: "〔あ〕would like to join：「参加したいのですが」would like to ＋動詞の原形で丁寧な希望を表す表現。\n〔い〕has been working hard：「ずっと一生懸命取り組んでいる」現在完了進行形 has been ～ing で、過去から現在まで続く動作を表す。"
    },
    {
        id: 7,
        level: "standard",
        instruction: "次の対話の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Emi: Have you ever been to Kyoto?" },
            { text: "Jack: Yes. I visited it last year." },
            { text: "Emi: What did you like the most?" },
            { text: "Jack: The temple ", blankId: "a", after: " was amazing." },
            { text: "Emi: I know that place! It's very popular." },
            { text: "Jack: I want to go back because there are ", blankId: "b", after: " yet." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["built", "of", "made", "wood", "on", "in"],
                correctOrder: ["made", "of", "wood", "built"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["many", "places", "I", "haven't", "visited", "been"],
                correctOrder: ["many", "places", "I", "haven't"],
                slotCount: 4
            }
        },
        translation: "エミ：京都に行ったことある？\nジャック：うん。去年行ったよ。\nエミ：何が一番良かった？\nジャック：木でできたあのお寺がすごかった。\nエミ：その場所知ってる！すごく人気だよね。\nジャック：まだ行っていない場所がたくさんあるから、また行きたいんだ。",
        explanation: "〔あ〕made of wood built：「木で造られた」made of ～は材料を表す。built は過去分詞で temple を修飾。\n〔い〕many places I haven't：「私がまだ～していない多くの場所」many places (that) I haven't visited の関係代名詞省略の形。"
    },
    {
        id: 8,
        level: "standard",
        instruction: "次のスピーチの空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Good morning, everyone." },
            { text: "Today I'd like to talk about volunteer work." },
            { text: "Last summer, I joined a group that ", blankId: "a", after: " the elderly." },
            { text: "The experience ", blankId: "b", after: " about other people." },
            { text: "I hope more students will try it." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["helps", "take", "care", "of", "for", "with"],
                correctOrder: ["helps", "take", "care", "of"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["taught", "me", "to", "think", "for", "been"],
                correctOrder: ["taught", "me", "to", "think"],
                slotCount: 4
            }
        },
        translation: "皆さん、おはようございます。\n今日はボランティア活動についてお話ししたいと思います。\n去年の夏、高齢者の世話をする団体に参加しました。\nその経験は私に他の人について考えることを教えてくれました。\nもっと多くの生徒が挑戦してくれることを願っています。",
        explanation: "〔あ〕helps take care of：「～の世話をするのを助ける」help + 動詞の原形で「～するのを手伝う」。take care of は「～の世話をする」。\n〔い〕taught me to think：「私に考えることを教えた」teach + 人 + to do で「人に～することを教える」。"
    },
    {
        id: 9,
        level: "standard",
        instruction: "次の対話の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Yuki: I can't decide which book to read next." },
            { text: "Mr. Brown: How about this one? It's a story ", blankId: "a", after: " around the world." },
            { text: "Yuki: That sounds interesting." },
            { text: "Mr. Brown: The writer is a woman ", blankId: "b", after: " in many countries." },
            { text: "Yuki: I'll try it. Thank you!" }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["about", "a", "boy", "traveling", "to", "been"],
                correctOrder: ["about", "a", "boy", "traveling"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["who", "has", "lived", "been", "in", "for"],
                correctOrder: ["who", "has", "lived", "in"],
                slotCount: 4
            }
        },
        translation: "ユキ：次にどの本を読もうか決められないの。\nブラウン先生：これはどう？世界中を旅する少年の物語だよ。\nユキ：面白そう。\nブラウン先生：著者は多くの国に住んだことがある女性なんだ。\nユキ：読んでみます。ありがとう！",
        explanation: "〔あ〕about a boy traveling：「旅する少年についての」about ＋名詞 ＋ 現在分詞で「～している…についての」。\n〔い〕who has lived in：「～に住んだことのある」関係代名詞 who + 現在完了 has lived で経験を表す。"
    },
    {
        id: 10,
        level: "standard",
        instruction: "次の案内の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "International Exchange Event", style: "title" },
            { text: "We will hold a special event next Friday." },
            { text: "Students from other countries ", blankId: "a", after: " their cultures." },
            { text: "This is a great chance ", blankId: "b", after: " new friends." },
            { text: "Don't miss it!" }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["will", "come", "and", "share", "for", "been"],
                correctOrder: ["will", "come", "and", "share"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["for", "you", "to", "make", "been", "at"],
                correctOrder: ["for", "you", "to", "make"],
                slotCount: 4
            }
        },
        translation: "国際交流イベント\n来週の金曜日に特別なイベントを開催します。\n海外からの生徒が来て、自分たちの文化を紹介してくれます。\nこれは新しい友達を作る絶好の機会です。\nお見逃しなく！",
        explanation: "〔あ〕will come and share：「来て共有する」will + 動詞 and 動詞で2つの動作を並列に表す。\n〔い〕for you to make：「あなたが～するための」for + 人 + to do は不定詞の意味上の主語を示す形。chance for you to make で「あなたが作るための機会」。"
    },

    // ===== 発展編 =====
    {
        id: 11,
        level: "advanced",
        instruction: "次のスピーチの空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Today, I want to talk about the environment." },
            { text: "Global warming is one of the biggest problems ", blankId: "a", after: " today." },
            { text: "If we don't act now, the situation will get worse." },
            { text: "I believe ", blankId: "b", after: " to solve this problem." },
            { text: "Let's start with small actions every day." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["we", "are", "facing", "faced", "for", "in"],
                correctOrder: ["we", "are", "facing", "faced"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["it", "is", "possible", "for", "important", "us"],
                correctOrder: ["it", "is", "possible", "for"],
                slotCount: 4
            }
        },
        translation: "今日は環境問題についてお話ししたいと思います。\n地球温暖化は今日私たちが直面している最大の問題の一つです。\n今行動しなければ、状況はさらに悪化するでしょう。\nこの問題を解決することは可能だと信じています。\n毎日の小さな行動から始めましょう。",
        explanation: "〔あ〕we are facing：「私たちが直面している」problems (that) we are facing の関係代名詞省略の形。現在進行形で「今まさに直面している」。\n〔い〕it is possible for：「～にとって可能である」It is possible for ＋人＋ to do の形式主語構文。"
    },
    {
        id: 12,
        level: "advanced",
        instruction: "次の対話の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Miki: I saw an interesting documentary about AI last night." },
            { text: "Tom: Really? What was it about?" },
            { text: "Miki: It showed us how technology ", blankId: "a", after: " in the future." },
            { text: "Tom: Do you think AI will replace human jobs?" },
            { text: "Miki: Some jobs may disappear, but I think the most important thing ", blankId: "b", after: " with technology." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["will", "change", "our", "lives", "to", "been"],
                correctOrder: ["will", "change", "our", "lives"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["is", "to", "learn", "how", "live", "work"],
                correctOrder: ["is", "to", "learn", "how"],
                slotCount: 4
            }
        },
        translation: "ミキ：昨夜AIについての面白いドキュメンタリーを観たの。\nトム：本当？何についてだった？\nミキ：テクノロジーが将来どのように私たちの生活を変えるか見せてくれたわ。\nトム：AIが人間の仕事に取って代わると思う？\nミキ：なくなる仕事もあるかもしれないけど、一番大切なことはテクノロジーとどう付き合うかを学ぶことだと思う。",
        explanation: "〔あ〕will change our lives：「私たちの生活を変える」how technology will change our lives は間接疑問文。how + S + V の語順。\n〔い〕is to learn how：「～の仕方を学ぶことだ」the most important thing is to learn how to ～ の形。how to ～ で「～の仕方」。"
    },
    {
        id: 13,
        level: "advanced",
        instruction: "次のエッセイの空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "When I was a child, my grandmother often told me stories." },
            { text: "She always said that the books ", blankId: "a", after: " her when she was young." },
            { text: "Now I understand what she meant." },
            { text: "Reading has given me ", blankId: "b", after: " differently." },
            { text: "I am grateful for her words." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["she", "read", "really", "helped", "been", "at"],
                correctOrder: ["she", "read", "really", "helped"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["the", "chance", "to", "think", "at", "been"],
                correctOrder: ["the", "chance", "to", "think"],
                slotCount: 4
            }
        },
        translation: "子どもの頃、祖母はよく私に話を聞かせてくれました。\n彼女はいつも、若い頃に読んだ本が本当に助けてくれたと言っていました。\n今、彼女の言葉の意味がわかります。\n読書は私に違った考え方をする機会を与えてくれました。\n彼女の言葉に感謝しています。",
        explanation: "〔あ〕she read really helped：「彼女が読んだ本が本当に助けた」the books (that) she read の関係代名詞省略。really は helped を修飾する副詞。\n〔い〕the chance to think：「考える機会」the chance to ～ で「～する機会」。不定詞の形容詞的用法で chance を修飾。"
    },
    {
        id: 14,
        level: "advanced",
        instruction: "次の対話の空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "Lisa: I heard you're going to study abroad next year." },
            { text: "Kenji: Yes! I'm going to Canada." },
            { text: "Lisa: That's exciting. Do you know ", blankId: "a", after: " there?" },
            { text: "Kenji: Yes, I'll stay with a host family." },
            { text: "Lisa: That sounds nice. Living with a local family will ", blankId: "b", after: " Canadian culture." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["where", "you", "are", "going", "stay", "to"],
                correctOrder: ["where", "you", "are", "going"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["help", "you", "understand", "learn", "for", "at"],
                correctOrder: ["help", "you", "understand", "learn"],
                slotCount: 4
            }
        },
        translation: "リサ：来年留学するんだって？\nケンジ：うん！カナダに行くんだ。\nリサ：わくわくするね。向こうでどこに滞在するか知ってる？\nケンジ：うん、ホストファミリーの家に泊まるんだ。\nリサ：いいね。地元の家族と暮らすことでカナダの文化を理解する助けになるよ。",
        explanation: "〔あ〕where you are going：「あなたがどこに行く予定か」間接疑問文 Do you know where + S + V の語順（疑問文の語順にしない）。\n〔い〕help you understand：「あなたが理解するのを助ける」help + 人 + 動詞の原形で「人が～するのを助ける」。"
    },
    {
        id: 15,
        level: "advanced",
        instruction: "次のスピーチの空所〔あ〕〔い〕に、あとのそれぞれの語群内の語から4語を選んで並べかえ、英文を完成させなさい。",
        passage: [
            { text: "I'd like to share an experience that changed my life." },
            { text: "Two years ago, I met a boy ", blankId: "a", after: " speak Japanese." },
            { text: "We used gestures and simple English to communicate." },
            { text: "This experience made me ", blankId: "b", after: " languages." },
            { text: "Communication is not just about words." }
        ],
        blanks: {
            a: {
                label: "あ",
                words: ["who", "could", "not", "couldn't", "been", "for"],
                correctOrder: ["who", "could", "not", "couldn't"],
                slotCount: 4
            },
            b: {
                label: "い",
                words: ["realize", "the", "importance", "of", "for", "been"],
                correctOrder: ["realize", "the", "importance", "of"],
                slotCount: 4
            }
        },
        translation: "私の人生を変えた経験を皆さんに共有したいと思います。\n2年前、日本語を話せない少年に出会いました。\n私たちはジェスチャーと簡単な英語でコミュニケーションを取りました。\nこの経験は私に言語の重要性を気づかせてくれました。\nコミュニケーションは言葉だけではないのです。",
        explanation: "〔あ〕who could not：「～できなかった」関係代名詞 who + 助動詞 could not で「～できなかった人」を表す。\n〔い〕realize the importance of：「～の重要性に気づく」make + 人 + 動詞の原形（使役）で「人に～させる」。the importance of ～ で「～の重要性」。"
    }
];
