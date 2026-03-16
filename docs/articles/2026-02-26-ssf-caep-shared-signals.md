# SSF / CAEP — セッションを「リアルタイムで終わらせる」共有シグナル標準

> 2025年9月にOpenID Foundationが最終承認したSSF/CAEPは、ゼロトラスト実装における「継続的アクセス評価」の共通言語となる。

## はじめに

IDaaSやSSOを導入した企業でも、セッションの継続性は長らく盲点だった。ユーザーがログアウトしても、別のSaaSアプリがトークンを持ち続け、デバイスが紛失してもセッションが生きている——そんな状況が当たり前だった。

Shared Signals Framework（SSF）とContinuous Access Evaluation Profile（CAEP）は、この問題に正面から取り組む標準だ。「何か怪しいことが起きたとき、関係するすべてのアプリに即座に知らせる」仕組みを、相互運用可能な形で規定している。

## 背景：なぜセッション無効化が難しかったか

### トークンの「寿命」問題

OAuth 2.0のアクセストークンは発行時点でのスナップショットだ。有効期限が切れるまで、その権限情報は変わらない。30分後にユーザーの職権が剥奪されても、既存のアクセストークンは30分間有効であり続ける。

短い有効期限で対処することもできるが、5分ごとのリフレッシュはユーザー体験とパフォーマンスのトレードオフだ。エンタープライズ環境では、アクセス制御の変更をリアルタイムで伝播する「プッシュ型」の仕組みが本質的な解決策になる。

### セッション管理の分散化

現代のエンタープライズでは、IdP（Okta, Entra ID等）とSP（Salesforce, Google Workspace, Slack等）が数十〜数百の組み合わせで連携している。デバイス紛失時にIdPでアカウントを無効化しても、各SPがそれを知るタイミングはバラバラだ。SCIM/LDAP同期は分単位〜時間単位の遅延が生じることがある。

## SSFとCAEPの関係

### フレームワークとプロファイルの構造

**SSF（Shared Signals Framework）** は、セキュリティシグナルを送受信するための汎用フレームワークだ。OpenID Foundationが策定し、IETFのSecurity Event Token（SET、RFC 8417）をベースにしている。

- **送信者（Transmitter）**: シグナルを発生させる側（IdP、デバイス管理、SIEMなど）
- **受信者（Receiver）**: シグナルを受け取り、アクセス制御に反映する側（SP、アプリ）
- **Stream**: 送受信者間の論理チャネル。どんなイベントを、どのエンドポイントに送るかを設定する

**CAEP（Continuous Access Evaluation Profile）** は、SSFのプロファイルとして、エンタープライズのアクセス評価に特化したイベントタイプと処理方法を定義する。

2025年9月2日、SSF・CAEP・RISC（Risk and Incident Sharing and Collaboration）の3仕様がOpenID Foundationの最終承認を得た。

### 主要イベントタイプ

CAEPが定義する主なイベント:

| イベント                   | 意味                       | 典型的なトリガー                 |
| -------------------------- | -------------------------- | -------------------------------- |
| `session-revoked`          | セッション即時無効化       | デバイス紛失、アカウント侵害検知 |
| `token-claims-change`      | トークンクレームの変更通知 | 職権変更、グループ異動、属性更新 |
| `credential-change`        | 認証情報の変更             | パスワード変更、MFA再登録        |
| `assurance-level-change`   | 保証レベルの変化           | デバイスコンプライアンス低下     |
| `device-compliance-change` | デバイスの準拠状態変化     | MDM判定の更新                    |

これらのイベントはJWTベースのSETとして配信され、受信者はそれに応じてセッションの即時失効や再認証要求を行う。

### プロトコルの基本フロー

```
[IdP / デバイス管理 / SIEM]
        │
        │ SET（セキュリティイベントトークン）をPUSH
        │ POST /ssf/events
        ▼
[SP（Salesforce, Google Workspace等）]
        │
        │ 受信確認 → セッション評価 → 必要なら失効/再認証
        ▼
[ユーザーへの影響: 再認証ダイアログ or セッション切断]
```

配信方式はHTTP PUSH（Webhookライク）とHTTP POLL（受信者がポーリング）の2種類をサポートする。エンタープライズ環境ではPUSH方式がリアルタイム性の観点から主流だ。

## 主要プラットフォームの実装状況

### Okta Identity Threat Protection

OktaはCAEP最大の推進者の一つだ。**Okta Identity Threat Protection（ITP）** は、CAEPシグナルを中心に設計されたゼロトラスト製品で、以下を実現する:

- サードパーティSIEMからのリスクシグナルをCAEP経由で受信
- Okta管理下のすべてのSPセッションをリアルタイムで失効
- CrowdStrike、Splunk等のセキュリティ製品との統合

2024年12月のブログでOktaはCAEP/SSFへのコミットメントを改めて表明し、Okta Verify（デバイスシグナル）とOIE（Okta Identity Engine）の統合を拡充している。

### Google Workspace

GoogleはSSF Transmitter/Receiverの両方を実装している。Google Workspaceは外部のCAEP受信者に対してシグナルを送信でき、逆に外部シグナルを受け取ってGoogle WorkspaceのセッションをリアルタイムSuspendすることも可能だ。

### Apple、IBM、Jamf

2025年3月のロンドンIAMサミットでは、Apple・IBM・Jamfを含む複数ベンダーが実際の相互運用実装をデモした。特にJamf（デバイス管理）とIdPの間でのCAEPシグナル交換は、「デバイスがMDM準拠を失った瞬間にすべてのSaaSセッションを失効させる」ユースケースを現実のものにしている。

## IPSIE・ゼロトラスト文脈での位置づけ

CAEPは単独で完結する仕様ではなく、ゼロトラストアーキテクチャの「継続的評価」レイヤーを担う部品だ。

**IPSIEとの関係**: OpenID FoundationのIPSIE WGは、エンタープライズ向けに複数の標準（CAEP・DPoP・DBSC等）を組み合わせた相互運用プロファイルを策定している。CAEPはIPSIEにおいてセッション状態の同期手段として中核的な役割を持つ。

**SIEMとの統合**: 現代のSOCでは、SIEMが脅威を検知した際に人手を介さずCAEP経由でセッション失効をトリガーする自動化が現実的になっている。「脅威検知 → 即時セッション無効化」のループタイムを分単位から秒単位に短縮できる。

## 実装者の視点から

CAEPの実装で注意すべき点をいくつか挙げる。

**べき等性の確保**: 同じSETが複数回届いた場合でも、正しく処理できる必要がある。`jti`（JWT ID）を使ったイベントの重複排除は実装必須だ。

**受信確認の設計**: PUSH方式では、受信者がHTTP 202 Acceptedを返すことでTransmitterに確認を伝える。失敗時の再送ロジックとデッドレターキューの設計を初期から考えておくべきだ。

**Streamのライフサイクル管理**: CAEPのStreamは設定が必要で、受信者がTransmitterに対してどのイベントを、どのSubject（ユーザー/デバイス）について受け取りたいかを明示する。この初期設定のAPIも仕様化されている（SSF Management API）。

**タイムゾーン・クロックスキュー**: SETのタイムスタンプ（`iat`・`toe`）の検証では、送受信者間のクロックスキューを考慮したウィンドウを設けることが推奨される。

## まとめと展望

SSF/CAEPの最終標準化は、ゼロトラスト実装における「継続的アクセス評価」が共通言語を得たことを意味する。これまで各ベンダーが独自実装していた「セッション即時無効化」が、相互運用可能な形で実現できるようになった。

今後の焦点は実装の広がりだ。Okta・Googleのような大手から中堅SaaSへの普及、そしてCAEPシグナルの「送信者」としてのSIEM・EDR製品の対応拡大が進めば、エンタープライズのアイデンティティ基盤は「静的なアクセス許可」から「動的なリスク評価に基づく継続的認可」へと本格的に移行する。

IPSIEとCAEPの組み合わせは、その移行の中心的インフラになるだろう。

## 参考

- [OpenID Shared Signals Framework 1.0](https://openid.net/specs/openid-sharedsignals-framework-1_0-final.html)
- [OpenID CAEP 1.0 Final](https://openid.net/specs/openid-caep-1_0-final.html)
- [Okta's commitment to CAEP and SSF](https://www.okta.com/blog/2024/12/oktas-commitment-to-caep-and-ssf-pioneering-secure-interoperable-identity-standards/)
- [SGNL: SSF/CAEP最終仕様公開を歓迎](https://sgnl.ai/2025/09/sgnl-welcomes-the-publication-of-the-final-shared-signals-and-caep-specifications/)
- [Google Workspace SSF Integration Guide](https://developers.google.com/workspace/shared-signals/api/ssf-api)
