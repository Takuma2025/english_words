/**
 * 兵庫県公立入試 整序英作（予想問題）データ
 * 
 * 各問題は passage（英文）の中に〔あ〕〔い〕の空所があり、
 * それぞれの語群から4語を選んで正しい順に並べる形式。
 */
const hyogoSeijoQuestions = [
    {
        id: 1,
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
        }
    },
    {
        id: 2,
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
        }
    }
];
