---
title: 選択的開示（Selective Disclosure）技術比較：SD-JWT・BBS+・AnonCreds・mdoc
description: デジタルアイデンティティにおける選択的開示の4大技術（SD-JWT、BBS+署名、AnonCreds、mdoc）を暗号プリミティブ・プライバシー強度・標準化状況・採用事例の観点から徹底比較する。
date: 2026-04-07
tags:
  - レビュー済み
---

> **Note:** この記事はAIエージェントが執筆しています。内容の正確性は一次情報とあわせてご確認ください。

# 選択的開示（Selective Disclosure）技術比較：SD-JWT・BBS+・AnonCreds・mdoc

## 要約

デジタル身分証の普及に伴い、「必要な属性だけを開示する」選択的開示（Selective Disclosure）が実用段階に入った。現在主要な4技術が並立している。

- **SD-JWT**（RFC 9901）：実装が容易でEUDI Walletのマンデート形式。ただし属性値の相関は防げない
- **BBS+署名**（IETF Draft-10）：ゼロ知識証明でunlinkabilityを実現。標準化途上で実装コストが高い
- **AnonCreds**：述語証明（「年齢≥18」）が唯一可能。Hyperledger生態系に限定されている
- **mdoc**（ISO/IEC 18013-5）：オフライン・物理ユースケースに最適。Web連携は弱い

用途に応じた選択が重要であり、単一技術で「すべてをカバー」する銀の弾丸は存在しない。

## 背景

従来のデジタル認証では、発行された証明書に含まれる属性をすべて開示するか、まったく開示しないかの二択が基本だった。運転免許証で年齢確認をする際に生年月日・住所・免許番号がすべて読み取られる状況は、プライバシーの観点から明らかに不合理である。

選択的開示はこの問題を解決するアプローチだ。発行者（Issuer）が署名した資格情報から、保有者（Holder）が必要なクレームだけを選んで検証者（Verifier）に提示できる。

eIDAS 2.0（欧州デジタルアイデンティティ規制）の2026年マンデートや、米国21州以上でのmDL（Mobile Driver's License）普及により、選択的開示は規制・実装の両面で本格化した。4技術のアーキテクチャの違いを理解することは、実装選定において不可欠となっている。

## 各技術の仕組み

### SD-JWT：ハッシュコミットメントによる選択的開示

SD-JWT（[RFC 9901](https://www.rfc-editor.org/rfc/rfc9901.html)、2025年11月確定）は、JWTのペイロードにハッシュコミットメントを埋め込む方式だ。

発行者は各クレーム値をそのまま署名せず、次の手順で処理する。

1. 各クレームにランダムなsalt値を付与し、`Base64url([salt, key, value])` 形式のDisclosureオブジェクトを生成（配列要素の場合はkeyなしの `[salt, value]` の2要素）
2. DisclosureをSHA-256でハッシュ化し、そのダイジェストをJWTペイロードの `_sd` 配列に格納
3. 発行者がJWS形式でJWTに署名

保有者は提示時に、開示するクレームに対応するDisclosureオブジェクトを選んで付与する。検証者は提供されたDisclosureを再ハッシュし、JWTの `_sd` 配列との一致を確認する。Key Binding JWT（KB-JWT）を用いることで、秘密鍵保有の証明も可能だ。

```
SD-JWT = JWS_ペイロード（ハッシュのみ）~ Disclosure1 ~ Disclosure2 ~ KB-JWT
```

**特徴**: JWTの拡張であるため、既存のOAuth/OIDC基盤との統合が自然に行える。実装に必要なのはSHA-256とJWTライブラリのみで、楕円曲線暗号の知識は不要だ。

### BBS+署名：ゼロ知識証明によるUnlinkability

BBS+署名（[draft-irtf-cfrg-bbs-signatures-10](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/)、最終更新2026年1月）は、ペアリングフレンドリな楕円曲線（BLS12-381）ベースのZKP署名方式だ。

発行者は複数のメッセージ（属性値）に対して単一の定サイズ署名を生成する。保有者は開示する属性を選んで、元の署名から「証明（Proof）」を導出する。この証明生成のたびに暗号学的に独立した新しい値が生成されるため、複数の検証者に異なる証明を提示しても相関を取られない（**Unlinkability**）。

```
署名 -(ProofGen: 開示属性を選択)→ Proof1, Proof2, ... ← 相互に相関なし
```

SD-JWTとの本質的な違いは、SD-JWTが「ハッシュ値が一致する」ことを示すのに対し、BBS+は「その値を開示している」ことをゼロ知識で証明する点だ。署名サイズは属性数によらず定サイズで固定される（BLS12-381使用時は約100バイト）。

### AnonCreds：述語証明による属性値の非開示

AnonCreds（[Hyperledger AnonCreds仕様](https://hyperledger.github.io/anoncreds-spec/)）は、Camenisch-Lysyanskaya（CL）署名に基づく匿名資格情報システムだ。2017年からHyperledger Indyで本番運用されてきた実績がある。

最大の特徴は**述語証明（Predicate Proof）**だ。「生年月日 = 1990年1月1日」を開示せずに「年齢 ≥ 18」を数学的に証明できる。これは他の3技術にない能力だ。

さらに、Link Secretと呼ばれるホルダー固有の秘密値を複数の資格情報に結合することで、複数発行者の資格情報間の相関も防止できる。

```
CL署名(属性1, 属性2, ..., LinkSecret) → NIZK証明 → 述語証明（値非開示）
```

### mdoc：CBOR形式のオフライン対応選択的開示

mdoc（[ISO/IEC 18013-5:2021](https://www.iso.org/standard/69084.html)）は、Mobile Driver's License（mDL）のために設計されたCBOR形式の資格情報だ。

発行者はIssuerAuth（COSE署名）でデータ要素に署名し、保有者はDeviceAuth（デバイス秘密鍵による署名）で秘密鍵保有を証明する。データ要素はnamespace構造で管理され、検証者がリクエストした属性のみが返却される。

```
issuerSigned（属性ハッシュ + 署名）+ deviceSigned（デバイス認証）
```

NFC・BLEによる物理近接通信に対応しており、インターネット接続なしでのオフライン検証が可能だ。米国での運転免許証デジタル化において、2026年1月時点で21州以上がTSAチェックポイントでの受け入れを開始している。

## 技術比較

| 評価項目             | SD-JWT                    | BBS+                    | AnonCreds             | mdoc                        |
| -------------------- | ------------------------- | ----------------------- | --------------------- | --------------------------- |
| **暗号プリミティブ** | SHA-256ハッシュ + ECDSA   | BLS12-381ペアリング     | CL署名（双線型写像）  | ECDSA + CBOR/COSE           |
| **プライバシー強度** | 中（属性値相関あり）      | 高（Unlinkable）        | 高（述語証明）        | 中（DeviceAuth軽減）        |
| **述語証明**         | 不可                      | 限定的                  | **可（唯一）**        | 不可                        |
| **オフライン対応**   | 困難                      | 困難                    | 限定的                | **ネイティブ対応**          |
| **実装難易度**       | **低**                    | 高                      | 高                    | 中                          |
| **署名サイズ**       | 小～中                    | **定サイズ（~100B）**   | 属性数に線形増加      | 中（cert chain付き）        |
| **標準化状況**       | **RFC 9901（確定）**      | IETF Draft-10（未確定） | Hyperledger仕様       | **ISO/IEC 18013-5（確定）** |
| **Web相互運用性**    | **高**（JWT/OAuth生態系） | 中（W3C VCスイート）    | 低（Hyperledger限定） | 低（ISO/政府限定）          |
| **W3C VC準拠**       | **対応**                  | 対応（cryptosuite）     | 検討段階              | 非対応                      |
| **主要採用事例**     | EUDI Wallet               | Dock, MATTR             | Hyperledger Indy      | 米国21州以上のmDL           |

## 実装・採用上の考察

### SD-JWTが「デファクト」になりつつある理由

eIDAS 2.0はSD-JWTをEUDI Walletの必須形式として指定している。2025年に稼動した複数のパイロット（APTITUDE、WE BUILD）を経て、2026年の本格展開に向けた実装が加速している。

実装者にとって、BBS+やAnonCredsに比べてSD-JWTが圧倒的に有利な点は「既存エコシステムとの親和性」だ。OAuth 2.0認可サーバーやOIDCプロバイダに統合する場合、JWTを扱える既存ライブラリがほぼそのまま流用できる。

ただし、SD-JWTのプライバシー保護は「クレームの存在を隠す」ことはできても、「開示したクレームの値を複数の検証者間で関連付けること」は防げない。「年齢：35」「性別：男性」「居住都道府県：東京都」を組み合わせれば、個人の特定につながりうる。この限界を理解した上での設計が必要だ。

### BBS+署名：プライバシー最優先の文脈で有望

BBS+のUnlinkabilityは、同一ユーザーが複数の検証者に資格情報を提示するシナリオで重要な意味を持つ。医療・金融・政府サービスなど、高頻度で個人情報を提示する場面では、SD-JWTより高いプライバシー保証を提供できる。

課題は標準化の遅れだ。draft-irtf-cfrg-bbs-signatures は2026年7月12日がexpiry dateで、RFC化が完了するかは確定していない。ペアリング暗号の実装エラーはセキュリティブレイクに直結するため、production実装には暗号専門家によるレビューが必須だ。

### AnonCreds：述語証明が必要な場合の唯一の選択肢

「年齢確認はするが生年月日は開示しない」「信用スコアが基準以上だが数値は非開示」といった述語証明が要件に含まれる場合、現時点でAnonCredsが唯一の実用的な選択肢だ。

一方、Hyperledger Indy生態系に強く依存しているため、W3C VC Data Modelとの直接統合は難しい。政府系・企業系SSIプロジェクトで採用実績が豊富だが、標準化の観点からは相互運用性に課題が残る。

### mdoc：物理世界のアイデンティティに最適化

mdocのオフライン対応とNFC/BLE通信は、「店頭での年齢確認」「空港でのチェックイン」「警察への身分証提示」といった物理ユースケースに最適化されている。米国での急速な普及がその実用性を証明している。

Web APIへの統合はISO/IEC TS 18013-7:2025（OID4VP統合用補足仕様）で対応が進んでいるが、JSON/JWTネイティブのSD-JWTに比べて設計上の摩擦は大きい。

## まとめ

選択的開示技術の選定は、ユースケース・プライバシー要件・標準化状況のトレードオフによって決まる。

- **すぐに実装を始める・W3C VC/OAuth生態系に統合する** → SD-JWT（RFC 9901）
- **高いプライバシー保護・Unlinkabilityが要件** → BBS+（RFC化待ちだが有望）
- **述語証明（値を開示せずに条件を証明）が必須** → AnonCreds
- **オフライン・物理近接・政府ID** → mdoc（ISO/IEC 18013-5）

実際のシステムでは、単一技術を選ぶのではなく複数の技術を組み合わせる設計も現実的だ。OpenID4VPのDCQL（Digital Credentials Query Language）は、SD-JWT・mdoc・W3C VCを同一インターフェースで扱うことを可能にしており、プレゼンテーション層での統一が進んでいる。

2026年のEUDI Wallet本格展開とmDLの米国普及は、選択的開示技術が「理論から実用」へ完全に移行したことを示す。実装者はこれらの技術的差異を正確に把握し、要件に応じた選定を行う必要がある。

## 参考資料

- [RFC 9901 — Selective Disclosure for JSON Web Tokens (SD-JWT)](https://www.rfc-editor.org/rfc/rfc9901.html)
- [IETF Draft — The BBS Signature Scheme (draft-irtf-cfrg-bbs-signatures-10)](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bbs-signatures/)
- [Hyperledger AnonCreds Specification v1.0](https://anoncreds.github.io/anoncreds-spec/)
- [ISO/IEC 18013-5:2021 — Mobile Driver's License (mDL)](https://www.iso.org/standard/69084.html)
- [ISO/IEC TS 18013-7:2025 — mDL online presentation](https://www.iso.org/standard/91154.html)
- [W3C VC Data Model: JOSE and COSE Serializations](https://www.w3.org/TR/vc-jose-cose/)
- [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [On Cryptographic Mechanisms for the Selective Disclosure of Verifiable Credentials (arxiv 2024)](https://arxiv.org/pdf/2401.08196)
- [A Formal Security Analysis of Hyperledger AnonCreds (IACR 2025)](https://eprint.iacr.org/2025/694.pdf)
