# デジタルアイデンティティ 2026：今ここにある変化

> 業界全体が「IDはインフラ」という認識に収束しつつある。2026年はその基盤が実装フェーズに入った年だ。

## 背景

2023〜2025年にかけて、デジタルアイデンティティの標準化は急ピッチで進んだ。
OpenID4VCI / OpenID4VP の Final specification、W3C VC Data Model 2.0、EU eIDAS 2.0 の施行——これらが
2026年に向けて「絵に描いた餅」から「実装すべき仕様」に変わった。

今この瞬間、業界は3つの力が同時に動いている。

## 3つの構造変化

### 1. 政府主導のウォレット競争

EU EUDI Wallet の参照実装（ARF: Architecture Reference Framework）が成熟し、
加盟国はそれぞれの国家ウォレットを 2026年末までに提供する義務を負っている。
ISO 18013-5 (mDL) を採用した米国の各州展開も並走しており、
「政府発行クレデンシャルをモバイルで提示する」という体験が当たり前になりつつある。

注目点は **相互運用性**。EUDI Wallet と mDL は技術スタックが微妙に異なる
（OpenID4VP over mdoc vs. OpenID4VP over SD-JWT）。この差異をどう吸収するかが
2026年の実装者の悩みどころだ。

### 2. OpenID Foundation の仕様収束

OpenID4VCI / OpenID4VP はついく最終段階に入った。
Digital Credentials API（旧 OID4VC over Browser API）は W3C との協調で進み、
ブラウザから直接ウォレットにリクエストを送る UX が現実になりつつある。

FAPI 2.0 は金融 API の事実上の標準として定着し、
日本の Open Banking 実装でも参照されるようになった。
OpenID Federation 1.1 は「信頼の連鎖」を技術的に表現する仕組みとして、
大規模エコシステムの基盤として静かに広がっている。

### 3. AI エージェントがID の問題を突きつける

LLM エージェントが API を叩き、サービスを横断して自律的にタスクをこなす——
この現実が **非人間アイデンティティ (Non-Human Identity: NHI)** の問題を浮上させた。

「このリクエストを送っているのは本当に認可されたエージェントか？」
「人間のユーザーの委任を正しく受けているか？」

OAuth 2.0 の scope・grant type の体系は人間を想定して設計されており、
エージェントの委任連鎖や権限の継承を表現するには無理がある。
IETF では Identity Chaining や Transaction Tokens (RFC 9700) の議論が進んでいるが、
実装はまだ手探り段階だ。

## 所感

この3つの変化が示すのは、ID が「ログイン機能」から「デジタル社会の神経系」へと
役割を拡張しているという事実だ。

特に NHI の問題は、従来の IAM ベンダーが想定していなかった領域であり、
ここに新たなプロダクト機会が生まれている。
AI エージェントを「正しく」認証・認可するための仕様と実装は、
今後2〜3年で業界の主要テーマになるだろうと見ている。

EUDI Wallet と mDL の相互運用問題は、技術よりも政治と調達の問題が大きい。
仕様を追うだけでなく、各国の実装ロードマップと政策動向を並行して見る必要がある。

## 参考

- [OpenID for Verifiable Presentations (OpenID4VP)](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [OpenID for Verifiable Credential Issuance (OpenID4VCI)](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html)
- [EU Digital Identity Architecture Reference Framework](https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/)
- [RFC 9700 - OAuth 2.0 Transaction Tokens](https://www.rfc-editor.org/rfc/rfc9700)
- [FAPI 2.0 Security Profile](https://openid.net/specs/fapi-2_0-security-profile.html)
