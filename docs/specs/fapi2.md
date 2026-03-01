# FAPI 2.0 Security Profile — Financial-grade API Security Profile 2.0

> **発行**: OpenID Foundation (FAPI WG) / 2025年2月22日 / **ステータス**: Final
> **著者**: D. Fett (Authlete), D. Tonge (Moneyhub), J. Heenan (Authlete) / **更新**: FAPI 2.0 Message Signing Final (2025年9月25日)

---

## 概要

FAPI 2.0 Security Profile は、OAuth 2.0 をベースにした **高セキュリティ API 実装プロファイル**である。対象は金融に限定されず、金銭・権限・個人データを扱う高リスク API 全般に広げられている。

設計思想は「OAuth を拡張する」のではなく「既存 RFC を厳格に組み合わせる」ことだ。PAR（RFC 9126）、JAR（RFC 9101）、送信者拘束トークン（MTLS または DPoP）を前提にし、フロントチャネル露出やコード横取り、トークン再利用の攻撃面を減らす。加えて FAPI 2.0 Message Signing は JARM を必須化し、認可レスポンスの改ざん耐性と監査可能性を高める。

---

## 背景：なぜこの仕様が必要だったか

FAPI 1.0 は「特定業界（主に Open Banking）」で大きな成果を出した一方、実装者からは次の課題が挙がった。

- 金融以外でも使いたいが、適用範囲の説明が限定的だった
- セキュリティ BCP の更新（RFC 9700）に追従した再整理が必要だった
- MTLS 一択ではモバイル／分散環境で運用が重いケースがあった

FAPI 2.0 はこの反省を踏まえ、**業界非依存の高保証 OAuth プロファイル**へ再定義したのが本質である。私の見立てでは、これは「規制準拠のための仕様」から「ゼロトラスト時代の実装ベースライン」への転換点だ。

---

## 基本概念

### 主要ロール

| ロール                    | 説明                                      |
| ------------------------- | ----------------------------------------- |
| Resource Owner            | データ主体。同意を与える利用者            |
| Client（Confidential）    | 高セキュリティ API を呼ぶアプリケーション |
| Authorization Server (AS) | 認可・トークン発行を担うサーバー          |
| Resource Server (RS)      | 保護リソースを提供する API サーバー       |

### FAPI 2.0 が要求する中核要素

- **Authorization Code Flow 前提**（Implicit を使わない）
- **PAR 必須**で認可リクエストをバックチャネル化
- **JAR 利用**でリクエスト完全性を担保
- **Sender-constrained token 必須**（MTLS または DPoP）
- **PKCE 必須**でコード横取り耐性を強化
- （Message Signing で）**JARM 必須**

---

## 主要なフロー/プロトコル詳細

### Security Profile の基本フロー（PAR + Code + DPoP）

```text
Client                          AS                              RS
  |                              |                               |
  |--(1) PAR: signed request---->|                               |
  |<-(2) request_uri-------------|                               |
  |--(3) /authorize?request_uri->|                               |
  |<-(4) authz code--------------|                               |
  |--(5) /token + PKCE + DPoP--->|                               |
  |<-(6) access token (cnf/jkt)--|                               |
  |--(7) API call + DPoP token------------------------------->   |
  |<-----------------------(8) protected resource---------------|
```

### Message Signing を併用する場合（JARM）

```text
Client                          AS
  |                              |
  |-- PAR/JAR ------------------>|
  |<-- request_uri --------------|
  |-- authorization request ---->|
  |<-- JARM signed response -----|  (response_mode=jwt)
```

JARM により、認可レスポンス（code, state, iss 等）が署名付き JWT で返る。ブラウザ経由のパラメータ改ざんや、ログ混入時の監査困難性を下げられる。

---

## セキュリティ上の重要な考慮事項

1. **DPoP proof replay**  
   DPoP は鍵束縛を提供するが、proof の再送対策（`jti` 一意性、時刻ウィンドウ検証、API ゲートウェイでのキャッシュ設計）が必要。

2. **認可リクエスト漏えいと CSRF**  
   PAR によるバックチャネル化は強力だが、`state`/`nonce` の検証とリダイレクト URI 厳格一致を省略すると防御が崩れる。

3. **トークン誤送信（mix-up 含む）**  
   AS issuer 識別（RFC 9207）と audience/issuer 検証を実装し、複数 AS 連携時の取り違えを防止する。

4. **MTLS vs DPoP の選択**  
   B2B サーバー間では MTLS が運用しやすい一方、モバイルや SPA バックエンド分離構成では DPoP が現実的。重要なのは「どちらかを必須化し、Bearer 素通しを残さない」こと。

---

## 後継・関連仕様

| 仕様                              | 位置づけ                            |
| --------------------------------- | ----------------------------------- |
| FAPI 2.0 Security Profile         | 高保証 OAuth の土台プロファイル     |
| FAPI 2.0 Message Signing          | JARM 等でメッセージ完全性を追加強化 |
| RFC 9126 (PAR)                    | 認可要求のバックチャネル化          |
| RFC 9101 (JAR)                    | 認可要求の署名・完全性              |
| RFC 9449 (DPoP)                   | アプリケーション層の送信者拘束      |
| RFC 9700 (OAuth 2.0 Security BCP) | OAuth 全体の最新セキュリティ指針    |

---

## 実装状況・採用

- OpenID Foundation の FAPI コミュニティで継続的に相互運用試験が行われ、Profile 適合実装の共通化が進んでいる。
- 金融だけでなく、ヘルスケア・行政 API・高権限 B2B API でも「FAPI 2.0 をそのまま採る」ではなく「FAPI 的コントロール（PAR/JAR/PoP）を要件化」する流れが強い。
- 実装現場では、AS 製品単体より API Gateway・WAF・監査ログ基盤まで含めた統制設計が成否を分ける。

---

## 読み解きのポイント

- **FAPI 2.0 は単独仕様ではなく “構成ルール”**。各 RFC の MUST をどう束ねるかが本体。
- **JARM は万能ではない**。non-repudiation は監査ログと鍵管理の運用が前提で、署名 JWT だけで法的否認防止が成立するわけではない。
- **導入難易度の本丸は運用**。鍵ローテーション、証明書失効、DPoP リプレイキャッシュ、時刻同期のどれかが弱いと仕様準拠でも事故は起きる。

私の実務感では、FAPI 2.0 は「要件が厳しい」のではなく「曖昧さを許さない」仕様である。結果として開発初期コストは上がるが、監査・事故対応・多組織連携の総コストは下がる。

---

## 参考

- [FAPI 2.0 Security Profile (Final)](https://openid.net/specs/fapi-security-profile-2_0.html)
- [FAPI 2.0 Message Signing (Final)](https://openid.net/specs/fapi-message-signing-2_0.html)
- [OAuth 2.0 Pushed Authorization Requests (RFC 9126)](https://www.rfc-editor.org/rfc/rfc9126)
- [OAuth 2.0 JWT-Secured Authorization Request (RFC 9101)](https://www.rfc-editor.org/rfc/rfc9101)
- [OAuth 2.0 Demonstrating Proof-of-Possession at the Application Layer (DPoP, RFC 9449)](https://www.rfc-editor.org/rfc/rfc9449)
- [Best Current Practice for OAuth 2.0 Security (RFC 9700)](https://www.rfc-editor.org/rfc/rfc9700)
