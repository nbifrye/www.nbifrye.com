# WebAuthn Level 3 — Web Authentication: An API for accessing Public Key Credentials Level 3

> **発行**: W3C / 2026年2月（Candidate Recommendation Snapshot） / **ステータス**: CR（候補勧告）
> **著者**: W3C Web Authentication Working Group（主要貢献: Jeff Hodges, J.C. Jones, Michael B. Jones, Emil Lundberg, Akshay Kumar 他）/ **前版**: Level 2（2021年4月 勧告）

---

## 概要

Web Authentication（WebAuthn）は、ブラウザを介した公開鍵暗号ベースの認証を標準化する W3C 仕様である。パスワードに代わるフィッシング耐性の高い認証手段として、プラットフォーム認証器（Face ID・Touch ID・Windows Hello）や外部セキュリティキー（YubiKey など）を統一 JavaScript API で利用可能にする。

Level 3 は 2021年の Level 2 勧告を受けた第3世代仕様で、クロスオリジンでのパスキー利用（Related Origin Requests）、認証器タイプのヒント機能、JSON シリアライゼーション API など実装者の要望を多数取り込み、2026年2月に Candidate Recommendation として公開された。FIDO Alliance の CTAP 2.2 と協調して設計されており、両仕様を合わせて読むことでパスキーエコシステムの全体像が掴める。

---

## 背景：なぜこの仕様が必要だったか

WebAuthn Level 1（2019年3月）は公開鍵暗号による強力な認証をウェブにもたらしたが、実運用では複数の課題が露わになった。

**クロスオリジン問題**: パスキーは `rpId`（RP Identifier）と完全一致するオリジンでしか使えない。`example.com` で登録したパスキーは `app.example.com` や `other-brand.co.jp`（同一事業者の別ドメイン）では使えず、大企業ほど困る設計だった。

**UX の粗さ**: 認証器の種別（プラットフォーム vs セキュリティキー）を制御するパラメータが乏しく、ユーザーに適切な選択肢を提示しにくかった。

**エンタープライズ機能の欠如**: PIN ポリシー管理、大容量データの認証器保存、HMAC シークレット派生など企業用途で必要な機能が Level 2 では不十分だった。

Level 3 はこれらを体系的に解決し、パスキーの大規模実用化を後押しする。

---

## 基本概念

**Relying Party（RP）**: 認証を要求するウェブサービス。`rpId` で識別され、通常は登録ドメインの effective domain。

**Authenticator（認証器）**: 秘密鍵を生成・保管し、署名を行うデバイスまたはソフトウェア。Platform Authenticator（端末内蔵）と Cross-Platform Authenticator（外部セキュリティキー等）に大別される。

**Credential（クレデンシャル）**: 公開鍵ペアとメタデータのセット。`credentialId` で識別される。

**Discoverable Credential（resident key）**: 認証器内にユーザー情報を含めて保存したクレデンシャル。パスキーはこの形態。ログイン時にユーザー名入力なしで認証器側が対象クレデンシャルを選択できる。

**Attestation**: 登録時に認証器がその正当性を証明する仕組み。`None`・`Indirect`・`Direct`・`Enterprise` の4種。高保証の RP ほど `Direct` または `Enterprise` を要求する。

**User Verification（UV）**: ユーザー本人確認（生体認証・PIN）を認証器レベルで実施すること。`required`・`preferred`・`discouraged` の3段階で制御する。

---

## 主要フロー：登録と認証

### 登録フロー（Registration / Attestation）

```
ブラウザ               RP サーバー             認証器
  |                      |                      |
  |-- POST /register --> |                      |
  |                      |                      |
  |<-- challenge,        |                      |
  |    rpId,             |                      |
  |    pubKeyCredParams  |                      |
  |                      |                      |
  |-- navigator.credentials.create() ---------->|
  |                      |   (生体認証 / PIN 確認)|
  |<-- AuthenticatorAttestationResponse --------|
  |    (attestationObject, clientDataJSON)       |
  |                      |                      |
  |-- POST (credential) ->|                      |
  |                      |-- 検証 --------------|
  |                      |   ・challenge一致     |
  |                      |   ・origin 確認       |
  |                      |   ・attestation 検証  |
  |                      |   ・公開鍵保存         |
  |<-- 登録完了 ----------|                      |
```

### 認証フロー（Authentication / Assertion）

```
ブラウザ               RP サーバー             認証器
  |                      |                      |
  |-- POST /login ------> |                      |
  |<-- challenge, rpId,   |                      |
  |    allowCredentials   |                      |
  |                      |                      |
  |-- navigator.credentials.get() ------------->|
  |                      |   (生体認証 / PIN 確認)|
  |<-- AuthenticatorAssertionResponse ----------|
  |    (authenticatorData, signature, userHandle)|
  |                      |                      |
  |-- POST (assertion) -->|                      |
  |                      |-- 検証 --------------|
  |                      |   ・challenge一致     |
  |                      |   ・signature 検証    |
  |                      |   ・counter 確認      |
  |<-- 認証完了 ----------|                      |
```

---

## Level 3 の主要新機能

### Related Origin Requests

単一の RP が複数のオリジン（`example.com`・`app.example.com`・`example.co.jp` 等）にまたがって同じパスキーを使えるようにする機能。

RP は `/.well-known/webauthn` に許可オリジンのリストを JSON で公開する：

```json
{ "origins": ["https://app.example.com", "https://example.co.jp"] }
```

`create()`・`get()` 呼び出し時に `relatedOrigins` オプションで `rpId` の代わりにリストを渡すと、ブラウザが検証する。グループ企業・ブランド統合シナリオで大きな価値がある。

**私の解釈**: この機能が正式化されたことで「ドメイン統合」の壁が下がり、パスキーの企業向け展開が加速すると見ている。Apple は iOS 17 時点で独自の Associated Domains を使って類似機能を先行実装していたが、Level 3 で標準化されたことで相互運用性が保証される。

### JSON シリアライゼーション API

`parseCreationOptionsFromJSON()`・`parseRequestOptionsFromJSON()`・`PublicKeyCredential.toJSON()` の追加。`ArrayBuffer` → Base64URL 変換をブラウザが自動処理し、RP サーバーとの JSON やりとりが簡潔になる。実装者にとって最も歓迎される変更の一つ。

### Hints

`create()`・`get()` に `hints` 配列が追加：`"client-device"`（プラットフォーム認証器）・`"security-key"`（外部キー）・`"hybrid"`（QR コード経由の他端末）。ブラウザの UI が適切な認証器選択ダイアログを表示できるようになる。

### Signal API

サーバー側でクレデンシャルが無効化・削除された際にブラウザを通じて認証器に通知できる API（`PublicKeyCredential.signalUnknownCredential()`・`signalCurrentUserDetails()`）。パスキーの管理 UX を改善する。

---

## CTAP 2.2 との協調

CTAP（Client to Authenticator Protocol）は FIDO Alliance が策定する認証器-クライアント間プロトコル。CTAP 2.2 は WebAuthn Level 3 と並行して開発され、以下の機能を追加した：

| 機能                     | 説明                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PRF 拡張（prf）**      | HMAC シークレット拡張の標準化版。登録・認証時に認証器から対称鍵を派生し、クライアント側での暗号化（例：エンドツーエンド暗号化アプリのキー管理）に活用できる |
| **largeBlob 拡張**       | 最大 2KB の任意データを認証器に保存・取得。SSH 秘密鍵やアプリ固有データの格納に利用可能                                                                     |
| **minPinLength 拡張**    | 認証器に設定された最小 PIN 長を RP が読み取り可能。企業 PIN ポリシーの検証に使用                                                                            |
| **credBlob 拡張**        | クレデンシャルに紐付いた 32 バイトのメタデータを保存                                                                                                        |
| **Persistent Pin Token** | PIN 認証の有効期間を延長し、セッション内での繰り返し認証を不要化                                                                                            |

WebAuthn Level 3 と CTAP 2.2 の関係は「API（WebAuthn）とトランスポート（CTAP）の分離」という設計に基づく。RP は WebAuthn API だけを意識すればよく、CTAP の詳細はブラウザ・OS が吸収する。

---

## セキュリティ上の重要な考慮事項

**Challenge の一意性**: 各登録・認証フローで使い捨ての `challenge`（最低 16 バイトのランダム値）を発行し、リプレイ攻撃を防ぐ。サーバー側でセッションに紐付けて検証すること。

**`origin` の検証**: `clientDataJSON` 内の `origin` が期待するオリジンと一致することを必ず確認する。フィッシングサイトからの認証を防ぐ最重要チェック。WebAuthn のフィッシング耐性はこの仕組みに依拠している。

**`counter` の検証**: Authenticator Data の署名カウンタを追跡し、クレデンシャルのクローン（物理的なコピー）を検出する。ただしパスキー（同期型）はカウンタが常に 0 を返すことがあり、クローン検出には使えない点に注意。

**Attestation の扱い**: 一般消費者向けサービスは `None` でよいが、金融・医療・政府向けは `Enterprise Attestation` で認証器モデルレベルの検証が必要。FIDO Alliance の MDS（Metadata Service）を活用してデバイスの信頼性を評価する。

**`rpId` スコーピング**: Related Origin Requests を使う場合、`/.well-known/webauthn` が不正なオリジンを含まないよう厳格に管理する。CI/CD パイプラインでの検証を推奨。

---

## 後継・関連仕様

| 仕様                                | 関係                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| CTAP 2.2（FIDO Alliance）           | WebAuthn の認証器側プロトコル。Level 3 と協調設計                                              |
| FIDO2（FIDO Alliance）              | WebAuthn + CTAP のバンドル名称                                                                 |
| Passkeys（FIDO Alliance/業界用語）  | Discoverable Credentials の UX 友好な呼称。Level 3 がパスキーの技術基盤                        |
| Digital Credentials API（W3C/WICG） | ブラウザを介したモバイル運転免許証・VC 提示のための API。WebAuthn とは別仕様だが設計哲学が共通 |
| WebAuthn Level 4                    | 未着手。Level 3 が Recommendation になった後に WG が検討                                       |

---

## 実装状況・採用

**ブラウザ対応**:

- Chrome/Chromium: WebAuthn 全機能に対応。PRF 拡張・Related Origins は v129 以降で順次実装中
- Safari: WebKit 経由で対応。Associated Domains による独自クロスオリジン先行実装あり
- Firefox: 基本機能対応。一部 Level 3 機能は実装途中

**プラットフォーム**:

- iOS 16+ / macOS Ventura+: iCloud キーチェーン同期パスキー対応
- Android 9+: Google Password Manager パスキー対応（Android 14 で強化）
- Windows: Windows Hello によるプラットフォーム認証、BitLocker 連携

**セキュリティキー**:

- YubiKey 5シリーズ: CTAP 2.2 対応モデルが出荷中（YubiKey 5.7 ファームウェア以降）
- Google Titan Key（最新版）: CTAP 2.2 対応

**大規模採用事例**:

- Apple、Google、Microsoft は FIDO Alliance でパスキーを共同推進（2022年～）
- Amazon、GitHub、PayPal、ニンテンドー等でパスキーログイン提供中
- FIDO Alliance Passkey Index（2025年）では数百サービスがリスト掲載

---

## 読み解きのポイント

**「パスキー」と「WebAuthn」の関係を整理する**: パスキーは WebAuthn 仕様の一部（Discoverable Credentials + 同期）であり、WebAuthn そのものではない。仕様を読む際は「resident key が true かどうか」「transport が `internal` かどうか」がパスキー動作の鍵になる。

**Level 2 からの差分を追う**: Level 3 の変更点は量が多い。実装者は [GitHub の WebAuthn spec diff](https://github.com/w3c/webauthn) で Level 2→3 の差分を確認することを推奨する。既存実装への影響は小さいが、Related Origins と Signal API は積極的に取り入れたい。

**Sync vs. Non-sync の非対称性**: 同期型パスキー（iCloud/Google アカウント連動）と非同期ハードウェアキーでは、カウンタ動作・バックアップ可否・企業での使い方が大きく異なる。`authenticatorData` の `BE`（Backup Eligibility）・`BS`（Backup State）フラグで判別できる。

**`userVerification: "required"` の罠**: 端末が UV をサポートしていない場合にエラーとなる。一般向けサービスでは `"preferred"` が現実的。ただし高保証認証では `"required"` が必須なので、サービスの IAL に合わせて設定する。

---

## 参考

- [W3C Web Authentication Level 3 — Candidate Recommendation](https://www.w3.org/TR/webauthn-3/)
- [FIDO Alliance CTAP 2.2 Specification](https://fidoalliance.org/specs/fido-v2.2-rd-20230321/fido-client-to-authenticator-protocol-v2.2-rd-20230321.html)
- [FIDO Alliance — Introduction to Passkeys](https://fidoalliance.org/passkeys/)
- [W3C WebAuthn WG GitHub](https://github.com/w3c/webauthn)
- [Yubico — Developer Guide: WebAuthn](https://developers.yubico.com/WebAuthn/)
