---
title: "DID Methods 概観 — エコシステムの多様性と選択の指針"
description: Decentralized Identifiers の実装基盤である DID メソッドを体系的に解説。did:web・did:key・did:jwk・did:peer・did:ion・did:ebsi の仕様・設計思想・トレードオフと、用途別の選択指針を示す。
tags:
  - レビュー済み
---

> **Note:** このページはAIエージェントが執筆しています。内容の正確性は一次情報（仕様書・公式資料）とあわせてご確認ください。

# DID Methods 概観 — エコシステムの多様性と選択の指針

## 概要

Decentralized Identifiers（DID）Core 1.0 は識別子の構文と操作モデルを定義しますが、「どこに・どのように DID Document を格納・解決するか」は **DID メソッド** に委ねられています。各 DID メソッドは固有の識別子構文・CRUD 操作・信頼モデルを持つ独立した仕様です。

2026年時点で W3C DID Specification Registries には100を超えるメソッドが登録されていますが、実務的に使われているのは十数種に限られます。本記事では主要メソッドの設計思想・トレードオフを解説し、用途別の選択指針を示します。

なお、DID Core 自体の仕様詳細（DID Document の構造・Resolution アーキテクチャなど）は [DID Core 解説記事](./did-core.md) を参照してください。

## DID メソッドの仕組み

DID の構文は `did:<method>:<method-specific-id>` の 3 部構成です。`<method>` 部分がメソッド名を指定し、後続の `<method-specific-id>` の解釈方法はメソッド仕様が定義します。

```
did:web:example.com          → Web サーバー上の JSON ファイルを参照
did:key:z6MkiTBz1y...        → 公開鍵をそのまま識別子にエンコード
did:ebsi:2A9RkiYbYHoBu...    → EU ブロックチェーン基盤を参照
```

各 DID メソッドは以下の 4 操作（CRUD）の仕様を定義しなければなりません（[DID Core §8](https://www.w3.org/TR/did-1.0/#methods)）。

| 操作       | 内容                                   |
| ---------- | -------------------------------------- |
| Create     | DID Document を登録・生成する          |
| Read       | DID を解決して DID Document を取得する |
| Update     | DID Document を更新する                |
| Deactivate | DID を無効化する                       |

## W3C DID Specification Registries

W3C Credentials Community Group（CCG）が管理する [DID Specification Registries](https://www.w3.org/TR/did-spec-registries/) は、DID メソッドの登録と拡張プロパティの管理を担います。登録自体の技術的ハードルは低く、提出・レビュー後に掲載されます。

メソッドの「標準化」状態に注意が必要です。Registries への掲載は W3C Recommendation ではなく、メソッド仕様は多くが提出者組織や個人によって管理されるコミュニティドラフトです。活発にメンテナンスされているメソッドもあれば、数年間更新がないものも存在します。

## 主要 DID メソッド詳解

### did:key

最もシンプルなメソッドで、公開鍵素材を Multibase でエンコードして識別子とします（[did:key 仕様](https://w3c-ccg.github.io/did-key-spec/)）。レジストリや外部サーバーを必要とせず、DID Document は識別子から決定論的に導出されます。

```
did:key:z6MkiTBz1ymuepAQ4HEHYSF1H8quG5GLVVQR3djdX3mDooWp
```

**適した用途**: テスト環境・一時的な通信・プロトコル検証  
**注意点**: DID Document の更新・鍵ローテーションが不可能。長期間使用する識別子には不向きです。

### did:jwk

公開鍵を JWK（JSON Web Key）形式でエンコードする点で did:key に似ていますが、JWK を Base64url エンコードして識別子に埋め込みます（[did:jwk 仕様](https://github.com/quartzjer/did-jwk/blob/main/spec.md)）。

```
did:jwk:eyJrdHkiOiJFQyIsImNydiI6IlAtMjU2IiwieCI6Ii4uLiIsInkiOiIuLi4ifQ
```

OpenID for Verifiable Credentials（OID4VCI・OID4VP）の実装では did:jwk を holder binding に使うケースが多く、`cnf.jwk` クレームから直接 DID を派生できる利便性が評価されています。did:key と同様に鍵ローテーション不可という制約があります。

**適した用途**: OID4VC エコシステムでの一時的な holder binding・テスト

### did:web

Web サーバー上の特定パスに DID Document（`did.json`）を配置し、HTTPS で公開するメソッドです（[did:web 仕様](https://w3c-ccg.github.io/did-method-web/)）。

```
did:web:example.com          → https://example.com/.well-known/did.json
did:web:example.com:users:alice  → https://example.com/users/alice/did.json
```

既存の Web インフラ・TLS 証明書・DNS を活用できるため導入障壁が低く、企業・機関が自組織の識別子を公開するのに広く使われています。OID4VCI の Issuer 識別子としても頻繁に採用されます。

**注意点**: ドメインの所有権に信頼が依存します。ドメイン移転・DNS ハイジャック・TLS 証明書の失効が DID の信頼を損ないます。また、サーバーが停止すれば DID が解決不可能になります。「分散型」の名に反し、実質的に中央集権的な信頼モデルです。

**適した用途**: 組織・機関の長期的な識別子・VC 発行者 ID

### did:peer

2 者間（または少人数グループ）の通信を目的とし、公開レジストリを持たないメソッドです（[did:peer 仕様](https://identity.foundation/peer-did-method-spec/)）。DIF（Decentralized Identity Foundation）が策定しています。

DID Document は通信当事者間でアウトオブバンドに共有されます。プライベートな P2P 通信に適しており、識別子が公開レジストリに記録されないためプライバシーが高い反面、関係するエージェント以外は解決できません。

NumAlgo に応じて複数の生成方式があります：

- **Numalgo 0**: `did:key` 相当の単一鍵からの生成
- **Numalgo 2**: 複数の鍵・サービスエンドポイントを含む Genesis Document のハッシュ

**適した用途**: DIDComm プロトコルを用いたエージェント間通信・プライバシー重視の一時的関係

### did:ion

Microsoft が中心となって開発した Sidetree プロトコルを Bitcoin ブロックチェーン上に構築したメソッドです（[ION ホワイトペーパー](https://techcommunity.microsoft.com/blog/microsofttecharticles/announcing-ion-we-have-liftoff/493175)）。Sidetree は操作をバッチ化して IPFS に格納し、アンカーハッシュのみをブロックチェーンに記録するため、高スループットを実現します。

```
did:ion:EiClkZMDxPKqC9c-umQfTkR8vvZ9JPhl_xLDI9Nfk38w5w
```

鍵ローテーション・DID Document の更新・無効化を完全にサポートし、Bitcoin のセキュリティを基盤とした長期的な識別子として設計されています。Microsoft Entra Verified ID が採用しています。

**注意点**: Bitcoin 依存による将来的なプロトコルリスク・解決レイテンシ（数分〜数十分の確定時間）・長い DID 文字列。

**適した用途**: 長期的な組織・個人識別子・Microsoft エコシステムとの統合

### did:ebsi

欧州委員会が推進する EU ブロックチェーンサービス基盤（EBSI: European Blockchain Services Infrastructure）上のメソッドです（[did:ebsi 仕様](https://hub.ebsi.eu/eid/did-methods/natural-person/v3)）。EUDI Wallet の Architecture Reference Framework（ARF）では信頼基盤（Trust Anchor）の識別子として使用されます。

```
did:ebsi:2A9RkiYbYHoBuMV7h7dJSSXMc...
```

EBSI は EU 加盟国が共同運営する許可型ブロックチェーンであり、完全な非中央集権ではなく EU 機関による管理を前提とした設計です。ナチュラルパーソン（個人）向けと法人向けで識別子体系が異なります。

**注意点**: EU 圏外での採用は限定的。EBSI ノードへのアクセスと onboarding プロセスが必要。

**適した用途**: eIDAS 2.0 準拠の EUDI Wallet・EU 圏の信頼サービス提供者

## メソッド比較

| メソッド | 基盤         | 鍵ローテーション | 外部依存       | プライバシー | 主なユースケース        |
| -------- | ------------ | ---------------- | -------------- | ------------ | ----------------------- |
| did:key  | なし（鍵）   | 不可             | なし           | 中           | テスト・一時 holder     |
| did:jwk  | なし（JWK）  | 不可             | なし           | 中           | OID4VC holder binding   |
| did:web  | Web / DNS    | 可               | HTTPS / DNS    | 低           | 組織・VC 発行者 ID      |
| did:peer | なし（P2P）  | 限定的           | なし           | 高           | DIDComm エージェント間  |
| did:ion  | Bitcoin IPFS | 可               | Bitcoin / IPFS | 中           | 長期 ID・Enterprise     |
| did:ebsi | EU BC        | 可               | EBSI ノード    | 中           | eIDAS 2.0 / EUDI Wallet |

## 用途別選択指針

### OID4VC（Verifiable Credentials）エコシステム

発行者（Issuer）には **did:web** が第一選択です。Web サーバーへの配置だけで済み、既存の PKI との統合も容易です。保有者（Holder）の一時的な鍵バインディングには **did:jwk** または **did:key** が広く使われます。

高保証プロファイル（[OID4VC HAIP](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0-final.html)）では特定の DID メソッドを強制しない設計になっており、エコシステムの柔軟性を維持しています。

### EUDI Wallet（eIDAS 2.0）

ARF v1.x では **did:ebsi** を信頼基盤識別子として推奨しつつ、did:web も許容しています。個人識別子としての DID 採用は現時点で必須ではなく、X.509 証明書ベースの信頼チェーンと並立しています。

### エンタープライズ・長期識別子

組織識別子として長期安定性が必要な場合は **did:web**（シンプルさ優先）または **did:ion**（改ざん耐性優先）が候補です。Microsoft Entra Verified ID との統合では did:ion が推奨されます。

### プライバシー重視のエージェント通信

DIDComm ベースのウォレット間通信では **did:peer** が適しています。識別子が公開台帳に記録されないため、取引パターンの追跡が困難になります。

## エコシステムの断片化問題

DID メソッドの乱立は深刻な相互運用性の課題を生んでいます。発行者が did:web を使い、検証者が did:ebsi のみをサポートする場合、検証は失敗します。

Universal Resolver（[DIF](https://resolver.identity.foundation/)）はプラグイン型のメソッドドライバーで複数メソッドを統一的に解決しますが、プロダクション環境での採用にはドライバーの信頼性評価が必要です。

[OpenID Connect Federation](./openid-federation.md) や OID4VCI の Issuer Metadata など、DID に依存しない信頼メカニズムも台頭しています。実際、eIDAS 2.0 ARF は DID を必須とせず、X.509 ベースの信頼チェーンとの共存を認めています。DID エコシステムが真の相互運用性を達成するには、メソッドの収束または抽象化レイヤーの標準化が不可欠です。

## 実装上の注意点

### DID Document キャッシュと TTL

did:web のような外部依存メソッドでは DID Document のキャッシュ戦略が重要です。`Cache-Control` ヘッダーを適切に設定し、古い DID Document を使った検証エラーを防いでください。

### 鍵ローテーション後の後方互換性

did:ion・did:web で鍵をローテーションした後も、古い鍵で署名された過去の VC が検証可能であることを確認してください。DID Resolution の `versionTime` パラメーターを使うことで特定時点の DID Document を取得できます（[DID Resolution §7](https://w3c-ccg.github.io/did-resolution/)）。

### did:key / did:jwk の一時利用

これらのメソッドは短命なセッション用です。長期的なアイデンティティや本番環境の VC Holder バインディングに使用する場合は、鍵漏洩時の失効手段がないことを十分に考慮してください。

### メソッドのメンテナンス状況確認

DID Specification Registries 掲載メソッドの中には、仕様が数年間更新されていないものがあります。採用前に GitHub リポジトリ・Issue トラッカーの活動状況と、実際の採用事例を確認することを推奨します。

## 関連仕様

| 仕様                                                                       | 関係                             |
| -------------------------------------------------------------------------- | -------------------------------- |
| [DID Core 1.0](https://www.w3.org/TR/did-1.0/)                             | DID の基盤仕様。メソッドの前提   |
| [DID Specification Registries](https://www.w3.org/TR/did-spec-registries/) | メソッド登録・拡張プロパティ管理 |
| [DID Resolution v0.3](https://w3c-ccg.github.io/did-resolution/)           | 解決プロトコルの詳細             |
| [did:key 仕様](https://w3c-ccg.github.io/did-key-spec/)                    | W3C CCG 管理                     |
| [did:web 仕様](https://w3c-ccg.github.io/did-method-web/)                  | W3C CCG 管理                     |
| [did:peer 仕様](https://identity.foundation/peer-did-method-spec/)         | DIF 管理                         |
| [did:ebsi 仕様](https://hub.ebsi.eu/eid/did-methods/)                      | 欧州委員会・EBSI 管理            |

## 参考資料

- [W3C DID Core 1.0](https://www.w3.org/TR/did-1.0/) — 基盤仕様
- [W3C DID Specification Registries](https://www.w3.org/TR/did-spec-registries/) — メソッド登録簿
- [DIF Universal Resolver](https://resolver.identity.foundation/) — 複数メソッド対応リゾルバー
- [EBSI DID Methods](https://hub.ebsi.eu/eid/did-methods/) — EU ブロックチェーン DID 仕様
- [OID4VC HAIP 1.0](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0-final.html) — 高保証プロファイルでの DID 利用
- [EUDI ARF](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework) — EUDI Wallet アーキテクチャ参照フレームワーク
