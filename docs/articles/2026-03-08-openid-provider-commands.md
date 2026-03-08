# OpenID Provider Commands — IdP がアカウントを直接操作する新しいプロトコル

> IdP からリライングパーティーに HTTP コマンドを送信し、アカウントライフサイクルを統制する新仕様。SSF/CAEP の「通知」を超えた「実行」の世界へ。

## はじめに

エンタープライズ ID の世界で長年放置されてきた問題がある。IdP（Identity Provider）が「このユーザーを無効化せよ」と指示しても、RP（Relying Party）のアプリ側でアカウントが生き続けるという問題だ。

SCIM でプロビジョニングを、CAEP でセッション変化の通知を、Back-Channel Logout でセッション終了を、それぞれ別々の仕様で対処してきた。だが、これらはいずれも「通知する」「知らせる」レベルに留まり、RP 側でのアカウント操作は RP の実装任せだった。

**OpenID Provider Commands（OPC）** は、この非対称性に正面から向き合う。OP が RP に直接 HTTP リクエストを送り、アカウントの状態変化を「コマンド」として実行させる。ドラフト 02 が 2025 年 9 月に公開されており、エンタープライズ ID の設計思想を根本から変えうる仕様として注目している。

## 問題の背景：なぜアカウントは IdP の外で生き続けるのか

従来のフェデレーション ID の仕組みは基本的に「入口」の設計だ。OIDC のトークン発行、SAML のアサーション受け渡し——ユーザーがログインするとき IdP は活躍するが、ログイン後は RP が独自にセッションを保持する。

この非対称性が生む問題は現実的だ：

- 退職者のアカウントを IdP 側で無効化しても、RP がセッションを持ち続ける（CAE が解決しようとしている問題）
- RP ごとにアカウントの「生存」状態が異なり、監査が困難
- B2B SaaS でテナント解約後もシートが残存し、ライセンス過剰課金が発生する

OpenID Connect Session Management、RP-Initiated Logout、Back-Channel Logout は「セッションを終了させる」ことには対応したが、アカウントそのものの状態管理（停止・削除・アーカイブ）は未解決のままだった。SCIM はプロビジョニングの標準だが、IdP 主導のリアルタイムコマンド実行には設計されていない。

## OPC の設計思想：通知から実行へ

OPC が既存仕様と根本的に異なるのは、**OP が実行責任を持つ**点だ。

SSF/CAEP は pub-sub 型の非同期イベント通知だ。OP がイベントストリームに「パスワードが変更された」と投稿し、RP がそれを購読して自分のポリシーに従って動作する。何をするかは RP の実装次第だ。

OPC はこれとは対照的に、OP から RP へのダイレクトな HTTP リクエストだ。RP はコマンドを受け取り、成功・失敗を応答する。OP は結果を知ることができ、必要であれば再試行やエスカレーションができる。

```
SSF/CAEP: OP → [イベントストリーム] → RP（RP が好きに解釈）
OPC:      OP → [HTTP POST] → RP → [HTTP 200/202] → OP（双方向の責任）
```

この設計は OP 側の「管理責任」を強化する。コンプライアンス要件が厳しい規制業界や、テナント管理を一元化したい SaaS プラットフォームにとっては、CAEP の「通知して終わり」モデルより踏み込んだ保証が得られる。

## 定義されるコマンドの体系

OPC は 2 つのカテゴリでコマンドを定義する。

**アカウントコマンド** はエンドユーザー単位の操作を表す：

| コマンド | 意味 |
|---------|------|
| Activate | アカウントを有効化（初期プロビジョニング）|
| Maintain | メタデータ更新（名前・属性の変更）|
| Suspend | 一時停止（ログイン不可、データ保持）|
| Reactivate | 停止中アカウントの再有効化 |
| Archive | 長期保管（アクセス不可、監査目的で保持）|
| Restore | アーカイブからの復元 |
| Delete | アカウント削除（データ消去を伴う可能性）|
| Invalidate | 既存セッション・トークンの即時無効化 |
| Migrate | 別テナント・別 OP への移行 |
| Audit | アカウント状態の問い合わせ |

**テナントコマンド** はマルチテナント SaaS 向けに、テナント全体を操作する：Suspend Tenant、Archive Tenant、Delete Tenant、Invalidate Tenant など。B2B SaaS での解約・乗り換えシナリオを想定したコマンドセットだ。

## プロトコルフロー

OPC は同期・非同期の 2 モードをサポートする。

**同期モード**（HTTP 200）は RP がコマンドを即時実行できる場合に使う：

```
POST /commands HTTP/1.1
Host: rp.example.com
Authorization: Bearer <op_token>

{
  "command": "suspend",
  "sub": "user@example.com"
}

→ HTTP 200 OK
{ "status": "success" }
```

**非同期モード**（HTTP 202）は RP 側での処理に時間を要する場合（データ削除、監査ログ作成など）に使う。RP は 202 を返した後、完了時にコールバック URL へ通知する。

コマンドのエンドポイント URL は RP のメタデータ（`.well-known` など）で公開することが想定されており、OP はそれを参照してコマンドを送る。

## 他の仕様との比較と位置づけ

OPC を既存の関連仕様と対比して整理する：

| 仕様 | 方向 | モデル | 主なユースケース |
|------|------|-------|----------------|
| Back-Channel Logout | OP → RP | 通知のみ | セッション終了 |
| SSF/CAEP | OP → RP | 非同期通知 | セッション変化・リスク通知 |
| SCIM | OP → RP | CRUD API | プロビジョニング |
| **OPC** | **OP → RP** | **双方向コマンド** | **アカウントライフサイクル** |

SCIM との比較が興味深い。SCIM は OP が RP の SCIM エンドポイントを叩いてユーザー管理をする。OPC は RP 側に「コマンドエンドポイント」を置く。どちらも OP 主導だが、OPC は「コマンドと結果」という明確な実行モデルを持ち、SCIM の汎用 CRUD より操作の意味が明確だ。同期・非同期の二段階応答モデルも SCIM にはない特徴だ。

IPSIE（Interoperability Profile for Secure Identity in the Enterprise）との関係も注目すべきだ。IPSIE はセッション終了・ライフサイクル管理を含むエンタープライズ向けプロファイルであり、OPC が扱う問題空間と重なる。Okta が主導し Microsoft・Google が採用した IPSIE が、将来 OPC をベースプロトコルとして参照する可能性はある。

## 現状と私の評価

OPC は 2025 年 9 月時点でドラフト 02（Dick Hardt / Karl McGuinness 著）であり、Implementer's Draft にはまだ達していない。Okta、Microsoft Entra、Google による具体的な実装実績はまだ報告されていない。

それでも、私はこの仕様を引き続き注目している。理由は 2 つある。

**第一に、問題の本質を突いている。** SCIM・CAEP・Logout 仕様が解決しきれなかった「アカウントライフサイクルの OP 主導管理」というギャップを、シンプルな HTTP コマンドモデルで埋めようとしている。エンタープライズ SaaS における SOC 2 監査対応や GDPR のデータ削除権への対応を考えると、この種のコマンドモデルへの需要は明確にある。

**第二に、作者の組み合わせが示唆を与える。** Dick Hardt は Hellō（コンシューマー向け OIDC プロキシ）を創業しており、OAuth 2.0 の RFC 6749 を著した人物でもある。Karl McGuinness は OpenID Foundation でのアイデンティティ標準化に長年携わっている。軽い実験的プロポーザルではなく、業界の経験に基づく設計判断が込められている。

課題としては、**RP 側でのコマンドエンドポイント実装コスト**が挙げられる。既存アプリがコマンドエンドポイントを用意するのは、SCIM サポートと同程度以上の改修を要する。また、コマンド実行の冪等性・タイムアウト・部分失敗の扱いは、非同期モデルの実装複雑さを増す。Suspend と Invalidate を同時に送ったときの原子性はどう保証するか——仕様がもう少し成熟してから判断が必要な部分だ。

## まとめと展望

OpenID Provider Commands は、エンタープライズ ID の「実行ギャップ」を埋める仕様として、地味ながら重要な試みだ。通知するだけの CAEP と比べて、OP がアカウント操作の結果を確認できる双方向モデルは、コンプライアンスと監査の観点から魅力的だ。

2026 年の現時点ではドラフト段階で普及はこれからだが、IPSIE や SSF/CAEP と並んで「エンタープライズ ID セキュリティの次の層」を形成する可能性がある。Implementer's Draft への昇格と、主要 IdP による実装表明が一つの転換点になるだろう。

## 参考

- [OpenID Provider Commands 1.0 — draft 02](https://openid.net/specs/openid-provider-commands-1_0.html)
- [GitHub: openid/openid-provider-commands](https://github.com/openid/openid-provider-commands)
- [Shared Signals Working Group — OpenID Foundation](https://openid.net/wg/sharedsignals/)
