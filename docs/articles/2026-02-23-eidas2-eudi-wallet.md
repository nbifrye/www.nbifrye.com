# eIDAS 2.0 と EUDI Wallet——EU が作るデジタルアイデンティティの新秩序

> EU の改正 eIDAS 規則（eIDAS 2.0）が 2026 年末の義務化に向けて動き出した。大規模パイロットの成果、技術スタックの実態、そして日本への波及を整理する。

## はじめに

2024 年 5 月、「eIDAS 2.0」こと改正 eIDAS 規則（Regulation EU 2024/1183）が正式に発効した。本規則の最大の目玉は **EU Digital Identity Wallet（EUDI Wallet）** の法的義務化だ。2026 年 12 月までに全 EU 加盟国が少なくとも 1 つの公式 Wallet を市民に提供し、相互受認することが求められる。

デジタルアイデンティティの標準化競争において、EU はトップダウンの規制力を武器に、OpenID4VP・SD-JWT VC・mDoc という最先端のプロトコルスタックを一気に社会実装しようとしている。その動向は日本を含む EU 域外にも無視できない影響を与え始めている。

## eIDAS 2.0 の義務化タイムライン

eIDAS 2.0 の施行スケジュールは段階的に設計されている。

**2026 年 12 月**——加盟国義務フェーズ

全 EU 加盟国が EUDI Wallet を市民に提供開始し、加盟国間での相互受認を義務付ける。政府サービス（税務申告・医療・社会保障）での利用が先行する。

**2027 年 12 月**——民間セクター強制受認フェーズ

銀行・大型 e コマースプラットフォーム・通信事業者に EUDI Wallet 受入義務が課される。「大型オンラインプラットフォーム」の基準は別途実施規則で定義される見込みだが、月間アクティブユーザーが一定規模を超えるサービスが対象となる。

この 2 段階構成は規制設計として巧みだと思う。加盟国に 1 年の先行期間を設けることで技術的なバグ出しを行い、民間が受け入れる段階では成熟したエコシステムが整っているという計算だ。

## EUDI Wallet の技術アーキテクチャ（ARF）

EUDI Wallet の技術仕様の中核は **Architecture and Reference Framework（ARF）** だ。ARF は欧州委員会が主導し、GitHub 上で公開されているオープンドキュメントであり、Wallet が実装すべき機能・インターフェース・セキュリティ要件を定義している。

技術スタックの要点を整理すると:

- **資格証明フォーマット**: SD-JWT VC（RFC 9901）と mdoc（ISO/IEC 18013-5）の両方をサポート。用途によって使い分ける設計（行政 PID は mdoc, 民間属性は SD-JWT VC が有力）
- **プレゼンテーションプロトコル**: OpenID for Verifiable Presentations（OpenID4VP）1.0 を採用。オンライン RP とのやりとりはすべて OpenID4VP の上で行われる
- **発行プロトコル**: OpenID for Verifiable Credential Issuance（OpenID4VCI）1.0 を採用。PID（Person Identification Data）や QEA（Qualified Electronic Attestation）の Wallet への配布に使用
- **信頼チェーン**: EU Trust Framework が発行機関・認証局の信頼関係を定義。OpenID Federation とも連携する設計

SD-JWT VC が選択的開示（Selective Disclosure）をネイティブにサポートする点が重要だ。ユーザーは「年齢が 18 歳以上であること」だけを提示し、生年月日そのものを開示せずに済む。GDPRの データ最小化原則と技術的に整合する設計になっている。

ARF はバージョンアップを重ねており（2026 年 2 月時点で v1.5 系）、実装者はこのドキュメントを継続的に追跡する必要がある。

## 大規模パイロット（Large Scale Pilots）の成果

EU は EUDI Wallet の実証実験として 4 つの大規模パイロット（LSP）を 2022 年から並行実施してきた。

| パイロット | 参加国・機関 | フォーカス領域 |
|-----------|-----------|--------------|
| **DC4EU** | 欧州 25 カ国超 | 教育資格・社会保障給付 |
| **EWC** | 欧州主要航空・ホテル | 旅行・eコマース認証 |
| **POTENTIAL** | 欧州 12 カ国以上 | 金融・モビリティ・医療など民間 6 分野 |
| **NOBID** | 北欧・バルト・伊・独 | 銀行 ID・政府 ID 統合 |

2025 年に各パイロットが検証フェーズを完了し、2026 年の本格展開につなぐロードマップに移行した。パイロットを通じて浮かび上がった課題の一つは**Wallet 間相互運用性**だ。各国・各ベンダーが独自実装を持つ中で、ARF 準拠だけでは十分な相互運用が保証されないケースがあり、EUDI Wallet Consortium での標準化作業が継続している。

## 民間への技術的インパクト

EUDI Wallet の受入義務は、企業の認証基盤に直接的な変化を求める。既存の OIDC/SAML ベースの IdP 連携に加えて、OpenID4VP による Verifiable Presentation の検証能力を追加する必要がある。

具体的には:

1. **RP（Relying Party）側の変更**: OpenID4VP で署名付き VP Token を受け取り、SD-JWT VC または mdoc を検証するライブラリの導入
2. **信頼ルートの管理**: EU Trust Framework が定める信頼チェーンの検証（発行機関が本当に EU 公認の機関かの確認）
3. **属性スキーマの対応**: EU が定める PID（氏名・生年月日・住所・国籍など）の属性名・値域への対応

既存の Identity Provider（Okta, Entra ID, Ping Identity など）は EUDI Wallet アダプター機能を提供し始めているが、自社で SAML/OIDC フェデレーションを管理している企業にとっては追加開発が必要になる。

## EU 域外への波及——日本への示唆

EU は **日本との間でデジタルアイデンティティ相互承認に関する覚書（MoC）を締結**しており、将来的な相互認証の議論が始まっている。具体的な実施規則はまだ存在しないが、EU 市場へのアクセスを重視する日本の金融機関や e コマース事業者は無関係ではいられない。

より直接的な影響として、EUDI Wallet が採用するプロトコルスタック——OpenID4VP / OpenID4VCI / SD-JWT VC——は、日本が検討するデジタルアイデンティティ標準（マイナンバーカードの次世代活用、民間 eKYC）とも高い親和性を持つ。EU の大規模実装は事実上のリファレンス実装となり、日本の標準化議論にも影響を与えるだろう。

また、**「GDPR 効果」**と同様に、EU に向けてグローバルサービスを提供する企業は EU の EUDI Wallet 対応を余儀なくされ、その実装をそのまま他地域に転用するケースが増えると予想される。

## まとめと展望

eIDAS 2.0 と EUDI Wallet は、デジタルアイデンティティを「インフラ」として法的に位置づけた EU の壮大な実験だ。2026 年末の義務化は現実味を帯びており、大規模パイロットの成果は技術スタックの実装可能性を示している。

個人的に注目しているのは**2027 年 12 月の民間強制受認フェーズ**だ。政府サービスは義務があるから対応するが、銀行や e コマースが Wallet 受入を実際にどう UI/UX に落とし込み、ユーザーに使わせるかがエコシステム定着の鍵になる。技術標準が整っても、ユーザーが Wallet を取り出して VP を提示するという新しい行動パターンの定着は別の課題だ。

OpenID4VP を中心とした技術スタックは日本でも参照されつつある。EU での大規模実装が成熟すれば、日本のデジタルアイデンティティ議論も加速するはずだ。EUDI Wallet の動向は引き続き注視したい。

## 参考

- [eIDAS 2.0 規則本文（Regulation EU 2024/1183）](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1183)
- [EUDI Wallet Architecture and Reference Framework（ARF）](https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/latest/architecture-and-reference-framework-main/)
- [欧州委員会 EUDI Wallet 実装ポータル](https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet-implementation)
- [Large Scale Pilots 概要（欧州委員会）](https://digital-strategy.ec.europa.eu/en/policies/eudi-wallet-implementation)
