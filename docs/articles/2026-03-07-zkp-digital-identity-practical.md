# ZKP がデジタルアイデンティティに本格上陸——Google Longfellow から EUDI Wallet まで

> Zero Knowledge Proof は「数学的理論」から「ブラウザで動く実装」へと変わり始めた。2025年を境に、標準化・プラットフォーム対応・ウォレット要件が一気に揃いつつある現状を整理する。

## はじめに

Zero Knowledge Proof（ZKP）はデジタルアイデンティティ界隈で長らく「将来の技術」として語られてきた。プライバシー保護・選択的開示・非連結性を数学的に保証できる一方、計算コストの高さ・標準化の未成熟・エコシステムの断片化が実用化の壁だった。

ところが 2025年〜2026年にかけて状況が急変している。Google が ZKP ライブラリをオープンソース化し、EU は EUDI Wallet の要件として ZKP を明記し、主要ブラウザの Digital Credentials API（DC API）が ZKP プロトコルを受け入れる形で出荷された。「理論」から「実装」へのシフトが始まった今、何が起きているのかを追う。

## Google Longfellow ZK——mDL × ZKP の現実解

2025年7月、Google は [Longfellow ZK](https://github.com/google/longfellow-zk) をオープンソース公開した。このライブラリが解決しようとした問題は明確だ。

mDL（ISO 18013-5/mdoc）は現在、発行者の ECDSA 署名をそのまま検証者に提示する設計になっている。これは「誰がどのサービスに提示したか」を発行者が理論的に追跡できる構造であり、プライバシー的に問題がある。ZKP を使えば「有効な署名が存在すること」を証明しつつ、署名そのものを明かさずに済む。

Longfellow は Ligero スキームと Sum-Check プロトコルを組み合わせ、ECDSA 署名に対して ZK プルーフを生成する。モバイル端末でのプルーフ生成が約 1.2 秒（ECDSA 単体なら 60ms）という実用水準を達成している。2025年11月の IETF 124 では CFRG（暗号研究グループ）にドラフトを提出済みだ。

ここで重要な点がある。Longfellow は mDL の既存インフラを壊さずに ZKP を「後付け」できる設計になっている。発行側の変更なしに、提示フローだけを ZKP 化できる。これは現実的な移行戦略として説得力がある。

## DC API・OpenID4VP との接続

2025年9月末に出荷された Chrome は、プロトコル非依存の形で DC API を実装した。OpenID4VP と ISO 18013-7 Annex C の双方に対応し、Safari 26.0 も org-iso-mdoc 形式をサポートする。

DC API はブラウザとウォレット間の橋渡しレイヤーであり、上位プロトコル（OpenID4VP、mdoc）が何を使うかは問わない設計だ。これは ZKP プロトコルとの相性がよい。Longfellow ZK が生成したプルーフを DC API 経由でブラウザが仲介し、RP（依拠当事者）へ届けることが技術的に可能になっている。

OpenID4VP は 2025年6月末に最終公開されており、DC API との統合も仕様に織り込まれている。ZKP ベースのプレゼンテーションが「既存の OpenID エコシステムに乗る」形になりつつあることは、エコシステム展開の観点から重要だ。

## EUDI Wallet が ZKP を義務化へ

EU の eIDAS 2.0 は 2026年12月までに加盟国がデジタルウォレットをリリースすることを義務づけている。その技術要件を定める EUDI ARF（Architecture and Reference Framework）は、ZKP に関して明示的な要求を列挙している：

- **選択的開示**（必要な属性のみ提示）
- **非連結性**（複数の提示間でユーザーが追跡されない）
- **レンジプルーフ**（「21歳以上」を年齢を明かさずに証明）
- **プライバシー保護失効確認**（失効状態をプライバシーを守りながら検証）
- **Issuer Hiding**（どの発行者からのクレデンシャルかを隠す）

このレベルの要求を満たすには SD-JWT VC の選択的開示だけでは不十分で、本格的な ZKP が必要になる。ドイツ SPRIND は ZKP 実装のサンドボックスを 2026年に拡張予定で、具体的な実装が動き始めている。

Groth16 は EUDI Wallet の ZKP 実装候補として評価が進んでいる。Groth16 は検証が高速（定数時間）な一方、信頼できるセットアップが必要という課題があり、EUDI の本番環境での採用にはガバナンス上の論点も残る。

## BBS+——選択的開示の実用的候補

標準化の観点で今最も現実感があるのは BBS+ だ。IETF CFRG でドラフト標準化が進んでいる BBS+ は次の特性を持つ：

- **選択的開示**：クレデンシャル内の任意のクレームサブセットを開示できる
- **非連結性**：同一クレデンシャルを複数回提示しても、提示間で相関をとられない
- **署名集約**：複数のメッセージに対して1つの短い署名を生成できる

SD-JWT VC は選択的開示に対応するが「非連結性」は提供しない（毎回同じクレデンシャルを提示すると相関が生じる）。BBS+ はこの弱点を解消できる。mDL の問題と合わせ、既存フォーマットの ZKP 拡張として現実的な位置づけだ。

## SD-JWT VC・mDL との共存関係

ZKP は既存フォーマットを置き換えるのではなく、拡張するレイヤーとして機能する方向が主流だ：

- **mDL + Longfellow ZK**：既存 mDL を変更せず、提示フローだけを ZKP 化
- **SD-JWT VC + BBS+**：発行時に BBS+ 署名を使い、提示で選択的開示と非連結性を実現
- **W3C VC 2.0**：選択的開示と ZKP に対応したデータモデルを確定済み

「どのフォーマット vs. ZKP」という競合ではなく、「フォーマット × ZKP 署名スキーム」の組み合わせが現実解になっている。

## 標準化の現在地

| 標準化体 | 内容 | ステータス |
|---------|------|----------|
| IETF CFRG | BBS+ ドラフト | 標準化進行中 |
| IETF CFRG | Longfellow ZK ドラフト | 2025年11月提出 |
| W3C | VC Data Model 2.0（ZKP 対応） | 勧告確定 |
| OpenID Foundation | OpenID4VP Final（DC API 統合） | 2025年6月最終公開 |
| EUDI ARF | ZKP 要件明記 | ARF に組み込み済み |

W3C・OpenID Foundation・IETF・FIDO Alliance・ISO という通常は独立して動く標準化体が、ZKP 周りで協調し始めているのが今の特徴だ。

## まとめと展望

ZKP がデジタルアイデンティティに「本格上陸」と言える理由は三つある。

第一に、**Longfellow ZK のオープンソース化**によって、誰でも使える実装が登場した。mDL の既存インフラに乗れる設計は実用化の最大の障壁（エコシステム変更コスト）を大きく下げる。

第二に、**DC API という共通インターフェース**が主要ブラウザに乗った。ZKP プロトコルが何であれ、ブラウザ〜ウォレット間の統一窓口ができたことで、RP が複数の ZKP 実装を個別に扱う必要がなくなりつつある。

第三に、**EUDI Wallet の義務要件**が ZKP を「オプション」から「必須」に引き上げた。EU 市場への参入を考えるウォレット実装者は ZKP 対応を避けられない。

課題も残る。Longfellow の 1.2 秒のプルーフ生成時間はユーザー体験として許容範囲だが、より低スペックなデバイスでの性能は未知数だ。Groth16 の信頼されたセットアップ問題、BBS+ の標準化完了時期など、本番環境への道のりはまだある。

ただ方向性は明確になった。2026年以降、ZKP は「プライバシーを本気で考えるシステム」の必須コンポーネントになっていく。

## 参考

- [Google Longfellow ZK — GitHub](https://github.com/google/longfellow-zk)
- [Google ZKP オープンソース化ブログ](https://blog.google/technology/safety-security/opening-up-zero-knowledge-proof-technology-to-promote-privacy-in-age-assurance/)
- [IETF CFRG — Longfellow ZK ドラフト](https://datatracker.ietf.org/doc/draft-google-cfrg-libzk/)
- [EUDI ARF — Zero Knowledge Proof ディスカッション](https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/latest/discussion-topics/g-zero-knowledge-proof/)
- [W3C Digital Credentials API ブログ](https://www.w3.org/blog/2025/w3c-digital-credentials-api-publication-the-next-step-to-privacy-preserving-identities-on-the-web/)
