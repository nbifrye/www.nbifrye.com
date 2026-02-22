# DCQL：OpenID4VP が選んだクレデンシャルクエリ言語——Presentation Exchange との決別とその背景

> OpenID4VP 1.0 Final（2025年7月）で Presentation Exchange が仕様から取り除かれ、DCQL（Digital Credentials Query Language）が唯一のクエリ言語になった。なぜ置き換えられたのか、DCQL は何を実現するのか、エコシステムへの影響を技術的に整理する。

## はじめに

Verifiable Credentials の提示要求（Presentation Request）をどう表現するかは、デジタルアイデンティティ仕様の中でも設計の難しい部分だ。「どのクレデンシャルを、どの形式で、どのクレームだけ開示して持ってこい」という要求を、機械可読な形で表現しなければならない。

長らくその役割を担ってきたのが DIF（Decentralized Identity Foundation）の **Presentation Exchange**（PE）だった。OpenID4VP の初期ドラフト群は PE を採用し、多くの実装が PE ベースで構築されてきた。

しかし 2024年10月、OpenID4VP Draft 22 において事態は大きく動いた。**DCQL（Digital Credentials Query Language、読み方：「ダクル」）** が OpenID4VP に追加され、その後 PE は仕様から完全に削除された。OpenID4VP 1.0 が 2025年7月に Final になった時点で、PE は仕様外の存在になっていた。

この変化は単なる技術的な置き換えではない。エコシステムの重心が DIF から OpenID Foundation に移行したことを示す象徴的な出来事でもある。

## Presentation Exchange の何が問題だったか

PE が使われなくなった背景を理解するには、PE 自体の設計を振り返る必要がある。

PE は `presentation_definition` という JSON オブジェクトで要求を表現する。`input_descriptors` で要求するクレデンシャルの条件を書き、`constraints` で必要なフィールドを指定する。複雑な条件（「AまたはBを提示せよ」「AとBの両方が必要」）を表現できる一方、その表現は煩雑だった。

PE の問題点として実装者の間でよく挙げられたのは次の点だ：

1. **外部仕様への依存**：PE は DIF が管理する独立した仕様だ。OpenID4VP は PE を参照するだけで、仕様のライフサイクルが分離している。OAuth 2.0 の拡張仕様が RFC 本体に統合されているのとは異なり、PE との整合性維持はコストがかかる。
2. **mdoc との相性の悪さ**：PE はもともと W3C VC を念頭に設計されている。ISO/IEC 18013-5 の mDL（モバイル運転免許証）のようなネームスペースベースのデータ構造を PE で表現しようとすると、特殊な対応が必要になる。
3. **クレデンシャル選択ロジックの複雑さ**：ウォレットが「どのクレデンシャルがこの PE を満たすか」を判定するアルゴリズムは実装者ごとに微妙に異なり、相互運用性の障害になることがあった。
4. **JSONPath 依存**：PE の条件記述は JSONPath を使うが、パス表現の解釈が実装によって異なるケースがあった。

PE を完全に削除する決定は OpenID4VP WG 内で相当な議論を経ている。GitHub の Pull Request #479「Remove PE as a query language」には激しい議論の痕跡が残っている。最終的に、「OpenID4VP ネイティブのクエリ言語を1つに統一する」という方針が勝った。

## DCQL の設計思想

DCQL は Daniel Fett が主導して設計した、OpenID4VP の `dcql_query` パラメーターに埋め込まれる JSON オブジェクトだ。前身となるクエリ言語のアイデアは Oliver Terbu、Tobias Looker、Mike Jones によって提示され、IIW（Internet Identity Workshop）での議論やニュルンベルクでの IDUnion ハッカソン（Kristina Yasuda、Christian Bormann、Paul Bastian らが参加）を経て形になっていった。

DCQL の設計原則は以下の3点に集約できる：

**1. OpenID4VP への内在化**
DCQL は OpenID4VP 仕様そのものの一部として定義されており、外部仕様への依存がない。仕様のバージョンアップに伴って一緒に更新される。

**2. マルチフォーマット対応**
DCQL は SD-JWT VC（`dc+sd-jwt`）、ISO mdoc（`mso_mdoc`）、W3C VC（`ldp_vc`, `jwt_vc_json`）を統一した構造で扱う。各フォーマットの特性（mdoc のネームスペース構造、SD-JWT の `vct` フィールドなど）は `meta` オブジェクトで吸収する。

**3. 宣言的な論理構造**
`credential_sets` を使った AND/OR 論理により、「AかBのどちらかを提示せよ」「CとDの両方が必要だが、EはCの代替になる」といった複合条件を明確に表現できる。

## DCQL の構造と構文

DCQL クエリの頂点は `dcql_query` オブジェクトで、`credentials` 配列と任意の `credential_sets` 配列から構成される。

### credentials 配列

各エントリは1種類のクレデンシャルへの要求を表す。以下のフィールドを持つ：

| フィールド | 説明 |
|-----------|------|
| `id` | このクレデンシャルクエリの識別子（`credential_sets` から参照する） |
| `format` | クレデンシャル形式（`mso_mdoc`, `dc+sd-jwt`, `jwt_vc_json` など） |
| `meta` | フォーマット固有のメタデータ（`doctype_value`, `vct_values` など） |
| `claims` | 要求するクレームのリスト。各クレームは `path` で JSON パス指定 |

SD-JWT VC の例（年齢確認）：

```json
{
  "credentials": [
    {
      "id": "pid",
      "format": "dc+sd-jwt",
      "meta": {
        "vct_values": ["https://example.bmi.bund.de/credential/pid/1.0"]
      },
      "claims": [
        { "path": ["age_over_18"] },
        { "path": ["family_name"] },
        { "path": ["given_name"] }
      ]
    }
  ]
}
```

mdoc（mDL）の例では `path` がネームスペース込みの2要素配列になる：

```json
{
  "credentials": [
    {
      "id": "mdl",
      "format": "mso_mdoc",
      "meta": { "doctype_value": "org.iso.18013.5.1.mDL" },
      "claims": [
        {
          "path": ["org.iso.18013.5.1", "family_name"],
          "intent_to_retain": false
        },
        {
          "path": ["org.iso.18013.5.1", "age_over_18"],
          "intent_to_retain": false
        }
      ]
    }
  ]
}
```

mdoc 特有の `intent_to_retain` は、Verifier がそのクレームを保持する意図があるかを明示するフラグだ。ISO 18013-5 の設計に由来する概念で、データの用途透明性に貢献する。

### credential_sets による AND/OR 論理

複数クレデンシャルの提示条件を表現する場合、`credential_sets` を使う。`options` は「代替」（OR）を、同じ `options` エントリの複数 ID は「全部必要」（AND）を意味する。

```json
{
  "credentials": [
    { "id": "pid", "format": "dc+sd-jwt", "meta": {"vct_values": ["..."]} },
    { "id": "mdl", "format": "mso_mdoc", "meta": {"doctype_value": "org.iso.18013.5.1.mDL"} },
    { "id": "health_card", "format": "dc+sd-jwt", "meta": {"vct_values": ["..."]} }
  ],
  "credential_sets": [
    {
      "options": [
        ["pid"],
        ["mdl"]
      ],
      "purpose": "本人確認のため"
    },
    {
      "options": [
        ["health_card"]
      ],
      "required": false
    }
  ]
}
```

この例では「pid か mdl のどちらかを必ず提示し、health_card は任意」という要求を表現している。`required: false` により、health_card は Verifier が望ましいが必須ではないことを示す。

## HAIP における DCQL の位置づけ

HAIP 1.0（High Assurance Interoperability Profile、2025年12月 Final）は、高保証ユースケースにおける OpenID4VP・OpenID4VCI の実装プロファイルだ。HAIP は **DCQL を唯一の必須クエリ言語として規定**しており、Presentation Exchange のサポートを要求しない。

HAIP が DCQL を選んだ理由は明確だ：

- **EU EUDI Wallet との整合性**：EUDI Wallet のアーキテクチャリファレンスは OpenID4VP + DCQL を核心として採用している
- **mdoc との親和性**：mDL や mEID など ISO 18013 系のクレデンシャルは mdoc 形式で発行されるため、mdoc に最適化された DCQL が適している
- **トラストフレームワーク統合**：HAIP における `trusted_authorities` クエリ（DCQL の拡張）により、X.509 チェーンや ETSI Trusted List ベースの発行者信頼検証を DCQL の中で完結させられる

2025年5月5日に実施された「世界初のウォレット相互運用デモ」では、OpenID4VP + DC API + HAIP + DCQL の組み合わせで複数の独立したウォレット実装が相互運用に成功している。これはエコシステムが DCQL に収束しつつあることを示す重要なマイルストーンだ。

## エコシステムの対応状況

### ライブラリ・実装

**OpenWallet Foundation（OWF）** は 2025年2月に DCQL TypeScript の incubation を発表した。このライブラリは：

- Node.js・React Native・ブラウザ対応のプラットフォーム非依存設計
- クレデンシャルのエンコード/デコードを自前で持たず、「デコード済みペイロードとクエリをマッチングする」単一責任の設計
- OpenID4VP Draft 22〜1.0 Final をカバー
- Apache-2.0 ライセンス（商用利用可）

OWF の Credo フレームワークも DCQL TypeScript を採用し、DIDComm プロトコルでも PE の代替として DCQL を使う方向性を示している。これは DCQL が OpenID4VP の外でも使われ始めることを意味する。

**npm `dcql` パッケージ**として公開されており、DCQL クエリの検証・マッチングを担うコアライブラリとして利用できる。

### プレイグラウンド

[DCQLfiddle](https://dcqlfiddle.com/) はブラウザで DCQL クエリを試せるオンラインツールだ。クレデンシャルデータを入力してクエリの結果を確認できるため、実装検証やプロトタイプ開発に役立つ。

## Presentation Exchange は本当に終わるのか

PE を使った既存実装はどうなるのかという疑問は当然だ。現時点の答えは「OpenID4VP 1.0 の文脈では終わる」だ。しかし：

1. **DIF Presentation Exchange 仕様は引き続き DIF が維持する**：OIDC（OpenID Connect）ベースの既存システムや、PE を独自に参照している実装には影響しない
2. **移行期間の存在**：OpenID4VP 1.0 以前のドラフト（Draft 21 以前）をベースにした実装はまだ多い。PE サポートを維持しながら DCQL に移行するトランジション期間が実際の現場では必要になる
3. **DIDComm/Hyperledger 系の継続使用**：PE は OpenID4VP 以外のプレゼンテーション要求コンテキスト（例：DIDComm の Present Proof プロトコル）でも使われており、そちらでは DCQL の置き換えは起きていない

つまり PE の「廃止」は OpenID4VP エコシステムに限定された話であり、デジタルアイデンティティ全体での PE の終焉を意味するわけではない。ただし EU EUDI Wallet の重力圏では DCQL が事実上の標準になっていくことは確実だ。

## まとめと展望

DCQL の登場と Presentation Exchange の退場は、デジタルアイデンティティエコシステムのパワーシフトを象徴している。OpenID Foundation が自身の仕様（OpenID4VP）にネイティブなクエリ言語を持つことで、外部仕様への依存から脱却した。

技術的には DCQL は PE より明快だ。JSON 構造がシンプルで、mdoc との相性が良く、AND/OR ロジックが `credential_sets` で直感的に表現できる。Verifier 実装者の視点では、HAIP への準拠を目指すなら今すぐ DCQL に移行を始めるべきだ。

注目すべき今後の動きは2つある。

**1. DCQL の OpenID4VP 外への拡張**：OWF の DCQL TypeScript が DIDComm での採用を検討しているように、DCQL が OpenID4VP の枠を超えて汎用クレデンシャルクエリ言語として定着するかどうか。

**2. DCQL を用いた DC API の実装普及**：Digital Credentials API（W3C）が DCQL を参照しており、ブラウザネイティブの credential request が DCQL で表現されるフローが普及すれば、Web 開発者にとっても DCQL は必須知識になる。

OpenID4VP 1.0 Final に続いて HAIP 1.0 Final が揃い、OIDF の自己認証プログラムが 2026年2月26日に開始する。DCQL の実装精度が相互運用性の鍵になる時代が、今まさに始まろうとしている。

## 参考

- [OpenID for Verifiable Presentations 1.0 — Final](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [OpenID4VC High Assurance Interoperability Profile 1.0 — Editor's Draft](https://openid.github.io/OpenID4VC-HAIP/openid4vc-high-assurance-interoperability-profile-wg-draft.html)
- [Remove PE as a query language — GitHub PR #479](https://github.com/openid/OpenID4VP/pull/479)
- [DCQL TypeScript — OpenWallet Foundation Labs](https://github.com/openwallet-foundation-labs/dcql-ts)
- [OpenID4VC, DCQL and OpenID Federation: Three new TypeScript projects at OWF](https://openwallet.foundation/2025/02/25/openid4vc-dcql-and-openid-federation-three-new-fundamental-typescript-projects-incubated-at-openwallet-foundation/)
- [First Global Interop of Wallets: May 5 Demo of OpenID4VP+DC API+HAIP+DCQL](https://openwallet.foundation/2025/08/11/1161/)
- [Understanding DCQL in the EUDI Wallet Ecosystem — iGrant.io](https://docs.igrant.io/concepts/eudi-wallet-dcql-openid4vp-business-wallet-payments/)
- [DCQLfiddle — DCQL Playground](https://dcqlfiddle.com/)
- [npm `dcql` package](https://www.npmjs.com/package/dcql)
