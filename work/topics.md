# Digital Identity Topic Coverage Matrix

`/work` 実行時にこのファイルを参照してカバレッジギャップを特定します。

## スコア凡例

| Score | 意味                                 |
| ----- | ------------------------------------ |
| 0     | 未着手                               |
| 1     | 他の記事で言及あり                   |
| 2     | 専用記事あり（概要レベル）           |
| 3     | 専用仕様解説あり（詳細レベル）       |
| 4     | 複数記事 + 仕様解説 + 相互リンク済み |

## 優先度

- **P0**: 必須カバレッジ（このサイトの核心）
- **P1**: 重要（6ヶ月以内に score ≥ 1 目標）
- **P2**: あれば望ましい

---

## Domain 1: OpenID Standards

| Topic                                                  | Priority | Score | File(s)                         | Last Updated |
| ------------------------------------------------------ | -------- | ----- | ------------------------------- | ------------ |
| OAuth 2.0 Authorization Framework (RFC 6749)           | P0       | 3     | docs/specs/rfc6749.md           | 2026-04-03   |
| OAuth 2.0 Bearer Token (RFC 6750)                      | P1       | 3     | docs/specs/rfc6750.md           | 2026-04-06   |
| PKCE — Proof Key for Code Exchange (RFC 7636)          | P1       | 3     | docs/specs/rfc7636.md           | 2026-04-04   |
| JWT — JSON Web Token (RFC 7519)                        | P0       | 3     | docs/specs/rfc7519.md           | 2026-04-03   |
| JWK — JSON Web Key (RFC 7517)                          | P1       | 3     | docs/specs/rfc7517.md           | 2026-04-06   |
| JWT Access Token (RFC 9068)                            | P1       | 3     | docs/specs/rfc9068.md           | 2026-04-07   |
| JWT-Secured Authorization Request / JAR (RFC 9101)     | P1       | 3     | docs/specs/rfc9101.md           | 2026-04-07   |
| Pushed Authorization Requests / PAR (RFC 9126)         | P1       | 3     | docs/specs/rfc9126.md           | 2026-04-05   |
| DPoP — Demonstrating Proof of Possession (RFC 9449)    | P1       | 3     | docs/specs/rfc9449.md           | 2026-04-05   |
| OAuth 2.0 Rich Authorization Requests / RAR (RFC 9396) | P1       | 3     | docs/specs/rfc9396.md           | 2026-04-07   |
| OpenID Connect Core 1.0                                | P0       | 3     | docs/specs/oidc-core.md         | 2026-04-03   |
| OpenID Connect Discovery 1.0                           | P1       | 3     | docs/specs/oidc-discovery.md    | 2026-04-07   |
| FAPI 2.0 Security Profile                              | P1       | 3     | docs/specs/fapi2.md             | 2026-04-05   |
| OpenID for Verifiable Credential Issuance (OID4VCI)    | P0       | 3     | docs/specs/oid4vci.md           | 2026-04-03   |
| OpenID for Verifiable Presentations (OID4VP)           | P0       | 3     | docs/specs/oid4vp.md            | 2026-04-03   |
| Self-Issued OpenID Provider v2 (SIOPv2)                | P1       | 3     | docs/specs/siop-v2.md           | 2026-04-07   |
| OpenID Federation 1.0                                  | P1       | 3     | docs/specs/openid-federation.md | 2026-04-07   |

---

## Domain 2: W3C Standards

| Topic                                            | Priority | Score | File(s)                     | Last Updated |
| ------------------------------------------------ | -------- | ----- | --------------------------- | ------------ |
| Verifiable Credentials Data Model 2.0            | P0       | 3     | docs/specs/vc-data-model.md | 2026-04-03   |
| Verifiable Presentations                         | P0       | 1     | docs/specs/vc-data-model.md | 2026-04-03   |
| Decentralized Identifiers (DID) Core 1.0         | P0       | 3     | docs/specs/did-core.md      | 2026-04-03   |
| DID Methods 概観                                 | P1       | 1     | docs/specs/did-core.md      | 2026-04-03   |
| Web Authentication (WebAuthn) Level 3            | P0       | 3     | docs/specs/webauthn.md      | 2026-04-03   |
| SD-JWT Verifiable Credentials (SD-JWT VC)        | P0       | 3     | docs/specs/sd-jwt-vc.md     | 2026-04-03   |
| Selective Disclosure for JWTs (SD-JWT, RFC 9901) | P1       | 1     | docs/specs/sd-jwt-vc.md     | 2026-04-03   |
| CBOR / COSE                                      | P1       | 3     | docs/specs/cbor-cose.md     | 2026-04-07   |

---

## Domain 3: Regulatory

| Topic                                                 | Priority | Score | File(s)                                        | Last Updated |
| ----------------------------------------------------- | -------- | ----- | ---------------------------------------------- | ------------ |
| eIDAS 2.0 と EUDI Wallet アーキテクチャ               | P0       | 2     | docs/articles/2026-04-03-eidas2-eudi-wallet.md | 2026-04-03   |
| NIST SP 800-63-4 デジタルアイデンティティガイドライン | P0       | 3     | docs/specs/nist-sp-800-63-4.md                 | 2026-04-03   |
| 日本のデジタル社会形成基本法                          | P1       | 0     | —                                              | —            |
| マイナンバー法改正 (2024)                             | P1       | 2     | docs/articles/2026-04-07-mynumber-law-2024.md  | 2026-04-07   |
| 犯収法改正と eKYC                                     | P1       | 2     | docs/articles/2026-04-05-hanzaishueki-ekyc.md  | 2026-04-05   |
| GDPR とデジタルアイデンティティ                       | P2       | 0     | —                                              | —            |

---

## Domain 4: Enterprise Identity

| Topic                                                                  | Priority | Score | File(s)                                                | Last Updated |
| ---------------------------------------------------------------------- | -------- | ----- | ------------------------------------------------------ | ------------ |
| Shared Signals Framework / CAEP                                        | P1       | 3     | docs/specs/ssf-caep.md                                 | 2026-04-04   |
| IPSIE — Interoperability Profile for Secure Identity in the Enterprise | P1       | 3     | docs/specs/ipsie.md                                    | 2026-04-05   |
| SCIM 2.0 (RFC 7643 / 7644)                                             | P1       | 3     | docs/specs/scim2.md                                    | 2026-04-04   |
| WIMSE — Workload Identity in Multi-System Environments                 | P2       | 0     | —                                                      | —            |
| SPIFFE / SPIRE ワークロードアイデンティティ                            | P2       | 0     | —                                                      | —            |
| ワークロードアイデンティティのパターン                                 | P1       | 2     | docs/articles/2026-04-07-workload-identity-patterns.md | 2026-04-07   |

---

## Domain 5: Emerging Technologies

| Topic                                             | Priority | Score | File(s)                                                     | Last Updated |
| ------------------------------------------------- | -------- | ----- | ----------------------------------------------------------- | ------------ |
| Zero Knowledge Proofs × デジタルアイデンティティ  | P1       | 2     | docs/articles/2026-04-06-zkp-digital-identity.md            | 2026-04-06   |
| AI エージェントのアイデンティティ課題             | P0       | 2     | docs/articles/2026-04-03-ai-agents-identity.md              | 2026-04-03   |
| mDL — Mobile Driver's License (ISO 18013-5)       | P1       | 3     | docs/specs/iso18013-5.md                                    | 2026-04-05   |
| Privacy-Preserving Credentials（BBS+、AnonCreds） | P1       | 2     | docs/articles/2026-04-07-privacy-preserving-credentials.md  | 2026-04-07   |
| 選択的開示（Selective Disclosure）技術比較        | P1       | 2     | docs/articles/2026-04-07-selective-disclosure-comparison.md | 2026-04-07   |

---

## Domain 6: Regional Adoption

| Topic                                                    | Priority | Score | File(s)                                                | Last Updated |
| -------------------------------------------------------- | -------- | ----- | ------------------------------------------------------ | ------------ |
| EUDI Wallet の実装状況（ARF / 参照実装）                 | P0       | 2     | docs/articles/2026-04-03-eudi-wallet-implementation.md | 2026-04-03   |
| EUDI Wallet ARF（Architecture Reference Framework）      | P0       | 2     | docs/articles/2026-04-03-eudi-wallet-implementation.md | 2026-04-03   |
| マイナカード・公的個人認証サービス（JPKI）               | P0       | 3     | docs/specs/jpki.md                                     | 2026-04-03   |
| Apple / Google のパスキー戦略                            | P1       | 2     | docs/articles/2026-04-07-passkey-platform-strategy.md  | 2026-04-07   |
| 日本のフィンテック eKYC 動向                             | P1       | 2     | docs/articles/2026-04-07-fintech-ekyc-japan.md         | 2026-04-07   |
| マイナカードのデジタル活用（健康保険証・運転免許証統合） | P1       | 2     | docs/articles/2026-04-06-myna-digital-use.md           | 2026-04-06   |
| 日本のパスキー普及戦略                                   | P1       | 2     | docs/articles/2026-04-07-japan-passkey-strategy.md     | 2026-04-07   |
