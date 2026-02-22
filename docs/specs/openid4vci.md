# OpenID4VCI 1.0 — OpenID for Verifiable Credential Issuance

> **発行**: OpenID Foundation (Digital Credentials Protocols WG) / 2025年9月16日 / **ステータス**: Final
> **著者**: T. Lodderstedt (SPRIND), K. Yasuda (SPRIND), T. Looker (MATTR), P. Bastian (Bundesdruckerei)

---

## 概要

OpenID for Verifiable Credential Issuance（OpenID4VCI）は、**デジタルウォレットがクレデンシャルイシュアーからVerifiable Credentialを安全に受け取るためのプロトコル**を定義する OpenID Foundation の標準仕様である。OAuth 2.0 を基盤とし、2025年9月16日に Final Specification として公表された。

OpenID4VP が「クレデンシャルを Verifier に提示する」プロトコルであるのに対し、OpenID4VCI は「Issuer からクレデンシャルを取得する」プロトコルを定義する。両者はデジタルアイデンティティのライフサイクルで対をなす。

対応するクレデンシャル形式は特定せず、SD-JWT VC（`dc+sd-jwt`）、ISO/IEC 18013-5 に基づく mdoc（`mso_mdoc`）、W3C Verifiable Credentials JWT 形式（`jwt_vc_json`）、JSON-LD Linked Data Proof（`ldp_vc`）など複数の形式に対応する。

---

## 背景：なぜこの仕様が必要だったか

Verifiable Credential のコンセプト自体は W3C が 2019 年から標準化を進めていたが、**「ウォレットがどうやってクレデンシャルを取得するか」**というプロトコルは長らく標準化されていなかった。各ベンダーや政府プロジェクトが独自の発行 API を実装しており、ウォレットと Issuer の組み合わせを増やすたびに個別統合が必要だった。

EU の eIDAS 2.0 は 2026 年末までに全 EU 加盟国が EUDI Wallet（European Digital Identity Wallet）を提供することを義務付けた。Architecture Reference Framework（ARF）は発行プロトコルとして OpenID4VCI を明示的に採用し、標準化の圧力が決定的なものとなった。

OAuth 2.0 を土台とすることで、既存の認証インフラ（IdP・AS）との親和性を確保し、Wallet Provider の追加負担を最小化している。

---

## 基本概念

### ロール

| ロール | 説明 |
|--------|------|
| **End-User / Holder** | クレデンシャルを受け取り、ウォレットを操作するエンドユーザー |
| **Wallet** | クレデンシャルを取得・保管するアプリケーション（OAuth 2.0 の Client に相当） |
| **Credential Issuer** | クレデンシャルを発行するエンティティ（OAuth 2.0 の Resource Server に相当） |
| **Authorization Server** | トークンを発行する OAuth 2.0 AS。Issuer と同一でも別サーバーでも可 |

### 主要なデータ概念

- **Credential Offer**: Issuer が Wallet に対してクレデンシャル取得を促す招待情報。URI または QR コードとして渡される。
- **Credential Configuration**: Issuer が発行可能なクレデンシャルの種別定義。形式・クレーム・暗号スイートを含む。
- **Proof of Possession**: Wallet がクレデンシャルに束縛する鍵を所持していることを証明する JWT または CWT。
- **c_nonce**: Issuer が発行するワンタイムノンス。Proof JWT のリプレイ攻撃を防ぐ。
- **Wallet Attestation**: Wallet Provider が Wallet の真正性・セキュリティ特性を証明する JWT。

---

## Issuer メタデータ

Wallet は発行開始前に Issuer のメタデータを取得する。

```
GET /.well-known/openid-credential-issuer HTTP/1.1
Host: issuer.example.com
```

レスポンスの主要フィールド：

```json
{
  "credential_issuer": "https://issuer.example.com",
  "credential_endpoint": "https://issuer.example.com/credential",
  "batch_credential_endpoint": "https://issuer.example.com/batch_credential",
  "deferred_credential_endpoint": "https://issuer.example.com/deferred_credential",
  "credential_configurations_supported": {
    "UniversityDegreeCredential": {
      "format": "dc+sd-jwt",
      "vct": "https://issuer.example.com/UniversityDegree",
      "claims": {
        "given_name": { "display": [{"name": "Given Name", "locale": "en-US"}] },
        "family_name": { "display": [{"name": "Family Name", "locale": "en-US"}] },
        "degree": {}
      },
      "cryptographic_binding_methods_supported": ["jwk", "did:example"],
      "credential_signing_alg_values_supported": ["ES256"]
    }
  }
}
```

---

## 2 つの主要フロー

OpenID4VCI は 2 つのフローを定義する。ユースケースに応じて使い分ける。

### Authorization Code Flow（認可コードフロー）

End-User が Issuer に対してインタラクティブに認証するフロー。既存の OAuth 2.0/OIDC 認証インフラをそのまま活用できる。

```
Wallet                       Authorization Server          Credential Issuer
  |                                   |                           |
  |--- Credential Offer を受け取る ---|                           |
  |                                   |                           |
  |--- Authorization Request -------->|                           |
  |    (code_challenge, scope 等)     |                           |
  |                                   |                           |
  |    (ユーザーが Issuer で認証)     |                           |
  |                                   |                           |
  |<-- Authorization Code ------------|                           |
  |                                   |                           |
  |--- Token Request (code) --------->|                           |
  |<-- Access Token + c_nonce --------|                           |
  |                                   |                           |
  |--- Credential Request (proof) ----|------------- POST ------->|
  |<-- Credential (VC) ---------------|------------ Response -----|
```

Wallet は PKCE（`code_challenge`/`code_verifier`）を必ず使用する。Pushed Authorization Request（PAR）の利用も推奨される。

### Pre-Authorized Code Flow（事前認可コードフロー）

Issuer が Out-of-Band（帯域外）でユーザーを認証済みの場合に使うフロー。ユーザーがブラウザ認証をスキップでき、Credential Offer から即座にクレデンシャル取得できる。

```
Wallet                       Authorization Server          Credential Issuer
  |                                   |                           |
  |--- Credential Offer を受け取る ---|                           |
  |    (pre-authorized_code を含む)   |                           |
  |                                   |                           |
  |--- Token Request ----------------->|                          |
  |    grant_type=urn:ietf:params:oauth:grant-type:pre-authorized_code
  |    pre-authorized_code=<code>     |                           |
  |    tx_code=<PIN>  (オプション)    |                           |
  |<-- Access Token + c_nonce --------|                           |
  |                                   |                           |
  |--- Credential Request (proof) ----|------------- POST ------->|
  |<-- Credential (VC) ---------------|------------ Response -----|
```

`pre-authorized_code` は Issuer が生成し Credential Offer に含める。有効期限は短く（数分）設定する。

---

## Credential Offer

Wallet がクレデンシャル取得を開始するトリガーとなる情報。

### 渡し方

1. **QR コード** — ウォレットアプリでスキャン（Cross-Device）
2. **Deep Link** — `openid-credential-offer://` スキームで Wallet を起動（Same-Device）
3. **Request URI** — `credential_offer_uri` パラメータで参照渡し（QR コードサイズ削減）

### Credential Offer の構造

```json
{
  "credential_issuer": "https://issuer.example.com",
  "credential_configuration_ids": ["UniversityDegreeCredential"],
  "grants": {
    "authorization_code": {
      "issuer_state": "eyJhbGciOiJSUzI1NiIsInR5cCI6Ikp..."
    },
    "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
      "pre-authorized_code": "SplxlOBeZQQYbYS6WxSbIA",
      "tx_code": {
        "length": 6,
        "input_mode": "numeric",
        "description": "メールに送信された6桁のコードを入力してください"
      }
    }
  }
}
```

`credential_configuration_ids` は Issuer メタデータの `credential_configurations_supported` のキーに対応する。`grants` が両方含まれる場合は Wallet が選択できる。

---

## tx_code（Transaction Code）

Pre-Authorized Code Flow で使えるセカンダリ認証機構。Credential Offer を傍受した第三者がクレデンシャルを不正取得するのを防ぐ。

- Issuer がメール・SMS 等の帯域外チャネルでユーザーに PIN を送る
- Wallet は Token Request に `tx_code` パラメータとして含める
- Issuer は Token Request 受信後、`tx_code` を検証してからアクセストークンを発行

```
tx_code オブジェクト（Credential Offer 内）:
{
  "length": 6,
  "input_mode": "numeric",  // または "text"
  "description": "メールに送信された6桁コード"
}

Token Request への追加:
tx_code=123456
```

eKYC などの高保証ユースケースでは、Issuer は `tx_code` の提示を必須とすることを推奨する。

---

## Credential Endpoint

Access Token を取得した Wallet が、実際にクレデンシャルを要求するエンドポイント。

### リクエスト

```
POST /credential HTTP/1.1
Host: issuer.example.com
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "credential_configuration_id": "UniversityDegreeCredential",
  "proof": {
    "proof_type": "jwt",
    "jwt": "<proof_jwt>"
  }
}
```

### Proof JWT

Wallet が新しく生成した鍵ペアの秘密鍵で署名する JWT。これにより Issuer は「この鍵の所有者にクレデンシャルを束縛する」ことができる。

```json
// Header
{
  "typ": "openid4vci-proof+jwt",
  "alg": "ES256",
  "jwk": { "kty": "EC", "crv": "P-256", "x": "...", "y": "..." }
}
// Payload
{
  "iss": "https://wallet.example.com",
  "aud": "https://issuer.example.com",
  "iat": 1701234567,
  "nonce": "<c_nonce>"
}
```

- `typ`: `openid4vci-proof+jwt`（固定）
- `jwk` または `kid` ヘッダー: 束縛する公開鍵を指定
- `nonce`: Issuer が提供した `c_nonce`（リプレイ防止）

### レスポンス

```json
{
  "credential": "<sd-jwt-vc-string>",
  "c_nonce": "fGFF7UkhLa",
  "c_nonce_expires_in": 86400
}
```

---

## Batch Credential Endpoint

一度のリクエストで複数のクレデンシャルを取得するエンドポイント。同じ証明書の複数フォーマット発行や、Family Unit（家族全員分）の一括取得などに使う。

```json
// POST /batch_credential
{
  "credential_requests": [
    {
      "credential_configuration_id": "UniversityDegreeCredential",
      "proof": { "proof_type": "jwt", "jwt": "<proof1>" }
    },
    {
      "credential_configuration_id": "UniversityDegreeCredential_mdoc",
      "proof": { "proof_type": "jwt", "jwt": "<proof2>" }
    }
  ]
}
```

---

## Deferred Credential Endpoint

Issuer が即座にクレデンシャルを発行できない場合（人的審査が必要なケース等）に使うエンドポイント。

```
[即時発行不可の場合の Credential Response]
{
  "transaction_id": "8xLOxBtZp8"
}

[後から Wallet が取りに来る]
POST /deferred_credential
{
  "transaction_id": "8xLOxBtZp8"
}

[準備完了していれば通常の Credential Response を返す]
```

保険証・運転免許証など審査プロセスを伴うクレデンシャルに有用。

---

## Wallet Attestation

Issuer がウォレットの真正性・安全性を検証するための仕組み。Wallet Provider が署名した JWT を Wallet が保持し、Token Request 時に提示する。

```
Token Request に含める:
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-client-attestation
client_assertion=<wallet_attestation_jwt>~<wallet_attestation_pop_jwt>
```

**Wallet Attestation JWT** の主なクレーム：

| クレーム | 説明 |
|---------|------|
| `iss` | Wallet Provider の識別子 |
| `sub` | Wallet アプリのクライアント識別子 |
| `iat`, `exp` | 発行時刻・有効期限 |
| `attested_keys` | Wallet インスタンスに紐付く公開鍵（Key Attestation） |
| `aal` | Authenticator Assurance Level |

**Wallet Attestation PoP JWT**（トランザクションごとに生成）：

```json
{
  "iss": "<wallet_client_id>",
  "aud": "https://as.example.com",
  "iat": 1701234567,
  "exp": 1701234627,
  "nonce": "<server_nonce>"
}
```

Wallet Attestation により、Issuer は「正規の Wallet プロバイダーが提供するアプリからのリクエストであること」を確認できる。HAIP（High Assurance Interoperability Profile）ではこれを必須要件としている。

---

## セキュリティ上の重要な考慮事項

**Proof の c_nonce バインディング**
Issuer は Token Response または Credential Response に `c_nonce` を含めて返す。Wallet は次回の Proof JWT にこの nonce を含めることで、Proof JWT のリプレイ攻撃を防ぐ。Issuer は nonce の有効期間管理に注意を払う必要がある。

**Pre-Authorized Code の単回使用**
`pre-authorized_code` は一度使用されたら即座に無効化しなければならない。有効期限は発行から数分以内が推奨。

**Credential Offer の傍受対策**
Authorization Code Flow では PKCE が必須。Pre-Authorized Code Flow では `tx_code` の使用を強く推奨する。`credential_offer_uri` を使う場合、Wallet は TLS を検証して URI を取得すること。

**クレデンシャルに束縛する鍵のセキュリティ**
Proof JWT で提示する鍵ペアは Wallet 内のセキュアエレメント（SE）またはハードウェアバックドストレージで保護することが理想。HAIP では Hardware-Backed Key Attestation を要件としている。

**`issuer_state` のバインディング**
Authorization Code Flow で `issuer_state` を Authorization Request に含める場合、AS と Issuer は同一でないことが多い。AS は `issuer_state` を検証し、本フローが正規の Credential Offer から開始されたことを確認すること。

---

## 後継・関連仕様

| 仕様 | 関係 |
|------|------|
| [OpenID4VP 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) | クレデンシャルの**提示**側プロトコル。OpenID4VCI と対をなす |
| [HAIP 1.0](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html) | 高保証ユースケース向けの実装プロファイル（Wallet Attestation・PKCE 等を必須化） |
| [SIOPv2](https://openid.net/specs/openid-connect-self-issued-v2-1_0.html) | Self-Issued OpenID Provider。Wallet が IdP として機能する |
| [RFC 9701](https://www.rfc-editor.org/rfc/rfc9701) | JWT Client Attestation（Wallet Attestation の基盤仕様） |
| [RFC 9126](https://www.rfc-editor.org/rfc/rfc9126) | Pushed Authorization Request（PAR）。Authorization Code Flow で推奨 |
| [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) | PKCE。Authorization Code Flow で必須 |
| [draft-ietf-oauth-sd-jwt-vc (RFC 9901)](https://www.rfc-editor.org/rfc/rfc9901) | SD-JWT VC 形式。OpenID4VCI が主要なクレデンシャルフォーマット |
| [ISO/IEC 18013-5](https://www.iso.org/standard/69084.html) | mDL（mdoc）形式の基盤仕様 |
| OpenID4VCI 1.1（開発中） | presentation-during-issuance などの追加機能。シュトゥットガルト大と形式的証明を共同研究中 |

---

## 実装状況・採用

**規制・ガバナンス**
- **EU eIDAS 2.0 / EUDI Wallet**: ARF が OpenID4VCI を必須プロトコルとして採用。2026 年末の義務化に向けた各国実装が進行中
- **NIST SP 800-63-4**（2025年7月）: Verifiable Credential の発行・提示フレームワークとして参照
- **HAIP 1.0**: OpenID4VCI の高保証プロファイルとして金融・政府系ユースケースをカバー

**実装例**
- **EUDI Wallet リファレンス**: Kotlin（JVM）・Swift（iOS）のオープンソース実装を EU Digital Identity Wallet GitHub が公開
- **OpenWallet Foundation**: `openid4vc-ts`（TypeScript）を OWF プロジェクトとして育成中
- **Authlete**: SaaS 型 Authorization Server として OpenID4VCI をフルサポート
- **Walt.id**: Enterprise Grade のオープンソース実装。Wallet SDK と合わせて提供
- **MATTR**: エンタープライズ向け Platform にて商用提供
- **Keycloak**: 2026 年 1 月、OpenID4VCI 対応の Credential Issuer として設定する公式ガイドを公開
- **EBSI**: 欧州ブロックチェーンサービスインフラが OpenID4VCI 準拠の発行フローをサポート

**相互運用テスト・自己認証プログラム**
2025 年 11 月の OIDF リモート相互運用テストイベントで Authorization Code Flow・Pre-Authorized Code Flow の両方にわたる相互運用性が検証済み。HAIP 1.0 も高い合格率を達成した。

2026 年 2 月 26 日より OIDF は OpenID4VCI 1.0・OpenID4VP 1.0・HAIP 1.0 の **自己認証プログラム**を開始する。現在 38 の法域でこれらの仕様が政策・技術フレームワークに採用・参照されており、認証プログラムはエコシステム全体の品質底上げと相互運用性の担保を目的とする。

---

## 読み解きのポイント

**「Pre-Authorized Code が主役」という現場感覚**
仕様上は Authorization Code Flow と Pre-Authorized Code Flow が対等に定義されているが、EUDI Wallet の LoA（保証レベル）High ユースケースでは、Issuer が先に Identity Verification を完了させた後に Credential Offer を送るという設計が自然であり、Pre-Authorized Code Flow が中心となることが多い。`tx_code` との組み合わせがデファクトスタンダードになりつつある。

**`credential_configuration_id` vs `format + credential_type`**
Draft 版では `format` と `types`/`credential_type` を直接指定する API が使われていた。Final では `credential_configuration_id` を使って Issuer メタデータの特定エントリを参照する設計に統一された。既存のDraft実装からのマイグレーション時に最も注意すべき変更点。

**`c_nonce` の取得タイミング**
Wallet は Token Response に含まれる `c_nonce` を使って最初の Proof JWT を生成するが、Credential Response にも新しい `c_nonce` が含まれる。Batch Credential 等で複数回 Credential Endpoint を呼ぶ場合は、直前のレスポンスの `c_nonce` を使って次の Proof を生成する必要がある。

**Authorization Server と Credential Issuer の分離**
設計上、AS と Credential Issuer は同一サーバーである必要はない。Issuer は `authorization_servers` メタデータで信頼する AS を列挙できる。ただしこの構成では `issuer_state` のセキュアな受け渡しに追加の注意が必要。

**Wallet Attestation が必須になるエコシステム**
HAIP では Wallet Attestation を必須要件とするため、消費者向けウォレットを開発する際には Wallet Provider（Apple/Google 等のプラットフォームまたは独自プロバイダー）から事前にアテステーションを取得するプロセスを設計段階から組み込む必要がある。プラットフォームレベルの Hardware Key Attestation との組み合わせが高保証ユースケースの鍵となる。

---

## 参考

- [OpenID for Verifiable Credential Issuance 1.0（公式）](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)
- [OpenID4VCI GitHub リポジトリ](https://github.com/openid/OpenID4VCI)
- [HAIP 1.0 — High Assurance Interoperability Profile](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0.html)
- [EUDI Wallet ライブラリ（Kotlin）](https://github.com/eu-digital-identity-wallet/eudi-lib-jvm-openid4vci-kt)
- [Authlete — OpenID4VCI 解説](https://www.authlete.com/developers/oid4vci/)
- [Walt.id — OpenID4VCI Developer Guide](https://docs.walt.id/concepts/data-exchange-protocols/openid4vci)
- [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636)
- [RFC 9126 — PAR](https://www.rfc-editor.org/rfc/rfc9126)
- [RFC 9701 — JWT Client Attestation](https://www.rfc-editor.org/rfc/rfc9701)
