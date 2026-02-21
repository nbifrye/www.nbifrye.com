# パスキーの「持ち運び」が現実になった：FIDO CXP/CXF の仕組みと今

> ベンダーロックインはパスキー普及の最大の心理的障壁だった。FIDO Alliance の Credential Exchange Protocol がその壁を壊しつつある。

## 背景

「パスキーを使いたいが、Apple から Android に乗り換えたらどうなるのか」——この問いが、パスキー採用を躊躇させる理由の一つだった。

パスワードなら CSV でエクスポートして別のパスワードマネージャーに移せる（セキュリティ上は最悪だが）。しかしパスキーの秘密鍵はデバイスの Secure Enclave/TPM に紐付いており、設計上エクスポートが難しい。クラウド同期型（Synced Passkeys）であれば Apple iCloud や Google Password Manager に保存されるが、プロバイダーをまたぐ移行の標準手段は存在しなかった。

2024年10月、FIDO Alliance がこの問題に正面から取り組む仕様草案を公開した。**Credential Exchange Protocol（CXP）** と **Credential Exchange Format（CXF）** だ。

## CXP/CXF とは何か

CXP と CXF は役割が分かれている。

- **CXP**（Credential Exchange Protocol）：プロバイダー間のクレデンシャル転送の「手順」を定義する。「誰が誰に何を送るか」のプロトコルだ。
- **CXF**（Credential Exchange Format）：転送されるクレデンシャルの「データ構造」を定義する。パスキー、パスワード、2FA コードなどを統一フォーマットで表現する。

### 技術的な仕組み

転送フローはシンプルだ。

1. **インポート側（受け取る側）が起点**：インポートプロバイダーがチャレンジと暗号パラメーターを含むエクスポートリクエストを生成する
2. **ユーザー承認**：エクスポート側でユーザーが転送を承認する（iOS では Face ID / Touch ID）
3. **エンドツーエンド暗号化で転送**：エクスポートプロバイダーはインポート側の公開鍵を使ってクレデンシャルを暗号化し、送信する
4. **インポート側が復号・保存**：インポートプロバイダーのみが復号できる

暗号方式は **Diffie-Hellman 鍵交換** と **HPKE（Hybrid Public Key Encryption、RFC 9180）** を組み合わせたもの。TLS と同じメカニズムを使うことで、転送中のデータが中間者に見えない設計になっている。

HPKE には Base、PSK、Auth、Auth-PSK の4モードが定義されており、実装者がユースケースに応じて選択する。転送データは DEFLATE（RFC 1951）で圧縮され、アーカイブとして扱われる。

CSV エクスポートのような「一時ファイルに平文を吐き出す」方式とは根本的に異なる。転送はアプリ間直接、暗号化されたまま行われる。

## 標準化の現状

2026年2月時点の状況：

| 仕様 | ステータス | 最新版 |
|------|-----------|--------|
| CXF | Review Draft（最終化間近） | 2025年3月13日版 |
| CXP | Working Draft | 2024年10月3日版（2026年初頭に正式化予定） |

策定に参加している主要企業：**Apple、Google、Microsoft、1Password、Bitwarden、Dashlane、NordPass、Enpass、Okta、Samsung、SK Telecom**。

これだけのメンバーが揃うのは珍しい。パスキーのエコシステムが「競争から協調」へ動いていることの象徴だ。

## iOS 26 での実装

仕様が机上の話でなくなったのは、2025年9月15日リリースの **iOS 26 と macOS Tahoe 26** だ。

Apple は iOS 26 で CXP を初めてプラットフォームレベルで実装した。開発者は `ASCredentialExportManager` と `ASCredentialImportManager` という API で参加できる。同時に **Bitwarden が最初のサードパーティ対応**を完了し、Apple Passwords からパスキーを Bitwarden へ（あるいはその逆方向へ）移行できるようになった。

1Password と Bitwarden はさらに、CXP/CXF の実装を加速するための **オープンソース Rust ライブラリ**も公開している。他のパスワードマネージャーも続く予定だ。

## NIST SP 800-63-4 との接続

2025年7月31日に最終版が発行された **NIST SP 800-63-4** との接続も見逃せない。

SP 800-63-4 の最大の変化の一つは、**Synced Passkeys（クラウド同期型パスキー）を AAL2（認証保証レベル2）として正式に認定**したことだ。従来はハードウェアトークンなど物理デバイスに縛られた認証方式でなければ AAL2 を満たせないとされていたが、iCloud や Google Password Manager に保存されるパスキーも、フィッシング耐性を持つ AAL2 の認証手段として政府・企業が採用できるようになった。

（AAL3 は依然としてデバイスバウンド型が必要——つまりクラウド同期不可のパスキーや FIDO2 ハードウェアキー。）

CXP/CXF は Synced Passkeys の「使い勝手を高める」仕組みであり、NIST SP 800-63-4 はその「セキュリティ水準を公式に認める」政策文書だ。この2つが2025年に揃ったことで、パスキーの「普及を妨げる最後の心理的・制度的障壁」が同時に取り除かれたと言える。

## 所感

CXP/CXF の完成が持つ意味は、技術的な面よりも「採用促進」の面で大きい。

「パスキーを使い始めたら囲い込まれる」という懸念は、特に IT 部門が複数のプラットフォームを管理する企業環境で実際の障壁になっていた。CXP が正式標準化されれば、その懸念は名実ともに消える。パスキーを採用した後でも、プロバイダーの変更やマルチプラットフォーム環境への対応が安全にできる。

また、CXP の設計は「パスキーだけ」に限定されていない。Google の Christian Brand は「将来的には運転免許証やパスポートなどのデジタルクレデンシャルも対象になりうる」と述べている。CXP は単なるパスワードマネージャー移行ツールではなく、デジタルクレデンシャル移植性の汎用基盤として設計されていることがわかる。

EUDI Wallet や mDL など、政府発行クレデンシャルの移植性が求められる場面での応用が、次の数年で現れてくるはずだ。

## 参考

- [FIDO Alliance: Credential Exchange Specifications](https://fidoalliance.org/specifications-credential-exchange-specifications/)
- [CXP Working Draft (2024-10-03)](https://fidoalliance.org/specs/cx/cxp-v1.0-wd-20241003.html)
- [CXF Review Draft (2025-03-13)](https://fidoalliance.org/specs/cx/cxf-v1.0-rd-20250313.html)
- [Apple @ Work: Passkey portability is finally here in iOS 26 and macOS Tahoe 26](https://9to5mac.com/2025/07/12/passkey-portability-is-finally-here-in-ios-26-and-macos-tahoe-26/)
- [Bitwarden: Security vendors join forces to make passkeys more portable](https://bitwarden.com/blog/security-vendors-join-forces-to-make-passkeys-more-portable-for-everyone/)
- [NIST SP 800-63-4 Final](https://csrc.nist.gov/pubs/sp/800/63/4/final)
- [Corbado: WebAuthn CXP & CXF 技術解説](https://www.corbado.com/blog/credential-exchange-protocol-cxp-credential-exchange-format-cxf)
