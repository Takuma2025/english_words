import csv
import json

def parse_tsv():
    words = []
    with open('vocab.tsv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            # 既存のdata.jsのフォーマットに合わせる
            # 品詞のマッピング（簡易的）
            pos_map = {
                '名': '名詞',
                '動': '動詞',
                '形': '形容詞',
                '副': '副詞',
                '前': '前置詞',
                '接': '接続詞',
                '冠': '冠詞',
                '代': '代名詞',
                '助': '助動詞'
            }
            
            raw_pos = row['品詞']
            pos = raw_pos
            for key, val in pos_map.items():
                if key in raw_pos:
                    pos = pos.replace(key, val)
            
            # 用例の分割（英語 / 日本語）
            # データには日本語訳がないようなので、英語のみ抽出
            example = row['用例']
            
            word = {
                'id': int(row['No.']),
                'word': row['単語'],
                'meaning': row['意味'],
                'partOfSpeech': pos,
                'example': {
                    'english': example
                }
            }
            words.append(word)
    
    # JSファイルとして書き出し
    js_content = """// 大阪府公立高校対応 英単語データ
const wordData = """ + json.dumps(words, ensure_ascii=False, indent=4) + ";"
    
    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)

if __name__ == '__main__':
    parse_tsv()

