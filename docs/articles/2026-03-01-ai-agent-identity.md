# AIエージェントのデジタルアイデンティティ——標準化の最前線

> 自律的なAIエージェントは「誰として」「誰の代わりに」行動しているかをどう証明するのか。OAuth/OIDC時代の想定を超える委譲モデルが求められている。

## はじめに

ChatGPTのActionsが外部APIを呼び出し、Claude CodeがGitHubにPRを作成し、複数のAIエージェントが連携してタスクをこなす——これは2026年現在の日常だ。しかし「そのリクエストは本当に正規のエージェントが、正規のユーザーの委任を受けて送ったものか」という問いに、現在の認証インフラは十分に答えられていない。

本記事では、AIエージェントのアイデンティティが既存のOAuth 2.0モデルとどう異なるかを整理し、IETF・OpenID Foundationで進む標準化の最前線を解説する。

## なぜAIエージェントは既存の認証モデルに収まらないのか

OAuth 2.0は「人間がブラウザで認可ダイアログを見て承認する」という想定のもとに設計された。AIエージェントはこの想定を根本から覆す。

**意図の漂流（Intent Drift）**: 人間のユーザーが「メールを整理して」と指示しても、エージェントが推論の過程でカレンダー編集・連絡先削除・外部サービス連携まで権限を行使しうる。スコープの境界が曖昧になり、当初の委任の「意図」から外れた行動が起きやすい。

**再帰的な委譲チェーン**: オーケストレーターエージェントがサブエージェントを起動し、そのサブエージェントがさらに別ツールを呼ぶ。チェーンが深くなるほど「誰が誰を代理しているか」の追跡が難しくなり、委任の正当性を担保する仕組みが必要になる。

**動的なスコープ変更**: タスク遂行中に必要な権限が変わることがある。人間ならその都度再認可を求めるが、自律エージェントに毎回人間の承認を求めると処理が止まる。かといって過剰な権限を事前付与すれば最小権限原則に反する。

OpenID Foundationは2025年10月に公開したホワイトペーパー「Identity Management for Agentic AI」で、既存標準がこれらの課題を部分的にしかカバーしていないと明示した。

## RFC 8693（Token Exchange）の限界

現時点でエージェント委譲に最も近い既存仕様がRFC 8693（OAuth 2.0 Token Exchange）だ。`act`クレームを使ってネストされた委譲関係を表現でき、「Aが Bの代理として Cの代わりに行動する」という3者関係を一つのトークンに埋め込める。

しかし、AIエージェント文脈では脆弱性が顕在化している。OAuth作業部会で議論されている「**Delegation Chain Splicing**」と呼ばれる攻撃では、悪意ある中間者が異なる委譲文脈のトークンを組み合わせることで、本来許可されていない操作を実行できる。再帰的な委譲の検証ロジックがRFC 8693には定義されていないため、連鎖が長くなると安全性の担保が難しい。

## 標準化の最前線：IETF と OpenID Foundation

### Agentic JWT（draft-goswami-agentic-jwt）

IETFに提出されているドラフトで、エージェント固有のJWTクレームセットを定義する。2つのコア概念が重要だ。

**エージェントチェックサム（Agent Checksum）**: エージェントの行動ログ・モデルバージョン・設定のハッシュ値をトークンに含め、「このトークンを使ったエージェントが当初の認可時と同一の実体か」を検証可能にする。エージェントのアップデートや改ざんを検知する仕組みだ。

**ワークフロー意図バインディング（Workflow Intent Binding）**: トークン発行時にユーザーの意図（タスクの目的・許可される行動の範囲）を暗号的に結び付け、エージェントが権限逸脱行為を行った場合にASで検証できる。RFC 8693が「誰が誰を代理するか」を定義するのに対し、Agentic JWTは「何のために・どこまで」も定義しようとする。

### agent-sd-jwt（draft-nandakumar-agent-sd-jwt）

SD-JWT（Selective Disclosure JWT）をエージェントのアイデンティティ証明に応用するドラフト。マルチエージェント環境でのプライバシーを意識した設計が特徴で、エージェントが自らの属性（能力・信頼レベル・委任元など）を選択的に開示できる。エージェント発見プロトコルとしての側面も持ち、「このエージェントはどのツールを使えるか」を安全に公開する仕組みを定義する。

### WIMSE WG の AI Agent Applicability

IETFのWIMSE（Workload Identity in Multi System Environments）作業部会は、ワークロードアイデンティティをAIエージェントに適用するドラフト（draft-ni-wimse-ai-agent-identity）を開発中だ。SPIFFEの設計哲学——つまりインフラ基盤が自動的にアイデンティティを発行するモデル——をAIエージェントオーケストレーション基盤に適用しようとしている。

## MCP と OAuth 2.1：実装の最前線

実装の文脈では、Model Context Protocol（MCP）の認可仕様が注目に値する。MCPはOAuth 2.1＋PKCEを採用し、AIエージェントがサードパーティツール（MCPサーバー）にアクセスする際の標準認可フローを定義している。`WWW-Authenticate`ヘッダーと`Well-known URI`でメタデータを公開し、エージェントが動的にASを発見できる設計だ。

一方、Anthropicは2026年1月にClaude APIの利用ポリシーを更新し、OAuthトークンを介した認可はClaude Code（ファーストパーティ）のみに制限した。サードパーティエージェントにはAPIキーを要求する方針だ。これは「委任の連鎖をコントロールできる範囲に限定する」という現実的な安全策だが、エコシステムの拡張性とのトレードオフでもある。

## 「セマンティック権限昇格」という新型脅威

セキュリティの観点で注目すべきは、**Semantic Privilege Escalation**と呼ばれる攻撃手法だ。従来の権限昇格はACLやロールの設定ミスを突くが、セマンティック権限昇格はエージェントの推論能力を悪用する。

「添付ファイルを開いて内容を教えて」という一見無害な指示に見えても、エージェントが添付内の指示文（プロンプトインジェクション）を実行すれば、本来の指示者が意図しない権限行使が起きる。OWASPが公開したMCP Top 10の「MCP02: Privilege Escalation via Scope Creep」もこの系統の脅威を扱っている。

技術的な認証モデルだけでは対処が難しく、エージェントランタイムレベルでの意図検証・行動監視が必要になる。Agentic JWTのワークフロー意図バインディングはこの問題へのアプローチの一つだが、実装の現実性はまだ検証段階だ。

## 現時点のベストプラクティス

標準化が固まるまでの間、実装者が取るべき現実的な対応を整理する。

**最小権限＋短命トークン**: AIエージェントに発行するアクセストークンは数分単位で有効期限を設定し、必要最小限のスコープに絞る。エージェントの行動ログと照合してスコープの実際の使用パターンを継続的に検証する。

**DPoP / mTLSによるトークンバインディング**: Bearer Tokenはトークン盗難リスクが高い。DPoP（Demonstrating Proof of Possession）やmTLSを使ってトークンを特定のキーペアに結び付け、トークンが窃取されても即座に悪用できないようにする。

**RelationShipベースのアクセス制御（ReBAC）**: ロールベースではなく、「AはBのドキュメントにアクセスできる」という関係グラフで権限を定義する。マルチユーザー・マルチエージェントの複雑な委譲関係に対応しやすい。

**委譲チェーンの監査ログ**: オーケストレーターからサブエージェントへの委譲を含む全チェーンを暗号検証可能な形で記録し、インシデント時に誰が何を実行したかを追跡可能にする。

## まとめと展望

AIエージェントのアイデンティティ問題は、既存のOAuth/OIDCエコシステムの延長線上にありながら、根本的に新しい要件をつきつけている。Agentic JWTやagent-sd-jwt、WIMSE WGのドラフトはいずれも2025〜2026年に登場した最新のものであり、実装として採用するには時期尚早だが、標準化の方向性を知っておくことは重要だ。

注目すべきは、これらのドラフトが「エージェントを別の認証主体として扱う」のではなく、「ユーザーの意図をトークンに埋め込み、委譲チェーン全体でその意図を検証する」という設計思想を共有している点だ。AIエージェント時代のIDの核心は、「誰か」ではなく「誰の意図を、どこまで実行するか」の証明に移行しつつある。

## 参考

- [Identity Management for Agentic AI — OpenID Foundation White Paper](https://openid.net/wp-content/uploads/2025/10/Identity-Management-for-Agentic-AI.pdf)
- [draft-goswami-agentic-jwt — IETF Datatracker](https://datatracker.ietf.org/doc/draft-goswami-agentic-jwt/)
- [draft-nandakumar-agent-sd-jwt — IETF Datatracker](https://datatracker.ietf.org/doc/draft-nandakumar-agent-sd-jwt/)
- [draft-ni-wimse-ai-agent-identity — WIMSE WG](https://datatracker.ietf.org/doc/draft-ni-wimse-ai-agent-identity/)
- [RFC 8693: OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693)
- [MCP Authorization Specification](https://modelcontextprotocol.io/specification/draft/basic/authorization)
- [OWASP MCP Top 10 — MCP02: Privilege Escalation via Scope Creep](https://owasp.org/www-project-mcp-top-10/2025/MCP02-2025%E2%80%93Privilege-Escalation-via-Scope-Creep)
