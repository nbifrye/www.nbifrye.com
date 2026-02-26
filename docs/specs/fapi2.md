# FAPI 2.0 Security Profile — Financial-grade API Security Profile 2.0

> **発行**: OpenID Foundation / 2025年2月 / **ステータス**: Final Specification
> **著者**: Joseph Heenan, Torsten Lodderstedt, Dave Tonge ほか FAPI WG
> **関連仕様**: RFC 9126 (PAR), RFC 9449 (DPoP), RFC 9101 (JAR), RFC 9396 (RAR)

---

## 概要

FAPI 2.0 Security Profile は、OAuth 2.0 をベースとした高セキュリティAPIアクセスのためのプロファイル仕様である。かつて "Financial-grade API" を意味していた FAPI だが、2.0 では金融に限らず医療・行政・エネルギーなど高価値なリソースを扱う API 全般を対象とする汎用プロファイルへと昇華した。

仕様は **Baseline** と **Message Signing** の2つのドキュメントで構成される。Baseline は認可コードフロー + PAR + Sender-Constrained Token の組み合わせによる基本的な保護を定義し、Message Signing はリクエスト・レスポンスへの署名（JAR/JARM）を追加することで否認防止（Non-repudiation）まで対応する。

---

## 背景：なぜ FAPI 2.0 が必要だったか

FAPI 1.0（Read/Read-Write）は Open Banking の黎明期に策定され、2019年前後にオーストラリア CDR・UK Open Banking・Brazil Open Finance 等で大規模採用された。しかし設計上のいくつかの課題が顕在化した。

**FAPI 1.0 の問題点:**

- Hybrid Flow（response_type=code id_token）に依存しており、フロントチャネルでの ID Token 暴露リスクがあった
- "Read" と "Read-Write" というセキュリティレベルの区分が直感的でなく、実装者を混乱させた
- PAR が必須でなく、フロントチャネルで認可リクエストパラメータが露出する実装が許容されていた
- mTLS 必須化により、クライアント側のインフラコストが高かった

FAPI 2.0 は、これらの問題をすべてシンプルな原則に基づいて解決した。「すべての機密データはバックチャネルで交換する」というアーキテクチャ原則が全体を貫いている。

---

## 基本概念

### セキュリティレベルの構成

| プロファイル | 用途 | 主な追加要件 |
|---|---|---|
| **FAPI 2.0 Baseline** | 高価値リソースへの委譲アクセス | PAR必須・Sender-Constrained Token必須 |
| **FAPI 2.0 Message Signing** | 否認防止が必要な取引 | JAR（署名付きリクエスト）・JARM 追加 |

### 主要ロール

- **Authorization Server (AS)**: OAuth 2.0 認可サーバー。PAR エンドポイントを公開し、Sender-Constrained Token を発行する
- **Client**: APIクライアント。秘密鍵を保持し、mTLS または DPoP でトークンバインドを証明する
- **Resource Server (RS)**: 保護されたAPIエンドポイント。アクセストークンとバインド証明を検証する

### Sender-Constrained Token

FAPI 2.0 の核心的要件。発行されたアクセストークンを特定のクライアントインスタンスに紐付け、トークン窃取による不正利用を防ぐ。

**2つの実装方式:**

- **mTLS (RFC 8705)**: TLS クライアント証明書のフィンガープリントを `cnf.x5t#S256` クレームに埋め込む。インフラとしての成熟度は高いが、中間プロキシとの相性に課題がある
- **DPoP (RFC 9449)**: クライアントが生成した公開鍵を `cnf.jkt` クレームに埋め込み、API呼び出し時に秘密鍵で署名した DPoP プルーフを提示する。TLS に依存せず、マイクロサービスアーキテクチャでの導入が容易

---

## プロトコルフロー（FAPI 2.0 Baseline）

```
Client                  Authorization Server          Resource Server
  |                            |                            |
  | 1. POST /par               |                            |
  |    (client_auth + RAR)---->|                            |
  |<---request_uri-------------|                            |
  |                            |                            |
  | 2. GET /authorize          |                            |
  |    ?request_uri=...------->|                            |
  |<---code + state------------|                            |
  |                            |                            |
  | 3. POST /token             |                            |
  |    (code + DPoP Proof)---->|                            |
  |<---access_token (DPoP-bound)|                           |
  |                            |                            |
  | 4. GET /resource           |                            |
  |    Authorization: DPoP ... |                            |
  |    DPoP: <proof>-----------|--------------------------->|
  |<---protected resource------|----------------------------|
```

**各ステップの詳細:**

**Step 1: Pushed Authorization Request (PAR)**
クライアントはバックチャネルで AS の `/par` エンドポイントに認可リクエストを送信する。`client_assertion`（private_key_jwt）または mTLS によりクライアント認証を行う。RAR（Rich Authorization Requests）を使って詳細なアクセス範囲（口座番号・金額上限等）を指定できる。AS は `request_uri`（URN形式、有効期限数十秒程度）を返す。

**Step 2: Authorization Request**
クライアントは `request_uri` のみを含む最小限のパラメータでフロントチャネルリダイレクトを行う。認可リクエストの実体はすでにバックチャネルに保存されているため、URLに機密情報は露出しない。`response_type=code` のみが許可される（Hybrid Flow は廃止）。

**Step 3: Token Request with DPoP**
クライアントは認可コードと DPoP プルーフ（アクセス先URL・メソッド・タイムスタンプ・nonce を含む JWS）をトークンエンドポイントに送信する。AS は DPoP 公開鍵フィンガープリントを `cnf.jkt` クレームに埋め込んだアクセストークンを発行する。

**Step 4: API呼び出し**
クライアントは各APIリクエストで新しい DPoP プルーフを生成して付与する。RS はアクセストークンの `cnf.jkt` と DPoP プルーフの公開鍵フィンガープリントを照合し、正規クライアントからのリクエストであることを検証する。

---

## Message Signing Profile

否認防止が必要なシナリオ（高額送金・重要なデータ変更等）では Message Signing プロファイルを追加適用する。

**JAR (JWT-Secured Authorization Request, RFC 9101)**

PAR で送信するリクエストオブジェクトをクライアント秘密鍵で署名した JWT として送信する。AS は署名を検証することで、認可リクエストの完全性と送信者を確認できる。

**JARM (JWT-Secured Authorization Response Method)**

認可レスポンス（code + state）を AS 秘密鍵で署名した JWT として返す。フロントチャネルでのレスポンス改ざん・インジェクション攻撃を防ぐ。

---

## セキュリティ上の重要な考慮事項

### 必須要件（FAPI 2.0 Baseline）

- **PAR 必須**: `require_pushed_authorization_requests=true` を AS メタデータに設定し、直接の認可リクエストを拒否する
- **PKCE 必須**: `code_challenge_method=S256`。認可コードインジェクション・CSRF 攻撃への対策
- **Sender-Constrained Token 必須**: mTLS または DPoP のいずれかを選択。Bearer Token のみの実装は不可
- **クライアント認証の強化**: `private_key_jwt` または `tls_client_auth`。`client_secret_basic/post` は禁止
- **response_type=code のみ**: Token/ID Token の直接返却は禁止。Implicit Flow・Hybrid Flow は使用不可

### 主要な脅威と対策

| 脅威 | 対策 |
|---|---|
| フロントチャネルでの認可リクエスト傍受 | PAR によるバックチャネル送信 |
| アクセストークン窃取・リプレイ | DPoP/mTLS による Sender-Constrained Token |
| 認可コードインジェクション | PKCE + nonce |
| レスポンス改ざん（フロントチャネル） | JARM（Message Signing Profile） |
| 不正クライアントへのトークン発行 | private_key_jwt/mTLS によるクライアント認証 |
| オープンリダイレクト | 完全一致 redirect_uri 検証 |

### FAPI 2.0 固有の注意点

**DPoP nonce の必須化**: FAPI 2.0 は AS が DPoP nonce を要求することを推奨している。nonce なしの DPoP は事前生成された DPoP プルーフを使ったリプレイ攻撃に対して脆弱になりうる。AS は `WWW-Authenticate: DPoP error="use_dpop_nonce"` でノンスを要求し、クライアントは再試行する実装が必要。

**RAR と scope の使い分け**: 従来の `scope` パラメータは粒度が粗い。FAPI 2.0 では RAR の `authorization_details` で具体的な取引内容を指定することが推奨される。ただし RAR 自体は FAPI 2.0 の必須要件ではなく、ユースケースに応じて選択する。

---

## FAPI 1.0 との比較

| 項目 | FAPI 1.0 Advanced | FAPI 2.0 Baseline |
|---|---|---|
| フロー | Hybrid Flow（response_type=code id_token） | Authorization Code Flow のみ |
| PAR | オプション | **必須** |
| Sender-Constrained Token | mTLS 必須 | mTLS **または** DPoP（選択可） |
| クライアント認証 | private_key_jwt or mTLS | 同上（変更なし） |
| Request Object | PAR と組み合わせで使用 | Message Signing Profile で必須化 |
| ID Token 暗号化 | 推奨 | 不要（バックチャネル配信のため） |
| JARM | 必須 | Message Signing Profile で必須 |

**移行の考え方**: PAR + JARM を実装済みの FAPI 1.0 Advanced 環境は、Hybrid Flow を廃止して DPoP を追加すれば FAPI 2.0 と高い互換性を持つ。多くの認定 AS ベンダーはすでに FAPI 2.0 対応版を提供している。

---

## 後継・関連仕様

| 仕様 | 関係 | 概要 |
|---|---|---|
| RFC 9126 (PAR) | FAPI 2.0 が依存 | Pushed Authorization Requests |
| RFC 9449 (DPoP) | FAPI 2.0 が依存 | Demonstrating Proof-of-Possession |
| RFC 9101 (JAR) | Message Signing が依存 | JWT-Secured Authorization Request |
| RFC 9396 (RAR) | 推奨補完仕様 | Rich Authorization Requests |
| FAPI 2.0 Grant Management | 拡張 | 発行済みグラントの管理・取消 API |
| FAPI 2.0 Attacker Model | 参考仕様 | 設計前提の脅威モデル定義 |
| OpenID4VP + FAPI 2.0 | 組み合わせ | Wallet を使った eKYC での適用 |

---

## 実装状況・採用

### 認定プログラム

OpenID Foundation の **FAPI 2.0 Certification Program** では、AS・クライアントライブラリ・保護リソースの3種類の認定を提供している。2025年時点で Authlete、ForgeRock、Ping Identity、Connect2id 等の主要ベンダーが認定を取得。

### 主要採用エコシステム

**オーストラリア CDR（Consumer Data Right）**: 最も積極的に FAPI 2.0 への移行を進めている。ConnectID（Mastercard 系の Australia Identity Exchange）が FAPI 2.0 対応を完了し、段階的な移行ロードマップが公開されている。

**UK Open Banking**: 現在は FAPI 1.0 Advanced を要件とするが、Open Banking Limited は FAPI 2.0 対応の検討を開始。DPoP の採用が mTLS 依存のインフラコスト削減に寄与すると期待されている。

**Brazil Open Finance**: 940以上の金融機関が参加する世界最大規模の Open Finance エコシステム。FAPI 1.0 Advanced を基盤とし、FAPI 2.0 への移行ロードマップが策定中。

**欧州（eIDAS 2.0/EUDIW）**: EUDI Wallet アーキテクチャの RP 認証において、FAPI 2.0 + OpenID4VP の組み合わせが有力な候補となっている。

### 実装ライブラリ

- **Node.js**: `node-oidc-provider`（panva）— PAR・DPoP・JAR 対応
- **Java**: Authlete SDK、Keycloak（PAR・DPoP 対応）
- **Go**: `fosite`（ory）— PAR・DPoP 対応

---

## 読み解きのポイント

**「FAPI 2.0 = 金融専用」ではない**: 仕様のスコープは高セキュリティAPI全般に拡大された。医療（SMART on FHIR）・行政（GOV.UK One Login）・エネルギー分野でも採用が始まっている。「財務」というコンテキストを超えた汎用セキュリティプロファイルとして評価すべき。

**DPoP vs mTLS の選択**: FAPI 2.0 Baseline はどちらも許容するが、設計思想は異なる。mTLS はネットワーク層でのクライアント認証（PKI 依存）であるのに対し、DPoP はアプリケーション層での鍵所持証明（PKI 不要）。ゼロトラストアーキテクチャやコンテナ環境では DPoP が整合しやすい。

**PAR の有効期限設計**: PAR の `request_uri` は短命（推奨：60秒以内）でなければならないが、ユーザーがリダイレクト後にすぐ操作しないケース（モバイルアプリの起動待ち等）では UX への影響を考慮する必要がある。AS は適切な有効期限と、期限切れ時のリトライ処理を設計する必要がある。

**Attacker Model を読む**: FAPI 2.0 には仕様本体とは別に [Attacker Model](https://openid.net/specs/fapi-attacker-model-2_0-final.html) ドキュメントがある。どの脅威を想定し、どのように対策しているかが明文化されている。セキュリティレビュー時はこのドキュメントを参照することで、要件の根拠を理解できる。

---

## 参考

- [FAPI 2.0 Security Profile – Final Specification](https://openid.net/specs/fapi-security-profile-2_0-final.html)
- [FAPI 2.0 Message Signing – Final Specification](https://openid.net/specs/fapi-message-signing-2_0-final.html)
- [FAPI 2.0 Attacker Model](https://openid.net/specs/fapi-attacker-model-2_0-final.html)
- [OpenID Foundation FAPI Working Group](https://openid.net/wg/fapi/)
- [RFC 9126 – Pushed Authorization Requests](https://www.rfc-editor.org/rfc/rfc9126)
- [RFC 9449 – DPoP: Demonstrating Proof of Possession](https://www.rfc-editor.org/rfc/rfc9449)
- [RFC 9101 – JWT-Secured Authorization Request (JAR)](https://www.rfc-editor.org/rfc/rfc9101)
- [RFC 9396 – OAuth 2.0 Rich Authorization Requests](https://www.rfc-editor.org/rfc/rfc9396)
