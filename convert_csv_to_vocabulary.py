#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CSVファイルから単語データを読み込んで、vocabulary-data.jsの形式に変換するスクリプト

使用方法:
python convert_csv_to_vocabulary.py csvdateset.csv output.js
"""

import csv
import json
import sys
import os
from typing import List, Dict, Any

# 品詞のマッピング（短縮形を展開）
POS_MAP = {
    '名': '名詞',
    '動': '動詞',
    '形': '形容詞',
    '副': '副詞',
    '前': '前置詞',
    '接': '接続詞',
    '冠': '冠詞',
    '代': '代名詞',
    '助': '助動詞',
    '間': '間投詞',
    '疑': '疑問詞',
    '限': '限定詞',
    '関': '関係代名詞',
    '関代': '関係代名詞',
    '疑代': '疑問詞',
    '疑形': '疑問詞',
    '疑副': '疑問詞',
}

# カテゴリー別のID範囲（既存のルールに基づく）
CATEGORY_ID_RANGES = {
    'level1': (30001, 30399),
    'level2': (30401, 30699),
    'level3': (30701, 30899),
    'level4': (31001, 31299),
    'level5': (31301, 31599),
    'LEVEL1 超重要単語400': (30001, 30399),
    'LEVEL2 重要単語300': (30401, 30699),
    'LEVEL3 差がつく単語200': (30701, 30899),
    'LEVEL4 私立高校入試レベル': (31001, 31299),
    'LEVEL5 難関私立高校入試レベル': (31301, 31599),
}


def normalize_part_of_speech(pos: str) -> str:
    """品詞を正規化する"""
    if not pos:
        return '名詞'  # デフォルト
    
    pos = pos.strip()
    
    # 改行や複数の品詞が含まれている場合の処理
    pos = pos.replace('\n', ' ').replace('\r', ' ')
    
    # 複数の品詞が連結されている場合（例：「名詞副」→「名詞」と「副詞」）、最初の品詞のみを取得
    # まず完全な形式をチェック
    full_forms = ['名詞', '動詞', '形容詞', '副詞', '前置詞', '接続詞', '冠詞', '代名詞', '助動詞', '間投詞', '疑問詞', '限定詞', '関係代名詞']
    for full_form in full_forms:
        if pos.startswith(full_form):
            return full_form
    
    # 短縮形をチェック（最初の一致のみ）
    for key, val in POS_MAP.items():
        if pos.startswith(key):
            return val
    
    # 複数の短縮形が連結されている場合、最初のもののみを処理
    # 例：「名副」→「名詞」を返す
    for key, val in POS_MAP.items():
        if key in pos:
            # 最初の出現位置を確認
            idx = pos.find(key)
            # その前後が文字でないことを確認（単語境界）
            if idx == 0 or (idx > 0 and not pos[idx-1].isalnum()):
                return val
    
    # デフォルト
    return '名詞'


def get_next_id_for_category(category: str, used_ids: set) -> int:
    """カテゴリーに基づいて次のIDを生成"""
    category_lower = category.lower().strip()
    
    if category_lower in CATEGORY_ID_RANGES:
        start_id, end_id = CATEGORY_ID_RANGES[category_lower]
        for id_num in range(start_id, end_id + 1):
            if id_num not in used_ids:
                return id_num
    
    # カテゴリーが定義されていない場合、30000番台から開始
    for id_num in range(30000, 40000):
        if id_num not in used_ids:
            return id_num
    
    # それでも見つからない場合、既存の最大ID+1
    return max(used_ids) + 1 if used_ids else 30001


def parse_csv_to_vocabulary(csv_file: str) -> List[Dict[str, Any]]:
    """CSVファイルを読み込んで単語データのリストに変換"""
    words = []
    used_ids = set()
    
    # CSVファイルのエンコーディングを自動検出
    encodings = ['utf-8', 'utf-8-sig', 'shift_jis', 'cp932', 'euc-jp']
    
    csv_data = None
    encoding_used = None
    
    for enc in encodings:
        try:
            with open(csv_file, 'r', encoding=enc) as f:
                csv_data = f.read()
                encoding_used = enc
                break
        except UnicodeDecodeError:
            continue
    
    if csv_data is None:
        raise ValueError(f"CSVファイルのエンコーディングを判別できませんでした: {csv_file}")
    
    # CSVをパース（カンマ区切りとタブ区切りの両方に対応）
    delimiter = ',' if ',' in csv_data.split('\n')[0] else '\t'
    
    lines = csv_data.strip().split('\n')
    if not lines:
        raise ValueError("CSVファイルが空です")
    
    # ヘッダー行を取得
    reader = csv.DictReader(lines, delimiter=delimiter)
    
    print(f"使用エンコーディング: {encoding_used}")
    print(f"区切り文字: {delimiter}")
    print(f"検出された列: {reader.fieldnames}")
    
    # 各行を処理
    for row_num, row in enumerate(reader, start=2):  # ヘッダー行を除くので2から開始
        try:
            # フィールドの取得（列名の大文字小文字を考慮）
            word = ''
            meaning = ''
            part_of_speech = ''
            category = ''
            appearance_count = 0
            
            # 列名のマッピング（様々な表記に対応）
            for key, val in row.items():
                key_lower = key.lower().strip()
                if 'word' in key_lower:
                    word = val.strip() if val else ''
                elif 'meaning' in key_lower or '意味' in key:
                    meaning = val.strip() if val else ''
                elif 'part' in key_lower or '品詞' in key:
                    part_of_speech = val.strip() if val else ''
                elif 'category' in key_lower or 'カテゴリー' in key or 'カテゴリ' in key:
                    category = val.strip() if val else ''
                elif 'count' in key_lower or '登場' in key or '回数' in key:
                    try:
                        appearance_count = int(val.strip()) if val and val.strip() else 0
                    except ValueError:
                        appearance_count = 0
            
            # 空の行をスキップ
            if not word and not meaning:
                continue
            
            # 必須フィールドの検証
            if not word:
                print(f"警告: {row_num}行目: 単語が空です。スキップします。")
                continue
            if not meaning:
                print(f"警告: {row_num}行目: 意味が空です。スキップします。")
                continue
            if not part_of_speech:
                print(f"警告: {row_num}行目: 品詞が空です。デフォルトで「名詞」を使用します。")
                part_of_speech = '名詞'
            if not category:
                print(f"警告: {row_num}行目: カテゴリーが空です。デフォルトで「level1」を使用します。")
                category = 'level1'
            
            # IDの生成
            word_id = get_next_id_for_category(category, used_ids)
            used_ids.add(word_id)
            
            # 意味の改行を処理（改行を削除またはスペースに変換）
            meaning_clean = meaning.replace('\n', ' ').replace('\r', ' ').strip()
            
            # 単語オブジェクトを作成
            word_obj = {
                'id': word_id,
                'word': word,
                'meaning': meaning_clean,
                'partOfSpeech': normalize_part_of_speech(part_of_speech),
                'category': category,
                'appearanceCount': appearance_count
            }
            
            words.append(word_obj)
            
        except Exception as e:
            print(f"エラー: {row_num}行目の処理中にエラーが発生しました: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    return words


def generate_js_output(words: List[Dict[str, Any]], output_file: str):
    """単語データをvocabulary-data.jsの形式で出力"""
    
    # カテゴリー別にグループ化
    words_by_category = {}
    for word in words:
        cat = word['category']
        if cat not in words_by_category:
            words_by_category[cat] = []
        words_by_category[cat].append(word)
    
    # IDでソート
    for cat in words_by_category:
        words_by_category[cat].sort(key=lambda x: x['id'])
    
    # JavaScriptコードを生成
    js_lines = []
    js_lines.append("/**")
    js_lines.append(" * CSVからインポートされた単語データ")
    js_lines.append(" * 生成日時: " + __import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    js_lines.append(" */")
    js_lines.append("")
    
    # カテゴリーごとに配列を生成
    for cat, cat_words in sorted(words_by_category.items()):
        # カテゴリー名を変数名に変換（JavaScriptの変数名として有効な形式に）
        var_name = cat.replace('・', '').replace(' ', '').replace('（', '').replace('）', '').replace('(', '').replace(')', '')
        var_name = ''.join(c for c in var_name if c.isalnum() or c in ['_', 'ー'])
        var_name = var_name[0].lower() + var_name[1:] if var_name else 'words'
        
        js_lines.append(f"// {cat}")
        js_lines.append(f"const {var_name} = [")
        
        for word in cat_words:
            js_lines.append("  {")
            js_lines.append(f"    id: {word['id']},")
            # エスケープ処理
            word_escaped = word['word'].replace('\\', '\\\\').replace('"', '\\"')
            meaning_escaped = word['meaning'].replace('\\', '\\\\').replace('"', '\\"')
            js_lines.append(f"    word: \"{word_escaped}\",")
            js_lines.append(f"    meaning: \"{meaning_escaped}\",")
            js_lines.append(f"    partOfSpeech: \"{word['partOfSpeech']}\",")
            js_lines.append(f"    category: \"{word['category']}\",")
            js_lines.append(f"    appearanceCount: {word['appearanceCount']}")
            js_lines.append("  },")
        
        js_lines.append("];")
        js_lines.append("")
    
    # 全単語を取得する関数
    js_lines.append("function getAllImportedVocabulary() {")
    js_lines.append("  return [")
    for cat in sorted(words_by_category.keys()):
        var_name = cat.replace('・', '').replace(' ', '').replace('（', '').replace('）', '').replace('(', '').replace(')', '')
        var_name = ''.join(c for c in var_name if c.isalnum() or c in ['_', 'ー'])
        var_name = var_name[0].lower() + var_name[1:] if var_name else 'words'
        js_lines.append(f"    ...{var_name},")
    js_lines.append("  ];")
    js_lines.append("}")
    
    # ファイルに書き出し
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(js_lines))
    
    print(f"\n完了: {len(words)}個の単語を {output_file} に出力しました。")
    print(f"  カテゴリー数: {len(words_by_category)}")
    print(f"  カテゴリー別内訳:")
    for cat, cat_words in sorted(words_by_category.items()):
        print(f"    - {cat}: {len(cat_words)}個")


def main():
    """メイン関数"""
    if len(sys.argv) >= 2:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) >= 3 else 'imported_vocabulary.js'
    else:
        input_file = 'csvdateset.csv'
        output_file = 'imported_vocabulary.js'
    
    if not os.path.exists(input_file):
        print(f"エラー: 入力ファイルが見つかりません: {input_file}")
        print("\n使用方法:")
        print("  python convert_csv_to_vocabulary.py <入力CSVファイル> [出力JSファイル]")
        return
    
    try:
        print(f"CSVファイルを読み込んでいます: {input_file}")
        words = parse_csv_to_vocabulary(input_file)
        
        if not words:
            print("エラー: 単語データが見つかりませんでした。")
            return
        
        print(f"\n{len(words)}個の単語を読み込みました。")
        generate_js_output(words, output_file)
        
        print("\n完了しました！")
        print(f"生成されたファイル: {output_file}")
        print("\n次のステップ:")
        print("1. 生成されたJSファイルの内容を確認してください")
        print("2. vocabulary-data.jsの適切な場所にコピー＆ペーストしてください")
        print("3. getAllVocabulary()関数に新しい配列を追加してください")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

