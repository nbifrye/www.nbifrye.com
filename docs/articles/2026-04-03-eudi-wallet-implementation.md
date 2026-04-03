---
title: EUDI WalletのARFと実装状況：2026年展開に向けた技術基盤と課題
description: EUDI Wallet Architecture Reference Framework（ARF）v2.7の技術アーキテクチャ、委任法令の整備状況、大規模パイロットの知見、2026年末加盟国展開に向けた課題を解説する。
date: 2026-04-03
---

> **Note:** この記事はAIエージェントが執筆しています。内容の正確性は一次情報とあわせてご確認ください。

# EUDI WalletのARFと実装状況：2026年展開に向けた技術基盤と課題

## 要約

- **Architecture Reference Framework（ARF）v2.7.2** が現行の技術基準であり、PID・EAA・Wallet Unit Attestation（WUA）・信頼リストという4層の信頼モデルを規定する。
- **Commission Implementing Regulations（CIR）** は2024年12月と2025年7月の2波で整備が進み、2024年12月公布分の施行（同月24日）から24ヶ月後にあたる **2026年12月** が加盟国のウォレット提供義務期限となる。
- 4つの大規模パイロット（POTENTIAL・EWC・NOBID・DC4EU）は2023〜2025年に完了し、相互運用性確保には「共通標準の厳格な適用」が不可欠であることを実証した。
- 2025年9月開始の第2世代パイロット（APTITUDE・WE BUILD）が2027年まで継続し、本番稼働に向けた最終検証を担う。
- 準備状況は加盟国間で大きく乖離しており、専門家の多くは本格的な相互運用は **2027年以降** になると予測している。

## 背景：ARFとは何か

[Regulation (EU) 2024/1183](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1183)（eIDAS 2.0）は法的要件を定めるが、技術仕様の詳細は委任法令（CIR・CDR）と参照アーキテクチャに委ねられている。**Architecture Reference Framework（ARF）** はその中核的な技術ドキュメントであり、欧州委員会が GitHub 上で公開・管理している（[eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework)）。

ARF は法的拘束力を持たず「参照実装のガイダンス」という位置付けだが、大規模パイロットの技術設計から CIR 草案策定まで実質的な標準として機能してきた。現行バージョンは **v2.7.2**（2026年初頭時点）で、Cooperation Group の意見を反映した継続的改訂が行われている。

## ARFの技術アーキテクチャ

### 主要コンポーネント

ARF は以下のエンティティとそのインタラクションを定義する。

| エンティティ             | 役割                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Wallet Provider**      | EUDI Wallet アプリを開発・提供する主体（加盟国または委託事業者）                                      |
| **PID Provider**         | Person Identification Data（身元証明データ）を発行する加盟国機関                                      |
| **Attestation Provider** | EAA（電子属性証明）を発行する認定機関。Qualified（QEAA）・公的機関発行（PuB-EAA）・非認定（EAA）の3種 |
| **Relying Party**        | ウォレットから属性の提示を受けるサービス提供者                                                        |
| **Wallet Unit**          | エンドユーザーのデバイス上で動作する EUDI Wallet の実例                                               |

### 信頼モデル：4層構造

ARF の信頼モデルは以下の4層で構成される。

**第1層：Trusted Lists（信頼リスト）**
加盟国がそれぞれ管理する信頼リストに、Wallet Provider・PID Provider・Attestation Provider のトラストアンカーを登録する。EU 全体でこれらを束ねる「European List of Trusted Lists」により、クロスボーダー検証を実現する（[ARF 2.7 Section 6](https://eudi.dev/2.7.3/architecture-and-reference-framework-main/)）。

**第2層：Wallet Unit Attestation（WUA）**
Wallet Provider が発行する WUA は、ウォレットのすべてのコンポーネント（WSCA/WSCD を含む）が要件を満たすことを証明する。Relying Party はクレデンシャル検証の前に WUA を検証する。

**第3層：Access Certificates / Registration Certificates**
PID Provider・Attestation Provider・Relying Party は、Wallet Unit との通信に先立ちアクセス証明書を提示する必要がある。CIR (EU) 2025/848 により Relying Party 登録証明書は加盟国の選択に委ねられた（必須ではなくオプション）。

**第4層：Wallet Secure Cryptographic Device（WSCD）**
秘密鍵の保護を担うハードウェアセキュリティコンポーネント。アーキテクチャタイプはリモート・ローカル外部・ローカル内部・ローカルネイティブの4種類。

### クレデンシャル形式：mdoc と SD-JWT VC の並行採用

ARF は2つのクレデンシャル形式を定める。

```
+----------------------------+----------------------------+
| ISO/IEC 18013-5 (mdoc)     | SD-JWT VC                  |
+----------------------------+----------------------------+
| 近接通信（Bluetooth/NFC）  | リモートWebフロー向け      |
| に最適化                   | JWTベースで既存PKIと親和   |
| mDL（運転免許証）の標準    | ブラウザAPIでのサポート    |
+----------------------------+----------------------------+
```

発行プロトコルは OpenID4VCI、提示プロトコルは OpenID4VP を採用する。

### Wallet セキュリティレベル

eIDAS 2.0 は Level of Assurance（LoA）を3段階定義するが、PID 発行には **LoA High** が要求される。EUDI Wallet はハードウェアバックドキーストア（認定 WSCD）の使用が義務付けられており、一般的なソフトウェアキーストアは LoA High の要件を満たさない。

## 法令整備状況：委任法令（CIR）の3波

### 第1波：2024年12月（5本）

| 規則番号      | 内容                           |
| ------------- | ------------------------------ |
| CIR 2024/2977 | PID・EAA の発行要件            |
| CIR 2024/2979 | ウォレットの完全性とコア機能   |
| CIR 2024/2980 | エコシステム通知               |
| CIR 2024/2981 | ウォレットソリューションの認証 |
| CIR 2024/2982 | プロトコルとインターフェース   |

**2024年12月4日**に公布、同月24日施行。この施行日から24ヶ月後（**2026年12月24日**）が加盟国の最初のウォレット提供義務期限となる。

### 第2波：2025年4〜5月（複数）

Relying Party 登録（CIR 2025/848）、クロスボーダー ID マッチング、セキュリティ侵害報告、認証要件に関する規則が整備された。

### 第3波：2025年7月（8本）

2025年7月30日に公布された8本の CIR は、主に電子信頼サービス関連（QSCDの管理・通知・認証、電子証明書発行時の身元確認等）と EAA 規則をカバーする。公布から20日後（**2025年8月19日**）に施行。

## 参照実装：オープンソース提供

欧州委員会は EUDI Wallet の参照実装を GitHub 上にオープンソースで公開している。

- **Android アプリ**: [eudi-app-android-wallet-ui](https://github.com/eu-digital-identity-wallet/eudi-app-android-wallet-ui)
- **iOS アプリ**: [eudi-app-ios-wallet-ui](https://github.com/eu-digital-identity-wallet/eudi-app-ios-wallet-ui)
- **Verifier アプリ**: [eudi-app-multiplatform-verifier-ui](https://github.com/eu-digital-identity-wallet/eudi-app-multiplatform-verifier-ui)
- **Wallet Provider サービス**: [eudi-srv-wallet-provider](https://github.com/eu-digital-identity-wallet/eudi-srv-wallet-provider)

参照実装は**プロトタイプ**であり、最終製品ではない。加盟国や民間開発者が独自ウォレットを開発する際の出発点として位置付けられている。2025年Q1のロードマップには、PID/証明書失効やブラウザ API サポートが含まれていた。

## 大規模パイロット（2023〜2025年）の知見

### 4パイロットの概要

欧州委員会は2022年に4つのコンソーシアムに計4,600万ユーロ以上を拠出し、26カ国以上にまたがる大規模パイロットを2023年4月から実施した。

| パイロット    | 主なユースケース                                               | 参加国数                                                              | 主な知見                                     |
| ------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| **POTENTIAL** | 政府サービス・銀行口座開設・SIM登録・mDL・eSign・ePrescription | 複数                                                                  | 1,300以上のテスト、249件のクロスボーダー取引 |
| **EWC**       | Digital Travel Credentials・旅行ユースケース                   | 複数                                                                  | 旅行業界への展開可能性を検証                 |
| **NOBID**     | 電子認証・決済・署名・属性共有                                 | 6（デンマーク、ドイツ、アイスランド、イタリア、ラトビア、ノルウェー） | UXと信頼の関係性を分析                       |
| **DC4EU**     | 教育・社会保障の QEAA クロスボーダー交換                       | 25（101パートナー）                                                   | 本番環境への移行ブループリントを提示         |

### 相互運用性への示唆

POTENTIAL の最大の提言は「共通標準の厳格な適用なしにクロスボーダー相互運用は実現しない」というものだった（[Biometric Update, 2025](https://www.biometricupdate.com/202511/eudi-wallet-needs-common-standards-applied-rigorously-potential-pilot-finds)）。各国実装間の差異は、厳格なコンフォーマンステストと EU レベルの統一された標準の適用によってのみ吸収できる。

NOBID は UX の重要性を指摘した。PIN 設定の煩雑さ、フローの不明確さ、データ共有の透明性不足が利用者の信頼を損なうことを実証した。特に障害を持つ利用者向けのアクセシビリティ対応が不足していた。

DC4EU は 101 のパートナーと 25 カ国での実証を経て、教育証明書・社会保障属性の QEAA 交換の技術的・運用的ブループリントを完成させた。

### 第2世代パイロット（2025〜2027年）

2025年9月に2つの新パイロットが開始した。

**APTITUDE**: 旅行・車両登録証明書を含む幅広いユースケースを対象に、相互運用性・使いやすさ・スケーラビリティを検証する。

**WE BUILD**: B2B・B2G・B2C での KYx（Know Your Customer/Business/Supplier/Employee）など13の高影響ユースケースに焦点を当て、オランダ経済省主導で24ヶ月間実施する。

## 展開状況：加盟国間の格差

### 準備状況の現実

2026年12月の展開期限に向けて、加盟国の準備状況は大きく乖離している。

- **オランダ**: 期限内での展開が困難と表明
- **マルタ**: 限定的な機能での展開を見込む
- **ブルガリア**: 国内法制が未整備のため開発未着手
- **大規模加盟国（ドイツ、スペイン、フランス等）**: 既存国内 eID 基盤との統合に課題（スペインの Cl@ve 等）

専門家の見解では「基本機能を持つウォレットは12ヶ月で開発可能だが、クロスボーダー相互運用は2027年以降」というのが大方のコンセンサスである（[Biometric Update, 2025](https://www.biometricupdate.com/202512/will-the-eudi-wallet-be-ready-in-2026-experts-say-probably-not)）。

### 認証プロセスのボトルネック

ウォレットの認証（certification）プロセスが構造的なボトルネックになっている。

1. 各加盟国が国家認証スキームを策定する必要がある
2. Conformity Assessment Bodies（CAB）の認定が完了していない国が多い
3. LoA High 要件を満たす WSCD の調達・統合に時間がかかる

### 民間サービスへの影響

eIDAS 2.0 第.45条は、**2027年末**までに以下の分野の民間サービス提供者が EUDI Wallet 対応を義務付けることを求める。

- 金融サービス（銀行口座開設・ローン申請）
- 電気通信（SIM 登録）
- 医療（ePrescription・患者記録）
- 輸送（旅行ドキュメント）

実際の義務発生タイミングは加盟国の全ウォレット提供後60日であり、ウォレット展開の遅れが民間義務の発生時期を後ろ倒しにする構造になっている。

## 技術的考察：設計のトレードオフ

### mdoc と SD-JWT VC の並行採用

ARF が2つのクレデンシャル形式を並行採用した背景には、ユースケースの多様性がある。mdoc は ISO/IEC 18013-5 として国際標準化されており、近接通信（mDL）への対応が優れている。SD-JWT VC は Web ベースのフローとの親和性が高く、既存の OAuth/OIDC エコシステムとの統合が容易だ。

しかしこの並行採用は、Relying Party が両方の形式を処理する実装コストを負担することを意味する。DC4EU・POTENTIAL のパイロットでも、対応形式の不一致が相互運用性の障壁となった事例が報告されている。

### Relying Party 登録の任意化

CIR 2025/848 が Relying Party 登録証明書をオプションとしたことは、加盟国の柔軟性を高める一方で相互運用性の統一性を低下させる可能性がある。登録証明書がないと Wallet Unit は Relying Party の正当性を事前に検証できず、フィッシング対策の観点から懸念が残る。

### WSCD の多様性

ローカルネイティブ（スマートフォンの Secure Enclave/TEE）・ローカル外部（FIDO セキュリティキー等）・リモート（クラウド HSM）という複数の WSCD アーキテクチャを認める設計は、多様なデバイス環境に対応できる柔軟性をもたらす。反面、各タイプのセキュリティ特性が異なるため、認証スキームの設計が複雑化する。

## まとめ

EUDI Wallet のエコシステムは法的基盤（eIDAS 2.0）・技術仕様（ARF v2.7）・委任法令（CIR の3波）が概ね整備され、実装フェーズに移行しつつある。大規模パイロットの知見は今後の開発に重要なインプットを提供した。

一方で、2026年12月という加盟国展開期限に向けた準備状況は加盟国間で大きく異なり、本格的なクロスボーダー相互運用は2027年以降になるという見方が現実的だ。「共通標準の厳格な適用」というPOTENTIALの提言が示す通り、技術仕様の整備と実装間のコンフォーマンスの間のギャップを埋める継続的な取り組みが求められる。

デジタルアイデンティティの実装者・事業者にとっては、以下の点を重点的に追跡することが重要だ。

- ARF の改訂動向（GitHub リポジトリで継続的に更新）
- 自国・対象市場の加盟国の国内実装法と認証スキームの確定状況
- APTITUDE・WE BUILD パイロットの成果（2027年Q1頃に最終報告予定）
- OpenID4VCI/OpenID4VP の仕様成熟度（関連するIETF/OpenID標準との整合性）

## 参考資料

- [EUDI Wallet ARF v2.7.3（公式ドキュメント）](https://eudi.dev/2.7.3/architecture-and-reference-framework-main/)
- [ARF GitHub リポジトリ](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework)
- [Regulation (EU) 2024/1183（eIDAS 2.0）](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1183)
- [欧州委員会 EUDI Wallet 実装ポータル](https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet-implementation)
- [大規模パイロット概要（EC公式）](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/694487808/What+are+the+Large+Scale+Pilot+Projects)
- [NOBID パイロット完了報告](https://www.nobidconsortium.com/nobid-wraps-up-successful-pilot-under-the-european-digital-identity-wallet-programme/)
- [POTENTIAL: 共通標準の厳格な適用を提言（Biometric Update）](https://www.biometricupdate.com/202511/eudi-wallet-needs-common-standards-applied-rigorously-potential-pilot-finds)
- [2026年展開の課題（Biometric Update）](https://www.biometricupdate.com/202512/will-the-eudi-wallet-be-ready-in-2026-experts-say-probably-not)
- [EUDI Wallet 参照実装（Android）](https://github.com/eu-digital-identity-wallet/eudi-app-android-wallet-ui)
- [EUDI Wallet 参照実装（iOS）](https://github.com/eu-digital-identity-wallet/eudi-app-ios-wallet-ui)
