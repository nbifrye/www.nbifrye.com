# OpenID Foundation が2月26日に適合性試験を開始：HAIP 1.0 エコシステムの「互換性保証」フェーズへ

> 2026年2月26日、OpenID Foundation が OpenID4VP 1.0・OpenID4VCI 1.0・HAIP 1.0 の自己認証プログラムを正式に開く。38ヵ国が参照するデジタルクレデンシャル仕様の「仕様策定」フェーズから「適合性保証」フェーズへの移行を象徴するイベントだ。

## 背景

2025年7月に OpenID4VP 1.0 が Final に到達し、同年12月24日に HAIP 1.0（High Assurance Interoperability Profile）が公開された。これで「書かれた標準」は出揃った。しかし標準化の歴史が示すように、仕様が出揃った後の最大の課題は**相互運用性の保証**だ。

OAuth 2.0 も FIDO2 も、実装がバラバラなまま「準拠」を自称する製品が乱立した時期を経験している。OpenID Foundation はその轍を踏まないために、適合性試験の基盤整備を仕様公開と並行して進めてきた。

## 2月26日に始まること

2026年2月26日から開始される**自己認証（Self-Certification）**プログラムの対象は次の3仕様。

| 仕様 | ステータス | 認証対象ロール |
|------|-----------|----------------|
| OpenID4VP 1.0 | Final（2025年7月） | Wallet、Verifier |
| OpenID4VCI 1.0 | Final（2025年7月） | Issuer、Wallet |
| HAIP 1.0 | Final（2025年12月） | Issuer、Wallet、Verifier |

プログラムの仕組みはシンプルだ。OpenID Foundation が提供するオープンソースの適合性スイートを使って実装をテストし、その結果ログを提出する。審査を経て合格が認められれば、Foundation の Web サイトに公開される。コストは**無料**（開発・テスト環境利用時）で、認証書発行時のみ費用が発生する。

対象となる実装者は38ヵ国にわたる。EUDI Wallet（EU）を筆頭に、英国、スイス、西バルカン諸国、そして**日本のデジタル庁**も参照している国・地域が含まれる。

## HAIP とは何か

HAIP（High Assurance Interoperability Profile）はそれ自体が新たなプロトコルではなく、既存仕様の**絞り込みプロファイル**だ。OpenID4VP・OpenID4VCI を実装するうえで「高保証ユースケースでは、この選択肢の組み合わせを使うこと」と制約する。

主要な技術制約：

- **クレデンシャル形式**：SD-JWT VC（RFC 9901）と ISO mdoc（ISO 18013-5）のみ
- **クエリ言語**：DCQL（Digital Credentials Query Language）のみ（DIF Presentation Exchange を廃止）
- **レスポンス暗号化**：必須
- **Wallet Attestation**：必須

特に注目すべきは**DCQL への一本化**だ。OpenID4VP 1.0 は DCQL と DIF Presentation Exchange の両方をサポートしているが、HAIP ではクエリ言語を DCQL のみに絞った。Presentation Exchange は JSONPath ベースの複雑なクエリが可能な一方、実装の一貫性を確保しにくいという問題があった。HAIP が DCQL に絞ることで、実装者は単一のクエリ言語に集中でき、相互運用性のテストも単純化される。

## 2025年11月の相互運用テスト結果

自己認証プログラムの開始に先立ち、2025年11月に OIDF はリモートの相互運用テストイベントを実施した。その結果は業界の期待を上回るものだった。

- **OID4VP 1.0 + HAIP 1.0 + DC API の組み合わせ**：44の Wallet・Verifier ペアで **98% の適合率**
- **OpenID4VCI 1.0**：22の Issuer・Wallet ペアで **82% の適合率**

参加したベンダーには Mattr、Bundesdruckerei、Google Wallet、Panasonic Connect、My Mahi、Meeco など、欧米アジアの幅広い企業が含まれる。Google Wallet のデータは特に重要で、Android プラットフォームレベルでの実装が相互運用テストに耐えうることを示した。

OID4VCI の 82% は VP の 98% と比較して低いが、これは Issuance フローが Authentication フローより実装の自由度が高く、テストケースのカバレッジが広いことが理由として挙げられている。

## Q2 2026 以降：認定（Accreditation）へ

自己認証の次のステップとして、OIDF は **Q2 2026 に認定（Accreditation）サービス**を予定している。自己認証が「自ら申告してログを提出する」仕組みなのに対し、認定では第三者（認定試験所）による検証レイヤーが加わる。EU EUDI Wallet の法的要件や規制調達では、この認定ステータスが実質的に必要になると予想される。

OIDF はすでに認定試験所候補とのパイロット連携を進めており、Q2 に詳細が明らかになる見通しだ。

## 所感

「38ヵ国で参照されている」という数字と「自己認証が2月26日から無料で開始できる」という事実を組み合わせると、これは単なるテクノロジーマーケティングではないとわかる。日本のデジタル庁もその38ヵ国に含まれる以上、OpenID4VP・HAIP への準拠は今後の国内調達・実装の前提条件になりえる。

DCQL への一本化も重要なシグナルだ。DIF Presentation Exchange は機能的に強力だが、ガバナンスが DIF（Decentralized Identity Foundation）と OIDF の間でまたがっており、維持コストが高い。HAIP が DCQL を選んだことは、OIDF エコシステム内で実装の複雑さを下げる方向への意志表示と読める。

2025年後半の標準化スプリント（OpenID4VP・OpenID4VCI・HAIP の Final 相次ぐ公開）は、2026年前半の「実装スプリント」への助走だった。2月26日はその号砲だ。

## 参考

- [OpenID Foundation to Launch Conformance Testing for Global Verifiable Credential Standards](https://idtechwire.com/openid-foundation-to-launch-conformance-testing-for-global-verifiable-credential-standards/)
- [OpenID Sets Feb. 2026 Self-Certification Launch](https://mobileidworld.com/openid-sets-feb-2026-self-certification-launch-for-wallet-and-verifiable-credential-conformance-tests/)
- [OpenID4VC High Assurance Interoperability Profile 1.0 — Editor's Draft](https://openid.github.io/OpenID4VC-HAIP/openid4vc-high-assurance-interoperability-profile-wg-draft.html)
- [OID4VP 1.0 is here: Unlocking a new era of verifiable credentials (Mattr)](https://mattr.global/article/oid4vp-1-0-is-here-unlocking-a-new-era-of-verifiable-credentials)
- [Inside the OpenID DCP Working Group: Issuance, Presentation, and Reality](https://sphericalcowconsulting.com/2026/01/27/inside-the-dcp-wg/)
- [OpenID Foundation Conformance Suite (GitLab)](https://gitlab.com/openid/conformance-suite)
