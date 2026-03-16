# OpenID Connect Core 1.0 — 認証レイヤーの基盤仕様

> **発行**: OpenID Foundation / 2014年11月（Errata Set 2: 2023年12月） / **ステータス**: Final
> **著者**: Nat Sakimura, John Bradley, Mike Jones, Breno de Medeiros, Chris Mortimore

---

## 概要

OpenID Connect Core 1.0（以下 OIDC Core）は、OAuth 2.0 の上に認証レイヤーを実装するためのコアプロトコル仕様である。OAuth 2.0 が「認可」（リソースへのアクセス許可）を扱うのに対し、OIDC Core はその仕組みを活用しながら「認証」（エンドユーザーが誰であるかの確認）を標準化する。

JWT 形式の **ID Token** を導入することで、クライアントはユーザーの認証イベントを暗号的に検証できる。現在もシングルサインオン（SSO）・フェデレーションアイデンティティの実質的な業界標準として機能しており、後継のより高度な仕様群（FAPI 2.0, OpenID4VP 等）の土台となっている。

---

## 背景：なぜこの仕様が必要だったか

OAuth 2.0 は認可フレームワークとして設計されており、**ユーザーが誰か**を伝える標準メカニズムを意図的に定義しなかった。このギャップを埋めようとした各社が独自の「ユーザー情報 API」を実装した結果、Facebook Connect・Twitter OAuth・Google OAuth2 などがそれぞれ互換性のない形式でユーザー属性を返すという断絶が生じた。

OIDC Core はこの問題を解決するために、以下を標準化した：

- **ID Token**：認証イベントを表す署名付き JWT。クライアントが自立して検証できる
- **UserInfo エンドポイント**：構造化されたユーザー属性を返す保護リソース
- **標準クレーム**：`sub`・`email`・`name` など属性名の標準セット

OAuth 2.0 を「認証に使う」行為そのものが持つ本質的な危険性（認可レスポンスの流用攻撃など）も、ID Token の設計によって緩和されている。

---

## 基本概念

| 用語                        | 定義                                                            |
| --------------------------- | --------------------------------------------------------------- |
| **OP (OpenID Provider)**    | 認証を実施し、ID Token を発行するサーバー                       |
| **RP (Relying Party)**      | OP に認証を委託するクライアントアプリケーション                 |
| **ID Token**                | 認証イベントを表す JWT（JWS 署名必須、JWE 暗号化オプション）    |
| **UserInfo エンドポイント** | アクセストークンを提示してユーザー属性を取得する保護リソース    |
| **`openid` スコープ**       | OIDC を有効にするための必須スコープ                             |
| **Claim**                   | ID Token や UserInfo レスポンスに含まれるユーザー属性の名前と値 |
| **nonce**                   | リプレイ攻撃を防ぐためにリクエストに含める一意な値              |

---

## 3つのフロー

OIDC Core は OAuth 2.0 のグラントタイプに対応する形で 3 つのフローを定義する。

### Authorization Code Flow

最もセキュアで推奨されるフロー。認可エンドポイントから「コード」を受け取り、トークンエンドポイントでトークン類と交換する。

```
RP                    OP
|                      |
|-- 認可リクエスト ---->|  response_type=code
|                      |  scope=openid
|<-- 認可レスポンス ---|  code=xxx, state=yyy
|                      |
|-- トークンリクエスト->|  code=xxx, client_secret
|<-- トークンレスポンス-|  id_token, access_token
|                      |
|-- UserInfo リクエスト>|  Bearer access_token
|<-- UserInfo レスポンス|  sub, email, name...
```

**メリット**: ID Token がブラウザを経由しない。クライアント認証が可能。
**対象**: 機密クライアント（バックエンドサーバーを持つ Web アプリ）

### Implicit Flow

すべてのトークンを認可エンドポイントから直接フラグメントで返すフロー。

```
response_type=id_token token  →  #id_token=...&access_token=...
```

**形式の区別**: OIDC Implicit Flow には `response_type=id_token`（ID Token のみ）と `response_type=id_token token`（ID Token + アクセストークン）の2形式がある。前者は ID Token が署名済み JWT（nonce・aud・iss・exp 付き）として返るため、OAuth 2.0 Implicit Grant のような根本的なセキュリティ上の欠陥はない。後者はアクセストークンが URL フラグメントに露出するため、RFC 9700 Section 2.1.2 が SHOULD NOT とする「認可レスポンスでのアクセストークン露出」に該当する。OpenID Foundation はいずれの形式も正式に非推奨とはしていないが、現在は SPA でも Authorization Code Flow + PKCE（RFC 7636）が標準とされている。

### Hybrid Flow

認可エンドポイントでトークンの一部（コードまたは ID Token）を受け取り、残りをトークンエンドポイントで取得する複合フロー。

```
response_type=code id_token  →  code=xxx, id_token=yyy (認可エンドポイント)
                             →  access_token (トークンエンドポイント)
```

認可レスポンスの `id_token` を使って認可コードの真正性を確認できる（`c_hash` クレーム）。ネイティブアプリとバックエンドが協調するシナリオで使われる。

---

## ID Token の構造

ID Token は標準的な JWT（ヘッダー.ペイロード.署名）として表現される。

### 必須クレーム

| クレーム | 説明                                                |
| -------- | --------------------------------------------------- |
| `iss`    | 発行者 URL（OP の識別子）                           |
| `sub`    | エンドユーザーの識別子（OP 内で一意、255 文字以内） |
| `aud`    | オーディエンス（RP のクライアント ID を含む）       |
| `exp`    | 有効期限（Unix 時刻）                               |
| `iat`    | 発行時刻（Unix 時刻）                               |

### 条件付きクレーム

| クレーム    | 条件                                                   |
| ----------- | ------------------------------------------------------ |
| `auth_time` | `max_age` パラメータ指定時または RP が要求する場合     |
| `nonce`     | リクエストに `nonce` が含まれた場合は必ず含める        |
| `acr`       | 認証コンテキスト（例: `urn:mace:incommon:iap:silver`） |
| `amr`       | 認証手段（例: `["pwd", "otp"]`）                       |
| `azp`       | `aud` が複数の場合は認可対象パーティーを明示           |

### Hybrid Flow 固有のクレーム

| クレーム  | 計算方法                                     |
| --------- | -------------------------------------------- |
| `at_hash` | access_token の左半分を base64url エンコード |
| `c_hash`  | code の左半分を base64url エンコード         |

これらのバインディングクレームは、認可レスポンスの改ざん検出に使われる。

---

## UserInfo エンドポイント

アクセストークン（Bearer）を提示することで、追加のエンドユーザー情報を取得できる保護リソース。

- **標準クレーム**: `name`, `given_name`, `family_name`, `email`, `email_verified`, `phone_number`, `address`, `birthdate`, `locale`, `zoneinfo` など
- **`sub` の一致**: UserInfo レスポンスの `sub` は ID Token の `sub` と一致しなければならない（攻撃者が別ユーザーのトークンに差し替えた場合を検出できる）
- **レスポンス形式**: JSON または署名付き JWT（RP が要求した場合）

---

## セキュリティ上の重要な考慮事項

### ID Token 検証（RP が必ず実施すべき手順）

1. `iss` が期待する OP の識別子と一致することを確認
2. `aud` が自身のクライアント ID を含むことを確認
3. 複数の aud がある場合、`azp` が自クライアント ID であることを確認
4. JWS 署名を OP の公開鍵（JWKS）で検証
5. `exp` が現在時刻より未来であることを確認（時計ズレは最大数分許容）
6. `iat` が著しく古くないことを確認
7. `nonce` がリクエストで送った値と一致することを確認

### 主要な脅威と対策

| 脅威                | 対策                                                       |
| ------------------- | ---------------------------------------------------------- |
| リプレイ攻撃        | `nonce` をセッションごとに一意に生成し検証                 |
| CSRF                | `state` パラメータで認可レスポンスを元のリクエストに紐付け |
| コード横取り攻撃    | PKCE（RFC 7636）を併用（Public Client では必須）           |
| ID Token の差し替え | `c_hash` / `at_hash` によるバインディング検証              |
| フィッシングサイト  | `iss` の厳格な検証・HTTPS 必須                             |

### 暗号要件

- **署名**: RS256（RSA + SHA-256）がデフォルト。HS256 も可だが共有シークレット管理に注意
- **暗号化**: JWE による暗号化はオプション（機密性が必要な場合）
- **通信**: すべてのエンドポイント通信に TLS（HTTPS）が必須

---

## 後継・関連仕様

| 仕様                      | 関係                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| RFC 6749 (OAuth 2.0)      | OIDC Core が拡張する基盤プロトコル                                   |
| RFC 7636 (PKCE)           | Public Client の Code Intercept 対策。現在のベストプラクティスで必須 |
| RFC 9126 (PAR)            | 認可リクエストを事前登録してセキュリティを強化                       |
| RFC 9101 (JAR)            | 認可リクエスト自体を署名付き JWT にする                              |
| OIDC Discovery            | OP のメタデータ（エンドポイント URL・鍵・サポート機能）の自動取得    |
| OIDC Dynamic Registration | RP がプログラムから OP に登録する仕組み                              |
| FAPI 2.0 Security Profile | OIDC Core + PAR + DPoP で高リスク環境向けにセキュリティ強化          |
| OpenID4VP                 | OIDC Core をベースに Verifiable Presentation の提示フローを定義      |
| OpenID4VCI                | Verifiable Credential の発行プロトコル（認可フロー構造を流用）       |

---

## 実装状況・採用

OIDC Core は現在、あらゆる規模のプロバイダーに実装されている事実上の業界標準である。

- **主要 IdP**: Google Identity、Microsoft Entra ID、Okta、Auth0、Ping Identity、Keycloak などすべてが OIDC Core を実装
- **政府・公共**: EU eIDAS 2.0 エコシステム・日本マイナンバーカード連携の基盤フローとして参照
- **金融**: FAPI 2.0 の土台として Open Banking API（英国・オーストラリア・ブラジル等）で採用
- **コンシューマー SSO**: 「Google でログイン」「Apple でサインイン」の技術的根幹

---

## 読み解きのポイント

### 「認可」と「認証」の混同

OAuth 2.0 のアクセストークンを「ユーザー認証に使う」行為は原理的に危険だ。アクセストークンはリソースサーバーへのアクセス権を表すものであり、クライアントはそのトークンが「誰のために」発行されたかを直接検証できない。OIDC Core の ID Token はこの問題を解決するために設計されており、`aud`・`nonce`・`iss` の検証がそのまま認証の証明になる。

### Implicit Flow は使わない（ただし「非推奨」との混同に注意）

仕様には定義されているが、現実のユースケースで Implicit Flow を新規採用する理由はない。Authorization Code Flow + PKCE の組み合わせが Public Client（SPA・ネイティブアプリ）でも確立されており、アクセストークンが URL に露出しない・リフレッシュトークンが取得できるという実用上の優位性がある。

ここで技術的な区別を整理しておく。`response_type=id_token`（アクセストークンを含まない形式）は、ID Token が署名済み JWT（nonce・aud・iss・exp 付き）として返るため、OAuth 2.0 Implicit Grant のような根本的なセキュリティ上の欠陥はない。RFC 9700 Section 2.1.2 が SHOULD NOT とする対象は「認可レスポンスでアクセストークンを返す形式」（`response_type=token` および `response_type=id_token token`）であり、純粋な `response_type=id_token` は直接の対象外だ。

一方、**OAuth 2.0 の Implicit Grant**（`response_type=token`）は RFC 9700 Section 2.1.2 で SHOULD NOT と明記され、新規採用すべきでない。**OIDC Core の Implicit Flow** は OpenID Foundation によって正式に非推奨とは宣言されていない。この区別を混同すると、標準仕様の理解として不正確になる。

### `sub` の永続性と不透明性

`sub` はエンドユーザーの識別子だが、仕様上は OP ごとにスコープされた不透明な文字列である。同一ユーザーが複数の OP を使う場合、`sub` は異なる値になる。アプリケーション側でユーザーの名寄せが必要な場合は `email` ではなく `iss` + `sub` の組み合わせを主キーとして扱うべきだ。

### クレームの「要求」と「保証」

OIDC Core では `claims` パラメータで特定クレームを要求できるが、OP がそれを返す保証はない（Essential/Voluntary の区別はあるが強制力は弱い）。重要な属性（例: `email_verified`）の有無を必ず確認し、存在しない場合のフォールバック処理を実装することが求められる。

---

## 参考

- [OpenID Connect Core 1.0 incorporating errata set 2](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://www.rfc-editor.org/rfc/rfc9700)
- [OAuth 2.0 for Browser-Based Applications (BCP)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps)
