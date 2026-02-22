# OpenID4VP 1.0 — OpenID for Verifiable Presentations

> **発行**: OpenID Foundation (Digital Credentials Protocols WG) / 2025年7月9日 / **ステータス**: Final
> **著者**: O. Terbu (MATTR), T. Lodderstedt (SPRIND), K. Yasuda (SPRIND), D. Fett (Authlete), J. Heenan (Authlete)

---

## 概要

OpenID for Verifiable Presentations（OpenID4VP）は、OAuth 2.0 を土台として、**デジタルウォレットが保有するクレデンシャルを第三者（Verifier）に安全に提示するためのプロトコル**を定義する OpenID Foundation の標準仕様である。

2021 年の最初のコミットから約 4 年の開発・議論・相互運用テストを経て、2025 年 7 月 9 日に Final Specification として公表された。支持するクレデンシャル形式は特定せず、W3C Verifiable Credentials Data Model、ISO/IEC 18013-5（mDL/mdoc）、IETF SD-JWT VC を含む複数の形式に対応する。

---

## 背景：なぜこの仕様が必要だったか

従来の OAuth 2.0 / OpenID Connect エコシステムは、**アクセストークン**や **ID トークン**という形で「認可」と「認証」を実現してきた。しかしこれらはイシュアーが管理するサーバーに依存しており、ユーザーがオフラインで保持・提示できるクレデンシャルのユースケースには対応できなかった。

EU の eIDAS 2.0 は 2026 年末までに全 EU 市民に電子 ID ウォレットの提供を義務付け、米国では NIST SP 800-63-4 が mDL/VC の受け入れを標準化した。こうした規制の要請は、**ウォレットからの提示プロトコルを共通化する仕様**の必要性を決定的なものにした。

OpenID4VP はその答えとして、OAuth 2.0 の認可フレームワークをクレデンシャル提示のチャネルとして流用し、既存の OAuth/OIDC インフラへの親和性を最大化する設計を採用した。

---

## 基本概念

### ロール

| ロール | 説明 |
|--------|------|
| **Holder / End-User** | クレデンシャルを保持し、Wallet を操作するエンドユーザー |
| **Wallet** | クレデンシャルを保管し、提示を行うアプリケーション（OAuth 2.0 の Client に相当） |
| **Verifier（Relying Party）** | クレデンシャルの提示を要求するサービス（OAuth 2.0 の Authorization Server に相当） |
| **Issuer** | クレデンシャルを発行するエンティティ（OpenID4VP の直接的なスコープ外） |

### 主要なデータ概念

- **Verifiable Credential (VC)**: Issuer が署名したクレデンシャル。属性（クレーム）を含む。
- **Verifiable Presentation (VP)**: Holder が特定のトランザクションのために作成する、1 つ以上の VC を含むコンテナ。Holder が VP に署名することで所持証明を行う。
- **VP Token**: OpenID4VP のレスポンスパラメータ。1 つ以上の VP を含む。

---

## 認可フロー

OpenID4VP は 2 種類のデバイス構成に対応する。

### Same-Device Flow（同一デバイスフロー）

Verifier と Wallet が同じデバイス上で動作する場合のフロー。ブラウザからのリダイレクトで Wallet を起動し、レスポンスは URL フラグメント（`response_mode=fragment`）またはクエリパラメータで返される。

```
End-User         Browser           Verifier          Wallet App
   |                |                  |                  |
   |---アクセス---->|                  |                  |
   |                |---Authorization Request (redirect)-->|
   |                |                  |<---(deep link)---|
   |<--Wallet UI----|                  |                  |
   |---同意-------->|                  |                  |
   |                |                  |<---VP Token------|
   |                |<--redirect(VP)---|                  |
   |<--結果---------|                  |                  |
```

### Cross-Device Flow（クロスデバイスフロー）

Verifier（PC のブラウザ等）と Wallet（スマートフォン）が別デバイスで動作する場合のフロー。QR コードを介してリクエストを渡し、Wallet が `response_mode=direct_post` でVerifier のエンドポイントに直接 VP を POST する。

```
Browser (PC)      Verifier Server    Wallet (Phone)
   |                  |                  |
   |---アクセス------->|                  |
   |<--QR コード-------|                  |
   |                  |                  |
   | (QR スキャン)     |                  |
   |                  |<----request_uri GET/POST-----------|
   |                  |-----Request Object (JAR JWT)------->|
   |                  |                  |---Wallet UI 表示-|
   |                  |                  |---ユーザー同意---|
   |                  |<------VP Token (direct_post)--------|
   |                  |                  |
   |<--検証結果--------|                  |
```

---

## 認可リクエスト

### パラメータ一覧

| パラメータ | 必須 | 説明 |
|-----------|------|------|
| `response_type` | 必須 | `vp_token` を指定（SIOPv2 併用時は `vp_token id_token`） |
| `client_id` | 必須 | Verifier の識別子。Client Identifier Prefix 形式 |
| `nonce` | 必須 | リプレイ攻撃対策のランダム値。ASCII URL safe 文字のみ |
| `response_mode` | 必須 | `direct_post` / `direct_post.jwt` / `fragment` |
| `dcql_query` | 条件必須 | DCQL 形式のクレデンシャル要求クエリ（`scope` と排他） |
| `scope` | 条件必須 | 事前定義済みスコープによる要求（`dcql_query` と排他） |
| `response_uri` | 条件必須 | `direct_post` 使用時の送信先 URI |
| `state` | 条件必須 | Holder Binding Proof 非使用時に必須（128 bit 以上のエントロピー） |
| `request_uri` | オプション | Request Object を参照で渡す場合の URI（JAR, RFC 9101） |
| `request_uri_method` | オプション | `get`（デフォルト）または `post`（wallet_nonce を送るために POST が必要） |
| `client_metadata` | オプション | Verifier のメタデータ（暗号化に必要な ephemeral 公開鍵等） |
| `transaction_data` | オプション | 電子署名等のトランザクション詳細情報 |

### リクエスト例（Same-Device）

```
openid4vp://?
  response_type=vp_token
  &client_id=https%3A%2F%2Fverifier.example.com
  &nonce=n-0S6_WzA2Mj
  &response_mode=direct_post
  &response_uri=https%3A%2F%2Fverifier.example.com%2Fcallback
  &dcql_query=...
```

---

## DCQL（Digital Credentials Query Language）

OpenID4VP 1.0 でクレデンシャル要求に使用される唯一のクエリ言語。Draft 22（2024 年 10 月）で Presentation Exchange を置き換えた（詳細は別記事を参照）。

DCQL は JSON 形式で記述し、`credentials` 配列の各要素が要求するクレデンシャルを定義する。

```json
{
  "credentials": [
    {
      "id": "my_credential",
      "format": "dc+sd-jwt",
      "meta": {
        "vct_values": ["https://credentials.example.com/identity_credential"]
      },
      "claims": [
        {"path": ["given_name"]},
        {"path": ["family_name"]},
        {"path": ["birthdate"]}
      ]
    }
  ]
}
```

`credential_sets` を使えば「A または B」「A かつ B」といった複合条件も表現できる。

---

## Client Identifier Prefix（Verifier 認証）

OpenID4VP 1.0 は `client_id_scheme`（旧称）を廃止し、**Client Identifier Prefix** の概念を採用した。`client_id` の先頭にプレフィックス（`<scheme>:`）を付けることで認証方式を指定する。プレフィックスがない場合は `pre-registered` として扱われる。

| Prefix | 説明 | JAR 必須 |
|--------|------|----------|
| なし（pre-registered） | RFC 6749 デフォルト。AS に事前登録済みのクライアント | 任意 |
| `redirect_uri:` | Verifier のリダイレクト URI を識別子として使用 | 不可 |
| `x509_san_dns:` | X.509 証明書の DNS SAN に一致する FQDN | 必須 |
| `x509_san_uri:` | X.509 証明書の URI SAN に一致する URI | 必須 |
| `decentralized_identifier:` | DID（Decentralized Identifier）。DID URL で鍵を解決 | 必須 |
| `verifier_attestation:` | 信頼された発行者からの Verifier Attestation JWT を使用 | 必須 |
| `openid_federation:` | OpenID Federation のエンティティ識別子 | 必須 |

### `verifier_attestation` の仕組み

信頼できるエコシステム事業者が発行した Verifier Attestation JWT を、JAR Request Object の JOSE ヘッダー（`jwt`クレーム）に含める。Wallet はその JWT を検証することで Verifier の正当性を確認する。登録不要で動的にトラストを確立できるため、HAIP や EUDI Wallet で推奨される方式。

---

## リクエストの参照渡しと wallet_nonce

Cross-Device Flow では、QR コードサイズを最小化するために Request Object を参照（`request_uri`）で渡す。Wallet はその URI に対して HTTP GET または HTTP POST でリクエストする。

`request_uri_method=post` の場合、Wallet は POST ボディに以下を含めることができる：

```
wallet_nonce=<wallet_generated_nonce>
wallet_metadata=<wallet_metadata_json>
```

Verifier はこの `wallet_nonce` を Request Object（JAR JWT）内に埋め込んで署名して返す。Wallet は自分が生成した nonce が Request Object に含まれていることを検証することで、**リクエストオブジェクト自体のリプレイ攻撃を防止**できる。

---

## JWT-Secured Authorization Request（JAR）

多くの Client Identifier Prefix では、認可リクエストを JWT として署名することが必須（JAR, RFC 9101）。

- `typ` ヘッダー: `oauth-authz-req+jwt`
- `x5c` ヘッダー: X.509 スキームでの証明書チェーン
- `iss` クレーム: 存在しても Wallet は無視する

Request Object を `request_uri` で参照渡しする場合、Wallet はその URI を取得して完全なリクエストパラメータを展開したうえでバリデーションを行う。

---

## レスポンス

### Response Mode

| モード | 説明 | 主な用途 |
|--------|------|---------|
| `fragment` | URL フラグメントでレスポンスを返す（デフォルト） | Same-Device |
| `direct_post` | Wallet が `response_uri` に HTTP POST | Cross-Device |
| `direct_post.jwt` | HTTP POST + 暗号化（unsigned, encrypted JWE） | Cross-Device + 機密性強化 |

`direct_post.jwt` では、Verifier の `client_metadata` から提供された ephemeral 公開鍵で JWE として暗号化する。これにより、ブラウザリダイレクトを経由しても VP の内容が漏洩しない。

### VP Token の構造

`vp_token` パラメータには 1 つ以上の VP が含まれる。クレデンシャル形式ごとに異なる表現が使われる。

| 形式識別子 | VP の表現 |
|-----------|----------|
| `dc+sd-jwt` | Issuer-signed JWT + Disclosures + KB-JWT（Key Binding JWT） |
| `mso_mdoc` | base64url エンコードされた CBOR DeviceResponse |
| `jwt_vc_json` | W3C VC JWT 形式の Verifiable Presentation |
| `ldp_vc` | JSON-LD Linked Data Proof 形式の VP |

### nonce binding

Wallet は VP を生成する際に、Verifier の `nonce` と `client_id` を VP に cryptographic に結合（bind）しなければならない。Verifier は受信後、VP に含まれるこれらの値が送信したリクエストと一致することを必ず検証する。

---

## Transaction Data

電子署名などのユースケースで、クレデンシャルと「何に同意したか」を結びつけるための仕組み。

```json
"transaction_data": [
  {
    "type": "https://example.com/payment",
    "credential_ids": ["my_credential"],
    "amount": "100.00",
    "currency": "EUR"
  }
]
```

- `type`: トランザクション種別 URI
- `credential_ids`: 関連する DCQL クエリの credential ID
- Wallet は未知の `type` を検出した場合はエラーを返さなければならない
- Wallet は Transaction Data を Holder の確認画面に表示する義務がある

---

## Digital Credentials API との統合

W3C の Digital Credentials API（DC API）は、ブラウザがウォレットを仲介する API である。OpenID4VP は DC API と組み合わせることで、以下の利点を得られる。

- OS レベルでのウォレット選択 UI（複数ウォレットがある場合）
- プロトコル識別子として `openid4vp-v1-unsigned` 等を使用
- Same-Device フローでは `state` パラメータが不要（DC API がバインディングを提供）

---

## セキュリティ上の重要な考慮事項

**nonce の扱い**
Verifier は認可リクエストごとに新しい暗号強度の高い nonce を生成する。Wallet は VP に nonce を含め、Verifier は検証時に一致を確認する。この仕組みがリプレイ攻撃の主要な防壁となる。

**state パラメータ**
Holder Binding Proof なしでの提示を許可する場合、Verifier は最低 128 bit のエントロピーを持つ `state` を生成し、セッションに保存して、レスポンスで同一の値が返ることを確認する。

**Holder Binding の欠如**
Holder Binding Proof なしの VP を受け入れることは、リプレイリスクを許容することを意味する。設計時にこのリスクを意識的に評価する必要がある。

**Client Identifier のスプーフィング**
`client_id_scheme`（Prefix）が異なれば同一文字列の `client_id` が別のエンティティを指す可能性がある。バリデーションは常に `(client_id, prefix)` のタプルで行う必要がある。

**`redirect_uri` の検証**
`verifier_attestation` スキームでは、Attestation JWT に `redirect_uris` クレームが含まれる場合、リクエストの `redirect_uri` がその一覧に完全一致することを検証する。

---

## 後継・関連仕様

| 仕様 | 関係 |
|------|------|
| [OpenID4VCI 1.0](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) | クレデンシャルの**発行**側プロトコル。OpenID4VP と対をなす |
| [SIOPv2](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html) | Self-Issued ID Token の発行。OpenID4VP と組み合わせて OIDC 互換に |
| [HAIP 1.0](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html) | 高保証ユースケース向けの実装プロファイル |
| [DCQL](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6) | OpenID4VP 仕様内で定義されるクレデンシャルクエリ言語 |
| [W3C Digital Credentials API](https://w3c-fedid.github.io/digital-credentials/) | ブラウザ/OS レベルでのウォレット呼び出し API |
| [ISO/IEC 18013-7](https://www.iso.org/standard/82772.html) | mDL 向け OpenID4VP プロファイル（`x509_san_dns` を採用） |
| [RFC 9101](https://www.rfc-editor.org/rfc/rfc9101) | JAR（JWT-Secured Authorization Request） |

---

## 実装状況・採用

**プラットフォーム**
- **Android（Google）**: 2025 年 4 月よりネイティブ実装。Android Credential Manager 経由で OpenID4VP をサポート
- **iOS（Apple）**: Digital Credentials API 経由での対応を進行中

**規制・ガバナンス**
- **EU eIDAS 2.0 / EUDI Wallet**: ARF（Architecture Reference Framework）が OpenID4VP + SD-JWT VC を中核に採用。2026 年末の義務化に向け各国でパイロット進行中
- **NIST SP 800-63-4**: mDL/VC の受け入れフローとして参照

**実装例**
- **EUDI Wallet ライブラリ群**: Kotlin (JVM)、Swift (iOS)、TypeScript のリファレンス実装が EU Digital Identity Wallet GitHub に公開
- **OpenWallet Foundation**: `openid4vc-ts`（TypeScript）を OWF プロジェクトとして育成中
- **Walt.id、Authlete、MATTR**: 商用実装として展開済み
- **California DMV**: mDL ログインサービスで OpenID4VP を採用

**相互運用テスト**
2025 年 7 月の OIDF 相互運用イベントで 87% の成功率を達成。W3C VC、SD-JWT VC、mDL の 3 フォーマットにわたる複数のウォレットと Verifier 実装が検証された。

---

## 読み解きのポイント

**「Verifier は Authorization Server」という逆転**
通常の OAuth 2.0 では AS が認可を行うが、OpenID4VP では Verifier が AS の役割を担い、Wallet（クライアント）にクレデンシャル提示を「要求」する。構造の読み解きにこの逆転を意識すると理解が容易になる。

**`request_uri` を使わないとリクエストが巨大になる**
DCQL クエリ、クライアントメタデータ、Transaction Data を含めると Authorization Request は数 KB になりうる。QR コードで渡す Cross-Device Flow では `request_uri` による参照渡しが事実上必須。

**JARM への参照は実質的に「暗号化 JWT」**
仕様は `direct_post.jwt` について「JARM に準拠する」と記述しているが、実際は「署名なし・暗号化あり」の JWE として実装することが標準的になりつつある。JARM が署名済みレスポンスを前提とするため、現在 WG で記述の簡略化が議論中。

**`presentation_definition` は削除済み**
OpenID4VP 1.0 Final では Presentation Exchange（DIF 仕様）の `presentation_definition` パラメータはスコープ外となっており、DCQL のみが定義される。既存の Draft ベースの実装からのマイグレーションが必要。

---

## 参考

- [OpenID for Verifiable Presentations 1.0（公式）](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [OpenID4VP GitHub リポジトリ](https://github.com/openid/OpenID4VP)
- [HAIP 1.0 — High Assurance Interoperability Profile](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html)
- [DCQL 仕様（OpenID4VP Section 6）](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6)
- [EUDI Wallet ライブラリ（Kotlin）](https://github.com/eu-digital-identity-wallet/eudi-lib-jvm-openid4vp-kt)
- [OID4VP 1.0 is here — MATTR](https://mattr.global/article/oid4vp-1-0-is-here-unlocking-a-new-era-of-verifiable-credentials)
- [RFC 9101 — JWT-Secured Authorization Request (JAR)](https://www.rfc-editor.org/rfc/rfc9101)
