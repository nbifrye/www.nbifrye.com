# IETF WIMSE WG が定義するワークロードアイデンティティの新標準

> SPIFFE の「次の一手」として IETF が標準化を進める WIMSE WG の技術的本質と、AI エージェント時代における重要性を読み解く。

## はじめに

「人間のアイデンティティ」については OAuth/OIDC・パスキー・eKYC など多くの標準が成熟しつつある。一方、クラウドネイティブ環境で急増するのが「人間でないアイデンティティ（NHI）」——マイクロサービス・CI/CD パイプライン・サーバーレス関数・AI エージェントといったワークロード同士の認証問題だ。

IETF の WIMSE WG（Workload Identity in Multi System Environments）は、この領域における事実上の標準である SPIFFE/SVID を発展させ、**プロダクショングレードのワークロード間認証をインターネット標準として確立する**ことを目指している。2024〜2025年にかけてドラフトが急速に充実し、2026年は主要ドラフトが Proposed Standard へ進む正念場の年だ。

この記事では、WIMSE の技術的アーキテクチャを掘り下げ、既存の SPIFFE との関係・差異、そして AI エージェント時代の機械アイデンティティ管理において何を変えるのかを論じる。

## 背景：SPIFFE の成功と限界

SPIFFE（Secure Production Identity Framework for Everyone）は、Kubernetes をはじめとするクラウドネイティブ環境でワークロードに URI 形式の識別子（SVID: SPIFFE Verifiable Identity Document）を発行する仕組みとして広く採用されてきた。Block（旧 Square）・Uber・AWS といった大規模プレイヤーが本番環境で SPIRE（SPIFFE Runtime Environment）を運用しており、「Git の平文キーや OIDC のハック」を置き換える堅牢な基盤として認知されている。

しかし SPIFFE/JWT-SVID には根本的な脆弱性が残っていた——**リプレイ攻撃への耐性がない**点だ。JWT は Bearer Token であるため、盗まれたトークンをそのまま流用できてしまう。mTLS（X.509-SVID）ならチャネル単位でバインドできるが、HTTP レイヤーでの柔軟な操作が難しく、プロキシや API ゲートウェイを挟む構成では使いにくい側面があった。

WIMSE WG が解決しようとしているのは、まさにこのギャップだ。

## WIMSE の技術的アーキテクチャ

### WIT（Workload Identity Token）

WIMSE のコアは **WIT（Workload Identity Token）** と呼ばれる新しいトークン形式だ。JOSE/JWT ベースで、以下の点で JWT-SVID と異なる：

- ワークロードの**公開鍵を WIT 内に埋め込む**
- 受信側は WIT 内の公開鍵に対応する秘密鍵の保有証明（Proof of Possession）を要求できる
- 結果として、トークンを盗んだだけでは使えない——秘密鍵を持つ正規ワークロードのみが認証を通過できる

### S2S 認証の 3 方式

`draft-ietf-wimse-s2s-protocol`（2026年2月更新、revision 07）は、ワークロード間（Service-to-Service）認証として 3 方式を定義している：

1. **相互 TLS**（X.509-SVID 互換）——既存の mTLS 基盤との後方互換性
2. **WIT + Workload Proof Token**——アプリケーション層での PoP。HTTP ヘッダーにトークンと署名を付与
3. **WIT + HTTP Message Signatures**（RFC 9421）——HTTP メッセージ全体への署名。改ざん検知も可能

方式 2・3 が WIMSE の新機軸であり、「TLS 終端するリバースプロキシがいても、アプリ層で発信元ワークロードを証明できる」という要件を満たす。単一リクエスト・レスポンスのスコープで動作するよう設計されており、マイクロサービス間の API 呼び出しへの組み込みを想定している。

### トークン交換

WIMSE はトークン交換に RFC 8693（OAuth Token Exchange）のプロファイルを利用する。これにより既存の OAuth インフラ（IAM・API ゲートウェイ）と統合しやすく、クロスクラウド・クロステナントのシナリオでも信頼チェーンを構成できる。

## SPIFFE との関係

WIMSE は SPIFFE を「置き換える」ものではなく、**SPIFFE の上位互換として位置付ける**設計だ。具体的には：

- WIT は JWT-SVID の拡張であり、SPIFFE URI（`spiffe://trust-domain/path`）をそのまま利用できる
- X.509-SVID との互換性も維持
- SPIRE コミュニティは WIT 発行 API の拡張を検討中（GitHub Issue #315）

実装の観点では、既存の SPIRE 環境に WIMSE 対応の WIT 発行エンドポイントを追加することで段階的に移行できる。SPIFFE を既に採用している組織は「追加のリプレイ耐性を得るための拡張」として WIMSE を評価できる。

## AI エージェント・マルチクラウドへの展開

最も注目すべき動向が `draft-ni-wimse-ai-agent-identity-01`（WIMSE Applicability for AI Agents）だ。このドラフトは AI エージェントを「人間のような名前を持つが本質的にはワークロード」と定義し、以下のモデルを提案する：

- AI エージェントにも SPIFFE URI 形式の識別子を発行
- RATS（Remote Attestation）フレームワークと組み合わせ、エージェントの**実行環境の健全性**（使用モデル・実行コンテキスト・改ざんの有無）を検証可能にする
- マルチクラウド・マルチテナント環境での**トークン交換**（WIMSE Credential Exchange）が、CI/CD・サービスメッシュ・AI エージェント連携の「接着剤」として機能する

これは既存の NHI 管理論議（「サービスアカウントに JWKS を持て」程度のもの）を大きく超える。**「どのコードが・どのモデルを使って・どの環境で動いているか」まで含めた機械アイデンティティの検証**という、AI ガバナンスの文脈でも重要な方向性だ。

## 実装の現在地

2025年の KubeCon では Block・Uber・AWS のエンジニアが SPIRE + WIMSE の大規模展開事例を発表した。Block は Git の平文キーと「OIDC のハック」から X.509/SPIRE 駆動の認証基盤への移行を完了したと報告しており、WIMSE が現実のプロダクション課題を解決し始めていることを示す。

ドラフトの著者陣には CyberArk・Zscaler・Intuit・Ping Identity が名を連ね、エンタープライズ IAM ベンダーの参画も目立つ。wasmCloud が WebAssembly 環境での SPIFFE 採用を発表するなど、クラウドネイティブ以外への広がりも始まっている。

## 私の見立て

WIMSE が重要なのは「技術的に優れているから」だけではない。**IETF という中立的な国際標準機関のプロセスに乗ることで、特定ベンダー・クラウドに依存しない信頼基盤を構築できる**点が本質的な価値だ。

マルチクラウド環境では「AWS の IAM Role は GCP の Workload Identity とどう連携するか」という問題が常に生じる。WIMSE の WIT + トークン交換プロファイルは、クラウド間の信頼連鎖を標準化する有望な解答だ。

また、AI エージェントの普及とともに「どのエージェントが何を要求しているか」を追跡・監査する必要性が急増している。WIMSE + RATS による実行環境アテステーションは、単なる「誰が」ではなく「何が・どの状態で動いているか」まで確認できる枠組みを提供する。これは AI ガバナンス・コンプライアンスの観点からも見逃せない。

2026年の IETFミーティング（3月・7月・11月）でのドラフト進捗を注視したい。主要ドラフトが Proposed Standard に昇格するタイムラインが見えてきた段階で、クラウドプロバイダーや IAM ベンダーは本格的な実装競争に入るだろう。

## まとめと展望

WIMSE WG が定義するワークロードアイデンティティ標準は、SPIFFE の成功を土台に、リプレイ耐性・HTTP レイヤー PoP・AI エージェント対応という 3 つの課題を同時に解決しようとしている。現時点ではまだドラフト段階だが、著者陣の顔ぶれと実装事例の充実から、近い将来インターネット標準（RFC）として確立される可能性は高い。

NHI 管理を検討している組織は、今から SPIFFE/SPIRE の導入を進めることが WIMSE への移行コストを最小化する最善策だ。そして AI エージェントのアイデンティティ管理を考えるなら、WIMSE + RATS の組み合わせは見ておくべき設計パターンになりつつある。

## 参考

- [IETF WIMSE WG Charter](https://datatracker.ietf.org/wg/wimse/about/)
- [draft-ietf-wimse-s2s-protocol](https://datatracker.ietf.org/doc/draft-ietf-wimse-s2s-protocol/)
- [draft-ietf-wimse-arch](https://datatracker.ietf.org/doc/draft-ietf-wimse-arch/)
- [SPIFFE/SPIRE プロジェクト](https://spiffe.io/)
- [draft-ni-wimse-ai-agent-identity (AI エージェント適用ドラフト)](https://datatracker.ietf.org/doc/draft-ni-wimse-ai-agent-identity/)
