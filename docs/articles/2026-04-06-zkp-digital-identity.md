---
title: Zero Knowledge Proof とデジタルアイデンティティ — 選択的開示・非連関性の実現
description: ZKP（ゼロ知識証明）をデジタルアイデンティティに適用する技術動向を解説。BBS+ Signatures、AnonCreds、SD-JWTとのトレードオフ、EUDI Walletへの統合計画を分析する。
date: 2026-04-06
tags:
  - レビュー済み
---

> **Note:** この記事はAIエージェントが執筆しています。内容の正確性は一次情報とあわせてご確認ください。

# Zero Knowledge Proof とデジタルアイデンティティ — 選択的開示・非連関性の実現

## 要約

- ZKP（Zero Knowledge Proof）は「情報を開示せずに命題を証明する」暗号技術であり、デジタルアイデンティティに適用すると、年齢の証明や資格の確認をプライバシーを保ちながら実現できる
- 実用的な選択的開示の実現には **BBS+ Signatures**（IETF CFRG で Draft 策定中）と **AnonCreds**（Hyperledger）が主要な技術として存在する
- EU の EUDI Wallet は将来の ZKP 統合を明記しており、eIDAS 2.0 が求めるデータ最小化・非連関性の要件を満たす手段として位置づけられている
- 現行の主流実装である SD-JWT は「真の ZKP ではない」が、実装の容易さと標準化の成熟度から多くの規制対応で選ばれている

## 背景

### ZKP とは何か

Zero Knowledge Proof とは、ある命題が真であることを、その命題の内容（秘密情報）を一切開示せずに証明できる暗号プロトコルです。1985 年に Goldwasser・Micali・Rackoff によって提唱されたこの概念は、3 つの性質を要求します。

- **完全性（Completeness）**: 命題が真なら証明者は検証者を納得させられる
- **健全性（Soundness）**: 偽の命題に対して、証明者は（ほぼ確実に）検証者を騙せない
- **零知識性（Zero-knowledge）**: 検証者は「命題が真である」以外の情報を何も得られない

デジタルアイデンティティにおける直感的な応用例は「年齢証明」です。「私は 18 歳以上である」という事実を、生年月日という個人情報を開示せずに証明できます。

### SD-JWT が先行した理由

W3C Verifiable Credentials Data Model 2.0（2025 年 5 月 15 日 W3C Recommendation）や EU の EUDI Wallet では、選択的開示の実装として SD-JWT VC が広く採用されています。SD-JWT は秘密にしたいクレームをハッシュ化し、開示時にプレーンテキストとともに提示する仕組みです。「真の ZKP ではない」ものの、JWT の延長線上で実装できる手軽さから、規制対応の速度が求められる場面で選ばれました。

## ZKP ベースの選択的開示技術

### BBS+ Signatures

BBS+ は複数のメッセージ（クレーム）に対して **1 つの固定サイズの署名** を生成し、保有者がその署名から任意のサブセットのみを開示した **証明（Proof）** を導出できる署名スキームです。

```
発行者 → 署名(name, age, address, nationality)
保有者 → Proof(age のみ開示、他は非開示)
検証者 → 「age が 18 以上」かつ「署名が正規の発行者によるものである」を検証
```

最大の特徴は **非連関性（Unlinkability）** です。同じ Credential から複数の Proof を生成しても、検証者はそれらが同一の Credential に由来することを証明できません。SD-JWT では同じクレームを複数回開示すると追跡可能になりますが、BBS+ では防止できます。

暗号学的基礎は BLS12-381 楕円曲線のペアリングで、IETF CFRG（Crypto Forum Research Group）が `draft-irtf-cfrg-bbs-signatures`（2026 年 1 月時点で第 10 版）として仕様化を進めています（[IETF Datatracker](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/)）。W3C も Data Integrity BBS Cryptosuites v1.0（[W3C Candidate Recommendation Draft](https://www.w3.org/TR/vc-di-bbs/)、2025 年 4 月現在）として Verifiable Credentials における利用方法を規定しています。

### AnonCreds

Hyperledger AnonCreds は **CL 署名（Camenisch-Lysyanskaya signature）** に基づく匿名認証情報スキームです。BBS+ と同様に選択的開示と非連関性を提供しますが、さらに **述語証明（Predicate Proof）** が可能です。例えば「age ≥ 18」という不等式を、age の値を開示せず証明できます。

```json
// AnonCreds の述語証明の概念
{
  "requested_predicates": {
    "age_pred": {
      "name": "age",
      "p_type": ">=",
      "p_value": 18
    }
  }
}
```

カナダ・ブリティッシュコロンビア州政府は SSI 基盤の Verifiable Credential 発行に AnonCreds を本番採用しています。ただし、AnonCreds の仕様は現時点で Hyperledger が管理するものであり、IETF 標準化には至っていません（[Hyperledger AnonCreds Spec](https://hyperledger.github.io/anoncreds-spec/)）。

### ZK-SNARKs と ZK-STARKs

汎用的な回路ベースの ZKP として ZK-SNARKs と ZK-STARKs があります。

| 特性                 | ZK-SNARKs            | ZK-STARKs                |
| -------------------- | -------------------- | ------------------------ |
| 証明サイズ           | 非常に小さい         | 大きい                   |
| 検証速度             | 高速                 | 高速                     |
| 信頼済みセットアップ | 必要（回路ごと）     | 不要（透明性）           |
| 量子耐性             | なし（楕円曲線依存） | あり（ハッシュ関数依存） |
| 実装例               | Groth16、PLONK       | StarkWare                |

アイデンティティ用途では、Groth16 や PLONK（ユニバーサルセットアップで複数回路に再利用可能）が使われますが、量子コンピュータへの対応が長期的な課題です。長期保存が必要な身分登録・不動産登録などには後量子安全な ZK-STARKs が適しています（[ZK-SNARKs vs ZK-STARKs 比較](https://arxiv.org/html/2512.10020v1)）。

## SD-JWT との比較

| 特性                      | BBS+ / AnonCreds                          | SD-JWT                                  |
| ------------------------- | ----------------------------------------- | --------------------------------------- |
| 非連関性                  | 完全（Proof は相互に無関係）              | 弱（同一クレームの再利用で追跡可能）    |
| 述語証明（age ≥ 18 など） | AnonCreds で可能                          | 不可（値の開示が必要）                  |
| 実装複雑度                | 高（専門的暗号知識が必要）                | 低（JWT の延長線）                      |
| パフォーマンス            | モバイルでは数倍の遅延                    | 軽量・高速                              |
| 標準化状況                | Draft 段階（BBS+）/ 独自仕様（AnonCreds） | RFC 9901 (SD-JWT)、W3C Note (SD-JWT VC) |
| EU 規制採用               | 将来統合計画あり                          | EUDI Wallet 初期リリースで採用          |

技術的に優れたプライバシー保護という点では BBS+/AnonCreds が優位ですが、標準化の成熟度と実装エコシステムの広さから、当面は SD-JWT が規制対応の主流です。

## EUDI Wallet と ZKP の将来計画

EU の EUDI Wallet Architecture Reference Framework（ARF）のディスカッション・ペーパーでは、ZKP 統合が検討中の技術方向性として示されています（[EUDI ARF ZKP ディスカッション](https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/latest/discussion-topics/g-zero-knowledge-proof/)）。

具体的には 2 つのアプローチが議論されています。

1. **マルチメッセージ署名ベース**: BBS+ などを用いて PID/Attestation に選択的開示と非連関性を付与する
2. **算術回路ベース**: ZK-SNARKs/STARKs を使い、`age ≥ 18` や `zip_code が 〇〇地域内` のような述語証明を実現する

現行の EUDI Wallet は SD-JWT VC で展開されており、将来のバージョンで ZKP を統合する段階的アプローチが想定されています。eIDAS 2.0 の「データ最小化」と「非連関性」要件を長期的に満たすには、ZKP 統合が不可欠と考えられています。

## 実装上の注意点

**パフォーマンス**: BBS+ の Proof 生成はデスクトップと比較してモバイル（ARM）では数倍の遅延が発生します。特に複数クレームを含む Credential でのプレゼンテーション生成は、ユーザー体験の設計に影響します（[選択的開示メカニズムの比較論文](https://arxiv.org/pdf/2401.08196)）。

**量子コンピュータ対応**: 現行の BBS+（BLS12-381 ベース）は量子耐性がなく、楕円曲線を攻撃できる量子コンピュータが実用化された場合に危殆化します。長期運用するシステムでは移行計画が必要です。

**セキュリティ監査の重要性**: ZKP の実装は数学的に高度であり、過去には ZKP 機能を使ったブロックチェーンプロジェクトで無制限のトークン発行を可能にする脆弱性が発見された事例があります。専門的な暗号レビューなしの実装は危険です。

**標準化のリスク**: `draft-irtf-cfrg-bbs-signatures` は 2026 年 7 月に失効予定です。プロダクションへの早期組み込みは、後の仕様変更への追従コストを伴います。

## まとめ

ZKP は「情報を開示せずに証明する」という強力なプライバシー保護を実現しますが、実装の複雑さ・パフォーマンス・標準化の成熟度が課題です。現時点では SD-JWT が規制対応の現実解ですが、EUDI ARF のディスカッション・ペーパーが示すとおり、ZKP への移行は中長期的な技術方向性として検討されています。

実装者は以下の判断基準を参考にしてください。

- **今すぐ規制対応が必要**: SD-JWT VC（RFC 9901）を採用し、将来の ZKP 移行を設計に織り込む
- **高プライバシー要求の Credential（医療・金融など）**: BBS+ の動向を注視し、IETF 仕様が安定したタイミングで採用を検討する
- **述語証明が必須**: AnonCreds または ZK-SNARKs ベースの実装、専門的暗号エンジニアが必要

## 参考資料

- [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/) — W3C Recommendation (May 15, 2025)
- [Data Integrity BBS Cryptosuites v1.0](https://www.w3.org/TR/vc-di-bbs/) — W3C Candidate Recommendation Draft
- [draft-irtf-cfrg-bbs-signatures](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/) — IETF CFRG Draft
- [The BBS Signature Scheme](https://identity.foundation/bbs-signature/draft-irtf-cfrg-bbs-signatures.html) — DIF
- [Hyperledger AnonCreds Specification](https://hyperledger.github.io/anoncreds-spec/) — Hyperledger
- [EUDI ARF Zero Knowledge Proof Discussion](https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/latest/discussion-topics/g-zero-knowledge-proof/) — EU Digital Identity Wallet
- [Credential Format Comparison](https://openwallet-foundation.github.io/credential-format-comparison-sig/) — OpenWallet Foundation
- [On Cryptographic Mechanisms for the Selective Disclosure](https://arxiv.org/pdf/2401.08196) — arXiv 2024
- [A Comparative Analysis of zk-SNARKs and zk-STARKs](https://arxiv.org/html/2512.10020v1) — arXiv 2024
