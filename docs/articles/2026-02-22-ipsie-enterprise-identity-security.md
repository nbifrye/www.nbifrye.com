# IPSIE：エンタープライズ ID セキュリティを統合する新たなインタオペラビリティプロファイル

> OpenID Foundation で進行中の IPSIE（Interoperability Profile for Secure Identity in the Enterprise）は、SSO・ライフサイクル管理・エンタイトルメント・リスクシグナル共有・セッション終了という「エンタープライズ ID セキュリティの 5 つの柱」を一つのプロファイルに束ねようとする業界横断の取り組みだ。

## はじめに

「ID が攻撃の 80% 以上に関与している」という数字は近年繰り返し引用される。にもかかわらず、エンタープライズ向け SaaS アプリケーションの ID セキュリティ実装は依然としてバラバラだ。あるアプリは SSO に対応していても SCIM がない。あるアプリはセッション終了の仕組みを持っていても、IdP からのリスクシグナルを受け取れない。

この「断片化」を解消しようとしているのが **IPSIE（Interoperability Profile for Secure Identity in the Enterprise）**だ。Okta が主導し、2024年10月に OpenID Foundation でワーキンググループが正式に発足。Microsoft・Google・Ping Identity・Beyond Identity・SGNL・Capital One・Slack・Atlassian など 50 を超える主要 SaaS ベンダーが参加している。

本稿では、IPSIE が何を解決しようとしているのか、どのような技術的枠組みを定義しているのか、そして業界にとってどんな意味を持つのかを整理する。

---

## 背景：なぜ今このプロファイルが必要か

### 仕様の乱立と「オプション地獄」

OpenID Connect も SCIM も Shared Signals Framework も、それぞれ単独では完成度の高い仕様だ。しかし問題は、これらを組み合わせるためのガイドラインが存在しないことにある。

各仕様には「オプション」の項目が大量に存在する。OIDC であれば `claims` パラメータの扱い、`acr_values` の使い方、セッション管理の方法。SCIM であればプロビジョニングのタイミングやグループ管理の実装。仕様の本文を読んだ開発者がそれぞれの判断で実装した結果、「OIDC に準拠している」と言い張る製品同士が実際にはほとんど相互運用できない、という状況が生まれる。

これは OAuth 2.0 や FIDO2 が歩んだ道と同じだ。仕様の策定後に「プロファイル」（FAPI、HAIP など）が登場して初めて実装間の相互運用性が保証された。IPSIE はエンタープライズ向けに同じことをしようとしている。

### SaaS アプリの「セキュリティ実装コスト」問題

エンタープライズ向け SaaS を開発する側から見ると、ID セキュリティの要求は複雑で多岐にわたる。大企業顧客から「SCIM を実装してくれ」「CAEP シグナルを受け取れるようにしてくれ」「セッション即時終了を実装してくれ」という要求が次々と来る。しかし何をどのレベルで実装すればよいのか、明確な基準がなかった。

IPSIE が「この機能セットを実装すれば IPSIE 準拠」という共通言語を提供することで、SaaS ベンダーは実装すべき内容を明確化でき、エンタープライズ顧客は調達の際に「IPSIE 準拠か否か」という軸で評価できるようになる。

---

## IPSIE が定義する 5 つの機能領域

IPSIE は新しいプロトコルを発明するのではなく、**既存の仕様を組み合わせて「エンタープライズ ID セキュリティのプロファイル」を定義する**。カバーする機能領域は以下の 5 つだ。

### 1. シングルサインオン（SSO）

対応仕様：**OpenID Connect (OIDC)**

エンタープライズ向け SSO に必要な要件を絞り込む。「どのオプションを必須とするか」「`acr_values` による MFA 要求をどう実装するか」「マルチ IdP 環境をどう扱うか」などが含まれる。

SAML は現在のエンタープライズ環境に広く存在するが、IPSIE の主軸は OIDC だ。SAML との後方互換性への言及はあるものの、新規実装は OIDC ベースを前提としている。

### 2. アカウントライフサイクル管理

対応仕様：**SCIM 2.0**

ユーザーの入社・異動・退職に対応するプロビジョニング／デプロビジョニングを定義する。「オーファンアカウント（退職者のアカウントが残存する問題）」の防止が主要な動機の一つだ。

グループ管理も含まれ、IdP 側のグループをアプリ側のロールにマッピングする仕組みを標準化する。

### 3. エンタイトルメント（最小権限）

対応仕様：**SCIM 2.0**（拡張）

「誰が何にアクセスできるか」を IdP 主導で一元管理する。アプリ側が利用可能なロールを IdP に公開し、双方向でロールのマッピング・同期を行うことで「最小権限の原則」を実装する。

### 4. リスクシグナル共有

対応仕様：**Shared Signals Framework (SSF) / CAEP**

CAEP（Continuous Access Evaluation Protocol）は、IdP とアプリ間でリアルタイムにセキュリティイベントを交換するプロトコルだ。「デバイスが侵害された」「ユーザーのパスワードがリセットされた」「IP アドレスが変わった」といったシグナルをリアルタイムで伝搬することで、ゼロトラストの文脈で「継続的な認証評価」を実現する。

SSF/CAEP はすでに OpenID Foundation で標準化が進んでいるが、IPSIE はエンタープライズ SaaS がこれをどのように実装するかを規定する。

### 5. セッション終了とトークン失効

対応仕様：**OpenID Provider Commands** + OIDC Back-Channel Logout

脅威が検知された際にすべてのユーザーセッションを即座に終了させる能力は、セキュリティインシデント対応において最も重要な機能の一つだ。しかし実装が統一されていないため、一部のアプリでは「ログアウトしたはずなのにセッションが残る」問題が起きていた。

**OpenID Provider Commands** は、IdP が RP（アプリ）に直接コマンド（例：「このユーザーの認可を即時取り消せ」）を送るプロトコルで、IPSIE の文脈でセッション終了を確実に実行する手段として位置づけられている。

---

## IPSIE が定義するレベル体系

IPSIE v1 ドラフトは、二つの独立した階層を定義している。

### セッションライフサイクル（SL）

| レベル | 主要要件 |
|--------|---------|
| **SL1** | 基本的な SSO + NIST SP 800-63-4 FAL2 準拠 + MFA の実施と ACR の通知 |
| **SL2** | 認証方法のリクエスト + ログアウト能力 + IdP による遠隔セッション終了 |
| **SL3** | 継続的アクセス監視 + リアルタイムの状態変化共有（IP 変更・デバイス状況等） |

### アカウントライフサイクル（AL）

| レベル | 主要要件 |
|--------|---------|
| **AL1** | ユーザーのデプロビジョニング（停止・アーカイブ・削除）|
| **AL2** | ユーザープロビジョニング + グループ管理（SCIM）|
| **AL3** | ロール管理 + IdP とアプリ間の双方向ロール同期 |

二つの階層は独立しているため、「SL2 かつ AL1」のように組み合わせて要件を表現できる。この設計は、企業の調達要件や認証プログラムで「どの組み合わせを必須とするか」を柔軟に定義できるようにするためのものだ。

---

## 参加プレイヤーと産業への影響

IPSIE のユニークな点は、**競合関係にあるベンダーが共同で標準を策定している**ことだ。Okta と Microsoft（Entra ID）は IdP 市場で直接競合しているが、両社が同じワーキンググループで仕様を議論している。Google、Slack、Atlassian といったメジャーな SaaS ベンダーも参加しており、「IPSIE 準拠」を共通の達成目標に据えている。

これが示すのは、ID セキュリティの断片化が「自社だけでは解決できない産業横断の問題」として認識されているということだ。競合他社と仕様を共有してでも、エコシステム全体のセキュリティレベルを底上げする方が、長期的に自社にとっても有利だという判断がある。

Okta は Customer Identity Cloud（CIC）において IPSIE 準拠機能（SSO、MFA、SCIM、Universal Logout）を全プランで提供する方針を示している。これはスタートアップから大企業まで、新しい SaaS アプリが最初から IPSIE の機能セットを実装できる環境を整えることを意味する。

---

## 現在のステータスと今後のロードマップ

- **2024年10月**：OpenID Foundation で IPSIE WG 正式発足
- **2025年前半（予定）**：IPSIE v1 ドラフト公開
- **2025年（Identiverse）**：IPSIE WG の進捗レビュー + 相互運用テストイベントの計画
- **2026年**：安定版標準の公開を目指す

2026年2月時点では、GitHub リポジトリ上でドラフト（`ipsie-v1-draft.md`）の作業が続いており、正式な draft 公開には至っていない。Identiverse 2025 での議論を経て、2025年後半から 2026年にかけて標準化が加速することが見込まれる。

---

## まとめと展望

IPSIE が解こうとしている問題は、技術的には複雑ではない。OIDC、SCIM、CAEP、OpenID Provider Commands——それぞれ単独では使える仕様が揃っている。問題は、それらをどのように組み合わせるかについての共通合意がなかったことだ。

IPSIE はその共通合意を「プロファイル」として文書化することで、3 つのことを可能にする。

1. **SaaS ベンダー**が「何を実装すれば十分か」を明確に知れる
2. **エンタープライズ顧客**が「IPSIE 準拠か否か」という軸で調達できる
3. **IdP とアプリの間**で相互運用性が保証された統合が実現する

特に注目すべきは、SL3（継続的アクセス監視）と CAEP の組み合わせだ。これが広く実装されれば、「ログイン時点でのみ認証する」モデルから「セッション全体を通じてリスクを評価し続ける」モデルへのシフトが現実のものになる。これはゼロトラストアーキテクチャの文脈で語られてきた「継続的認証」を、実装レベルで具体化するものだ。

2026年は IPSIE の標準化が最終段階に差し掛かる年になる。ドラフトへのフィードバックと相互運用テストの結果次第では、HAIP が EUDI Wallet エコシステムに果たした役割——「仕様が出揃った後の相互運用性保証」——をエンタープライズ ID セキュリティ領域で担う可能性がある。

## 参考

- [IPSIE Working Group — OpenID Foundation GitHub](https://github.com/openid/ipsie)
- [IPSIE — oauth.net](https://oauth.net/ipsie/)
- [Okta's mission to standardize Identity Security](https://www.okta.com/blog/2024/10/oktas-mission-to-standardize-identity-security/)
- [How the IPSIE Working Group is Reshaping Identity Security](https://www.okta.com/blog/2024/11/help-reshape-identity-security-join-the-ipsie-working-group/)
- [Okta, OpenID Foundation & Tech Firms Tackle Today's Biggest Cybersecurity Challenge — BusinessWire](https://www.businesswire.com/news/home/20241016143671/en/Okta-OpenID-Foundation-Tech-Firms-Tackle-Today%E2%80%99s-Biggest-Cybersecurity-Challenge-Identity-Security-in-SaaS-Apps)
- [Okta's commitment to CAEP and SSF](https://www.okta.com/blog/2024/12/oktas-commitment-to-caep-and-ssf-pioneering-secure-interoperable-identity-standards/)
- [Beyond Identity's Investment in Identity Standards: IPSIE](https://www.beyondidentity.com/resource/beyond-identitys-investment-in-identity-standards-ipsie)
- [The Standards Making Identity Security Better: A 2025 Review](https://www.widefield.ai/blog/the-standards-making-identity-security-better-a-2025-review)
