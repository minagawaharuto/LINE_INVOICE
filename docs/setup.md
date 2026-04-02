# セットアップ手順

## 事前準備

- Googleアカウント（Google Drive / Google Sheetsへのアクセス）
- LINE Developersアカウント（developers.line.biz）
- LINE Official Account（LINE公式アカウント）
- Node.js（claspのインストールに必要）

---

## Step 1: claspのインストールとGASプロジェクト作成

```bash
npm install -g @google/clasp
clasp login   # ブラウザでGoogleアカウント認証

cd gas
clasp create --title "LINE_INVOICE_GAS" --type webapp
# 生成された .clasp.json の scriptId を確認する
```

---

## Step 2: マスタスプレッドシートの作成

1. Google Driveで「**マスタ_LINE_INVOICE**」という名前のスプレッドシートを新規作成
2. **案件マスタシート**（シート名: `案件マスタ`）を作成し、以下のヘッダーを1行目に入力：

   | A: 案件名 | B: 現場コード | C: 単価 | D: 項目区分 |

3. 既存Excelの金額シートからデータを転記

4. **ダンサーマスタシート**（シート名: `ダンサーマスタ`）を追加し、以下のヘッダーを1行目に入力：

   | A: 芸名 | B: 本名 | C: コード | D: 時給 | E: 交通費 | F: 在籍 | G: 金融機関 | H: 口座番号 | I: 口座名義(カナ) | J: 住所 | K: 連絡先 |

5. 既存Excelの外注連絡票シートからダンサー情報を転記

6. URLから**マスタスプレッドシートID**をコピー：
   `https://docs.google.com/spreadsheets/d/<ここがID>/edit`

---

## Step 3: 月次テンプレートスプレッドシートの作成

1. Google Driveで「**テンプレート_外注連絡表**」を新規作成
2. **入力表シート**（シート名: `2.入力表`）を作成し、1行目にヘッダー：

   | A: 日程 | B: 案件名 | C: 詳細 | D: 名前 | E: 数量 | F: 単価 | G: 合計金額 | H: 登録日時 |

3. **外注連絡票シート**（シート名: `外注連絡票`）を追加し、3行目にヘッダー：

   | A: 在籍 | B: コード | C: 芸名 | D: 氏名 | E: 案件報酬(出演費) | F: 案件報酬(インセンティブ) | G: 交通費 | H: 課税支払 | I: 所得税(10.21%) | J: 差引支払額 | K: 立替 | L: 振込金額 | M: 振込先口座 | N: 口座番号 | O: 口座名義 | P: 住所 |

4. H列（課税支払）4行目: `=E4+F4+G4`
5. I列（所得税）4行目: `=ROUND(H4*0.1021,0)`
6. J列（差引支払額）4行目: `=H4-I4`
7. L列（振込金額）4行目: `=J4-K4`
8. URLから**テンプレートスプレッドシートID**をコピー

---

## Step 4: 月次ファイル保存フォルダのID取得

1. Google Driveで「**LINE_INVOICE_月次**」フォルダを作成
2. フォルダを開いたURLからIDをコピー：
   `https://drive.google.com/drive/folders/<ここがID>`

---

## Step 5: GASスクリプトプロパティの設定

GASエディタ（script.google.com）→ プロジェクトの設定 → スクリプトプロパティ に以下を追加：

| キー | 値 |
|------|-----|
| `MASTER_SPREADSHEET_ID` | Step 2で取得したID |
| `MONTHLY_FOLDER_ID` | Step 4で取得したフォルダID |
| `TEMPLATE_SPREADSHEET_ID` | Step 3で取得したID |
| `LINE_CHANNEL_ACCESS_TOKEN` | Step 6で取得するトークン |
| `LIFF_ID` | Step 7で取得するLIFF ID |

---

## Step 6: LINE Messaging APIチャネルアクセストークンの取得

1. LINE Developers（developers.line.biz）にログイン
2. プロバイダー → Messaging APIチャネルを選択
3. 「Messaging API設定」タブ → チャネルアクセストークン（長期）→「発行」
4. 発行されたトークンをスクリプトプロパティ `LINE_CHANNEL_ACCESS_TOKEN` に設定

---

## Step 7: GASをWebアプリとしてデプロイ

```bash
cd gas
clasp push
```

GASエディタ → 「デプロイ」→「新しいデプロイ」：
- 種類: ウェブアプリ
- 次のユーザーとして実行: 自分（デプロイしているアカウント）
- アクセスできるユーザー: **全員**

デプロイURLをコピー（例: `https://script.google.com/macros/s/XXXXX/exec`）

---

## Step 8: LIFFアプリの登録

1. LINE Developers → Messaging APIチャネル → 「LIFF」タブ → 「LIFFアプリを追加」
2. 設定：
   - LIFFアプリ名: `案件入力フォーム`
   - サイズ: `Full`
   - エンドポイントURL: Step 7のGAS WebアプリURL
   - スコープ: `profile` にチェック
3. 発行された **LIFF ID** をスクリプトプロパティ `LIFF_ID` に設定

---

## Step 9: リッチメニューの設定

1. LINE Official Account Manager（manager.line.biz）にログイン
2. 「リッチメニュー」→「作成」
3. テンプレート: ボタン1つ（大）
4. ボタン設定：
   - アクション: リンク
   - URL: `https://liff.line.me/<LIFF_ID>`（Step 8で取得したLIFF ID）
   - テキスト: `データ入力`
5. 「公開」をクリック

---

## Step 10: 月初トリガーの設定

GASエディタ → 左メニュー「トリガー（時計アイコン）」→「トリガーを追加」：
- 実行する関数: `createMonthlySheetTrigger`
- イベントのソース: 時間主導型
- タイプ: 月ベースのタイマー
- 日: 1日
- 時間: 0時〜1時

---

## Step 11: 動作確認

1. LINEアプリで公式アカウントを開く
2. リッチメニューの「データ入力」をタップ
3. LIFFフォームが開くことを確認
4. テストデータを入力して「送信」
5. LINEトーク画面に「✅ ○件追加しました」が届くことを確認
6. Google Driveの月次スプレッドシートに追記されることを確認

---

## スプレッドシートID一覧（記入欄）

- マスタスプレッドシートID: `（ここに貼り付け）`
- 月次ファイル保存フォルダID: `（ここに貼り付け）`
- テンプレートスプレッドシートID: `（ここに貼り付け）`
- GAS WebアプリURL: `（ここに貼り付け）`
- LIFF ID: `（ここに貼り付け）`
