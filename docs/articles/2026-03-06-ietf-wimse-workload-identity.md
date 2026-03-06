# IETF WIMSE WG——ワークロードアイデンティティの国際標準化が本格始動

> クラウド・マルチシステム環境でのサービス間認証を統一するため、IETF が 2024 年に立ち上げた WIMSE WG が複数のドラフトを並行して策定中だ。SPIFFE との役割分担、Transaction Tokens との連携、そして AI エージェントへの拡張まで、ワークロード ID の「次の 5 年」を決める議論を整理する。

## はじめに

ヒトが使うパスワードやパスキーと同様に、サービスやコンテナ・AI エージェントにもアイデンティティが必要だ。マイクロサービスが増殖し、マルチクラウドが当たり前になった今、「誰がこの API コールを行っているか」を安全かつスケーラブルに証明する仕組みが実装ごとにバラバラに作られてきた。

その混乱を収束させようとしているのが、IETF の **WIMSE（Workload Identity in Multi System Environments）** ワーキンググループだ。2024 年に設立されたばかりだが、すでに複数の Standards Track ドラフトが並行して策定されており、クラウドプロバイダーやサービスメッシュベンダーが注目している。

## 背景：なぜ今ワークロード ID が問題になるのか

従来の境界型セキュリティでは「同じネットワーク内にいれば信頼する」という前提が成立していた。しかしコンテナ・Kubernetes・マルチクラウドの普及で、サービスはアドレスを頻繁に変え、呼び出し元の IP は意味をなさなくなった。

さらに **AI エージェントの台頭**が事態を複雑にする。単一のリクエストが、人間のユーザー → フロントエンド → オーケストレーターエージェント → 複数のサブエージェント → バックエンド API と連鎖する。各ホップで「誰の権限で動いているか」「元の委任元は誰か」を証明できないと、最小権限の原則を実現できない。

SPIFFE（Secure Production Identity Framework for Everyone）は 2018 年ごろから CNCF プロジェクトとしてこの問題に取り組んできたが、あくまでクラスター内のアイデンティティ基盤だ。クロスドメイン・クロスオーガニゼーションでの認証や OAuth エコシステムとの統合は SPIFFE のスコープ外だった。

## WIMSE の主要ドラフト

2026 年 3 月時点で進行中の主なドラフトを示す。

**アーキテクチャ（`draft-ietf-wimse-arch`）**

Informational ドラフトとして全体の脅威モデルと用語を定義する。「ワークロード」「ワークロードプロバイダー」「トラスト ドメイン」などの共通語彙を確立し、後続の Standards Track ドラフトの前提条件となる。

**サービス間プロトコル（`draft-ietf-wimse-s2s-protocol`）**

Standards Track の中核。HTTP 単一リクエスト単位でのワークロード間認証を定義しており、2 つの方式を提供する：

- **アプリケーション層方式**: WIT（Workload Identity Token）＋ HTTP Message Signatures（RFC 9421）。トークンにワークロードの公開鍵を埋め込み PoP（Proof of Possession）を実現する。
- **mTLS 方式**: 既存サービスメッシュとの互換性を確保するための補完的な選択肢。

両方式を定義することで、完全移行できない環境でも段階的な採用が可能になる点が実用的だ。

**ワークロードクレデンシャル（`draft-ietf-wimse-workload-creds`）**

WIT と X.509 証明書の 2 形式を規定する。WIT は JWT ベースで SPIFFE JWT-SVID を拡張した形式であり、クレームとして公開鍵を含む点が既存の Bearer トークンと異なる。

**BCP（`draft-ietf-wimse-workload-identity-bcp`）**

OAuth 2.0 のクライアントアサーション（RFC 7521/7523）をワークロード認証に安全に適用するためのベストプラクティス集。既存の OAuth AS をそのまま活用したいユーザー向けの「橋渡し」的な位置づけだ。

## SPIFFE との関係：競合ではなく統合

WIMSE は SPIFFE を置き換えるものではない。SPIFFE/SPIRE が「クラスター内でどうアイデンティティを発行・配布するか」を解決する CNCF 実装であるのに対し、WIMSE は「クロスドメインで OAuth や標準プロトコルとどう統合するか」を IETF として標準化する上位レイヤーと理解すると整理しやすい。

WIT 自体が SPIFFE JWT-SVID を拡張した設計になっており、SPIFFE 基盤の上に WIMSE プロトコルを乗せる構成が想定されている。すでに SPIRE を本番運用している組織にとっては、破壊的な移行を強いられないことが明確になっているのは安心材料だ。

## Transaction Tokens との連携

WIMSE と合わせて注目すべきが、OAuth WG で策定中の **Transaction Tokens（Txn-Tokens）** だ。これはマイクロサービス連鎖の中で「元のアクセストークンが持っていた権限情報を伝播する」問題を解決する。

WIMSE が「呼び出し元のワークロード ID を証明する」のに対し、Txn-Tokens は「元のユーザーリクエストのコンテキストを持ち歩く」役割を担う。両者を組み合わせることで、マルチホップの API チェーンでも「誰が・誰の権限で・どのワークロードから」呼んでいるかを完全に追跡できるようになる。

AI エージェントのユースケースでは、この組み合わせがとりわけ重要になる。

## AI エージェントへの拡張

`draft-ni-wimse-ai-agent-identity` では、AI エージェントを独立したアイデンティティ主体として扱うための拡張が議論されている。オーケストレーターエージェントがサブエージェントに権限を委譲する際の「委任チェーン」の表現、エージェントが自律的に取得したリソースへのアクセス制御など、従来のサービスアカウントモデルでは表現しにくかった概念が対象だ。

人間のユーザーによる OAuth の委任（`actor` クレームや Token Exchange）を AI エージェントのシナリオに拡張する設計になっており、OAuth の既存エコシステムを最大限に活用する方針が見えてくる。

## 実装者への示唆

**クラウドプロバイダー向け**: ワークロードプラットフォームのクレデンシャル（AWS EC2 Instance Metadata, GCP Workload Identity 等）を OAuth AS へのクライアントアサーションとして使うパターンが WIMSE BCP で標準化される見込みだ。今後は各プロバイダー独自の実装ではなく、標準仕様に準拠した形での実装が求められるようになる。

**サービスメッシュベンダー向け**: mTLS と HTTP Signatures の共存プロファイルにより、Istio や Linkerd などの既存実装との互換性が確保されている。ゼロトラスト推進の観点からも、WIMSE 対応が製品ロードマップに入ってくるだろう。

**エンタープライズ ID チーム向け**: ワークロード ID はもはや DevOps だけの問題ではない。IAM・セキュリティ・コンプライアンスチームが連携して、NHI（Non-Human Identity）のライフサイクル管理ポリシーを WIMSE の用語体系に合わせて整理し始める時期だ。

## まとめと展望

WIMSE は「SPIFFE の国際標準化」でも「OAuth の単なる拡張」でもなく、両者をクロスドメイン・マルチシステムで統合するための新しいレイヤーとして位置づけられる。

注目すべき点は、AI エージェント時代を見越した設計が最初から組み込まれていることだ。ワークロード間の委任チェーンを標準化する仕様が IETF レベルで定まれば、AI エージェントのガバナンス議論に「どこに権限の根拠があるか」という明確な答えを提供できる。

実装側としては、まず WIMSE BCP に従って既存の OAuth フローをワークロード認証に適用し、サービス間のアイデンティティを可視化するところから始めるのが現実的だ。WIT や HTTP Signatures の採用は、仕様が安定する 2026〜2027 年ごろを見据えたロードマップで検討するのがよいだろう。

## 参考

- [IETF WIMSE WG](https://datatracker.ietf.org/wg/wimse/about/)
- [draft-ietf-wimse-s2s-protocol](https://datatracker.ietf.org/doc/draft-ietf-wimse-s2s-protocol/)
- [draft-ietf-wimse-arch](https://datatracker.ietf.org/doc/draft-ietf-wimse-arch/)
- [draft-ietf-wimse-workload-identity-bcp](https://datatracker.ietf.org/doc/draft-ietf-wimse-workload-identity-bcp/)
- [Transaction Tokens (Txn-Tokens)](https://datatracker.ietf.org/doc/draft-ietf-oauth-transaction-tokens/)
- [SPIFFE/SPIRE（CNCF）](https://spiffe.io/)
