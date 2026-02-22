# OpenID Federation 1.0 — フェデレーションによる分散型デジタルアイデンティティ信頼インフラ

> **発行**: OpenID Foundation / 2025年（Draft 46 / Public Review 中） / **ステータス**: Final 直前（2026年2月時点）
> **著者**: Roland Hedberg, Rolf Lindemann, Edmund Jay, Michael B. Jones, Andreas Åkre Solberg
> **関連仕様**: OpenID Connect Core 1.0, OpenID4VCI, OpenID4VP, EUDI ARF

---

## 概要

OpenID Federation 1.0 は、複数の組織にまたがる OpenID Connect / OAuth 2.0 エコシステムにおいて、**エンティティ間の信頼を分散・自動化**するためのフレームワークを定義する。従来の手動的な事前登録（静的クライアント登録）に代わり、署名済み JWT チェーンによって「どの Trust Anchor が信頼する組織グループに属するか」を暗号的に証明できる。

EU デジタルウォレット（EUDI ARF）がこれを必須インフラとして採用したことで、欧州を中心に急速に実装が進んでいる。2025年12月に Working Group Last Call（Draft 46）を完了し、2026年初頭のパブリックレビュー期間を経て Final Specification に向けて最終調整中。

---

## 背景：なぜこの仕様が必要だったか

OpenID Connect エコシステムが普及するにつれ、大規模なマルチ組織環境での運用課題が顕在化した。

**従来の問題**:
- RP（Relying Party）と OP（OpenID Provider）は事前に秘密のクライアントシークレットや JWKS を交換しなければならない（静的登録）
- 参加組織が増えるほど管理コストが爆発的に増大する（N×M 問題）
- 信頼の判断が中央集権的なディレクトリに依存する
- 準拠性確認（誰が正当な RP か）の仕組みが標準化されていない

**OpenID Federation が解決すること**:
- 署名済み JWT チェーン（Trust Chain）による分散的な信頼伝播
- メタデータポリシーの自動適用（上位組織の制約を下位に継承）
- 動的なエンティティ登録（事前の個別合意不要）
- Trust Anchor からの準拠性証明を暗号的に検証可能

---

## 基本概念

### エンティティとロール

| ロール | 説明 | 例 |
|--------|------|-----|
| **Trust Anchor** | 信頼の起点。他のすべてのエンティティはここに連鎖する | 国家機関、業界団体、大学連合 |
| **Intermediate** | 下位エンティティへの委任を行う中間ノード | 省庁、地方自治体、業界サブグループ |
| **Leaf** | 実際のプロトコルロールを担う末端エンティティ | OP（認証サーバー）、RP（アプリ）、Wallet Provider |

### 中核データ型

**Entity Configuration**
各エンティティが `/.well-known/openid-federation` で公開する自己署名 JWT。自身のメタデータ（OIDC OP や RP としての設定値）と JWKS（公開鍵）を含む。

```
{
  "iss": "https://op.example.com",
  "sub": "https://op.example.com",
  "jwks": { /* エンティティ固有の公開鍵 */ },
  "metadata": {
    "openid_provider": { /* OP としての設定 */ }
  },
  "authority_hints": ["https://trust-anchor.example.eu"]
}
```

**Subordinate Statement**
上位エンティティ（Intermediate / Trust Anchor）が下位エンティティに対して発行する JWT。下位エンティティの JWKS とメタデータポリシーを含み、「この組織は我々のフェデレーションに属する」ことを証明する。

**Trust Chain**
Entity Configuration と Subordinate Statement を連結した JWT チェーン。Leaf → Intermediate → Trust Anchor の順で構成され、最終的に Trust Anchor の署名で全体を検証できる。チェーンの各ステップでメタデータポリシーが適用・伝播される。

---

## フロー詳細：Trust Chain の構築と検証

```
RP が OP を初めて利用する場合の Trust Chain 解決フロー

1. RP が OP の Entity Configuration を取得
   GET https://op.example.com/.well-known/openid-federation
   → authority_hints から上位エンティティを特定

2. Intermediate から Subordinate Statement を取得
   GET https://intermediate.example.eu/federation_fetch_endpoint
       ?sub=https://op.example.com
   → OP に対する Subordinate Statement（JWT）を取得

3. Trust Anchor から Intermediate の Subordinate Statement を取得
   GET https://trust-anchor.example.eu/federation_fetch_endpoint
       ?sub=https://intermediate.example.eu
   → Intermediate に対する Subordinate Statement を取得

4. Trust Anchor の Entity Configuration を取得（JWKS を取得）
   GET https://trust-anchor.example.eu/.well-known/openid-federation

5. Trust Chain を組み立てて検証
   [OP EC] → [Intermediate SS for OP] → [TA SS for Intermediate] → [TA EC]
   各ステップでメタデータポリシーを適用し最終メタデータを算出
```

### メタデータポリシーの伝播

上位エンティティは下位に対して「subset\_of」「superset\_of」「one\_of」「add」「value」などの演算子を使ってメタデータ値を制約できる。例：

```json
{
  "openid_provider": {
    "userinfo_signing_alg_values_supported": {
      "subset_of": ["RS256", "PS256", "ES256"]
    }
  }
}
```

Trust Anchor が「ES256 のみ許可」を宣言すれば、下位の OP が RS256 をサポートすると主張しても、ポリシー適用後の有効値は ES256 のみとなる。

---

## Federation API エンドポイント

| エンドポイント | 用途 | 必須/任意 |
|----------------|------|-----------|
| `/.well-known/openid-federation` | Entity Configuration の公開 | **全エンティティ必須** |
| `federation_fetch_endpoint` | 下位エンティティの Subordinate Statement 取得 | Intermediate/TA |
| `federation_list_endpoint` | 管理下のエンティティ一覧 | Intermediate/TA（任意） |
| `federation_resolve_endpoint` | Trust Chain の解決をサービスとして提供 | 任意 |
| `historical_keys_endpoint` | 失効した署名鍵の公開 | 任意 |

---

## セキュリティ上の重要な考慮事項

**鍵ロールオーバー**
Entity Configuration の署名鍵（Federation Key）とプロトコル鍵（OIDC 用 JWKS）は分離して管理する。Federation Key の更新時は `historical_keys_endpoint` を通じて旧鍵を公開し、キャッシュされた古い Trust Chain との互換性を維持する。

**Trust Chain キャッシュと有効期限**
Trust Chain は `exp` クレームによって有効期限が設定される。実装者はチェーンをキャッシュする場合、最短 `exp` のコンポーネントを基準として更新タイミングを設計する必要がある。短すぎると動的 discovery のオーバーヘッドが増大し、長すぎると失効への対応が遅れる。

**Subordinate Statement の取り消し**
標準仕様レベルでの失効リストは未定義（2026年2月時点）。現実装では `exp` の短縮か、`federation_list_endpoint` から対象を外すことで事実上の取り消しを行う。明示的な失効メカニズムは 1.1 以降での課題として議論継続中。

**メタデータポリシーの演算子競合**
`subset_of` と `superset_of` が矛盾する制約を生む場合（空集合が出力される場合）、Trust Chain 検証は失敗として扱う。Policy の設計ミスが広範な RP/OP のアクセス障害を引き起こすリスクがあるため、段階的なロールアウトと事前テストが不可欠。

---

## 後継・関連仕様

| 仕様 | 関係 |
|------|------|
| **OpenID Federation 1.1** | 1.0 のアーキテクチャを維持しつつプロトコル非依存コアと OIDC バインディングに分割。2026年前半ドラフト公開予定 |
| **OpenID4VCI** | Trust Chain を Credential Issuer の準拠性確認に使用（EUDI ARF） |
| **OpenID4VP** | Trust Chain を Verifier の準拠性確認に使用（EUDI ARF） |
| **EUDI ARF 1.5** | OpenID Federation を必須信頼インフラとして規定 |
| **SPID / CIe（Italy）** | OpenID Federation 1.0 の本番運用事例として仕様開発をリード |

---

## 実装状況・採用

**イタリア SPID / CIe（最先進事例）**
イタリアの公的 ID 基盤 SPID（国民 ID システム）と CIe（電子 ID カード）は、OpenID Federation 1.0 を本番運用している欧州最先進事例。Python/Django、Java（Spring Boot）、ASP.NET Core、Node.js の4言語でオープンソース SDK を整備し、国内数千の RP が動的登録で参加する大規模エコシステムを実現している。

**EU デジタルウォレット（EUDI ARF）**
EUDIW Architecture and Reference Framework（ARF）は、Wallet Provider・Issuer・Verifier の準拠性確認に OpenID Federation を必須インフラとして採用している。2026年12月のサービス義務化（eIDAS 2.0）に向けて、各加盟国の Trust Anchor 整備が急務となっている。

**OpenWallet Foundation**
Animo 社が孵化プロジェクトとして TypeScript 実装（`openid-federation-ts`）を開発中。OpenID4VC TypeScript ライブラリ群との統合を想定した設計になっており、ウォレットベンダーのスタートアップコストを下げることが目標。

**日本**
2026年2月時点で国内本番採用事例はないが、次期マイナンバーカード（2028年）での Digital Credentials API 連携の文脈で OpenID Federation の適用が検討されている。政府 API のフェデレーション基盤として将来的な採用ポテンシャルは高い。

---

## 読み解きのポイント

**「フェデレーション」の意味の違いに注意**
SAML フェデレーション（XML ベースの信頼サークル）とは完全に異なる技術スタック。OpenID Federation は JWT ベースで REST 的なアーキテクチャを採用し、メタデータの動的取得を前提とする。既存の SAML フェデレーション（eduGAIN 等）の延長線上ではなく、ゼロベースの設計と理解する必要がある。

**Trust Chain の「長さ」のトレードオフ**
チェーンが長くなる（Intermediate が多段になる）ほど、Trust Anchor は個々のエンティティの詳細を知らなくてよくなる（委任）。しかし Discovery の HTTP ラウンドトリップが増加し、レイテンシとキャッシュ戦略の重要性が増す。`federation_resolve_endpoint` を活用して Trust Chain 解決をサービスオフロードする設計が現実的な解。

**Entity Statement ≠ アクセストークン**
Trust Chain による検証はあくまで「エンティティがフェデレーションに属するか」の確認であり、特定リソースへのアクセス権限付与ではない。OIDC/OAuth のアクセス制御ロジックと混同しないように注意。

**1.0 で解決されていない課題**
明示的な失効メカニズム、Trust Chain の長さ上限の標準化、Intermediate 不在のフラット構成でのスケーラビリティは 1.1 以降の検討事項。実装する際は `exp` の設計と鍵ロールオーバー計画に特に注意を払うこと。

---

## 参考

- [OpenID Federation 1.0 仕様（最新ドラフト）](https://openid.net/specs/openid-federation-1_0.html)
- [OpenID Foundation — Federation WG](https://openid.net/wg/federation/)
- [EUDI ARF (Architecture and Reference Framework)](https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework)
- [イタリア SPID / CIe SDK（GitHub）](https://github.com/italia/spid-cie-oidc-django)
- [OpenWallet Foundation — openid-federation-ts](https://github.com/openwallet-foundation-labs/openid-federation-ts)
