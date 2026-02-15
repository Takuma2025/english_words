/**
 * 兵庫県公立入試 英文読解（予想問題）データ
 * 画像ファイルはプロジェクト直下に配置:
 * - teacher_woman.png
 * - girl1.png
 * - girl2.png
 * - boy2.png
 */
const hyogoDokkaiQuestions = [
    {
        id: 1,
        problemNo: "Ⅱ",
        problemTitle: "高校生の春さんは、学校のリーダーとしての取組について、田中先生・エマさん・コウタさんとオンラインで意見交換をしています。次の英文を読んで、あとの問いに答えなさい。",
        title: "School Leaders Report",
        instruction: "次の対話文を読み、あとの設問に答えなさい。",
        conversation: [
            {
                speakerName: "Ms. Tanaka",
                role: "teacher",
                avatar: "teacher_woman.png",
                text: "Hello, everyone. Today we'll report what we have done as school leaders. Please share your activities this month. Let's begin with Haru."
            },
            {
                speakerName: "Haru",
                role: "student",
                avatar: "girl2.png",
                text: "OK. This month, I helped improve the morning announcements. Many students said they couldn't hear important information, especially on rainy days. So I tested the microphone with the broadcast team and found that the volume changed depending on the classroom speaker. We made a checklist and asked teachers to turn on the correct setting before announcements. It took time, but the sound is clearer now."
            },
            {
                speakerName: "Ms. Tanaka",
                role: "teacher",
                avatar: "teacher_woman.png",
                text: "Good job. Sometimes it's important to ( ① ) before you decide what to do. Now, Emma, please."
            },
            {
                speakerName: "Emma",
                role: "student",
                avatar: "girl1.png",
                text: "Our class leaders planned a \"Culture Corner\" in the hallway. Students wanted to show their hobbies, but some were shy about speaking in front of others. So we made short poster guides and allowed students to present in small groups during lunch. We also prepared a question card so visitors could ask simple questions without feeling nervous. Many students joined, and the hallway felt more friendly."
            },
            {
                speakerName: "Ms. Tanaka",
                role: "teacher",
                avatar: "teacher_woman.png",
                text: "Nice idea. I imagine students could ( ② ) thanks to your plan. How about you, Kota?"
            },
            {
                speakerName: "Kota",
                role: "student",
                avatar: "boy2.png",
                text: "Like Emma said, making people comfortable matters. I led a team to solve a problem in PE classes. Some students often forgot their sportswear and had to sit out. Instead of only warning them, we created a \"borrow box\" with clean spare items and a simple record sheet. At first, we worried it would be messy, but it worked better than expected."
            },
            {
                speakerName: "Ms. Tanaka",
                role: "teacher",
                avatar: "teacher_woman.png",
                text: "Great effort! I'd like to ( ③ ). They must be useful. Being a leader teaches you how to support others, not only how to give orders."
            }
        ],
        note: "announcement: 校内放送",
        sections: [
            {
                id: "q1",
                title: "1 文中の(①)(②)(③)に入る適切なものを選びなさい。",
                prompts: [
                    { key: "q1_1", text: "( ① )" },
                    { key: "q1_2", text: "( ② )" },
                    { key: "q1_3", text: "( ③ )" }
                ],
                choices: [
                    { label: "ア", text: "collect facts carefully" },
                    { label: "イ", text: "make the hallway quieter" },
                    { label: "ウ", text: "feel less nervous about joining" },
                    { label: "エ", text: "clean the borrow box every day" },
                    { label: "オ", text: "see your record sheet" }
                ],
                answers: {
                    q1_1: "ア",
                    q1_2: "ウ",
                    q1_3: "オ"
                }
            },
            {
                id: "q2",
                title: "2 発言の内容に合うように、(1)(2)の( )に入る適切なものを選びなさい。",
                prompts: [
                    { key: "q2_1", text: "(1) (　　　　) is talking about helping students share something without speaking to a large audience." },
                    { key: "q2_2", text: "(2) (　　　　) is talking about finding the cause of a problem by testing equipment." }
                ],
                choices: [
                    { label: "ア", text: "Only Haru is" },
                    { label: "イ", text: "Only Emma is" },
                    { label: "ウ", text: "Only Kota is" },
                    { label: "エ", text: "Haru and Emma are" },
                    { label: "オ", text: "Haru and Kota are" },
                    { label: "カ", text: "Emma and Kota are" }
                ],
                answers: {
                    q2_1: "イ",
                    q2_2: "ア"
                }
            },
            {
                id: "q3",
                title: "3 Haruのメールの(あ)(い)に入る適切なものを選びなさい。",
                email: {
                    to: "Emma; Kota",
                    from: "Haru",
                    subject: "A quick question",
                    body: [
                        "Dear Emma and Kota,",
                        "",
                        "Thank you for your reports yesterday. I was impressed by your ideas. I have two questions.",
                        "",
                        "Emma, ( あ )? You said some students were shy, so you changed the way they presented.",
                        "Kota, ( い )? You mentioned you used a record sheet with the borrow box.",
                        "",
                        "Please tell me your advice. Thank you.",
                        "",
                        "Your friend,",
                        "Haru"
                    ]
                },
                prompts: [
                    { key: "q3_a", text: "( あ )" },
                    { key: "q3_i", text: "( い )" }
                ],
                choices: [
                    { label: "ア", text: "why did you decide to use question cards" },
                    { label: "イ", text: "how did you test the microphone on rainy days" },
                    { label: "ウ", text: "what information did students write on the record sheet" },
                    { label: "エ", text: "how many posters did you put on the wall" },
                    { label: "オ", text: "when will you hold Culture Corner again" }
                ],
                answers: {
                    q3_a: "ア",
                    q3_i: "ウ"
                }
            }
        ],
        explanation: "①は行動前の情報収集についてHaruが説明しているためア。②はEmmaの工夫で参加の緊張が和らぐ内容なのでウ。③はKotaが作成したrecord sheetを先生が見たいという流れでオ。"
    }
];
