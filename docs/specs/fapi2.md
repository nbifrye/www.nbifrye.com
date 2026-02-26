# FAPI 2.0 Security Profile — Financial-grade API セキュリティプロファイル

> **発行**: OpenID Foundation / 2025年2月 / **ステータス**: Final
> **著者**: Dave Tonge, Daniel Fett, Nat Sakimura, John Bradley, Torsten Lodderstedt 他 FAPI WG
> **関連仕様**: FAPI 2.0 Attacker Model, FAPI 2.0 Message Signing

---

## 概要

FAPI 2.0 Security Profile は、OpenID Foundation の FAPI Working Group が策定した金融グレード API 向けセキュリティプロファイルである。OAuth 2.0 と OpenID Connect を基盤としつつ、Authorization Code Flow + PAR + DPoP（または mTLS）の組み合わせを必須とすることで、高度な攻撃者モデルに対しても安全な API アクセスを実現する。Open Banking・Consumer Data Right・デジタル ID などの規制要件を満たす標準実装の指針として、世界中の金融エコシステムで採用されている。

---

## 背景：なぜこの仕様が必要だったか

### FAPI 1.0 の課題

FAPI 1.0（Read-Only / Read-Write）は OAuth 2.0 に対するアドホックな強化として策定されたが、いくつかの設計上の問題を抱えていた。

- **Hybrid Flow の採用**: `response_type=code id_token` を使用したが、フロントチャネルでトークンを返すことはフラグメント漏洩やリプレイ攻撃のリスクを孕む
- **Implicit Flow の許容**: 一部のプロファイルで許容しており、現代のセキュリティ要件に合致しない
- **形式的安全性証明の欠如**: 仕様のセキュリティ特性が数学的に証明されていなかった

### FAPI 2.0 の設計思想

FAPI 2.0 はシュトゥットガルト大学（Ralf Küsters 教授らの研究グループ）の形式的セキュリティ分析を基盤に設計されており、以下の原則を貫く：

1. **フロントチャネルへの機密データ露出を最小化**: PAR でリクエストパラメータをバックチャネルへ移動
2. **ベアラートークンの廃止**: DPoP または mTLS による送信者拘束トークンを必須化
3. **単一フローへの収束**: Authorization Code Flow のみを許可し、実装の複雑性を排除
4. **証明可能なセキュリティ**: Attacker Model を公式仕様として分離し、安全性を形式的に定義

---

## 基本概念

### 保護対象リソース

FAPI 2.0 が想定する API は、不正アクセスが深刻な経済的・社会的損害をもたらすものである：

- 金融口座情報・取引履歴の参照
- 資金移動・支払い指示
- 個人の機微情報（健康・税務・行政データ）

### ロールと用語

| ロール | 説明 |
|--------|------|
| **Authorization Server (AS)** | 認可サーバー。PAR エンドポイント・トークンエンドポイントを提供 |
| **Resource Server (RS)** | 保護された API を提供するサーバー |
| **Client** | API にアクセスするアプリケーション（TPP: Third Party Provider 等） |
| **Resource Owner** | エンドユーザー（口座保有者・市民等） |

### 送信者拘束トークン（Sender-Constrained Token）

FAPI 2.0 の核心概念。アクセストークンをそれを要求したクライアントに暗号学的に紐付けることで、トークンが第三者に漏洩しても利用不能にする。実現手段は2通り：

- **DPoP (Demonstration of Proof-of-Possession)**: リクエストごとにクライアントの秘密鍵で署名した JWT を提示
- **mTLS (Mutual TLS)**: クライアント証明書のサムプリントをトークンに埋め込む

---

## プロトコルフロー詳細

### 必須コンポーネントと組み合わせの理由

FAPI 2.0 は Authorization Code Flow + PAR + 送信者拘束トークンを組み合わせることで多層防御を実現する：

```
[Client]                    [Authorization Server]            [Resource Server]
   |                               |                                |
   |--- POST /par ---------------→|                                |
   |    (client_id, scope,         |                                |
   |     code_challenge, etc.)     |                                |
   |←-- {request_uri} -----------|                                |
   |                               |                                |
   |--- GET /authorize?           |                                |
   |    client_id=...             |                                |
   |    request_uri=urn:xxx ----→|                                |
   |         [ユーザー認証・同意]  |                                |
   |←-- redirect?code=... -------|                                |
   |                               |                                |
   |--- POST /token (+ DPoP) ---→|                                |
   |    code=..., code_verifier   |                                |
   |←-- {access_token (DPoP拘束)}|                                |
   |                               |                                |
   |--- GET /resource (+ DPoP) ----------------------------→     |
   |←-- {resource data} ----------------------------------------|
```

**各コンポーネントが防ぐ攻撃:**

- **PAR**: 認可リクエストのパラメータ改ざん・フロントチャネルでのスコープ漏洩を防止。短命な `request_uri` のみが URL パラメータとして渡される
- **PKCE**: 認可コード横取り攻撃（Authorization Code Interception Attack）を防止。PAR と組み合わせることでコードチャレンジ自体の改ざんも防止
- **DPoP**: 盗まれたアクセストークンの再利用を防止。秘密鍵なしではトークンを利用できない

### クライアント認証

FAPI 2.0 は以下の強いクライアント認証方式のみを許可する：

| 認証方式 | 説明 |
|---------|------|
| **private_key_jwt** | 非対称鍵によるクライアント認証（推奨） |
| **tls_client_auth** | mTLS による PKI ベース認証 |
| **self_signed_tls_client_auth** | 自己署名証明書による mTLS |

`client_secret_basic` / `client_secret_post` は MUST NOT（パスワードベース認証の廃止）。

### FAPI 2.0 Message Signing（補足仕様）

基本プロファイルとは別に、リクエスト・レスポンスの署名が必要な高保証用途向けに Message Signing プロファイルが存在する：

- **JAR (JWT-Secured Authorization Request)**: 認可リクエストを JWT で署名・暗号化
- **JARM (JWT-Secured Authorization Response Mode)**: 認可レスポンスを JWT で署名

高額取引や規制の強い用途では Message Signing も合わせて採用する。

---

## セキュリティ上の重要な考慮事項

### Attacker Model

FAPI 2.0 は専用の [Attacker Model 仕様](https://openid.net/specs/fapi-attacker-model-2_0-final.html) を公開しており、以下の攻撃者能力を前提とする：

- ネットワーク通信の傍受・改ざん（ただし TLS は破られない）
- フロントチャネル（ブラウザリダイレクト）の観察
- 被害者に悪意のあるリンクを踏ませる能力
- 脆弱なクライアントを制御下に置く能力

この攻撃者モデルに対して FAPI 2.0 の安全性が形式的に証明されている点は、他の OAuth プロファイルと一線を画す特徴である。

### 既知の脅威と対策

| 脅威 | 対策 |
|------|------|
| 認可コード傍受 | PAR + PKCE（コードチャレンジが事前にバックチャネルに送られている）|
| トークン窃盗 | DPoP / mTLS による送信者拘束 |
| Mix-Up Attack | iss パラメータ確認（RFC 9207）|
| CSRF | state / PKCE |
| リプレイ攻撃 | DPoP ノンス（jti ベース）|

---

## FAPI 1.0 との比較

| 項目 | FAPI 1.0 | FAPI 2.0 |
|------|---------|---------|
| 許可フロー | Code, Hybrid, Implicit | Authorization Code のみ |
| 送信者拘束 | mTLS のみ（一部） | DPoP または mTLS（必須） |
| 認可リクエスト | フロントチャネル or JAR | PAR 必須（+ オプションで JAR）|
| セキュリティ証明 | なし | 形式的証明あり |
| クライアント認証 | 複数方式 | 強い非対称鍵認証のみ |
| 複雑性 | Read-Only / Read-Write の2プロファイル | 単一プロファイル |

---

## 後継・関連仕様

| 仕様 | 関係 |
|------|------|
| [FAPI 2.0 Attacker Model](https://openid.net/specs/fapi-attacker-model-2_0-final.html) | セキュリティ前提を定義する補足仕様 |
| [FAPI 2.0 Message Signing](https://openid.net/specs/fapi-2_0-message-signing-final.html) | JAR/JARM を用いた署名プロファイル |
| [Grant Management for OAuth 2.0](https://openid.net/specs/fapi-grant-management.html) | 継続的認可・同意管理の拡張 |
| PAR (RFC 9126) | Pushed Authorization Requests の基盤 RFC |
| DPoP (RFC 9449) | 送信者拘束トークンの基盤 RFC |
| RAR (RFC 9396) | Rich Authorization Requests（詳細な認可記述）|

---

## 実装状況・採用

### 規制フレームワークでの採用

- **UK Open Banking**: FAPI 1.0 から 2.0 への移行が進行中
- **オーストラリア Consumer Data Right (CDR)**: ConnectID が FAPI 2.0 を採用、適合性テストスイート開発に資金提供
- **ブラジル Open Finance**: FAPI 2.0 をベース仕様として採用
- **サウジアラビア・UAE・EU（FIDA 規制案）**: FAPI 2.0 を参照している

### 実装済みプロダクト

Auth0、Keycloak、Authlete、Tyk、SecureAuth などが FAPI 2.0 対応を実装または発表している。

### OIDF 認定プログラム

OpenID Foundation は FAPI 2.0 適合性テストスイートを提供しており、認定を取得した実装は[公式リスト](https://openid.net/certification/)に掲載される。

---

## 読み解きのポイント

### PAR は必須だが JAR はオプション

PAR（バックチャネルで認可パラメータを送る）は必須だが、JAR（認可リクエストを JWT で署名）は Message Signing プロファイルで定義されており基本プロファイルではオプション。高額取引や改ざん防止が必要な用途では両方の採用が推奨される。

### DPoP ノンスで nonce リプレイを防ぐ

DPoP ヘッダーの `jti` クレームは AS/RS 側でキャッシュして重複拒否する必要がある。また RFC 9449 で定義された `DPoP-Nonce` ヘッダーを使うことで、サーバー側がノンスを発行してリプレイ攻撃をさらに強固に防止できる。FAPI 2.0 でこの運用がどこまで必須かは実装プロファイルごとに異なるため、デプロイ前に確認が必要。

### 「金融グレード」は金融業界だけではない

FAPI 2.0 は金融 API に限らず、医療・行政・eID などの高保証ユースケース全般で採用が広がっている。EUDI Wallet アーキテクチャでも FAPI 2.0 との整合性が議論されており、デジタルアイデンティティの文脈でも重要な仕様となっている。

---

## 参考

- [FAPI 2.0 Security Profile Final](https://openid.net/specs/fapi-security-profile-2_0-final.html)
- [FAPI 2.0 Attacker Model Final](https://openid.net/specs/fapi-attacker-model-2_0-final.html)
- [OpenID Foundation FAPI Working Group](https://openid.net/wg/fapi/)
