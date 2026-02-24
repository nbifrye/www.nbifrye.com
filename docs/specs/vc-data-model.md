# W3C VC Data Model 2.0 — Verifiable Credentials Data Model v2.0

> **発行**: W3C / 2025年5月15日 / **ステータス**: W3C Recommendation
> **著者**: Manu Sporny, Ted Thibodeau Jr., Ivan Herman, Michael B. Jones, Gabe Cohen（VC Working Group）
> **更新**: v1.0（2019年）→ v1.1（2022年）→ v2.0（2025年）

---

## 概要

W3C Verifiable Credentials Data Model 2.0（VC DM 2.0）は、インターネット上で検証可能なクレデンシャル（資格証明）を表現・交換するためのデータモデル標準である。「誰が・誰について・何を主張しているか」という三要素を構造化し、暗号学的な検証手段とセットで定義する。

デジタル運転免許証・学位証明・健康保険証・年齢確認など、物理的な証明書をデジタル化するユースケースの共通基盤として設計された。OpenID for Verifiable Credentials（OID4VC）や eIDAS 2.0 といった上位仕様が参照する中核標準であり、デジタルアイデンティティエコシステムのデータレイヤーを担う。

---

## 背景：なぜこの仕様が必要だったか

従来の属性証明はサービスごとに閉じた仕組みで実装されており、相互運用性がなかった。ID トークン（OIDC）は RP ごとに発行され、携帯性がない。紙の証明書はデジタル検証不可能。「誰でも発行でき、誰でも検証でき、保有者がコントロールできる」汎用フォーマットが存在しなかった。

VC DM はこの空白を埋めるため、以下の設計原則を採用した：

- **表現の分離**: データモデル（何を主張するか）とセキュリティ機構（どう署名するか）を分離
- **保有者中心**: 発行者→保有者→検証者のトライアングルで保有者がフローを制御
- **オープン性**: DID や HTTPS URL など多様な識別子を許容、特定のインフラに依存しない

---

## 基本概念

### ロール

| ロール | 説明 | 例 |
|--------|------|-----|
| **Issuer（発行者）** | VC を作成・署名するエンティティ | 大学・政府機関・雇用主 |
| **Holder（保有者）** | VC を受け取り・提示するエンティティ | 個人・デバイス |
| **Verifier（検証者）** | VP を受け取り・検証するエンティティ | サービスプロバイダー・空港ゲート |

### コアデータ構造

**Verifiable Credential（VC）**：発行者が保有者の属性を主張する文書

- `@context`：JSON-LD コンテキスト（必須）
- `type`：`["VerifiableCredential", ...]`
- `issuer`：発行者の識別子（URL または DID）
- `validFrom` / `validUntil`：有効期間（v2.0 で `issuanceDate` / `expirationDate` から改名）
- `credentialSubject`：主張するクレーム群（`id` で主体を識別）
- `credentialStatus`：失効確認エンドポイントへの参照
- `proof`：署名（Data Integrity / JOSE / COSE）

**Verifiable Presentation（VP）**：保有者が1枚以上の VC を検証者に提示するラッパー

### EnvelopedVerifiableCredential（v2.0 新要素）

外部のセキュリティエンベロープ（JWT, SD-JWT, CBOR など）で VC 全体を包む方式を公式に定義した。これにより「JSON-LD の VC を JWT でセキュアにする」構成が仕様上明確になった。

---

## セキュリティ機構の設計

v2.0 最大の変更点は、**プルーフ機構を本体仕様から分離**したことである。

### 分離された3種のセキュリティ仕様

| 仕様 | 概要 | 採用例 |
|------|------|--------|
| **VC Data Integrity 1.0** | RDF の正規化 + Ed25519/ECDSA 署名 | 欧州 EUDI Wallet（一部）, Linked Data 系 |
| **VC-JOSE** | JWT / SD-JWT ベースのセキュリティ | OpenID4VC, HAIP, SD-JWT VC |
| **VC-COSE** | CBOR + COSE 署名（ISO 18013-5 親和） | mdoc/mDL エコシステム |

この分離設計には賛否がある。仕様の可搬性と実装者の選択自由度が上がった一方、「どのプルーフを使えばいいか」が状況依存になり、相互運用性は上位プロファイル（HAIP など）が担保する構造になった。

---

## v1.1 → v2.0 の主要差分

| 変更点 | v1.1 | v2.0 |
|--------|------|------|
| フィールド名 | `issuanceDate`, `expirationDate` | `validFrom`, `validUntil` |
| プルーフ機構 | 仕様本体に定義 | 独立仕様（DI / JOSE / COSE）に分離 |
| エンベロープ表現 | 非公式 | `EnvelopedVerifiableCredential` として明記 |
| mediaType | 規定なし | `application/vc` 等を IANA 登録 |
| JSON-LD 依存 | JSON-LD が主軸 | JSON ネイティブ実装を追記、緩和（ただし `@context` は必須継続） |

`validFrom` / `validUntil` への改名は破壊的変更であり、v1.1 実装の移行コストが生じる点は批判を受けた。

---

## フロー概要

```
Issuer                        Holder                        Verifier
  │                             │                              │
  │── VC 発行（署名）──────────>│                              │
  │                             │                              │
  │                             │<── 提示要求（VP Request） ──│
  │                             │                              │
  │                             │── VP 送信（VC を含む） ────>│
  │                             │                              │
  │                             │           │── 署名検証      │
  │                             │           │── 失効確認      │
  │                             │           │── 発行者信頼確認│
  │                             │           └── クレーム評価  │
```

保有者は VP 生成時に、どのクレームを提示するかを選択できる（選択的開示は SD-JWT VC や ZKP プルーフで実現）。

---

## セキュリティ上の重要な考慮事項

### 発行者の信頼確立

`issuer` フィールドの値（URL や DID）が信頼できるかは VC DM 自体は規定しない。OpenID Federation や X.509 PKI、DID メソッドを組み合わせて信頼チェーンを構築する必要がある。

### 失効管理

`credentialStatus` で参照される主要なメカニズム：

- **Status List 2021 / Bitstring Status List**：大規模向けビットマップ方式（W3C CG 仕様）
- **OCSP 相当**：リアルタイム問い合わせ（プライバシーリスクあり）

保有者のプライバシー（誰がどの VC を使ったかの追跡）と失効の即時性のトレードオフは未解決課題である。

### Holder Binding

VC が特定の保有者のものであることを証明する Holder Binding は VC DM 本体では弱い。`credentialSubject.id` に DID を書く方式が一般的だが、提示時に保有者がその DID の秘密鍵を持つことを証明する仕組みは VP / OpenID4VP 側の責任となる。

---

## 批判・議論ポイント

### JSON-LD 依存の継続

v2.0 でも `@context` は必須フィールドである。JSON-LD の完全な意味論（RDF トリプル）を必要としない実装者にとって、`@context` の URI 解決コスト・仕様複雑性は過剰との声が多い。GitHub issue #947 では 296 コメントの大議論になった。

### Data Integrity の RDF 正規化批判

W3C TAG は VC Data Integrity が依存する RDF Dataset Canonicalization（RDNA）について設計上の懸念を示した（TAG review #860, #899）。正規化の計算複雑性とセキュリティ特性への批判で、実装コストが高い点が問題視されている。

### 「標準が分裂している」問題

実際のエコシステムでは:
- HAIP / EUDIW ARF → SD-JWT VC（VC-JOSE）
- mDL / ISO 18013-5 → mdoc（VC-COSE）
- Linked Data 系 → Data Integrity

「どれが VC か」という質問への答えが文脈依存になっており、相互運用性は各プロファイルが保証する構造になっている。VC DM 2.0 はある種の「最小公倍数的な上位概念」であり、実装者は必ずプロファイルを参照する必要がある。

私見では、この分離は設計として正しい選択だと考える。署名アルゴリズムの進化に追随できるよう可換にしておくことで、耐量子暗号への移行もデータモデル改訂なしで対応できる。一方で、相互運用性のレイヤーが上位プロファイル任せになる点は、エコシステム全体の分断リスクを内包している。

---

## 後継・関連仕様

| 仕様 | 関係 | 状態 |
|------|------|------|
| VC Data Integrity 1.0 | セキュリティ機構（Linked Data 系） | W3C Recommendation (2025) |
| VC-JOSE-COSE | JWT/SD-JWT/CBOR セキュリティ機構 | W3C Recommendation (2025) |
| SD-JWT VC (RFC 9901) | IETF 標準の VC フォーマット、VC-JOSE の実用プロファイル | RFC (2025) |
| OpenID4VCI | VC 発行プロトコル（VC DM を搬送する） | OpenID Foundation Final |
| OpenID4VP | VC 提示プロトコル（VP を搬送する） | OpenID Foundation Final |
| HAIP | OID4VC 上の高保証相互運用性プロファイル | OpenID Foundation Final |
| Bitstring Status List | 失効管理機構 | W3C CG |
| DID Core | 発行者・保有者識別子としての DID 解決 | W3C Recommendation |

---

## 実装状況・採用

- **EU eIDAS 2.0 / ARF**：SD-JWT VC と mdoc を主フォーマットとして採用、VC DM 2.0 を参照
- **NIST SP 800-63-4**：mDL（ISO 18013-5）および VC フォーマットを IAL3 相当として認定
- **OpenWallet Foundation**：OpenID4VC TypeScript SDK で VC DM 2.0 対応
- **日本 Trusted Web**：VC DM を基盤として検討（2025 年度以降の実証）
- **Walt.id / Sphereon / Lissi** など多数のウォレットベンダーが v2.0 対応を表明

---

## 読み解きのポイント

1. **`@context` は省略不可**：JSON 実装であっても `@context` フィールドは必須。ただし値の解釈（RDF 変換）は任意
2. **プルーフなしの VC は非検証可能**：`proof` フィールドのない VC は "Credential"（検証不可）であり "Verifiable Credential" ではない
3. **`validFrom` と `validUntil` は将来日時を許容する**：future-dated credential（まだ有効でない）が仕様上存在できる
4. **失効は検証者の責任**：`credentialStatus` があってもチェックするかどうかは検証者の実装次第。仕様はチェックを SHOULD（推奨）としている
5. **クレームの意味はコンテキスト依存**：同じフィールド名でも `@context` が異なれば別の意味になる。相互運用性は共通コンテキスト URL の合意が前提

---

## 参考

- [W3C Verifiable Credentials Data Model 2.0（正式仕様）](https://www.w3.org/TR/vc-data-model-2.0/)
- [W3C Press Release: VC 2.0 Recommendation](https://www.w3.org/press-releases/2025/verifiable-credentials-2-0/)
- [OpenID4VC High Assurance Interoperability Profile（HAIP）](https://openid.net/specs/openid4vc-high-assurance-interoperability-profile-1_0-final.html)
