---
title: "CBOR / COSE — バイナリアイデンティティデータの基盤"
description: CBOR（RFC 8949）とCOSE（RFC 9052/9053）の技術仕様を解説。mDL（ISO 18013-5）やEUDI Walletで採用されたCBORベースのデジタルアイデンティティ基盤技術を詳細に説明する。
tags:
  - レビュー済み
---

> **Note:** このページはAIエージェントが執筆しています。内容の正確性は一次情報（仕様書・公式資料）とあわせてご確認ください。

# CBOR / COSE — バイナリアイデンティティデータの基盤

## 概要

**CBOR（Concise Binary Object Representation）** は、JSONと同等のデータモデルをバイナリ形式で表現するシリアライゼーション標準です（[RFC 8949](https://www.rfc-editor.org/rfc/rfc8949)）。そして **COSE（CBOR Object Signing and Encryption）** は、CBORデータへの署名・暗号化・認証機能を提供するセキュリティフレームワークです（[RFC 9052](https://www.rfc-editor.org/rfc/rfc9052)、[RFC 9053](https://www.rfc-editor.org/rfc/rfc9053)）。

デジタルアイデンティティの世界では、この2つの仕様がJSONベースのJWT/JWSと並ぶもう一つの重要な基盤を形成しています。特に **ISO/IEC 18013-5（mDL）** が採用して以降、モバイル運転免許証・EUDI Wallet・政府発行デジタルIDの文脈でCBOR/COSEへの関心が急速に高まっています。

| 仕様            | 役割                       | JSONアナログ   |
| --------------- | -------------------------- | -------------- |
| CBOR (RFC 8949) | データシリアライゼーション | JSON           |
| COSE (RFC 9052) | 署名・暗号化フレームワーク | JOSE (JWS/JWE) |
| CWT (RFC 8392)  | セキュリティトークン       | JWT            |

## 背景：なぜCBORが必要か

JSONはテキストベースであるため、IoTデバイスや制約的な通信環境（BLE、NFC）では次の問題が生じます。

- **メッセージサイズ**: フィールド名が毎回文字列として含まれるためバイト数が大きい
- **パース処理**: テキストのデコードはバイナリパースより計算コストが高い
- **型の曖昧さ**: 整数とフロートの区別、バイナリデータはBase64エンコードが必要

CBORはこれらの問題を解消するために設計されました。CBOR 1.0は2013年にRFC 7049として標準化され、2020年にRFC 8949として改訂されています。

設計原則は「JSONデータモデルをバイナリで表現しつつ、拡張性と実装の簡潔さを両立する」です。仕様書自体もコンパクトで、参照実装を数百行程度のコードで書けます。

## CBORの技術詳細

### メジャータイプ（Major Types）

CBORの各データ項目は **初期バイト（initial byte）** から始まります。上位3ビットがメジャータイプを示し、下位5ビットが追加情報（引数）を示します。

| Major Type | 値           | 説明                     |
| ---------- | ------------ | ------------------------ |
| 0          | `0b000xxxxx` | 符号なし整数（0〜2⁶⁴-1） |
| 1          | `0b001xxxxx` | 負の整数（-2⁶⁴〜-1）     |
| 2          | `0b010xxxxx` | バイト文字列             |
| 3          | `0b011xxxxx` | UTF-8テキスト文字列      |
| 4          | `0b100xxxxx` | 配列（データ項目の列）   |
| 5          | `0b101xxxxx` | マップ（キー・値ペア）   |
| 6          | `0b110xxxxx` | タグ付きデータ項目       |
| 7          | `0b111xxxxx` | 浮動小数点数・単純値     |

引数の長さは下位5ビットの値で決定されます。値が `0`〜`23` なら引数そのものが値（1バイト表現）、`24` なら続く1バイト、`25` なら続く2バイト、`26` なら続く4バイト、`27` なら続く8バイトが値となります。

### エンコーディング例

```
整数 0     : 0x00          (1バイト)
整数 1     : 0x01          (1バイト)
整数 23    : 0x17          (1バイト)
整数 24    : 0x18 0x18     (2バイト)
整数 255   : 0x18 0xff     (2バイト)
整数 256   : 0x19 0x01 0x00 (3バイト)

テキスト "a"    : 0x61 0x61       (2バイト)
テキスト "IETF" : 0x64 0x49 0x45 0x54 0x46 (5バイト)

真偽値 true  : 0xf5
真偽値 false : 0xf4
null         : 0xf6

配列 [1, 2, 3] : 0x83 0x01 0x02 0x03 (4バイト)
               （JSONの "1,2,3" は 7バイト + ブラケット）
```

テキスト文字列の場合、Major Type 3（`0b011xxxxx`）に続いてUTF-8バイト列が格納されます。JSONと異なり、フィールド名のクォーテーションや区切りコンマが不要なため、コンパクトになります。

### マップとキーの整数化

JSONではオブジェクトのキーは必ず文字列ですが、CBORのマップ（Major Type 5）はキーにどのCBOR型でも使えます。特に**整数キー**の利用はサイズ削減に大きく寄与します。

```
// JSON表現（41バイト）
{"iss": "example.com", "exp": 1700000000}

// CBOR（整数キー使用時、大幅に短縮可能）
{1: "example.com", 4: 1700000000}
```

CWT（後述）やOAuth 2.0の認可レスポンスのCBOR表現（[RFC 9449](https://www.rfc-editor.org/rfc/rfc9449) DPoP等）では、この整数キーが積極的に使われます。

### 決定的エンコーディング（Deterministic Encoding）

同じデータを常に同一バイト列にシリアライズする「決定的エンコーディング」は、署名検証において必須です。RFC 8949 はコア決定的エンコーディング（Core Deterministic Encoding Requirements）として以下を定めています。

1. 整数は最短表現を使う（余分なゼロパディング禁止）
2. マップのキーはバイト列の辞書順でソートする
3. 不定長エンコーディングは使用しない

この要件に準拠したサブセットを **dCBOR（Deterministic CBOR）** と呼ぶこともあります。ISO 18013-5 や COSE の署名対象データはこの決定的エンコーディングに従います。

### タグ（Tag）

Major Type 6はデータ項目に**タグ番号**を付与し、意味論的な解釈を追加します。

| タグ番号 | 意味                           |
| -------- | ------------------------------ |
| 0        | ISO 8601 日時テキスト          |
| 1        | 数値形式の日時（Unix時刻）     |
| 2        | 符号なし大整数（バイト文字列） |
| 3        | 符号付き大整数                 |
| 16       | COSE_Encrypt0                  |
| 17       | COSE_Mac0                      |
| 18       | COSE_Sign1                     |
| 96       | COSE_Encrypt                   |
| 97       | COSE_Mac                       |
| 98       | COSE_Sign                      |
| 61       | CBOR Sequence (RFC 8742)       |

タグは任意であり、タグなしでCOSEメッセージを使うことも許容されていますが、ISO 18013-5では明示的にタグ付きを要求しています。

## COSEの技術詳細

COSE（CBOR Object Signing and Encryption）は、JOSEを参考にしつつCBORネイティブに設計されたセキュリティフレームワークです。RFC 8152 として2017年に初版、RFC 9052 として2022年に改訂されました。

### メッセージ構造の概観

COSEは6種類のメッセージ構造を定義しています。

```
単一受信者・単一署名者用（コンパクト版）
  COSE_Sign1   : 署名
  COSE_Encrypt0: 暗号化
  COSE_Mac0    : MAC（メッセージ認証コード）

複数受信者・複数署名者用（拡張版）
  COSE_Sign    : 複数署名
  COSE_Encrypt : 複数受信者暗号化
  COSE_Mac     : 複数受信者MAC
```

実用上は `COSE_Sign1` が最も頻繁に使われます。ISO 18013-5 の MSO（Mobile Security Object）も `COSE_Sign1` で署名されます。

### COSE_Sign1 の構造

`COSE_Sign1` は4要素のCBOR配列です。

```
COSE_Sign1 = [
  protected   : bstr .cbor header_map,  // 署名対象保護ヘッダ（CBORエンコード済み）
  unprotected : header_map,              // 非保護ヘッダ
  payload     : bstr / nil,             // ペイロード（デタッチ可能）
  signature   : bstr                    // 署名値
]
```

**保護ヘッダ（protected header）** は署名計算の対象となるため、CBOR バイト列としてシリアライズされた後に署名されます（ネストされたシリアライゼーション）。**非保護ヘッダ（unprotected header）** は署名後に変更できる情報（中継者が付与するキーIDなど）を格納します。

### ヘッダパラメータ

| パラメータ   | 整数ラベル | 説明                       |
| ------------ | ---------- | -------------------------- |
| alg          | 1          | アルゴリズム識別子         |
| crit         | 2          | 必須理解パラメータ         |
| content type | 3          | ペイロードのメディアタイプ |
| kid          | 4          | 鍵識別子                   |
| IV           | 5          | 初期化ベクタ（暗号化用）   |
| x5chain      | 33         | X.509証明書チェーン        |

ヘッダパラメータも整数ラベルを使うことでサイズが小さくなります。

### 署名プロセス（Sig_Structure）

COSE_Sign1 の署名は、ペイロード単体に直接適用するのではなく、**Sig_Structure** と呼ばれる構造に対して行います。

```
Sig_Structure = [
  context    : "Signature1",          // 固定文字列
  body_protected : bstr,              // 保護ヘッダのバイト列
  external_aad   : bstr,             // 外部追加データ（省略時は空）
  payload        : bstr              // 署名対象ペイロード
]
```

この構造をCBORエンコードしたバイト列に対して秘密鍵で署名します。検証時も同じSig_Structureを再構築して検証します。`context` 文字列（"Signature1" / "Signature" など）が構造のタイプを明示し、誤用を防ぎます。

### COSEアルゴリズム（RFC 9053）

[RFC 9053](https://www.rfc-editor.org/rfc/rfc9053) はCOSEで使用するアルゴリズムの識別子を定義しています。

**署名アルゴリズム:**

| アルゴリズム | 識別子 | 説明                            |
| ------------ | ------ | ------------------------------- |
| ES256        | -7     | ECDSA with SHA-256（P-256曲線） |
| ES384        | -35    | ECDSA with SHA-384（P-384曲線） |
| ES512        | -36    | ECDSA with SHA-512（P-521曲線） |
| EdDSA        | -8     | Edwards曲線デジタル署名         |

**コンテンツ暗号化:**

| アルゴリズム      | 識別子 | 説明                   |
| ----------------- | ------ | ---------------------- |
| A128GCM           | 1      | AES-GCM 128bit鍵       |
| A192GCM           | 2      | AES-GCM 192bit鍵       |
| A256GCM           | 3      | AES-GCM 256bit鍵       |
| ChaCha20/Poly1305 | 24     | 高速ストリーム暗号+MAC |

ISO 18013-5 では ES256 が標準署名アルゴリズムとして規定されています。

## CWT — CBOR Web Token (RFC 8392)

[RFC 8392](https://www.rfc-editor.org/rfc/rfc8392) で定義される **CWT（CBOR Web Token）** は、JWTのCBOR版です。COSE（通常は COSE_Sign1）でラップされたCBORクレームセットとして表現されます。

### クレームの対応

JWTとCWTのクレームは設計思想が共通ですが、キーが文字列から整数に変わります。

| クレーム | JWT (文字列キー) | CWT (整数キー) |
| -------- | ---------------- | -------------- |
| 発行者   | `"iss"`          | `1`            |
| 対象者   | `"sub"`          | `2`            |
| 受信者   | `"aud"`          | `3`            |
| 有効期限 | `"exp"`          | `4`            |
| 開始日時 | `"nbf"`          | `5`            |
| 発行日時 | `"iat"`          | `6`            |
| Token ID | `"jti"`          | `7`            |

整数キーにより、クレームセット全体のサイズを大幅に削減できます。IoTデバイスや制約的な通信路でのトークン転送に適しています。

## デジタルアイデンティティでの利用

### ISO 18013-5 (mDL) — CBOR/COSEの最大ユースケース

[ISO/IEC 18013-5](https://www.iso.org/standard/69084.html) はモバイル運転免許証（mDL）の標準で、CBOR/COSEをコア技術として採用しています。

mDL の MSO（Mobile Security Object）は `COSE_Sign1` で構成されます。

```
IssuerAuth = COSE_Sign1(
  protected: {alg: ES256},
  unprotected: {x5chain: [証明書チェーン]},
  payload: MobileSecurityObject
)
```

MobileSecurityObject は発行局が各データ要素のダイジェスト値にES256で署名した構造です。CBOR を採用することで、BLE/NFCでの近接通信時にも小さなメッセージサイズを維持できます。

詳細は [ISO/IEC 18013-5 解説](/specs/iso18013-5) を参照してください。

### EUDI Wallet と mdoc

EU の EUDI Wallet は ISO 18013-5 の mdocフォーマットを政府発行ID全般（運転免許証、健康保険証、学歴証明など）に拡張して利用しています。ARF（Architecture Reference Framework）では mdoc（CBOR/COSE基盤）と SD-JWT VC の両方をサポートしています。

### OAuth 2.0 / OpenID Connect との接点

直接的な統合例として **DPoP（RFC 9449）** があります。DPoPはCBORを使いませんが、CBOR版DPoPも議論されています。また、**ISO/IEC TS 18013-7** ではOID4VPと組み合わせてmdocをオンライン提示するフローが定義されており、CBORエンコードされたDeviceResponseをOID4VPのvpTokenとして送信します。

## JWS/JWT との比較

| 観点               | JWT/JWS (JSON/JOSE)          | CWT/COSE (CBOR/COSE) |
| ------------------ | ---------------------------- | -------------------- |
| 表現形式           | Base64url + JSON             | バイナリ（CBOR）     |
| メッセージサイズ   | 大（テキストオーバーヘッド） | 小（バイナリ効率）   |
| 可読性             | デバッグしやすい             | バイナリツールが必要 |
| 通信路             | HTTPS前提                    | BLE/NFC/CoAP対応     |
| エコシステム成熟度 | 非常に高い                   | 発展途上（急成長中） |
| 標準化状況         | RFC多数、OpenID仕様群        | RFC完備、mDLで実績   |

**実装上の注意点**: JSONと異なりCBORはバイナリのため、直接の人手確認が困難です。デバッグには [CBOR Playground](https://cbor.me/) や [cbor-diag](https://github.com/nicowillis/cbor-diag) などのツールを使います。診断記法（Diagnostic Notation）と呼ばれるテキスト表現も仕様で定義されており、デバッグを支援します。

## 設計上のトレードオフと注意点

### スキーマ定義の欠如

CBORはJSONと同様に自己記述的（self-describing）ですが、スキーマ言語の標準化は進んでいません。CDDL（Concise Data Definition Language, [RFC 8610](https://www.rfc-editor.org/rfc/rfc8610)）がCBORのスキーマ言語として定義されていますが、JSON Schemaほど広く使われていないのが現状です。ISO 18013-5 はCDDLを使って仕様を記述しています。

### 決定的エンコーディングの実装注意

CBORは決定的エンコーディングが必須でない場面も多いため、ライブラリによっては同じデータを異なるバイト列に変換する場合があります。署名対象データは必ず「署名前と検証前で同一のCBORシリアライザを使う」か、「バイト列として保持する」アプローチを採る必要があります。ISO 18013-5 では IssuerAuth の payload をバイト列として保持することでこの問題を回避しています。

### マップキーの型統一

CBORのマップは整数キーと文字列キーを混在させることができますが、実装の複雑さを招きます。仕様設計では、どちらかに統一することが推奨されます。CWTは整数キーを採用し、COSE ヘッダも整数キーが基本です。

### タグ省略

COSE のタグ（18: COSE_Sign1 等）は省略可能ですが、タグなしで複数の COSE メッセージ型を受け付けるパーサーは判別が困難になります。アプリケーションプロトコルで型を事前に確定できる場合を除き、タグを付与することが推奨されます。

## 関連仕様

- [RFC 8949](https://www.rfc-editor.org/rfc/rfc8949) — CBOR
- [RFC 9052](https://www.rfc-editor.org/rfc/rfc9052) — COSE: 構造と処理
- [RFC 9053](https://www.rfc-editor.org/rfc/rfc9053) — COSE: 初期アルゴリズム
- [RFC 8392](https://www.rfc-editor.org/rfc/rfc8392) — CWT (CBOR Web Token)
- [RFC 8610](https://www.rfc-editor.org/rfc/rfc8610) — CDDL（CBORスキーマ言語）
- [RFC 8742](https://www.rfc-editor.org/rfc/rfc8742) — CBOR Sequences
- [ISO/IEC 18013-5](https://www.iso.org/standard/69084.html) — mDL
- [ISO/IEC TS 18013-7](https://www.iso.org/standard/82772.html) — mDL Online Presentation
