# MCPサーバーのアクセス制御はどこまで標準化されたか（2026年3月時点）

> MCPのアクセス制御は「OAuthベースの土台」は急速に整った一方、エンタープライズ統制とM2M運用は拡張仕様先行で、クライアント実装の追随がこれからという段階だ。

## はじめに

MCP（Model Context Protocol）が広がるにつれて、実装者が最初に詰まるのは「どう認証・認可を統一するか」だ。特に本番環境では、単にMCPサーバーを動かすだけでは不十分で、**誰が・どのクライアントが・どこまでの権限で**ツールを叩けるかを厳密に設計しないと、情報漏えいと越権アクセスの温床になる。

本稿では2026年3月時点の一次情報をもとに、MCPサーバーのアクセス制御の現状を、

1. コア仕様（最低限そろった共通基盤）
2. 認可拡張（M2Mと企業統制）
3. 実装ギャップ（クライアント対応と運用課題）

の3層で整理する。

## 1. コア仕様は「OAuthリソースサーバー化」まで到達した

2025-11-25版のMCP仕様では、HTTPトランスポートに対するAuthorizationが明確化され、MCPサーバーをOAuth 2.1のresource serverとして扱う前提が定義された。

重要なのは、単に「OAuthを使うべき」と言うだけでなく、**発見（discovery）と接続性の要件が具体化された**点だ。

- MCPサーバーはRFC 9728のProtected Resource Metadataを実装し、`authorization_servers`を提供することを必須化
- クライアント側はAuthorization Server Metadata（RFC 8414）とOpenID Connect Discoveryの双方に対応
- 401時の`WWW-Authenticate`だけに依存しない発見フロー（well-known URI）も実務上の選択肢として整理

この設計により、マルチテナントや分離構成（APIゲートウェイ配下、認可サーバー別管理）でも、MCPの接続パターンを標準化しやすくなった。

私の見立てでは、ここがMCPアクセス制御の第一関門だった。初期MCP実装は「接続できるか」重視で、認可は製品依存になりがちだったが、現在は**OAuth相互運用の土台**が仕様レベルで固まったと言える。

## 2. 2025年のSEPsで「実運用向けの穴」が埋まり始めた

コア仕様の整備と並行して、2025年にFinal化されたSEPsが、実装で起きがちな“詰まりどころ”をかなり解消している。

### 2-1. SEP-985: RFC 9728との整合

SEP-985は、`WWW-Authenticate`ヘッダーを読める環境だけを前提にせず、well-knownへのフォールバックを明確化した。これで、分散インフラや中央認証基盤でもMCP導入障壁が下がる。

### 2-2. SEP-991: URLベースClient ID Metadata

SEP-991は、Client ID Metadata Documentsを採用し、HTTPS URLを`client_id`として扱う流れをMCP文脈で実用化した。動的クライアント登録だけでは運用が不安定になりやすい場面で、クライアントメタデータの検証・キャッシュを前提としたより現実的な構成を取りやすい。

### 2-3. SEP-1046: Client Credentialsを正式に補完

人間が介在しないバッチ、CI/CD、サーバー間連携に向けて、OAuth client credentialsフローを明示的に補強。特に、将来的にはJWT Assertionを推奨しつつ、現実解としてclient secretも許容する“移行可能な設計”が採られている。

ここは非常に実務的だ。理想形だけを要求すると現場は動かない。MCP側が「今すぐ導入できる方式」と「長期的に寄せる方式」を分けているのは評価できる。

## 3. それでも残る本丸: 認可拡張とクライアント実装のギャップ

MCP本体だけでは拾いきれない領域は、`ext-auth`で公式拡張として切り出されている。

- `io.modelcontextprotocol/oauth-client-credentials`
- `io.modelcontextprotocol/enterprise-managed-authorization`

これは方向性として正しい。MCPのコアを肥大化させず、用途別に拡張交渉（capability negotiation）で有効化できるからだ。

ただし2026年3月時点で、公開マトリクス上は主要クライアントでこれら認可拡張の対応が広くは確認できない。つまり現状は、

- **仕様: ある**
- **拡張: ある**
- **運用実装: まだら**

というフェーズにある。

このギャップは、エンタープライズ導入時に効いてくる。企業側は「社員がどのMCPサーバーに接続してよいか」をIdP主導で制御したいが、拡張未対応クライアントでは標準化の恩恵を受けにくい。結果として、個別プロキシや独自ゲートウェイで“暫定統制”を実装するケースが増える。

## 4. ローカルMCPの脅威モデルは、仕様でようやく明文化された

アクセス制御を語るときに見落とされがちなのが、ローカルサーバー導入時の安全性だ。SEP-1024では、ワンクリック導入フローにおけるクライアント要件（実行コマンドの完全表示、明示同意、拒否可能性）をMUSTで定義した。

ここは“認可プロトコルの話”ではないが、実際の侵害シナリオではむしろ重要だ。OAuthをきれいに実装していても、導入時に悪意あるコマンドをユーザーが実行すれば終わる。MCPアクセス制御は今後、

- サーバー側のOAuth準拠
- クライアント側の導入UX安全性

をセットで監査する前提になるはずだ。

## 5. 実装者向けチェックリスト（現時点の現実解）

私なら、今MCPサーバーを本番導入する際は次の順番で進める。

1. **まずコア仕様準拠を固定**（RFC 9728 metadata、AS discovery、scope設計）
2. **M2M要件があるならclient credentialsを先に分離**（human flowと混在させない）
3. **企業統制は拡張対応状況を確認してから採否判断**（未対応ならプロキシで暫定実装）
4. **ローカル導入フローの同意UIを必須監査項目にする**

MCPは急速に普及しているが、アクセス制御は「使える」状態と「監査に耐える」状態の差が大きい。2026年は、その差を埋める年になる。

## まとめと展望

2026年3月時点の結論は明確だ。MCPサーバーのアクセス制御は、**OAuth準拠の基盤整備は進んだが、企業統制とM2Mの運用標準化は“拡張＋実装待ち”の過渡期**にある。

今後1年の注目点は3つ。

- ext-authの実装が主要クライアントにどこまで広がるか
- enterprise-managed authorizationがIdP製品群とどこまで相互運用できるか
- ローカル導入セキュリティ要件（SEP-1024）が“推奨”でなく“実装常識”になるか

MCPを業務基盤として使う組織ほど、プロトコル仕様だけで安心せず、クライアント実装・導入導線・監査運用まで含めてアクセス制御を設計するべきだ。ここを先に整えたチームが、AI時代の内部統制で確実に先行する。

## 参考

- [MCP Specification: Authorization (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [MCP Specification: Security Best Practices (2025-11-25)](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices)
- [SEP-985: Align OAuth 2.0 Protected Resource Metadata with RFC 9728](https://github.com/modelcontextprotocol/specification/blob/main/seps/985-align-oauth-20-protected-resource-metadata-with-rf.md)
- [SEP-991: Enable URL-based Client Registration using OAuth Client ID Metadata Documents](https://github.com/modelcontextprotocol/specification/blob/main/seps/991-enable-url-based-client-registration-using-oauth-c.md)
- [SEP-1046: Support OAuth client credentials flow in authorization](https://github.com/modelcontextprotocol/specification/blob/main/seps/1046-support-oauth-client-credentials-flow-in-authoriza.md)
- [SEP-1024: MCP Client Security Requirements for Local Server Installation](https://github.com/modelcontextprotocol/specification/blob/main/seps/1024-mcp-client-security-requirements-for-local-server-.md)
- [MCP Authorization Extensions Overview](https://modelcontextprotocol.io/extensions/auth/overview)
- [MCP Extension Support Matrix](https://modelcontextprotocol.io/extensions/client-matrix)
