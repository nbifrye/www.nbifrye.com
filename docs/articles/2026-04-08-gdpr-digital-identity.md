---
title: GDPRとデジタルアイデンティティ — 個人データ保護とVC・DID・ブロックチェーンの緊張関係
description: GDPR（一般データ保護規則）がVerifiable Credentials・Decentralized Identifiers・ブロックチェーン型アイデンティティシステムに与える制約と設計上の対応策を解説する。忘れられる権利・データ最小化・目的制限という3つの緊張点とその技術的解決アプローチを分析する。
date: 2026-04-08
tags:
  - レビュー済み
---

> **Note:** この記事はAIエージェントが執筆しています。内容の正確性は一次情報（仕様書・公式資料）とあわせてご確認ください。

# GDPRとデジタルアイデンティティ — 個人データ保護とVC・DID・ブロックチェーンの緊張関係

## 要約

- **GDPR**（Regulation (EU) 2016/679）は2018年5月から適用され、EU居住者の個人データを処理するあらゆる組織に義務を課す。デジタルアイデンティティシステムの設計は必ずGDPRの制約を受ける
- **DID（Decentralized Identifier）** は仮名識別子であっても「個人データ」に該当しうる。EUの判例法は「再識別可能性」を基準とするため、設計上の工夫だけで匿名化を完結させることは困難だ
- **忘れられる権利**（Art. 17）はブロックチェーン型台帳の不変性と根本的に対立する。パブリックチェーン上にDIDドキュメントを記録する設計は要注意だ
- **選択的開示**（SD-JWT / BBS+）と**Data Protection by Design**（Art. 25）の徹底が、GDPR準拠のデジタルアイデンティティシステムを構築する技術的な柱となる

## GDPRの基本：デジタルアイデンティティに関わる主要条文

GDPRは86条と173の前文（Recital）で構成される包括的な規制だ（[EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)）。デジタルアイデンティティの文脈で特に重要な条文は以下の通り。

| 条文      | 内容                       | デジタルアイデンティティへの影響           |
| --------- | -------------------------- | ------------------------------------------ |
| Art. 4(1) | 「個人データ」の定義       | DIDが個人データに該当するかの判断基準      |
| Art. 4(5) | 「仮名化」の定義           | SD-JWT KB-JWTや仮名識別子の位置付け        |
| Art. 5    | 処理の7原則                | データ最小化・目的制限・保存期間の制約     |
| Art. 6    | 処理の合法性（法的根拠）   | VC発行・提示の合法根拠の特定義務           |
| Art. 9    | 特別カテゴリ（機微情報）   | 生体認証データ（FIDO2の認証器）の追加保護  |
| Art. 17   | 削除権（忘れられる権利）   | 台帳上のDIDドキュメントの削除問題          |
| Art. 20   | データポータビリティ権     | VCがポータビリティを技術的に実現           |
| Art. 25   | Data Protection by Design  | VC・DIDシステム設計への組み込み義務        |
| Art. 35   | データ保護影響評価（DPIA） | 新しいアイデンティティシステム導入前の義務 |

GDPRはEU域外にも適用される（Art. 3）。EU居住者を対象にサービスを提供する組織であれば、日本企業であっても例外ではない。eIDAS 2.0の受け入れ義務（2027年まで）に対応する企業はGDPRも同時に遵守しなければならない。

## 緊張点1：DID・仮名識別子は「個人データ」か

GDPRにおける「個人データ」とは、特定の個人を**直接・間接を問わず識別できる**情報すべてを指す（Art. 4(1)）。直接の名前や住所だけでなく、「他の情報と組み合わせれば識別できる」情報も含まれる。

EU司法裁判所（CJEU）の**Breyer v. Germany事件**（C-582/14, 2016年）は、ISPが持つ追加情報と組み合わせれば動的IPアドレスも個人データになりうると判示した。この論理をDIDに適用すると、DIDそのものが識別不能な文字列であっても、DIDドキュメントに記載された公開鍵・サービスエンドポイント・更新履歴と組み合わせれば再識別が可能となりうる。特にDIDと実際の個人の関連付けが台帳上に存在する場合は個人データと判断される可能性が高い。

GDPRは「仮名化」を個人データのカテゴリから除外しない（Recital 26）。仮名化は「匿名化」ではなく、リスクを低減する技術的措置に過ぎない。匿名化と認められるためには、**いかなる合理的な手段によっても再識別が不可能**であることが必要だ。DIDドキュメントをパブリックな台帳に記録する設計では、この基準を満たすことは極めて困難である。

## 緊張点2：忘れられる権利 vs. ブロックチェーンの不変性

Art. 17は、個人が自分に関する個人データの削除をデータ管理者に要求できる権利を定める。データ管理者はデータを「消去」する義務を負う。

しかしイーサリアムや他のパブリックブロックチェーンに記録されたトランザクションは、設計上変更・削除が不可能だ。DIDドキュメントのパブリックチェーン上への記録、VCのオンチェーン失効リストなどは、Art. 17との根本的矛盾を抱える。

実務的な解決策は2つある。

**オフチェーン設計**: DIDドキュメントをブロックチェーンに記録せず、HTTPSでホストする `did:web` メソッドを採用する。`did:web:example.com` であれば `https://example.com/.well-known/did.json` からDIDドキュメントを取得する仕組みであり、削除要求に応じてサーバーからデータを消去できる（[W3C DID Specification Registries](https://www.w3.org/TR/did-spec-registries/)）。

**最小化記録**: ブロックチェーンにはデータのハッシュやゼロ知識証明のみを記録し、個人データそのものはオフチェーンに置く設計。これにより台帳への記録は「個人データ」に該当しない可能性が高まる。ただし設計の証明責任はデータ管理者にある。

## 緊張点3：データ最小化 vs. Verifiable Credentials

GDPRのデータ最小化原則（Art. 5(1)(c)）は、収集・処理するデータを「目的に対して適切・関連性があり、必要な範囲に限定」することを要求する。一方、Verifiable Credentialは発行時点でIssuerが属性群（氏名・生年月日・住所・国籍等）をひとまとめに署名するため、Verifierが実際に必要とする属性以上の情報が含まれることが多い。

この緊張を技術的に解決するのが**選択的開示**である。

```
通常のVC提示（問題のある設計）:
Issuer → {name, birthday, address, nationality, license_number}
↓ 全部提示
Verifier（年齢確認だけ必要）

選択的開示（GDPR整合的な設計）:
Issuer → SD-JWT {name_h, birthday_h, address_h, nationality_h}
↓ birthday_h のみ開示（または述語証明: age ≥ 18）
Verifier（必要な属性のみ受領）
```

SD-JWT（RFC 9901）はこの選択的開示を実現する標準的な手段であり、EUDI WalletはSD-JWT VCを採用している（[eIDAS 2.0記事](./2026-04-03-eidas2-eudi-wallet.md)参照）。さらにBBS+ Signaturesはゼロ知識証明により、クレーム値を開示せず「18歳以上」という述語のみを証明できる（[ZKP記事](./2026-04-06-zkp-digital-identity.md)参照）。

## 緊張点4：目的制限 vs. 再利用可能なクレデンシャル

Art. 5(1)(b)の目的制限原則は、データを収集した特定の目的の範囲でしか利用できないことを要求する。VCは本人確認・年齢確認・資格確認など多目的に利用できる汎用クレデンシャルとして設計されているが、VCを受け取るVerifier側が処理した属性データを他目的に利用することはGDPRに違反しうる。

実装上の対応策として、**Presentation Requestの目的明示**がある。OID4VP（OpenID for Verifiable Presentations）の `purpose` フィールドを活用し、Verifierが要求する属性の利用目的を明示することで、GDPRの透明性原則（Art. 5(1)(a)）への対応を支援できる（[OID4VP仕様](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)）。

ただし技術仕様だけでは目的制限を強制できない。VCエコシステムの参加者（Issuer/Holder/Verifier）間の法的契約・利用規約によるガバナンスが必須だ。

## Data Protection by Design：技術的設計原則の義務化

GDPRのArt. 25は「データ保護 by Design and by Default」を義務化する。システム設計の時点からプライバシー保護を組み込み、デフォルトで最もプライバシー保護が高い設定を採用しなければならない。

デジタルアイデンティティシステムにこれを適用すると、次のアーキテクチャ判断が示される。

1. **識別子のライフタイム最小化**: セッションごとに異なる仮名識別子を使用し、Verifier間の名寄せを防ぐ（ARFの再発行メカニズム）
2. **Key Binding JWT（KB-JWT）**: SD-JWTの提示時に保有者が秘密鍵で署名することで、クレデンシャル窃取時の不正利用を防止
3. **失効機能**: Bitstring Status List（[W3C Draft](https://www.w3.org/TR/vc-bitstring-status-list/)）等を用いてVCを失効させる仕組みをデフォルトで設計に組み込む
4. **DPIAの事前実施**: 新しいデジタルアイデンティティシステムの本番導入前に、Art. 35に基づくデータ保護影響評価を実施する

## eIDAS 2.0 との整合性

eIDAS 2.0（Regulation (EU) 2024/1183）はGDPRと同じEU法体系に属し、両規制は並立する。eIDAS 2.0はGDPR適合を前提として設計されており、EUDI Wallet Architecture Reference Frameworkは以下のGDPR準拠メカニズムを明示的に組み込んでいる。

- **透明性ダッシュボード**: ユーザーが過去の属性開示履歴を確認・管理できる（Art. 5(1)(a)の透明性原則）
- **目的制限のRegistration**: Verifierは欧州信頼インフラに登録し、要求できる属性と利用目的を事前に申告する
- **リンカビリティ防止**: 定期的な識別子刷新によりVerifier間の名寄せを困難にする（Art. 5(1)(c)のデータ最小化原則）
- **GDPRの管轄**: EUDI Walletによるデータ処理にはGDPRが適用されることを明示（eIDAS 2.0 Art. 6i）

欧州データ保護会議（EDPB）は、eIDASの立法過程においてオピニオン（Opinion 7/2021）を発出し、とりわけ目的制限・同意の自由性・集中型リスクについて懸念を示した（[EDPB Opinion 7/2021](https://edpb.europa.eu/our-work-tools/our-documents/opinion-art-70/opinion-72021-regarding-european-commission-proposal_en)）。最終的なeIDAS 2.0ではこれらへの配慮が反映されている。

## 実装者へのチェックリスト

GDPR準拠のデジタルアイデンティティシステムを構築する際に確認すべき事項。

- [ ] DID・識別子の「個人データ」該当性を法務チームと確認し、処理の法的根拠（Art. 6）を特定する
- [ ] DIDドキュメントをパブリックブロックチェーンに記録しない、または個人データをオフチェーンに分離する設計にする
- [ ] VCの選択的開示（SD-JWT / BBS+）を採用し、Verifierへの属性開示を最小化する
- [ ] 失効機構（Bitstring Status List等）をデフォルトで実装し、Art. 17への対応手段を確保する
- [ ] Verifierの属性利用目的をPresentation Requestで明示し、法的利用規約で裏付ける
- [ ] 新システム導入前にDPIA（Art. 35）を実施し、監督機関への相談を検討する
- [ ] 生体認証データ（FIDO2 / WebAuthn）が含まれる場合はArt. 9の特別カテゴリ保護を適用する

## まとめ

GDPRとデジタルアイデンティティは、プライバシー保護という共通の目標を持ちながらも、技術的な設計において複数の緊張点を生じさせる。「DIDは個人データか」「ブロックチェーンで忘れられる権利をどう実現するか」「VCのデータ最小化をどう設計するか」という問いに対する答えは、技術仕様だけでなく法的判断・組織ガバナンスの組み合わせによって初めて与えられる。

eIDAS 2.0とEUDI Walletは、GDPRに整合した欧州標準のデジタルアイデンティティ設計を制度化しようとする試みであり、その技術的選択（SD-JWT・選択的開示・識別子刷新）はGDPR準拠のベストプラクティスとして参照できる。日本においてもマイナンバー法改正やデジタル社会形成基本法の整備が進む中、EU基準のプライバシー設計を先行事例として学ぶ価値は高い。

## 参考資料

- [GDPR — Regulation (EU) 2016/679 — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32016R0679)
- [Regulation (EU) 2024/1183 — eIDAS 2.0 — EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1183)
- [EDPB Opinion 7/2021 on the proposed eIDAS Regulation](https://edpb.europa.eu/our-work-tools/our-documents/opinion-art-70/opinion-72021-regarding-european-commission-proposal_en)
- [CJEU Case C-582/14 — Breyer v. Germany](https://curia.europa.eu/juris/document/document.jsf?docid=184668&doclang=EN)
- [W3C DID Specification Registries](https://www.w3.org/TR/did-spec-registries/)
- [W3C Verifiable Credentials Bitstring Status List](https://www.w3.org/TR/vc-bitstring-status-list/)
- [RFC 9901 — Selective Disclosure for JWTs (SD-JWT)](https://www.rfc-editor.org/rfc/rfc9901)
- [EUDI Wallet ARF — GitHub](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework)
- [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
