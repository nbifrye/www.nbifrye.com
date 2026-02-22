# ブラウザが本人確認の窓口になる：Digital Credentials API の現在地

> Chrome 141 と Safari 26 が 2025年9月に相次いで出荷。Web サイトがブラウザを通じてユーザーのウォレットに保存されたクレデンシャルを安全にリクエストできる仕組みが、標準として実装フェーズに入った。

## 背景

これまで Web 上での本人確認は「身分証のスキャン画像をアップロード」か、各ウォレットアプリが独自に定義したカスタム URI スキーム（`openid4vp://` など）への遷移が主流だった。いずれも問題がある。

前者は過剰なデータ開示（住所も名前も全部見える）とセキュリティリスクの塊だ。後者はフィッシング耐性がなく、悪意あるサイトが正規のウォレット起動フローに見せかけた偽 URI スキームを使えばユーザーを騙せる。また、ブラウザが介在しないため、どのウォレットが使えるかの一貫した選択UIも存在しなかった。

この問題を根本から解決しようとするのが **Digital Credentials API** だ。

## 仕様と標準化の経緯

Digital Credentials API は W3C の **Federated Identity Working Group（FedID WG）** で開発されており、2025年4月に WICG（Web Incubator Community Group）から正式なワーキンググループに移管された。

**主要マイルストーン（2025年）:**

| 日付 | 出来事 |
|------|--------|
| 2025年2月 | W3C Council が仕様の Recommendation Track 掲載を決定（プライバシーに関する formal objection を退けつつ、WG に Privacy 対策の強化を指示） |
| 2025年4月 | WICG → W3C FedID WG へ移管 |
| 2025年7月1日 | First Public Working Draft 発行 |
| 2025年9月17日 | Working Draft 更新 |
| 2025年11月 | WG が仕様方針を合意：レジストリを廃止し、**OpenID4VP 1.0・OpenID4VCI・ISO/IEC 18013-7 Annex C** を normative reference として組み込む |

仕様は2026〜2027年に Candidate Recommendation へ進む見通しで、EU EUDI Wallet の展開タイムラインとも重なる。

## API の形と使い方

API の形はシンプルだ。既存の [Credential Management API](https://www.w3.org/TR/credential-management-1/) に `digital` メンバーを追加する設計で、既存の Web 認証基盤と統合される。

**提示（Presentation）:**
```javascript
const credential = await navigator.credentials.get({
  digital: {
    requests: [{
      protocol: "openid4vp",
      data: { /* OpenID4VP リクエスト */ }
    }]
  }
});
```

**発行（Issuance）— Chrome 143 Origin Trial:**
```javascript
await navigator.credentials.create({
  digital: {
    requests: [{ protocol: "openid4vci", data: { /* OID4VCI リクエスト */ } }]
  }
});
```

以前の Origin Trial では `navigator.identity.get()` と `providers`/`request` という名前だったが、現在は `navigator.credentials.get()` と `requests`/`data` に改称されている。

## ブラウザ実装状況

| ブラウザ | 対応状況 | バージョン | 対応プロトコル |
|---------|---------|-----------|--------------|
| **Chrome** | ✅ 出荷済み | Chrome 141（2025年9月30日） | OpenID4VP + ISO 18013-7 Annex C |
| **Safari** | ✅ 出荷済み | Safari 26（2025年9月15日） | `org-iso-mdoc`（mdoc のみ） |
| **Firefox** | ❌ 未対応 | — | —（プライバシー懸念を表明） |

Chrome はプロトコル非依存設計（OpenID4VP も mdoc も対応）。Safari は ISO/IEC 18013-7 Annex C のみをサポートし、OpenID4VP は対応しない。

Chrome はさらに **クロスデバイス対応**も実装しており、デスクトップブラウザから Android 端末のウォレットへ CTAP 2.2/BLE 経由でリクエストを転送できる。Chrome 143 からは**クレデンシャル発行**（`navigator.credentials.create()`）の Origin Trial も始まった（現時点は Android のみ）。

Relying Party（検証側）としては、Chrome ユーザーと Safari ユーザーを両方カバーするために OpenID4VP と mdoc の両プロトコルへの対応が現実的には必要になる。

## OpenID4VP との関係

OpenID4VP 1.0 Final は 2025年7月9日に OpenID Foundation が正式発行している（SD-JWT RFC 9901 より前後して標準化が完了した形だ）。

Digital Credentials API と OpenID4VP の関係を整理すると：

- **OpenID4VP** = クレデンシャルをどのプロトコルで提示するかの仕様
- **Digital Credentials API** = ブラウザがウォレットへのリクエストを仲介するトランスポート層

OpenID4VP 1.0 仕様自体に「DC API を使う場合の Appendix」が含まれており、OpenID4VP over DC API の実装方法が規定されている。つまり DC API は OpenID4VP を「上から乗せる」インフラとして機能する。

フローを簡略化すると：

```
ウェブサイト
  └─ navigator.credentials.get({ digital: { requests: [{ protocol: "openid4vp", data: OID4VP_request }] } })
       └─ ブラウザ（Chrome/Safari）
            └─ OS のウォレット選択 UI を表示
                 └─ ユーザーが Google Wallet / Apple Wallet / サードパーティウォレットを選択
                      └─ ウォレットアプリが OID4VP リクエストを処理し、選択的開示で応答
```

## ブラウザ仲介のセキュリティ的意味

なぜブラウザが間に入ることが重要なのか。

**1. 起点の認証（Origin Binding）**
ブラウザはリクエストの発信元 Origin を把握している。`example.com` のふりをした偽サイトが悪意あるリクエストを送っても、ブラウザがオリジンを確認してウォレットに渡す。カスタム URI スキームでは、どのサイトがリクエストしているかを確認する仕組みがない。

**2. 一貫した同意 UI**
ウォレットアプリごとに異なる同意画面ではなく、OS/ブラウザレベルで統一された選択 UI を提示できる。ユーザーが見慣れた UI でクレデンシャルを選ぶため、フィッシングの余地が減る。

**3. クレデンシャルの不可視性**
ブラウザはどのクレデンシャルがウォレットにあるかを Web サイトに事前通知しない。リクエストへの応答も暗号化されており、ブラウザ自身も内容を読めない（Relying Party のみが復号できる）。

**4. "Quishing"（QR コードフィッシング）への対策**
クロスデバイスフローでは CTAP 2.2 の Proximity Check（Bluetooth 近接確認）が組み込まれており、遠隔からの QR コード悪用を防ぐ。

さらに、Zero Knowledge Proof（ZKP）対応も設計に含まれる。Google の Longfellow ZK など、クレデンシャルの属性を明かさずに「18歳以上である」という事実だけを証明するプロトコルが DC API の上で動作できる。

## EUDI Wallet・mDL との接続

EU の EUDI Wallet は DC API への対応を ARF（Architecture and Reference Framework）で「オプション」として定義している：

- **DC API を使わない場合**（必須）：ISO 18013-5 + OpenID4VP v1.0
- **DC API を使う場合**（オプション）：ISO 18013-7 Annex C + OpenID4VP（DC API 対応付録）

EU 加盟国は 2026年12月までに EUDI Wallet の提供を義務付けられており、民間 Relying Party（金融機関など）は 2027年12月までに EUDI Wallet クレデンシャルの受け入れが求められる。

DC API がオプションとはいえ、Chrome と Safari の主要ブラウザが対応した今、「Web 上の EUDI Wallet 検証フロー」において DC API は事実上の標準経路になっていくとみられる。

## 所感

Digital Credentials API の出荷が示す変化は、「本人確認の仲介者がアプリからブラウザへ移行した」という一言に尽きる。

これは過去の認証技術の歴史と重なる。OAuth 2.0 が API アクセスの「仲介者」としてブラウザのリダイレクトを活用したように、DC API はデジタルクレデンシャルの提示において同じ役割を担おうとしている。

ただし、Chrome（OpenID4VP + mdoc）と Safari（mdoc のみ）の実装乖離は短期的な現実問題だ。OpenID4VP と mdoc の両方をサポートしない Relying Party は、どちらかのユーザーを切り捨てることになる。日本企業が DC API を使った本人確認を導入する場合、iOS ユーザーが大多数を占める市場では mdoc サポートが先決になる可能性が高い。

一方、Firefox の不参加も気になる。W3C の formal objection で示されたプライバシー懸念は技術的に正当な部分もある（クレデンシャルのトラッキングリスク、OS ベンダーへの依存など）。これらの懸念が Working Draft の改版でどう対処されるかが、仕様の完成度を左右する。

EUDI Wallet の義務的展開、mDL の各国実装、そして DC API の標準化——これらが 2026〜2027年に重なるタイミングで、Web 上の本人確認は「書類アップロード」から「ウォレットからの選択的開示」へと置き換わっていく。

## 参考

- [W3C Digital Credentials Working Draft](https://www.w3.org/TR/digital-credentials/)
- [W3C FedID WG GitHub リポジトリ](https://github.com/w3c-fedid/digital-credentials)
- [W3C Blog: Digital Credentials API publication（2025年7月）](https://www.w3.org/blog/2025/w3c-digital-credentials-api-publication-the-next-step-to-privacy-preserving-identities-on-the-web/)
- [Chrome Developers Blog: Digital Credentials API shipped](https://developer.chrome.com/blog/digital-credentials-api-shipped)
- [Chrome Developers Blog: Credential issuance OT（Chrome 143）](https://developer.chrome.com/blog/digital-credentials-api-143-issuance-ot)
- [WebKit Blog: Online Identity Verification with the Digital Credentials API](https://webkit.org/blog/17431/online-identity-verification-with-the-digital-credentials-api/)
- [Android Developers Blog: Android support of digital credentials（2025年4月）](https://android-developers.googleblog.com/2025/04/announcing-android-support-of-digital-credentials.html)
- [EUDI ARF: Digital Credentials API Discussion（ARF 1.10.0）](https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/1.10.0/discussion-topics/f-digital-credential-api/)
- [Corbado: Digital Credentials API 解説（2026年版）](https://www.corbado.com/blog/digital-credentials-api)
