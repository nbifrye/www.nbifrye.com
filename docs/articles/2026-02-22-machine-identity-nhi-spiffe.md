# AI エージェント時代のマシンアイデンティティ：NHI・SPIFFE・WIMSE が描く非人間認証の現在

> 企業環境でマシンの数が人間の 25〜50 倍になった今、「人間のための IAM」から「マシンのための IAM」へのパラダイムシフトが起きている。AI エージェントの台頭がその速度をさらに加速しつつある。

## はじめに

デジタルアイデンティティの世界は長らく「人間」を主役として設計されてきた。OAuth 2.0 も OpenID Connect も WebAuthn も、エンドユーザーが画面の前にいることを前提にしている。

しかし 2026 年の現実は大きく異なる。CI/CD パイプライン、マイクロサービス、クラウド関数、そして生成 AI によるエージェント——これらは常時稼働し、秒単位で API を叩き、ユーザーの承認なしに判断を下す。**非人間アイデンティティ（Non-Human Identity: NHI）** は今や企業の認証基盤の主役になりつつある。

この記事では、NHI の規模感を整理したうえで、標準化の中心にある **SPIFFE/SPIRE**、IETF の新ワーキンググループ **WIMSE**、そして AI エージェント特有の課題への対応として生まれつつある新しいドラフトを論じる。

## NHI（非人間アイデンティティ）とは何か

NHI とは、サービスアカウント、API キー、OAuth クライアント、X.509 証明書、CI ジョブトークン、そして AI エージェントが保有する「機械のための認証情報」の総称だ。

**その規模は想像以上に大きい。**

- 現代の企業環境では、マシンアイデンティティの数が人間アイデンティティを **25〜50 倍**上回る
- 金融サービス分野では比率が **96:1** に達するケースもある
- AI ワークロードは人間ユーザーの **148 倍**の頻度で認証リクエストを発行する
- 91% のセキュリティ・アイデンティティの専門家が、2026 年に AI 生成アイデンティティが爆発的に増加すると予測している

問題はこの量的変化だけではない。NHI の多くは「デプロイ時に作られ、忘れられ、管理されない」というライフサイクルを持つ。人間のアイデンティティは HR システムがライフサイクルを管理するが、マシンアイデンティティにそれに相当する仕組みはない。長期間有効な API キーが過剰な権限を持ったまま放置されるのが、現在の典型的なアンチパターンだ。

## SPIFFE/SPIRE：ワークロードアイデンティティの基盤標準

この問題に対する現時点で最も成熟した標準的回答が **SPIFFE（Secure Production Identity Framework For Everyone）** と、その参照実装である **SPIRE（SPIFFE Runtime Environment）** だ。

### SPIFFE の設計思想

SPIFFE は「パスワードや長期 API キーなしに、ワークロードが暗号的に検証可能な ID を持てる」ことを目標に設計された。コンテナやマイクロサービスが本番環境で安全に相互認証できるようにするため、Uber・Google・Twitter の SRE チームがクラウドネイティブ環境の経験から開発し、CNCF（Cloud Native Computing Foundation）プロジェクトとして管理されている。

### SVID：ワークロードの身分証明書

SPIFFE の中核概念は **SVID（SPIFFE Verifiable Identity Document）** だ。SVID はワークロードに発行される短命な（通常 1 時間以内で期限切れ）認証情報で、2 つの形式がある：

- **X.509-SVID**：X.509 証明書として表現される。Subject Alternative Name フィールドに `spiffe://trust-domain/path/to/workload` 形式の SPIFFE ID を埋め込む。mTLS での相互認証に使う
- **JWT-SVID**：JWT 形式の SVID。`sub` クレームに SPIFFE ID を含む。HTTP ヘッダーに添付してサービス間認証に使う

SPIRE はノード証明（そのマシン自体の検証）とワークロード証明（マシン上で動くプロセスの検証）の 2 段階アテステーションで SVID を発行する。発行は自動で、期限切れ前に更新も自動で行われる。

### SPIFFE の適用範囲拡大

もともとはマイクロサービスの認証基盤として設計されたが、AI エージェントへの適用が 2025 年から本格的に議論されている。KubeCon 2025 では Uber・AWS・Block のエンジニアが「SPIFFE/SPIRE をワークロードアイデンティティ基盤の『ボトムタートル』として機能させ、AI エージェントを含むすべてのワークロードの認証を統一する」というビジョンを共有した。

HashiCorp Vault 1.21（2025 年後半リリース）では、SPIFFE 認証がネイティブサポートされ、Vault が X.509-SVID を発行できるようになった。これにより「SPIRE が ID を発行 → Vault が機密情報へのアクセスを許可」というフローが単一のエコシステムで完結する。

## IETF WIMSE：標準化の最前線

SPIFFE/SPIRE が実装を主導する一方、**IETF** はワークロードアイデンティティの標準化を目的に **WIMSE（Workload Identity in Multi-System Environments）** ワーキンググループを立ち上げた。

### WIMSE の主要ドラフト（2026 年 2 月時点）

| ドラフト | 概要 | ステータス |
|---------|------|-----------|
| `draft-ietf-wimse-arch-06` | WIMSE アーキテクチャ全体像 | Informational（2025年10月） |
| `draft-ietf-wimse-identifier-00` | ワークロード識別子（URI 形式） | Standards Track（2025年11月） |
| `draft-ietf-wimse-s2s-protocol` | ワークロード間認証プロトコル | Standards Track（2025年12月） |
| `draft-ietf-wimse-workload-identity-bcp` | OAuth 2.0 クライアント認証のベストプラクティス | Standards Track |

**ワークロード識別子**（`draft-ietf-wimse-identifier-00`）は特に重要だ。SPIFFE ID と互換性を持ちながら、より広い標準の文脈で使用できる URI 形式の識別子を定義する。形式は：

```
spiffe://<trust-domain>/<path>
```

この識別子は X.509 証明書や JWT などデジタル認証情報に埋め込み可能で、組織をまたいだ認証・認可・ポリシー適用に使えるよう設計されている。

**ワークロード間認証プロトコル**（`draft-ietf-wimse-s2s-protocol`）は、2 つのワークロードが 1 回の HTTP リクエスト/レスポンスを安全に行う最小単位のプロトコルを定義する。アプリケーションレベルの署名と mTLS の 2 つの方式を規定しており、同一呼び出しチェーン内で混在させられる。

WIMSE は SPIFFE の実装経験を IETF 標準に昇華させる試みと見ることができる。**SPIFFE が「どう実装するか」を定義するなら、WIMSE は「標準として何を要求するか」を定義する**という関係だ。

## AI エージェント：SPIFFE では解けない問題

SPIFFE/SPIRE が解くのは「ワークロードに ID を与える」問題だ。しかし AI エージェントにはそれ以上の課題がある。

**なぜ AI エージェントはマイクロサービスと違うのか。**

Kubernetes は同じデプロイメントの複数レプリカを「同一」として扱う。マイクロサービスならこれで問題ない。しかし AI エージェントは**非決定論的**だ。同じモデル・設定から生まれた 2 つのエージェントでも、実行履歴・コンテキスト・推論経路によって振る舞いが異なる。セキュリティ上は「どのエージェントインスタンスが、どのユーザーの意図を実行しているか」が監査可能でなければならない。

また、AI エージェントはしばしば**サブエージェントを生成する**。親エージェントが子エージェントを作り、子が孫エージェントを生む——このような委譲チェーンで権限がどう伝播するかを制御する仕組みが、既存の SPIFFE や OAuth 2.0 には欠けている。

さらに**ユーザーの意図とエージェントの行動のズレ**も問題だ。従来の OAuth 2.0 は「クライアントアプリがユーザーの意図を忠実に実行する」前提で設計されている。自律的に動くエージェントはその前提を崩す。

### 新世代ドラフト：エージェント ID の標準化

この課題に対して、2025 年後半から IETF に複数のドラフトが提出された。

**`draft-nandakumar-agent-sd-jwt-01`（SD-Agent）**
Cisco の Nandakumar と Jennings が提出。SD-JWT を使ったエージェントの発見と ID 管理を定義する。**Agent Card**（エージェントの能力・連絡先・メタデータを記述した構造体）を SD-JWT として符号化し、文脈に応じて開示する属性を変える仕組みを提案する。

- Discovery Context（"public"・"internal"・"diagnostic" など）ごとに異なる SD-Card を発行できる
- 異なる Verifier への提示が紐付け不可能（Unlinkable Presentations）でプライバシーを保護
- Key Binding でエージェント自身が特定の SD-Card の保持者であることを証明できる

**`draft-goswami-agentic-jwt-00`（Agentic JWT）**
OAuth 2.0 の拡張として Agentic JWT（A-JWT）を定義する。中核の問題意識は「自律 AI エージェントによるゼロトラストドリフト」——エージェントが人間の意図なしに動的なワークフローを生成し権限要求を行うことで、OAuth の信頼モデルが崩れる、という問題だ。A-JWT は：

- エージェントの「チェックサム」（システムプロンプト・ツール・設定から算出）で暗号的エージェント ID を生成
- ユーザーの意図とエージェントの実行を結ぶワークフロー対応トークンバインディング
- 新しい OAuth 2.0 グラントタイプを定義

これらはまだ個人提出の Internet-Draft であり、IETF の正式なワーキンググループ採択はされていない。しかし、問題を定義している段階から解決策が競争的に提案される段階へと移行しつつあることを示している。

## デジタルウォレット標準との接続

NHI の議論は、デジタルアイデンティティの主流である Verifiable Credentials や OpenID4VP とどう接続するのか。

**SD-JWT との接続**は最も直接的だ。`draft-nandakumar-agent-sd-jwt-01` が SD-JWT RFC 9901 を基盤とすることは、エージェント ID の標準化がユーザー向け VC のエコシステムと共通の暗号技術を使うことを意味する。将来的には「ユーザーが持つ Verifiable Credential」と「エージェントが保有する SD-JWT ベースの能力証明」が同一の検証インフラ上で扱われる可能性がある。

**EUDI Wallet との関係**も注目すべきだ。EUDI Wallet のアーキテクチャは現時点で人間ユーザー向けのクレデンシャルを中心に設計されているが、将来的に組織や自動化エージェントを表すクレデンシャルへの拡張が求められるのは自明だ。

**SPIFFE ID と Verifiable Credentials の統合**も研究段階で議論されている。SPIFFE ID（URI 形式の識別子）は DID（Decentralized Identifier）の設計思想と親和性が高い。SPIFFE ベースのワークロード ID を VC に埋め込む提案は、クラウドネイティブ基盤と W3C VC エコシステムをつなぐ橋になりうる。

## まとめと展望

マシンアイデンティティの問題は、デジタルアイデンティティ専門家が無視できないフロンティアになった。以下の 3 つの観点から状況をまとめる。

**1. インフラ層では SPIFFE/SPIRE が事実上の標準になりつつある。**
コンテナ・クラウドネイティブ環境での実績、CNCF のガバナンス、HashiCorp Vault との統合——これらが揃い、新規構築のシステムで SPIFFE を選ばない理由は減った。IETF WIMSE が SPIFFE の設計をベースに標準化を進めていることも、採用への後押しになる。

**2. AI エージェント層の標準化はまだ黎明期だ。**
`draft-nandakumar-agent-sd-jwt` や `draft-goswami-agentic-jwt` は問題を定義して解決策を示しているが、IETF の正式採択には至っていない。「エージェントを SPIFFE でワークロードとして扱い、OAuth でアクセス制御する」という現在の実装パターンは合理的だが、委譲チェーンの管理や意図バインディングといった問題への標準的回答はまだない。

**3. 日本の文脈では「NHI 管理」は製品レベルの議論だが、標準への注目が不足している。**
CyberArk・Entro・Permiso などの NHI 専門セキュリティベンダーが台頭しているが、日本企業の多くは API キーの管理さえ属人的なままだ。SPIFFE/WIMSE が標準として成熟し、国内クラウドプロバイダーが対応を始めるタイミングに向けて、いまから標準の動向を把握しておく価値は大きい。

AI エージェントの認証問題は「認証技術の問題」であると同時に「ガバナンスの問題」でもある。誰がどのエージェントを作り、何のためにどのデータにアクセスさせるのか——これを制御する仕組みなしには、NHI の爆発的増加は制御不能なリスクになる。デジタルアイデンティティの標準コミュニティがこの問題にどう応えるか、2026〜2027 年が分岐点になるだろう。

## 参考

- [SPIFFE 公式サイト](https://spiffe.io/)
- [SPIRE GitHub](https://github.com/spiffe/spire)
- [HashiCorp: SPIFFE Securing the Identity of Agentic AI](https://www.hashicorp.com/en/blog/spiffe-securing-the-identity-of-agentic-ai-and-non-human-actors)
- [IETF WIMSE WG Datatracker](https://datatracker.ietf.org/wg/wimse/about/)
- [draft-ietf-wimse-arch-06: WIMSE Architecture](https://datatracker.ietf.org/doc/draft-ietf-wimse-arch/)
- [draft-ietf-wimse-s2s-protocol: Workload-to-Workload Authentication](https://ietf-wg-wimse.github.io/draft-ietf-wimse-s2s-protocol/draft-ietf-wimse-s2s-protocol.html)
- [draft-nandakumar-agent-sd-jwt-01: SD-Agent](https://datatracker.ietf.org/doc/draft-nandakumar-agent-sd-jwt/)
- [draft-goswami-agentic-jwt-00: Agentic JWT](https://datatracker.ietf.org/doc/draft-goswami-agentic-jwt/)
- [Solo.io: Agent IAM — Can SPIFFE Work?](https://www.solo.io/blog/agent-identity-and-access-management---can-spiffe-work)
- [NHI Management Group: SPIFFE for NHI](https://nhimg.org/nhi-101/spiffe-architecture-non-human-identity)
- [GitGuardian: Workload and Agentic Identity at Scale](https://blog.gitguardian.com/workload-identity-day-zero-atlanta/)
