#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
imported_vocabulary.jsの内容をvocabulary-data.jsに統合するスクリプト
"""

import re

# imported_vocabulary.jsを読み込む
with open('imported_vocabulary.js', 'r', encoding='utf-8') as f:
    imported_content = f.read()

# vocabulary-data.jsを読み込む
with open('vocabulary-data.js', 'r', encoding='utf-8') as f:
    vocab_content = f.read()

# 各配列の内容を抽出
level1_pattern = r'const level1Words = \[(.*?)\];'
level2_pattern = r'const level2Words = \[(.*?)\];'
level3_pattern = r'const level3Words = \[(.*?)\];'

level1_match = re.search(level1_pattern, imported_content, re.DOTALL)
level2_match = re.search(level2_pattern, imported_content, re.DOTALL)
level3_match = re.search(level3_pattern, imported_content, re.DOTALL)

if not level1_match or not level2_match or not level3_match:
    print("エラー: 配列が見つかりませんでした")
    exit(1)

level1_content = level1_match.group(1).strip()
level2_content = level2_match.group(1).strip()
level3_content = level3_match.group(1).strip()

# vocabulary-data.jsの対応する配列を置き換え
# level1Words
vocab_content = re.sub(
    r'const level1Words = \[.*?\];',
    f'const level1Words = [\n{level1_content}\n];',
    vocab_content,
    flags=re.DOTALL
)

# level2Words
vocab_content = re.sub(
    r'const level2Words = \[.*?\];',
    f'const level2Words = [\n{level2_content}\n];',
    vocab_content,
    flags=re.DOTALL
)

# level3Words
vocab_content = re.sub(
    r'const level3Words = \[.*?\];',
    f'const level3Words = [\n{level3_content}\n];',
    vocab_content,
    flags=re.DOTALL
)

# ファイルに書き出し
with open('vocabulary-data.js', 'w', encoding='utf-8') as f:
    f.write(vocab_content)

print("統合が完了しました！")
print(f"level1Words: {len(level1_content.split('},'))} エントリ")
print(f"level2Words: {len(level2_content.split('},'))} エントリ")
print(f"level3Words: {len(level3_content.split('},'))} エントリ")

