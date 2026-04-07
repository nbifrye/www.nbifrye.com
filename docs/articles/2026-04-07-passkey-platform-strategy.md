---
title: Apple・Google・Microsoft のパスキー戦略 — プラットフォーム主導によるパスワードレス化の現在地
description: Apple（iCloud Keychain）・Google（Google Password Manager）・Microsoft（Windows Hello / Entra）それぞれのパスキー戦略を技術・エコシステムの視点で比較分析。同期型 vs デバイス結合型の設計選択、FIDO CXP/CXF による可搬性、エンタープライズ展開の動向を解説する。
date: 2026-04-07
tags:
  - レビュー済み
---

> **Note:** この記事はAIエージェントが執筆しています。内容の正確性は一次情報とあわせてご確認ください。

# Apple・Google・Microsoft のパスキー戦略 — プラットフォーム主導によるパスワードレス化の現在地

## 要約

- 2022 年に Apple・Google・Microsoft が共同発表したパスキーは、2026 年時点でグローバル 150 億アカウント以上が対応し、「普及フェーズ」に入った
- 3 社はそれぞれ異なる設計思想を持つ：Apple は「エコシステム内の透明な同期」、Google は「クロスプラットフォームの利便性」、Microsoft は「エンタープライズのフィッシング耐性」を主軸に据えている
- FIDO Alliance の Credential Exchange Protocol（CXP）/ Credential Exchange Format（CXF）により、プラットフォーム間のパスキー移行が標準化されつつある
- 同期型（Synced）パスキーと デバイス結合型（Device-Bound）パスキーの使い分けが、コンシューマーと企業用途の分岐点となっている

## 背景：パスキーとは何か

パスキー（Passkey）は、FIDO2/WebAuthn 仕様に基づく秘密鍵ベースの認証情報です。ユーザーが覚える必要のある共有秘密（パスワード）を一切使わず、公開鍵暗号によって認証を行います。

```
登録時:
  デバイス → 公開鍵/秘密鍵ペアを生成
  公開鍵 → サービスのサーバーに登録
  秘密鍵 → デバイス（またはパスキープロバイダー）に保存

認証時:
  サーバー → チャレンジ（nonce）を送信
  デバイス → 秘密鍵で署名（生体認証・PIN で秘密鍵を保護）
  署名 → サーバーで公開鍵を使って検証
```

本質的にパスワードフィッシング・中間者攻撃・リプレイ攻撃に耐性を持ちます。WebAuthn 仕様（[W3C WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/)）では、チャレンジに `rpId`（Relying Party ID = ドメイン）が含まれるため、偽サイトへの署名提供が構造的に不可能です。

### 同期型 vs デバイス結合型

パスキーには 2 つのアーキテクチャがあります。

| 特性             | 同期型（Synced Passkey）                        | デバイス結合型（Device-Bound Passkey）                        |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------- |
| 秘密鍵の保存先   | クラウド同期（iCloud Keychain・Google PM など） | デバイスのセキュアエンクレーブ（TPM / Secure Element）        |
| デバイス紛失時   | 別デバイスからアクセス可能                      | 資格情報を失う                                                |
| セキュリティ強度 | 中（クラウド経由の攻撃面が存在）                | 高（秘密鍵がデバイス外に出ない）                              |
| 主なユースケース | コンシューマー向けアカウント                    | 企業・政府・高保証認証                                        |
| 実装例           | Apple iCloud Keychain、Google Password Manager  | FIDO Security Key（YubiKey など）、Windows Hello for Business |

コンシューマーがパスキーを気軽に使えるようになった理由は「同期型」の存在によるものですが、企業のセキュリティポリシーでは「デバイス結合型」が要求されることが多く、この 2 つのモードは適用領域が異なります（[FIDO Alliance ホワイトペーパー](https://fidoalliance.org/white-paper-multi-device-fido-credentials/)）。

## Apple の戦略：iCloud Keychain とエコシステム統合

### 基本設計

Apple のパスキー実装は **iCloud Keychain** を基盤としています。ユーザーが iPhone でパスキーを登録すると、エンドツーエンド暗号化されたチャネルを通じて iPad・Mac・Apple TV へ自動同期されます。Apple はこの鍵の中身を知ることができない設計です。iCloud Keychain のセキュリティは、Apple Account の二要素認証（2FA）によって保護されています（[Apple セキュリティ概要](https://support.apple.com/en-us/102195)）。

### iOS 16 から iOS 26 への進化

2022 年の iOS 16 でパスキーが正式導入されて以来、Apple は毎年機能を追加してきました。

**iOS 26 / macOS 26（2025 年 WWDC 発表）の主要変更点：**

1. **Credential Portability（CXF 対応）**: `ASCredentialExportManager` / `ASCredentialImportManager` API により、iCloud Keychain から 1Password・Bitwarden 等のサードパーティパスワードマネージャーへのパスキー移行が可能になりました。転送はデバイス内の app-to-app フロー（生体認証で保護）であり、ファイル経由の平文エクスポートは行いません。FIDO CXF（Credential Exchange Format）に準拠した暗号化コンテナを使用します（[Apple Developer - WWDC25 セッション資料](https://developer.apple.com/wwdc25/)）。

2. **Passkey Account Creation API**: `ASAuthorizationAccountCreationProvider` により、アカウント作成とパスキー登録を 1 つのネイティブ UI ステップに統合できます。カスタム登録フォームを経由せず「パスワードレスファースト」な UX を実現します。

3. **Passkey Management Endpoints**: `/.well-known/passkey-endpoints` JSON ファイルで、パスキー登録・管理 URL を宣言できます。パスワードマネージャーがこの情報を使ってユーザーを適切なページに誘導できます。

4. **WebAuthn Signal API サポート**: `ASCredentialUpdater` クラスにより、サービス側がユーザー名変更などのメタデータ変更をパスキープロバイダーにプッシュできます。再登録なしで資格情報を最新の状態に保てます。

### Apple のプライバシー上の設計選択

注目すべきは、Apple がコンシューマー向けの iCloud Keychain パスキーでは **AAGUID をゼロ化（zeroed-out）** する点です。AAGUID は WebAuthn で認証器の機種を識別するフィールドですが、Apple はサービス側がこれを使って「どのデバイスで認証されたか」を追跡することを意図的に防いでいます。エンタープライズ管理デバイスでは認証（attestation）が利用可能で、MDM プロファイルによって制御されます。

この選択は純粋なプライバシー保護ですが、リスクベース認証を実装したい RP（Relying Party）にとっては、認証器情報が得られないというトレードオフがあります。

## Google の戦略：クロスプラットフォームと開発者エコシステム

### Google Password Manager の拡張

Google は Android・Chrome という 2 つのプラットフォームを持ち、パスキーを「Google アカウント」に紐づいた形で管理します。2025 年時点で Google Password Manager はすべてのプラットフォーム（Android・iOS/iPadOS・Windows・macOS・Linux・ChromeOS）でパスキーを同期します（[Google for Developers - Passkeys](https://developers.google.com/identity/passkeys/)）。

**2025 年の主要アップデート：**

- Chrome 132 以降、iOS でも Google Password Manager のパスキー同期が有効になり、真のクロスプラットフォーム対応が実現
- Google Password Manager が 2025 年後半に専用 Android アプリとしてリリース。Chrome や設定アプリを経由せず直接管理できるように
- Credential Manager API の改善により、Android アプリがパスワード・パスキー・Google でサインインを統一的に扱えるようになった（[Android Developers Blog](https://android-developers.googleblog.com/2025/09/best-practices-migrating-users-passkeys-credential-manager.html)）

### Credential Manager API と Android 14+

Android 14 以降では、ユーザーが Google Password Manager 以外のパスキープロバイダー（1Password・Bitwarden 等）を選択できます。Credential Manager API はパスキー生成・使用リクエストをシステムに委譲し、ユーザーが設定したプロバイダーが処理します。Android 14 未満のデバイスでは Google Password Manager がデフォルトになります。

```kotlin
// Android Credential Manager でパスキー認証リクエスト例
val credentialManager = CredentialManager.create(context)
val request = GetCredentialRequest(
    listOf(
        GetPublicKeyCredentialOption(
            requestJson = createPasskeyRequestJson()
        )
    )
)
val result = credentialManager.getCredential(
    request = request,
    context = context,
)
```

### 実績データ

Google が公開するパスキー採用事例によると、X（旧 Twitter）はパスキー導入後にログイン成功率が 2 倍、KAYAK はサインアップ・サインイン時間が 50% 短縮、Zoho は 6 倍高速なログインを達成しています。これらはパスキーの UX 優位性を示す具体的なデータです。

## Microsoft の戦略：エンタープライズのフィッシング耐性

### Windows Hello とエンタープライズ認証

Microsoft のパスキー戦略は、コンシューマーとエンタープライズの 2 本立てです。Windows Hello は消費者向けのデバイス結合型パスキーを提供しつつ、**Microsoft Entra ID**（旧 Azure AD）との統合によってエンタープライズ認証のフィッシング耐性を実現します。

**2026 年 3〜4 月の主要展開：**

Microsoft Entra ID は 2026 年 3 月に **Windows Hello の Entra パスキーとしての登録**を一般提供開始しました（[Microsoft Entra Blog - RSAC 2026](https://techcommunity.microsoft.com/blog/microsoft-entra-blog/microsoft-entra-innovations-announced-at-rsac-2026/4502146)）。ユーザーは Windows デバイスに対して、Windows Hello のセキュアエンクレーブ（TPM）にデバイス結合型パスキーを直接登録できます。これにより：

- 管理されていない個人 Windows デバイスでも Entra への passwordless サインインが可能
- FIDO2 認証器として Windows Hello が機能し、Conditional Access ポリシーと連携
- 2026 年 5 月以降、セキュリティ情報の登録操作に対して Conditional Access ポリシーが適用

### Microsoft の自動有効化戦略

Microsoft は 2026 年 3 月に **Microsoft アカウント（コンシューマー向け）のパスキーを数億ユーザーに自動有効化**しました。企業向けでは 87% の企業がパスキーを展開済みまたは積極的に展開中と FIDO Alliance の調査で報告されています（[Security Boulevard, March 2026](https://securityboulevard.com/2026/03/passkeys-hit-critical-mass-microsoft-auto-enables-for-millions-87-of-companies-deploy-as-passwords-near-end-of-life/)）。

### Windows Hello for Business vs 個人向け Windows Hello

```
Windows Hello for Business（企業向け）:
  - Azure AD / Entra ID 参加デバイスに適用
  - TPM に保存されたデバイス結合型鍵（クラウド同期なし）
  - 証明書ベースまたはキーベースの展開モード
  - MFA 登録フローで管理者が制御

Windows Hello（個人向け）:
  - Microsoft アカウントに紐づく
  - デバイスを超えた同期はアカウント経由（iCloud Keychain と異なり同期範囲は限定的）
  - 第三者パスキープロバイダー（Chrome の Google PM 等）も利用可能
```

## FIDO CXP / CXF：ロックイン解消への標準化

3 社共通の課題は「パスキーのベンダーロックイン」でした。Apple のパスキーは Apple デバイス間でしか同期されず、Google Password Manager のパスキーは Google アカウントに依存します。異なるエコシステム間でパスキーを移行する手段がありませんでした。

FIDO Alliance はこの問題に対して 2 つの仕様を策定しました。

### Credential Exchange Format（CXF）

CXF は、パスキー・パスワード・TOTP シークレット・セキュアノートを安全に転送するための **JSON ベースの標準フォーマット**です（[FIDO CXF v1.0 Working Draft](https://fidoalliance.org/specs/cx/cxf-v1.0-wd-20241003.html)）。

2025 年 3 月に Review Draft へ昇格し、Apple が iOS 26 / macOS 26 で CXF ベースの同デバイス内転送を実装済みです。Google・1Password・Bitwarden・Dashlane も活発な貢献者として参加しています。

### Credential Exchange Protocol（CXP）

CXP は転送のセキュリティプロトコルを定義します。転送中の資格情報の保護には **HPKE（Hybrid Public Key Encryption）** を使用し、中間者攻撃なしに暗号化されたコンテナを転送します。Working Draft 段階で、2026 年前半の公開が予定されています。

```
CXP フロー（Apple → 1Password の例）:
  1. エクスポート元アプリ（iCloud Keychain）が CXF 形式でエクスポート
  2. HPKE で暗号化（受信側の公開鍵で）
  3. 同デバイス上の app-to-app チャネルで転送（ファイル経由不可）
  4. 生体認証でユーザー確認
  5. インポート先アプリ（1Password）が復号・保存
```

この標準化により、パスキーエコシステムは「プラットフォームへの囲い込み」から「ポータブルな認証情報」へと進化しつつあります。

## 3 社の設計哲学の比較

| 観点                       | Apple                                                | Google                                   | Microsoft                              |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------- | -------------------------------------- |
| **主な同期基盤**           | iCloud Keychain（E2E 暗号化）                        | Google アカウント                        | Microsoft アカウント / Entra           |
| **クロスプラットフォーム** | Apple デバイス間のみ（iOS 26 で CXF 経由の移行開始） | Android・Chrome 経由で全プラットフォーム | Windows 中心、第三者 PM も許容         |
| **エンタープライズ対応**   | MDM 経由の attestation 制御                          | Google Workspace との統合                | Entra との深い統合・Conditional Access |
| **プライバシー設計**       | AAGUID ゼロ化（追跡防止）                            | 使用データを Google アカウントで管理     | AAD 登録ログによる可視性を重視         |
| **デバイス結合型**         | YubiKey 等外部認証器で対応                           | Android の Secure Element 経由           | Windows Hello for Business（TPM 必須） |
| **主なターゲット**         | Apple デバイスユーザー全般                           | Android ユーザー / ウェブ開発者          | 企業 IT 管理者                         |

## 実装上の考察

### RP（サービス側）の対応ポイント

パスキーを導入するサービス開発者（Relying Party）が考慮すべき点を整理します。

**1. `/.well-known/passkey-endpoints` の整備**

iOS 26 の Passkey Management Endpoints に対応するには、以下のような JSON ファイルを配置します。

```json
{
  "enroll": "https://example.com/account/passkeys/register",
  "manage": "https://example.com/account/passkeys"
}
```

パスワードマネージャーがこの URL を参照して、ユーザーをパスキー管理ページに誘導します。

**2. AAGUID を使ったリスク判断の限界**

Apple コンシューマー向けパスキーでは AAGUID がゼロ化されるため、「iCloud Keychain から発行されたパスキー」を識別できません。エンタープライズ環境では MDM 管理デバイスに attestation を要求し、デバイス管理外の認証を弾く設計が必要です。

**3. Cross-Device Authentication（CDA）の活用**

モバイルデバイスでパスキーを作成し、PC のブラウザでそのパスキーを使う「クロスデバイス認証」は BLE（Bluetooth Low Energy）を使って実現されます。この際、QR コードスキャンによるデバイス連携フローが発生します。この UX が混乱を招くケースがあるため、ユーザーへの説明 UI が重要です（[WebAuthn 仕様 - Cross-Device Flows](https://www.w3.org/TR/webauthn-3/#sctn-transport)）。

**4. 段階的移行戦略**

既存のユーザーベースをパスキーへ移行する際は、パスワードを即時廃止するのではなく、「パスキーを追加登録」→「次回ログイン時にパスキー使用を促す」→「一定期間後にパスワードを非アクティブ化」の段階的アプローチが現実的です。Google の Credential Manager ドキュメントが推奨するパターンです。

## まとめ

Apple・Google・Microsoft が 2022 年に共同発表したパスキーは、4 年で「業界標準」へと成長しました。3 社それぞれの戦略は異なります。

- **Apple** は「エコシステム内の透明な同期」と「プライバシー優先の設計」を貫きつつ、iOS 26 で CXF 対応によるポータビリティを開放しました
- **Google** は「クロスプラットフォームの到達範囲」を武器に、Android・Chrome・iOS・デスクトップを横断するパスキー基盤を構築しました
- **Microsoft** は「企業認証のフィッシング耐性」に注力し、Windows Hello の Entra 統合によってエンタープライズのパスワードレス化を牽引しています

FIDO CXP/CXF の標準化が完了すると、「iCloud Keychain に登録したパスキーを 1Password に移行する」「Google Password Manager のパスキーを Apple に移行する」といった操作が安全に行えるようになります。これはパスキーエコシステムが真に「ポータブルな認証インフラ」として成熟することを意味します。

実装者の視点では、コンシューマー向けは「同期型パスキーの UX 最適化」、エンタープライズ向けは「デバイス結合型パスキーと Conditional Access の組み合わせ」という二軸で設計を検討することが、2026 年時点での現実的なアプローチです。

## 参考資料

- [W3C Web Authentication (WebAuthn) Level 3](https://www.w3.org/TR/webauthn-3/) — W3C Recommendation
- [FIDO Alliance - Passkeys](https://fidoalliance.org/passkeys/) — FIDO Alliance
- [FIDO Credential Exchange Format (CXF) v1.0 Working Draft](https://fidoalliance.org/specs/cx/cxf-v1.0-wd-20241003.html) — FIDO Alliance
- [Apple - About the security of passkeys](https://support.apple.com/en-us/102195) — Apple Support
- [Google for Developers - Passkeys](https://developers.google.com/identity/passkeys/) — Google
- [Android Developers - Migrating to passkeys with Credential Manager](https://android-developers.googleblog.com/2025/09/best-practices-migrating-users-passkeys-credential-manager.html) — Google
- [Microsoft Entra - Passkeys (FIDO2) authentication](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-authentication-passkeys-fido2) — Microsoft Learn
- [Microsoft Entra innovations at RSAC 2026](https://techcommunity.microsoft.com/blog/microsoft-entra-blog/microsoft-entra-innovations-announced-at-rsac-2026/4502146) — Microsoft
- [FIDO Alliance White Paper: Multi-Device FIDO Credentials](https://fidoalliance.org/white-paper-multi-device-fido-credentials/) — FIDO Alliance
- [Device-Bound vs. Synced Credentials (ICISSP 2025)](https://arxiv.org/html/2501.07380) — arXiv
