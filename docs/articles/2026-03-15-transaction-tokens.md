# Transaction Tokens は「内部API向けの文脈付き最小権限トークン」になるか

> OAuth Token Exchange を土台に、マイクロサービスの Call Chain へ「改ざんされない取引文脈」を運ぶのが Txn-Token の本質。

## はじめに

Transaction Tokens（Txn-Tokens）は、IETF OAuth WG で標準化が進む Internet-Draft で、外部から入ってきたリクエストの**主体（user/workload）と認可文脈**を、内部のマイクロサービス連鎖（Call Chain）に安全に引き回すための仕様です。

私の理解では、これは「OAuth access token を内部で使い回す」設計から、「内部向けに再発行した短命 JWT を使う」設計へのシフトを明文化したものです。Zero Trust や workload identity の実装で繰り返し問題になる「誰が、どの意図で、この処理を始めたか」を、監査可能な形で固定化できる点が重要です。

## なぜ今 Transaction Tokens なのか

従来の API 境界では、外部クライアントの access token を gateway から内部サービスへそのまま渡してしまう実装が少なくありませんでした。ですがこの方式には、次の弱点があります。

- 内部サービスが増えるほど、外部向け token の漏洩時インパクトが大きくなる
- 下流サービスで「この呼び出しが本当に同一トランザクション由来か」を検証しにくい
- リクエストパラメータや環境情報（IP・authn method など）が途中で変質しても追いにくい

Txn-Token draft はこの課題に対して、以下を要求しています。

- **短命（minutes 以下）**の署名付き JWT とする
- Trust Domain ごとに **Transaction Token Service（TTS）** を置く
- `txn`（一意トランザクション ID）と `tctx/rctx`（文脈）を保持する
- HTTP 伝播時は `Authorization` ヘッダではなく **`Txn-Token` ヘッダ**を使う

この設計は、内部境界で必要な検証責務を明確に分割できるため、SOC 監査・インシデント調査・不正呼び出し検知まで含めて運用しやすいです。

## 仕様の技術的ポイント

### 1. OAuth 2.0 Token Exchange（RFC 8693）プロファイルとして定義される

Txn-Token は独自プロトコルではなく、Token Exchange を利用します。`requested_token_type` に `urn:ietf:params:oauth:token-type:txn_token` を指定して TTS に発行要求する形です。

ここが実務上かなり重要で、既存の OAuth AS/STS 実装を拡張しやすい。新規に完全独自の issuing protocol を持たなくてよいので、段階導入の障壁が下がります。

### 2. claim 設計が「内部認可向け」に寄っている

必須・推奨 claim の思想は明確です。

- `aud`: Trust Domain を識別（ドメイン外受理を禁止）
- `txn`: 一意 ID（再利用検知と監査の軸）
- `scope`: 外部 token と一致不要、TTS が内部方針で狭く再定義
- `req_wl`: 発行要求した workload 識別
- `tctx`: 取引で不変であるべき業務パラメータ
- `rctx`: IP や認証方式など環境文脈

特に `scope` が「外部と同一でなくてよい」と整理されている点は、企業内権限モデルに合わせた least privilege 設計をしやすくします。

### 3. セキュリティ境界の引き直し

仕様は「Txn-Token は認証資格情報そのものではない」と明記し、さらに次を強調しています。

- リプレイ耐性は限定的なので短命必須
- refresh token は発行・利用不可
- 外部 access token を Txn-Token に埋め込んではならない
- TTS と workload の**相互認証（mTLS/署名系）**が必要

私はここを、"内部 API にも token hygiene を適用する" ための実装ガイドだと見ています。とくに「外部 access token の内部持ち込みをやめる」だけでも、横展開リスクは体感的に大きく下がります。

## 実装観点：どう導入するか

現実的には、次の 3 段階が導入しやすいです。

1. **入口固定化**: API Gateway だけが TTS に発行要求できる状態にする
2. **下流検証標準化**: 共通ライブラリで `aud/exp/署名/txn` 検証を必須化する
3. **監査運用**: `txn` を分散トレーシング ID と突合し、再利用検知ルールを作る

ポイントは、仕様をそのまま実装するより、組織の運用（ログ保全・SIEM・障害解析）に接続することです。Txn-Token は「トークン仕様」ですが、価値の本体はオブザーバビリティ改善にあります。

## 日本企業への示唆

日本企業の ID 基盤では、IAM チームと API チームが分断していることが多く、内部 API の権限管理が属人化しがちです。Txn-Token の導入は、次の共通言語を作る効果があります。

- 「外部認可」と「内部認可」を分ける
- 取引単位（`txn`）で監査ログを統合する
- workload identity（SPIFFE/SPIRE や mTLS）と OAuth を接続する

特に金融・公共・大規模 EC のような多段マイクロサービス環境では、**「誰が始めた要求か」だけでなく「何をしようとしていた要求か」**を改ざん不能に持ち回れる設計が、今後の標準になると考えています。

## まとめと展望

Transaction Tokens は、単なる新しい token type ではなく、**内部サービス連鎖での認可責務を再設計する提案**です。

OAuth 2.0 Token Exchange を再利用しながら、`txn`・`tctx`・`rctx` で業務文脈を固定する設計は、WIMSE や Zero Trust 実装の実務課題に直接効きます。ドラフト段階ではありますが、今のうちに「TTS をどこに置くか」「どの workload に発行権限を与えるか」「`txn` をどう監査に使うか」を先に設計しておくと、将来の標準追従コストを下げられます。

## 参考

- [IETF Internet-Draft: Transaction Tokens](https://datatracker.ietf.org/doc/draft-ietf-oauth-transaction-tokens/)
- [RFC 8693: OAuth 2.0 Token Exchange](https://www.rfc-editor.org/rfc/rfc8693)
- [IETF Internet-Draft: WIMSE Architecture](https://datatracker.ietf.org/doc/draft-ietf-wimse-arch/)
- [RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)
