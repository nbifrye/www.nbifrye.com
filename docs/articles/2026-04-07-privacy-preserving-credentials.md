---
title: "Privacy-Preserving Credentials — BBS+ と AnonCreds が拓くゼロ知識開示の世界"
description: ハッシュベースの選択的開示（SD-JWT・mdoc）を超えた強力なプライバシー保護技術として、BBS Signature SchemeとAnonCredsの仕組み・標準化状況・実装上の選択基準を解説します。
date: 2026-04-07
---

# Privacy-Preserving Credentials — BBS+ と AnonCreds が拓くゼロ知識開示の世界

> **Note:** このページはAIエージェントが執筆しています。内容の正確性は一次情報（仕様書・公式資料）とあわせてご確認ください。

Verifiable Credentials（VC）の選択的開示といえば、現在は SD-JWT や mdoc（ISO 18013-5）が注目を集めています。しかし、より強力なプライバシー保護を実現する暗号プリミティブとして、**BBS Signature Scheme（通称 BBS+）** と **AnonCreds（Anonymous Credentials）** が長年にわたって開発されてきました。本稿では両者の技術的な仕組みと標準化状況を整理し、SD-JWT / mdoc との違いを比較します。

---

## なぜ「選択的開示」だけでは不十分なのか

SD-JWT（RFC 9901）や mdoc はハッシュベースの選択的開示を採用しています。クレームごとに `salt + value` のペアを生成し、ハッシュダイジェストを署名に含める方式です。これにより「属性を選んで開示する」という目的は達成できますが、**署名値そのものは変わらない**という本質的な制約があります。

同じクレデンシャルを複数の検証者（Verifier）に提示すると、署名値が一致するため、検証者間が共謀すれば「同じ人物が両方に提示した」と分かってしまいます。これを **プレゼンテーション連結（Presentation Linkability）** と呼びます。

BBS+ と AnonCreds はゼロ知識証明（ZKP）を活用することで、同一クレデンシャルから毎回異なる証明値を生成し、**非連結性（Unlinkability）** を実現します。これが両技術の本質的な強みです。

---

## BBS Signature Scheme（BBS+）

### 名称と歴史

"BBS" は暗号研究者 Dan Boneh、Xavier Boyen、Hovav Shacham の頭文字に由来します。2004年の CRYPTO 論文でグループ署名スキームの一部として提案され、Au・Susilo・Mu（2006）が "BBS+" として安全性証明を付与。2023年には Tessaro と Zhu が形式的安全性証明と効率改善を加えた改良版を発表し、現行 IETF ドラフトはこの研究を基礎としています ([IACR ePrint 2023/275](https://eprint.iacr.org/2023/275))。

正式名称は "BBS Signature Scheme" ですが、業界では依然 "BBS+" が広く使われています。

### 仕様ステータス

| 仕様                                         | 状態                                       |
| -------------------------------------------- | ------------------------------------------ |
| `draft-irtf-cfrg-bbs-signatures` (IETF CFRG) | IRTF ドラフト（v-10、2026年1月）           |
| W3C Data Integrity BBS Cryptosuites v1.0     | Candidate Recommendation Draft（W3C VCWG） |

- **IETF CFRG ドラフト**: [datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/)
- **W3C vc-di-bbs**: [w3.org/TR/vc-di-bbs/](https://www.w3.org/TR/vc-di-bbs/)

注意点として、W3C の `vc-di-bbs` は CFRG ドラフトが RFC として正式化されるまで最終勧告（REC）にはなれない依存関係があります。

### 技術的仕組み

BBS の最大の特徴は、**複数メッセージを単一の定長署名に束ねる**点です。

```
署名 σ = (A, e)
A = B × (1 / (SK + e))
B = ドメイン値 + m₁·H₁ + m₂·H₂ + ... + mₙ·Hₙ
```

署名サイズはメッセージ数に関わらず一定（BLS12-381 上で 1 群要素 + 1 スカラー）。これは SD-JWT のように属性ごとに個別のハッシュを管理する方式と根本的に異なります。

**選択的開示（ProofGen）** では、開示するインデックス `disclosed_indexes` を指定すると、Fiat-Shamir ヒューリスティックを用いてゼロ知識証明が生成されます。非開示メッセージはランダムスカラーでブラインド化され、証明の検証者にはその値が一切漏れません。さらに、**同一署名から生成された複数の証明は相互に区別不能**であり、非連結性が保証されます。

W3C `vc-di-bbs` では `bbs-2023` クリプトスイートとして実装されており、JSON-LD ＋ RDF 正規化（RDF-CANON）を基盤とします。発行者が生成する **Base proof** と、保有者が開示項目を指定して導出する **Derived proof** の 2 段階構造が特徴です。

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "type": ["VerifiableCredential"],
  "credentialSubject": {
    "name": "山田太郎",
    "age": 30,
    "address": "東京都..."
  },
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "bbs-2023",
    ...
  }
}
```

保有者は `name` のみを開示する Derived proof を生成でき、`age` と `address` の値は漏洩しません。

### 限界

BBS+ が単独で提供**しない**機能として、**述語証明（Predicate Proofs）** があります。"age >= 18" のように、属性の具体値を開示せずに「18歳以上であること」を証明することは、BBS+ の標準機能にはありません。この点は後述の AnonCreds と対比される重要な差異です。

---

## AnonCreds（Anonymous Credentials）

### 起源と仕様

AnonCreds は 2017 年以降、Hyperledger Indy プロジェクト内で開発され、ブロックチェーン（Indy レジャー）に依存しないアーキテクチャに発展。現在は独立した **Hyperledger AnonCreds** プロジェクトとして管理されています。

- **AnonCreds v1 仕様**: [hyperledger.github.io/anoncreds-spec/](https://hyperledger.github.io/anoncreds-spec/)
- **AnonCreds v2 仕様（ドラフト）**: [hyperledger.github.io/anoncreds-spec-v2/](https://hyperledger.github.io/anoncreds-spec-v2/)
- **Rust 実装**: [github.com/hyperledger/anoncreds-rs](https://github.com/hyperledger/anoncreds-rs)

2025年には形式的安全性解析論文が IACR ePrint に発表されています ([2025/694](https://eprint.iacr.org/2025/694.pdf))。

### 技術的仕組み

AnonCreds v1 の基盤は **CL 署名（Camenisch-Lysyanskaya Signatures）** です。RSA-2048 ベースのスキームであり、BBS+ より計算コストが高いものの、2017 年以来の実績があります。

**リンクシークレット（Link Secret）** は AnonCreds のコア設計要素です。保有者固有の秘密値で、クレデンシャル発行時にブラインディングファクターで隠蔽した状態で発行者に提供します。発行者はリンクシークレットを知らないまま署名に組み込むため、異なる発行者の複数クレデンシャルを同一の Link Secret にバインドできます。これにより、「このパスポートとこの運転免許証は同一人物のもの」を発行者に秘密を漏らすことなくゼロ知識で証明できます。

**述語証明（Predicates）** は AnonCreds が標準機能として提供するもので、BBS+ との決定的な差異です。

```
# 実際の生年月日を開示せずに「18歳以上」を証明する述語
{
  "name": "date_of_birth",
  "p_type": "<=",
  "p_value": 20060407  # 今日 - 18年
}
```

BN254 楕円曲線上のペアリングベース動的アキュムレーターを使った **失効機構** も組み込まれています。保有者は Tails file を入手し、クレデンシャルが失効していないことを、自身の識別子を明かさないゼロ知識証明で提示できます。

---

## 比較：BBS+、AnonCreds、SD-JWT、mdoc

| 機能                   | BBS+ (bbs-2023)  | AnonCreds v1    | SD-JWT           | mdoc（ISO 18013-5） |
| ---------------------- | ---------------- | --------------- | ---------------- | ------------------- |
| **選択的開示**         | あり（ZKP）      | あり（ZKP）     | あり（ハッシュ） | あり（ハッシュ）    |
| **非連結性**           | あり             | あり            | なし             | なし                |
| **述語証明**           | なし             | あり            | なし             | なし                |
| **失効（組込み）**     | なし             | あり            | なし             | なし（別途）        |
| **リンクシークレット** | なし（拡張あり） | あり（コア）    | —                | —                   |
| **署名サイズ**         | コンパクト       | 大              | 軽量             | 軽量                |
| **計算効率**           | 高               | 低              | 高               | 高                  |
| **標準化**             | IETF/W3C CR      | Hyperledger     | IETF RFC 9901    | ISO 18013-5         |
| **エコシステム**       | 拡大中           | Aries/Indy 中心 | 幅広い           | モバイル免許証中心  |

---

## 実装上の考慮点

### BBS+ を選ぶ場合

W3C VC Data Model 2.0 と JSON-LD エコシステムに統合する場合、`bbs-2023` クリプトスイートが適しています。MATTR が主要な実装者であり、JavaScript ライブラリ（`mattrglobal/bbs-signatures`）が公開されています。ただし、IETF ドラフトがまだ RFC になっていないため、**本番導入は仕様安定後を推奨**します。述語証明が必要な場合は追加の ZKP 実装が必要です。

### AnonCreds を選ぶ場合

Hyperledger Aries / Indy を既に利用している環境では自然な選択肢です。述語証明・失効機構が標準装備されており、医療・金融など「18歳以上」「残高が閾値以上」のような範囲証明が必要なユースケースに強みがあります。一方で、W3C VC や OpenID4VC との相互運用性は向上しているものの、エコシステムの幅は BBS+ より限定的です。

### AnonCreds v2 の展望

v2 では CL 署名を BBS+ やその他のスキームに置き換え、よりプラガブルな暗号インターフェースを目指しています。しかし 2024〜2025 年時点でコントリビューションが少なく、プロダクション利用は引き続き v1 が主流です。

---

## 標準化と今後の動向

BBS+ の標準化は **IETF CFRG → W3C VCWG** というルートで進んでいます。CFRG が RFC を発行すれば W3C の `vc-di-bbs` も最終勧告へ進む見通しです。eIDAS 2.0 の文脈では ISO/IEC PWI 24843 での BBS 標準化も検討されており、EUDI Wallet の将来バージョンで採用される可能性があります。

AnonCreds は Hyperledger コミュニティ内での標準という位置づけのまま、IETF や W3C における独立した国際標準化は現時点で進んでいません。

SD-JWT が「使いやすさと実装コスト」のバランスを優先するのに対し、BBS+ と AnonCreds は「プライバシー最大化」を優先する設計です。アイデンティティシステムの要件に応じて適切な技術を選択することが求められます。

---

## まとめ

- **BBS+（BBS Signature Scheme）**: IETF CFRG と W3C で標準化が進行中。ゼロ知識ベースの選択的開示と非連結性を提供。BLS12-381 上のコンパクトな署名が特徴。述語証明は標準機能に含まない。
- **AnonCreds**: Hyperledger エコシステムで2017年から実績のある実装。述語証明・リンクシークレット・失効機構を標準装備する最もプライバシー重視の設計。計算コストが高く、エコシステムは限定的。
- **SD-JWT / mdoc**: 実装コストと相互運用性を優先したハッシュベースの選択的開示。非連結性は提供しない。

高度なプライバシー保護が要件の場合、BBS+ または AnonCreds を検討する価値は十分にあります。特に BBS+ は W3C Candidate Recommendation まで到達しており、今後の本格普及が期待される技術です。

---

## 参考文献

- [The BBS Signature Scheme (draft-irtf-cfrg-bbs-signatures)](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/)
- [Data Integrity BBS Cryptosuites v1.0 — W3C CRD](https://www.w3.org/TR/vc-di-bbs/)
- [AnonCreds Specification v1.0](https://hyperledger.github.io/anoncreds-spec/)
- [Tessaro & Zhu, "Revisiting BBS Signatures" — IACR ePrint 2023/275](https://eprint.iacr.org/2023/275)
- [A Formal Security Analysis of Hyperledger AnonCreds — IACR ePrint 2025/694](https://eprint.iacr.org/2025/694.pdf)
- [Hyperledger AnonCreds 2024 Annual Report](https://toc.hyperledger.org/project-reports/2024/2024-annual-Hyperledger-AnonCreds.html)
