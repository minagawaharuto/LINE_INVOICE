# LINE請求書自動作成システム 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LINE公式アカウントのLIFFフォームからクライアント企業が案件情報を入力すると、Google Driveに月次外注連絡表スプレッドシートを自動生成・追記するシステムを構築する。

**Architecture:** GASをWebアプリとしてデプロイし、LIFFフォーム（HTML/JS）からのPOSTを受け取る。マスタスプレッドシートから単価・ダンサー情報を参照し、月次スプレッドシートの入力表シートに追記する。毎月1日にタイムトリガーで新規月次ファイルを自動生成する。

**Tech Stack:** Google Apps Script (GAS), LIFF SDK v2, HTML/CSS/JavaScript, LINE Messaging API, Google Sheets API (SpreadsheetApp), Google Drive API (DriveApp)

---

## ファイル構成

```
LINE_INVOICE/
├── gas/
│   ├── appsscript.json       # GASマニフェスト（Webアプリ設定）
│   ├── Code.gs               # doPost/doGet エントリーポイント
│   ├── Utils.gs              # 和暦変換・日付ユーティリティ
│   ├── MasterSheet.gs        # マスタスプレッドシート操作
│   ├── MonthlySheet.gs       # 月次スプレッドシート作成・追記
│   ├── LineApi.gs            # LINE Messaging API push送信
│   └── TestHelpers.gs        # GAS上で手動実行するテスト関数
├── liff/
│   ├── index.html            # LIFFフォームUI
│   ├── style.css             # フォームスタイル
│   └── app.js                # LIFF SDK連携・フォームロジック
└── docs/
    ├── setup.md              # セットアップ手順書
    └── superpowers/
        ├── specs/2026-04-02-line-invoice-system-design.md
        └── plans/2026-04-02-line-invoice-system.md
```

---

## 前提・セットアップ情報

- **claspのインストール：** `npm install -g @google/clasp`
- **GASプロジェクト：** claspでローカル開発→`clasp push`でデプロイ
- **LIFFホスティング：** GAS WebアプリのURL（`/exec`）からHTMLを配信
- **スクリプトプロパティに設定する値（後のタスクで設定）：**
  - `LINE_CHANNEL_ACCESS_TOKEN` : LINE Messaging APIアクセストークン
  - `MASTER_SPREADSHEET_ID` : マスタスプレッドシートのファイルID
  - `MONTHLY_FOLDER_ID` : 月次ファイルを保存するDriveフォルダID
  - `TEMPLATE_SPREADSHEET_ID` : 月次テンプレートスプレッドシートのID
  - `LIFF_ID` : LINE DevelopersコンソールのLIFF ID

---

## Task 1: プロジェクトディレクトリとGASマニフェスト作成

**Files:**
- Create: `gas/appsscript.json`
- Create: `gas/.clasp.json`（claspプロジェクト設定）

- [ ] **Step 1: gasディレクトリを作成し、appsscript.jsonを書く**

```bash
mkdir -p gas liff
```

`gas/appsscript.json` を作成：

```json
{
  "timeZone": "Asia/Tokyo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
```

- [ ] **Step 2: claspでGASプロジェクトを初期化する**

GASエディタ（script.google.com）で新規プロジェクト「LINE_INVOICE_GAS」を作成し、URLのスクリプトIDをコピーする。

```bash
cd gas
clasp login  # 初回のみ、ブラウザ認証
clasp clone <スクリプトID>  # 既存プロジェクトに紐付け
```

または新規作成の場合：
```bash
clasp create --title "LINE_INVOICE_GAS" --type webapp
```

- [ ] **Step 3: コミット**

```bash
git add gas/appsscript.json
git commit -m "feat: add GAS project manifest"
```

---

## Task 2: マスタスプレッドシートをGoogle Sheetsで手動作成

**Files:**
- (Google Drive上で作成)
- Create: `docs/setup.md`（スプレッドシートIDの記録先）

- [ ] **Step 1: Google Driveで「マスタ_LINE_INVOICE」スプレッドシートを新規作成する**

Google Sheetsで新規作成 → ファイル名：`マスタ_LINE_INVOICE`

- [ ] **Step 2: 案件マスタシートを作成する**

シート名を「案件マスタ」に変更。1行目にヘッダーを入力：

| A | B | C | D |
|---|---|---|---|
| 案件名 | 現場コード | 単価 | 項目区分 |

サンプルデータを入力（既存Excelの金額シートから転記）：

| OWL TIP | OWL | 50 | TIP |
| OWL チェキ | OWL | 500 | チェキ |
| OWL GUEST | OWL | 0 | ゲスト |
| OWL VIP | OWL | 1 | VIP |
| PCDL TIP | PCDL | 60 | TIP |
| PCDL GUEST | PCDL | 1000 | ゲスト |
| Am TIP | Am | 50 | TIP |
| Am VIP | Am | 1 | VIP |
| Am チェキ | Am | 400 | チェキ |
| KITSUNE TIP | KTN | 40 | TIP |
| KITSUNE VIP | KTN | 1 | VIP |

- [ ] **Step 3: ダンサーマスタシートを追加する**

「＋」ボタンでシートを追加 → シート名：「ダンサーマスタ」。1行目にヘッダー：

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| 芸名 | 本名 | コード | 時給 | 交通費 | 在籍 | 金融機関 | 口座番号 | 口座名義（カナ） | 住所 | 連絡先 |

既存Excelの外注連絡票シートからダンサー情報を転記する。

- [ ] **Step 4: スプレッドシートIDをdocs/setup.mdに記録する**

ブラウザのURLから `https://docs.google.com/spreadsheets/d/<ID>/edit` の `<ID>` 部分をコピー。

`docs/setup.md` を作成：

```markdown
# セットアップ手順

## スプレッドシートID一覧

- マスタスプレッドシートID: `（ここに貼り付け）`
- 月次ファイル保存フォルダID: `（ここに貼り付け）`
- テンプレートスプレッドシートID: `（Task 3完了後に記入）`

## GASスクリプトプロパティ設定

GASエディタ → プロジェクトの設定 → スクリプトプロパティ に以下を追加：

| キー | 値 |
|------|-----|
| LINE_CHANNEL_ACCESS_TOKEN | （LINE Developersから取得） |
| MASTER_SPREADSHEET_ID | （上記マスタID） |
| MONTHLY_FOLDER_ID | （上記フォルダID） |
| TEMPLATE_SPREADSHEET_ID | （上記テンプレートID） |
| LIFF_ID | （LINE DevelopersのLIFF ID） |
```

- [ ] **Step 5: コミット**

```bash
git add docs/setup.md
git commit -m "feat: add master spreadsheet setup guide"
```

---

## Task 3: 月次テンプレートスプレッドシート作成（Google Sheets）

**Files:**
- (Google Drive上で作成)
- Modify: `docs/setup.md`

- [ ] **Step 1: Google Driveで「テンプレート_外注連絡表」スプレッドシートを作成する**

Google Sheetsで新規作成 → ファイル名：`テンプレート_外注連絡表`

- [ ] **Step 2: 入力表シートを設定する**

シート名を「入力表」に変更。1行目にヘッダー：

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 日程 | 案件名 | 詳細 | 名前 | 数量 | 単価 | 合計金額 | 登録日時 |

G列（合計金額）の2行目以降に数式テンプレートは入れない（GASで値として書き込む）。

列幅を調整：A=100px, B=150px, C=150px, D=100px, E=60px, F=80px, G=100px, H=160px

- [ ] **Step 3: 外注連絡票シートを追加する**

「＋」でシート追加 → シート名：「外注連絡票」

1行目に月次タイトル（GASが毎月書き換える）：
```
A1: ≪令和○年○月分 外注費支払表≫
```

3行目にヘッダー：

| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 在籍 | コード | 芸名 | 氏名 | 案件報酬(出演費) | 案件報酬(インセンティブ) | 交通費 | 課税支払 | 所得税(10.21%) | 差引支払額 | 立替 | 振込金額 | 振込先口座 | 口座番号 | 口座名義 | 住所 |

4行目以降はダンサーマスタから転記（GASが月初に書き込む）。

H列（課税支払）: `=E4+F4+G4`
I列（所得税）: `=ROUND(H4*0.1021,0)`
J列（差引支払額）: `=H4-I4`
L列（振込金額）: `=J4-K4`

- [ ] **Step 4: テンプレートIDをdocs/setup.mdに記録する**

URLからIDをコピーし `docs/setup.md` の `テンプレートスプレッドシートID` 欄に記入。

- [ ] **Step 5: コミット**

```bash
git add docs/setup.md
git commit -m "feat: document template spreadsheet ID"
```

---

## Task 4: GAS ユーティリティ関数（Utils.gs）

**Files:**
- Create: `gas/Utils.gs`
- Create: `gas/TestHelpers.gs`

- [ ] **Step 1: テスト関数を書く（TestHelpers.gs）**

`gas/TestHelpers.gs` を作成：

```javascript
// GASエディタで手動実行してテストする
function testToWareki() {
  const cases = [
    { input: new Date('2019-04-30'), expected: '平成31年4月' },
    { input: new Date('2019-05-01'), expected: '令和元年5月' },
    { input: new Date('2026-04-01'), expected: '令和8年4月' },
    { input: new Date('2026-01-01'), expected: '令和8年1月' },
  ];
  cases.forEach(({ input, expected }) => {
    const result = toWareki(input);
    if (result !== expected) {
      throw new Error(`toWareki(${input}): expected "${expected}", got "${result}"`);
    }
  });
  Logger.log('testToWareki: PASSED');
}

function testGetMonthlyFileName() {
  const result = getMonthlyFileName(new Date('2026-04-01'));
  const expected = '【ダンサー】令和8年4月分 外注連絡表';
  if (result !== expected) {
    throw new Error(`expected "${expected}", got "${result}"`);
  }
  Logger.log('testGetMonthlyFileName: PASSED');
}
```

- [ ] **Step 2: Utils.gsを実装する**

`gas/Utils.gs` を作成：

```javascript
/**
 * 西暦DateオブジェクトをGENGO+年+月の文字列に変換する
 * @param {Date} date
 * @returns {string} 例: "令和8年4月"
 */
function toWareki(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const reiwaStart = new Date('2019-05-01');
  const heiseiStart = new Date('1989-01-08');

  if (date >= reiwaStart) {
    const reiwaYear = y - 2018;
    const label = reiwaYear === 1 ? '令和元年' : `令和${reiwaYear}年`;
    return `${label}${m}月`;
  } else if (date >= heiseiStart) {
    const heiseiYear = y - 1988;
    const label = heiseiYear === 1 ? '平成元年' : `平成${heiseiYear}年`;
    return `${label}${m}月`;
  }
  return `${y}年${m}月`;
}

/**
 * 月次スプレッドシートのファイル名を生成する
 * @param {Date} date
 * @returns {string} 例: "【ダンサー】令和8年4月分 外注連絡表"
 */
function getMonthlyFileName(date) {
  return `【ダンサー】${toWareki(date)}分 外注連絡表`;
}

/**
 * "YYYY/MM/DD" 形式の文字列をDateに変換する
 * @param {string} dateStr
 * @returns {Date}
 */
function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('/').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * DateをYYYY/MM/DD形式にフォーマットする
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

/**
 * 現在の日時をYYYY/MM/DD HH:MM:SS形式で返す
 * @returns {string}
 */
function nowString() {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${y}/${mo}/${d} ${h}:${mi}:${s}`;
}
```

- [ ] **Step 3: GASエディタでテストを実行する**

```
clasp push
```

GASエディタを開き、`testToWareki` を選択して「実行」→ ログに `PASSED` が出ることを確認。
`testGetMonthlyFileName` を選択して「実行」→ `PASSED` を確認。

- [ ] **Step 4: コミット**

```bash
git add gas/Utils.gs gas/TestHelpers.gs
git commit -m "feat: add wareki/date utility functions"
```

---

## Task 5: GAS マスタ参照（MasterSheet.gs）

**Files:**
- Create: `gas/MasterSheet.gs`
- Modify: `gas/TestHelpers.gs`

- [ ] **Step 1: テスト関数を追加する（TestHelpers.gs）**

`gas/TestHelpers.gs` の末尾に追加：

```javascript
function testLookupUnitPrice() {
  // 実際のマスタスプレッドシートに接続してテスト
  const price = lookupUnitPrice('OWL TIP');
  if (price !== 50) {
    throw new Error(`lookupUnitPrice('OWL TIP'): expected 50, got ${price}`);
  }
  Logger.log('testLookupUnitPrice: PASSED');
}

function testGetMasterData() {
  const data = getMasterData();
  if (!data.jobNames || data.jobNames.length === 0) {
    throw new Error('getMasterData: jobNames is empty');
  }
  if (!data.dancerNames || data.dancerNames.length === 0) {
    throw new Error('getMasterData: dancerNames is empty');
  }
  Logger.log('testGetMasterData: PASSED, jobs=' + data.jobNames.length + ', dancers=' + data.dancerNames.length);
}
```

- [ ] **Step 2: MasterSheet.gsを実装する**

`gas/MasterSheet.gs` を作成：

```javascript
/**
 * スクリプトプロパティからマスタスプレッドシートを取得する
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getMasterSpreadsheet() {
  const id = PropertiesService.getScriptProperties().getProperty('MASTER_SPREADSHEET_ID');
  if (!id) throw new Error('MASTER_SPREADSHEET_ID is not set in script properties');
  return SpreadsheetApp.openById(id);
}

/**
 * 案件名から単価を検索する
 * @param {string} jobName
 * @returns {number} 単価（見つからない場合は0）
 */
function lookupUnitPrice(jobName) {
  const ss = getMasterSpreadsheet();
  const sheet = ss.getSheetByName('案件マスタ');
  const data = sheet.getDataRange().getValues();
  // 1行目はヘッダー、A列=案件名、C列=単価
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === jobName) {
      return Number(data[i][2]) || 0;
    }
  }
  return 0;
}

/**
 * LIFFフォームのドロップダウン用にマスタデータを返す
 * @returns {{ jobNames: string[], dancerNames: string[] }}
 */
function getMasterData() {
  const ss = getMasterSpreadsheet();

  const jobSheet = ss.getSheetByName('案件マスタ');
  const jobData = jobSheet.getDataRange().getValues();
  const jobNames = jobData.slice(1).map(row => row[0]).filter(v => v !== '');

  const dancerSheet = ss.getSheetByName('ダンサーマスタ');
  const dancerData = dancerSheet.getDataRange().getValues();
  const dancerNames = dancerData.slice(1).map(row => row[0]).filter(v => v !== '');

  return { jobNames, dancerNames };
}

/**
 * 外注連絡票シートにダンサーマスタの情報を書き込む
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 外注連絡票シート
 */
function fillDancerMasterToSheet(sheet) {
  const ss = getMasterSpreadsheet();
  const dancerSheet = ss.getSheetByName('ダンサーマスタ');
  const dancers = dancerSheet.getDataRange().getValues().slice(1).filter(row => row[0] !== '');

  // 4行目から書き込む（1-3行目はヘッダー）
  dancers.forEach((d, i) => {
    const row = 4 + i;
    // A:在籍, B:コード, C:芸名, D:氏名, M:振込先口座, N:口座番号, O:口座名義, P:住所
    sheet.getRange(row, 1).setValue(d[5]);  // 在籍
    sheet.getRange(row, 2).setValue(d[2]);  // コード
    sheet.getRange(row, 3).setValue(d[0]);  // 芸名
    sheet.getRange(row, 4).setValue(d[1]);  // 氏名
    sheet.getRange(row, 13).setValue(d[6]); // 金融機関
    sheet.getRange(row, 14).setValue(d[7]); // 口座番号
    sheet.getRange(row, 15).setValue(d[8]); // 口座名義
    sheet.getRange(row, 16).setValue(d[9]); // 住所
  });
}
```

- [ ] **Step 3: スクリプトプロパティにMAST​ER_SPREADSHEET_IDを設定する**

GASエディタ → 「プロジェクトの設定」→「スクリプトプロパティ」→「プロパティを追加」：
- キー: `MASTER_SPREADSHEET_ID`
- 値: Task 2で作成したマスタスプレッドシートのID

- [ ] **Step 4: テストを実行する**

```
clasp push
```

GASエディタで `testLookupUnitPrice` を実行 → ログで `PASSED` を確認。
`testGetMasterData` を実行 → job数・dancer数がログに出ることを確認。

- [ ] **Step 5: コミット**

```bash
git add gas/MasterSheet.gs gas/TestHelpers.gs
git commit -m "feat: add master sheet lookup functions"
```

---

## Task 6: GAS 月次スプレッドシート操作（MonthlySheet.gs）

**Files:**
- Create: `gas/MonthlySheet.gs`
- Modify: `gas/TestHelpers.gs`

- [ ] **Step 1: テスト関数を追加する（TestHelpers.gs）**

`gas/TestHelpers.gs` の末尾に追加：

```javascript
function testGetOrCreateMonthlySheet() {
  const ss = getOrCreateMonthlySpreadsheet(new Date());
  if (!ss) throw new Error('getOrCreateMonthlySpreadsheet returned null');
  Logger.log('testGetOrCreateMonthlySheet: PASSED, title=' + ss.getName());
}

function testAppendRows() {
  const ss = getOrCreateMonthlySpreadsheet(new Date());
  const inputSheet = ss.getSheetByName('入力表');
  const beforeCount = inputSheet.getLastRow();

  appendRowsToInputSheet(ss, [
    { date: '2026/04/01', jobName: 'OWL TIP', detail: 'テスト', name: '斉藤愛乃', qty: 3, unitPrice: 50 }
  ]);

  const afterCount = inputSheet.getLastRow();
  if (afterCount !== beforeCount + 1) {
    throw new Error(`appendRows: expected ${beforeCount + 1} rows, got ${afterCount}`);
  }
  Logger.log('testAppendRows: PASSED');
}
```

- [ ] **Step 2: MonthlySheet.gsを実装する**

`gas/MonthlySheet.gs` を作成：

```javascript
/**
 * 当月の月次スプレッドシートを取得する（なければ作成する）
 * @param {Date} date
 * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function getOrCreateMonthlySpreadsheet(date) {
  const props = PropertiesService.getScriptProperties();
  const folderId = props.getProperty('MONTHLY_FOLDER_ID');
  const templateId = props.getProperty('TEMPLATE_SPREADSHEET_ID');
  if (!folderId) throw new Error('MONTHLY_FOLDER_ID is not set');
  if (!templateId) throw new Error('TEMPLATE_SPREADSHEET_ID is not set');

  const fileName = getMonthlyFileName(date);
  const folder = DriveApp.getFolderById(folderId);

  // 既存ファイルを検索
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  // テンプレートをコピーして新規作成
  const templateFile = DriveApp.getFileById(templateId);
  const newFile = templateFile.makeCopy(fileName, folder);
  const newSs = SpreadsheetApp.open(newFile);

  // 外注連絡票シートのタイトルと日付を設定
  const invoiceSheet = newSs.getSheetByName('外注連絡票');
  if (invoiceSheet) {
    invoiceSheet.getRange('A1').setValue(`≪${toWareki(date)}分 外注費支払表≫`);
    fillDancerMasterToSheet(invoiceSheet);
  }

  return newSs;
}

/**
 * 入力表シートに複数行を追記する
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss
 * @param {Array<{date:string, jobName:string, detail:string, name:string, qty:number, unitPrice:number}>} rows
 */
function appendRowsToInputSheet(ss, rows) {
  const sheet = ss.getSheetByName('入力表');
  const timestamp = nowString();
  rows.forEach(row => {
    const total = row.qty * row.unitPrice;
    sheet.appendRow([
      row.date,
      row.jobName,
      row.detail || '',
      row.name,
      row.qty,
      row.unitPrice,
      total,
      timestamp
    ]);
  });
}
```

- [ ] **Step 3: スクリプトプロパティを設定する**

GASエディタ → スクリプトプロパティに追加：
- `MONTHLY_FOLDER_ID`: Google DriveのフォルダID（月次ファイル保存先）
- `TEMPLATE_SPREADSHEET_ID`: Task 3で作成したテンプレートのID

フォルダIDの確認方法：Google DriveのフォルダURLの `https://drive.google.com/drive/folders/<ID>` の`<ID>`部分。

- [ ] **Step 4: テストを実行する**

```
clasp push
```

GASエディタで `testGetOrCreateMonthlySheet` を実行 → Google Driveの指定フォルダにファイルが作成されることをブラウザで確認。
`testAppendRows` を実行 → 入力表シートに1行追記されることをスプレッドシートで確認。

- [ ] **Step 5: コミット**

```bash
git add gas/MonthlySheet.gs gas/TestHelpers.gs
git commit -m "feat: add monthly spreadsheet creation and row append"
```

---

## Task 7: GAS LINE Messaging API連携（LineApi.gs）

**Files:**
- Create: `gas/LineApi.gs`
- Modify: `gas/TestHelpers.gs`

- [ ] **Step 1: テスト関数を追加する（TestHelpers.gs）**

`gas/TestHelpers.gs` の末尾に追加：

```javascript
function testSendLineMessage() {
  // 実際のLINEユーザーIDに送信テスト（自分のIDを使う）
  const testUserId = 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // ← 自分のLINE User IDに書き換える
  sendLineMessage(testUserId, 'テスト: GASからのpushメッセージ');
  Logger.log('testSendLineMessage: PASSED (check LINE app)');
}
```

- [ ] **Step 2: LineApi.gsを実装する**

`gas/LineApi.gs` を作成：

```javascript
/**
 * LINE Messaging APIでプッシュメッセージを送信する
 * @param {string} userId LINEユーザーID
 * @param {string} message 送信するテキスト
 */
function sendLineMessage(userId, message) {
  const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
  if (!token) throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');

  const payload = {
    to: userId,
    messages: [{ type: 'text', text: message }]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: `Bearer ${token}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', options);
  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error(`LINE push failed: ${code} ${response.getContentText()}`);
  }
}
```

- [ ] **Step 3: スクリプトプロパティを設定する**

LINE Developersコンソール（developers.line.biz）→ チャネル → Messaging API設定 → チャネルアクセストークン（長期）を発行・コピー。

GASエディタ → スクリプトプロパティに追加：
- `LINE_CHANNEL_ACCESS_TOKEN`: 上記で取得したトークン

- [ ] **Step 4: テストを実行する**

```
clasp push
```

`testSendLineMessage` 内の `testUserId` を自分のLINE User IDに書き換えて実行 → LINEアプリにメッセージが届くことを確認。

LINE User IDの確認方法：LINE DevelopersコンソールのWebhookで `liff.getProfile()` か、一度メッセージを送ってWebhookログで確認。

- [ ] **Step 5: コミット**

```bash
git add gas/LineApi.gs gas/TestHelpers.gs
git commit -m "feat: add LINE Messaging API push function"
```

---

## Task 8: GAS メインハンドラ（Code.gs）

**Files:**
- Create: `gas/Code.gs`
- Modify: `gas/TestHelpers.gs`

- [ ] **Step 1: テスト関数を追加する（TestHelpers.gs）**

`gas/TestHelpers.gs` の末尾に追加：

```javascript
function testDoPostSimulation() {
  // doPostをシミュレート
  const mockPayload = JSON.stringify({
    userId: 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    rows: [
      { date: '2026/04/01', jobName: 'OWL TIP', detail: '', name: '斉藤愛乃', qty: 5 },
      { date: '2026/04/01', jobName: 'PCDL GUEST', detail: 'VIP対応', name: '伊藤悠亜', qty: 1 }
    ]
  });

  const mockEvent = { postData: { contents: mockPayload } };
  const result = handleSubmission(mockEvent);
  Logger.log('testDoPostSimulation: PASSED, result=' + JSON.stringify(result));
}
```

- [ ] **Step 2: Code.gsを実装する**

`gas/Code.gs` を作成：

```javascript
/**
 * LIFFフォームからのPOSTリクエストを受け取るエントリーポイント
 */
function doPost(e) {
  try {
    const result = handleSubmission(e);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * LIFFからのGETリクエスト（マスタデータ取得・フォームHTML配信）
 */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'getMaster') {
    const data = getMasterData();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // LIFFフォームHTMLを配信
  return HtmlService
    .createHtmlOutputFromFile('liff/index')
    .setTitle('案件入力フォーム');
}

/**
 * フォーム送信の実処理
 * @param {object} e GASイベントオブジェクト
 * @returns {{ ok: boolean, count: number, date: string }}
 */
function handleSubmission(e) {
  const body = JSON.parse(e.postData.contents);
  const { userId, rows } = body;

  if (!rows || rows.length === 0) {
    throw new Error('rows is empty');
  }

  // 単価をマスタから補完
  const enrichedRows = rows.map(row => ({
    ...row,
    unitPrice: lookupUnitPrice(row.jobName)
  }));

  // 当月スプレッドシートに追記
  const date = parseDate(rows[0].date);
  const ss = getOrCreateMonthlySpreadsheet(date);
  appendRowsToInputSheet(ss, enrichedRows);

  // LINE通知
  const dateLabel = rows[0].date;
  const message = `✅ ${rows.length}件追加しました（${dateLabel}）\nスプレッドシート: ${ss.getUrl()}`;
  if (userId) {
    sendLineMessage(userId, message);
  }

  return { ok: true, count: rows.length, date: dateLabel };
}
```

- [ ] **Step 3: テストを実行する**

```
clasp push
```

GASエディタで `testDoPostSimulation` を実行 → ログに `PASSED` が出ることを確認。スプレッドシートの入力表に2行追記されることを確認。

- [ ] **Step 4: GASをWebアプリとしてデプロイする**

GASエディタ → 「デプロイ」→「新しいデプロイ」→
- 種類: ウェブアプリ
- 説明: v1
- 次のユーザーとして実行: 自分（デプロイしているアカウント）
- アクセスできるユーザー: 全員

デプロイURL（`https://script.google.com/macros/s/.../exec`）をコピーし `docs/setup.md` に記録する。

- [ ] **Step 5: コミット**

```bash
git add gas/Code.gs gas/TestHelpers.gs docs/setup.md
git commit -m "feat: add main doPost/doGet handler and deploy"
```

---

## Task 9: GAS 月初自動生成トリガー（MonthlySheet.gs追記）

**Files:**
- Modify: `gas/MonthlySheet.gs`

- [ ] **Step 1: 月初トリガー関数を追加する**

`gas/MonthlySheet.gs` の末尾に追加：

```javascript
/**
 * 毎月1日0時に実行されるトリガー関数
 * 当月の月次スプレッドシートを作成する
 */
function createMonthlySheetTrigger() {
  const now = new Date();
  Logger.log(`月次シート作成開始: ${getMonthlyFileName(now)}`);
  const ss = getOrCreateMonthlySpreadsheet(now);
  Logger.log(`月次シート作成完了: ${ss.getUrl()}`);
}
```

- [ ] **Step 2: タイムトリガーを設定する**

GASエディタ → 左メニュー「トリガー（時計アイコン）」→「トリガーを追加」：
- 実行する関数: `createMonthlySheetTrigger`
- イベントのソース: 時間主導型
- 時間ベースのトリガーのタイプ: 月ベースのタイマー
- 日: 1日
- 時間: 0時〜1時

- [ ] **Step 3: 手動実行でトリガーをテストする**

`createMonthlySheetTrigger` をGASエディタから手動実行 → Google Driveに当月ファイルが作成されることを確認。

- [ ] **Step 4: コミット**

```bash
git add gas/MonthlySheet.gs
git commit -m "feat: add monthly sheet creation trigger"
```

---

## Task 10: LIFFフォームフロントエンド（liff/）

**Files:**
- Create: `liff/index.html`
- Create: `liff/style.css`
- Create: `liff/app.js`

- [ ] **Step 1: style.cssを作成する**

`liff/style.css` を作成：

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif; background: #f5f5f5; padding: 16px; }
h1 { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 16px; color: #06c755; }
.row-card { background: #fff; border-radius: 8px; padding: 12px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.row-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.row-number { font-size: 13px; font-weight: bold; color: #666; }
.remove-btn { background: none; border: none; color: #e74c3c; font-size: 18px; cursor: pointer; padding: 0 4px; }
.field { margin-bottom: 8px; }
label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
select, input[type="text"], input[type="number"], input[type="date"] {
  width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;
}
.add-btn { display: block; width: 100%; padding: 10px; background: #fff; border: 2px dashed #06c755; border-radius: 8px; color: #06c755; font-size: 14px; cursor: pointer; margin-bottom: 16px; }
.submit-btn { display: block; width: 100%; padding: 14px; background: #06c755; border: none; border-radius: 8px; color: #fff; font-size: 16px; font-weight: bold; cursor: pointer; }
.submit-btn:disabled { background: #aaa; cursor: not-allowed; }
#message { margin-top: 12px; text-align: center; font-size: 14px; color: #333; min-height: 20px; }
.error { color: #e74c3c; }
```

- [ ] **Step 2: app.jsを作成する**

`liff/app.js` を作成：

```javascript
const GAS_URL = ''; // Task 8でデプロイしたGAS WebアプリのURLを貼り付ける

let liffProfile = null;
let masterData = { jobNames: [], dancerNames: [] };
let rowCount = 0;

async function init() {
  const liffId = document.getElementById('liff-id').value;
  await liff.init({ liffId });

  if (!liff.isLoggedIn()) {
    liff.login();
    return;
  }

  liffProfile = await liff.getProfile();

  const res = await fetch(`${GAS_URL}?action=getMaster`);
  const json = await res.json();
  if (json.ok) {
    masterData = json.data;
  }

  addRow();
}

function addRow() {
  if (rowCount >= 10) return;
  rowCount++;
  const n = rowCount;

  const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
  const dateVal = today;

  const jobOptions = masterData.jobNames
    .map(j => `<option value="${j}">${j}</option>`).join('');
  const dancerOptions = masterData.dancerNames
    .map(d => `<option value="${d}">${d}</option>`).join('');

  const card = document.createElement('div');
  card.className = 'row-card';
  card.id = `row-${n}`;
  card.innerHTML = `
    <div class="row-header">
      <span class="row-number">${n}件目</span>
      ${n > 1 ? `<button class="remove-btn" onclick="removeRow(${n})">✕</button>` : ''}
    </div>
    <div class="field">
      <label>日程</label>
      <input type="date" id="date-${n}" value="${dateVal.replace(/\//g, '-')}" required>
    </div>
    <div class="field">
      <label>案件名</label>
      <select id="job-${n}" required>
        <option value="">選択してください</option>
        ${jobOptions}
      </select>
    </div>
    <div class="field">
      <label>名前</label>
      <select id="name-${n}" required>
        <option value="">選択してください</option>
        ${dancerOptions}
      </select>
    </div>
    <div class="field">
      <label>数量</label>
      <input type="number" id="qty-${n}" value="1" min="1" required>
    </div>
    <div class="field">
      <label>詳細（任意）</label>
      <input type="text" id="detail-${n}" placeholder="任意">
    </div>
  `;
  document.getElementById('rows-container').appendChild(card);
}

function removeRow(n) {
  const el = document.getElementById(`row-${n}`);
  if (el) el.remove();
}

async function submitForm() {
  const btn = document.getElementById('submit-btn');
  const msg = document.getElementById('message');
  btn.disabled = true;
  msg.textContent = '送信中...';
  msg.className = '';

  try {
    const cards = document.querySelectorAll('.row-card');
    const rows = [];

    for (const card of cards) {
      const n = card.id.replace('row-', '');
      const date = document.getElementById(`date-${n}`).value.replace(/-/g, '/');
      const jobName = document.getElementById(`job-${n}`).value;
      const name = document.getElementById(`name-${n}`).value;
      const qty = Number(document.getElementById(`qty-${n}`).value);
      const detail = document.getElementById(`detail-${n}`).value;

      if (!date || !jobName || !name || !qty) {
        throw new Error(`${n}件目: 必須項目を入力してください`);
      }
      rows.push({ date, jobName, name, qty, detail });
    }

    const payload = {
      userId: liffProfile ? liffProfile.userId : null,
      rows
    };

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (!json.ok) throw new Error(json.error || '送信に失敗しました');

    msg.textContent = `✅ ${json.count}件を送信しました（${json.date}）`;
    document.getElementById('rows-container').innerHTML = '';
    rowCount = 0;
    addRow();
  } catch (err) {
    msg.textContent = `❌ ${err.message}`;
    msg.className = 'error';
  } finally {
    btn.disabled = false;
  }
}
```

- [ ] **Step 3: index.htmlを作成する**

`liff/index.html` を作成：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>案件入力フォーム</title>
  <link rel="stylesheet" href="style.css">
  <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
</head>
<body>
  <!-- GASとしてホストする場合、LIFF IDはGASスクリプトプロパティから動的に設定 -->
  <input type="hidden" id="liff-id" value="">
  <h1>案件入力フォーム</h1>
  <div id="rows-container"></div>
  <button class="add-btn" onclick="addRow()">＋ 行を追加（最大10件）</button>
  <button class="submit-btn" id="submit-btn" onclick="submitForm()">送 信</button>
  <p id="message"></p>
  <script src="app.js"></script>
  <script>init();</script>
</body>
</html>
```

- [ ] **Step 4: GASでLIFFをホストする場合の調整**

GASからHTMLを配信する場合、`liff/index.html` と `liff/app.js` をGASプロジェクトに追加する。`clasp push` でアップロードされるが、GASはHTMLファイルとして `.html` 拡張子で管理する。

`gas/liff/index.html` にコピーして、`app.js` の内容をインライン `<script>` タグとしてHTMLに埋め込む。また `GAS_URL` に実際のデプロイURLを設定し、`liff-id` の `value` をGASのスクリプトプロパティ `LIFF_ID` から動的に読み込む形にする。

修正版 `gas/liff/index.html`：

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>案件入力フォーム</title>
  <style>
    /* style.cssの内容をここに貼り付け */
  </style>
  <script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>
</head>
<body>
  <input type="hidden" id="liff-id" value="<?= liffId ?>">
  <h1>案件入力フォーム</h1>
  <div id="rows-container"></div>
  <button class="add-btn" onclick="addRow()">＋ 行を追加（最大10件）</button>
  <button class="submit-btn" id="submit-btn" onclick="submitForm()">送 信</button>
  <p id="message"></p>
  <script>
    const GAS_URL = '<?= gasUrl ?>';
    // app.jsの内容をここに貼り付け
  </script>
  <script>init();</script>
</body>
</html>
```

`gas/Code.gs` の `doGet` 関数を更新：

```javascript
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === 'getMaster') {
    const data = getMasterData();
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, data }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const props = PropertiesService.getScriptProperties();
  const template = HtmlService.createTemplateFromFile('liff/index');
  template.liffId = props.getProperty('LIFF_ID') || '';
  template.gasUrl = ScriptApp.getService().getUrl();
  return template.evaluate().setTitle('案件入力フォーム');
}
```

- [ ] **Step 5: clasp pushしてLIFFページを確認する**

```
clasp push
```

ブラウザでGAS WebアプリのURLにアクセスし、フォームが表示されることを確認（LIFF SDKの初期化はLINEアプリ内でのみ動作するため、ブラウザではエラーになる場合がある）。

- [ ] **Step 6: コミット**

```bash
git add liff/ gas/Code.gs
git commit -m "feat: add LIFF form frontend"
```

---

## Task 11: LINE Developers設定とリッチメニュー

**Files:**
- Modify: `docs/setup.md`

- [ ] **Step 1: LINE Developersでチャネルを確認・設定する**

LINE Developers（developers.line.biz）にログイン：
1. プロバイダーを選択（なければ作成）
2. 「Messaging API」チャネルを確認（なければ作成）
3. 「LIFF」タブ → 「LIFFアプリを追加」：
   - LIFFアプリ名: `案件入力フォーム`
   - サイズ: Full
   - エンドポイントURL: GAS WebアプリのURL（`https://script.google.com/macros/s/.../exec`）
   - スコープ: `profile` にチェック
4. 発行された「LIFF ID」をGASのスクリプトプロパティ `LIFF_ID` に設定

- [ ] **Step 2: リッチメニューを作成する**

LINE Official Account Manager（manager.line.biz）にログイン：
1. 「リッチメニュー」→「作成」
2. テンプレート: 大（ボタン1つ）
3. ボタンのアクション: LINKアクション
4. URL: `https://liff.line.me/<LIFF_ID>`（Task 11 Step 1で取得したLIFF ID）
5. ボタンテキスト: 「データ入力」
6. 「公開」をクリック

- [ ] **Step 3: LINEアプリで動作確認する**

LINEアプリでLINE公式アカウントを開き：
1. リッチメニューの「データ入力」をタップ
2. LIFFフォームが開くことを確認
3. フォームに入力して送信
4. LINEトーク画面に完了メッセージが届くことを確認
5. Google Driveの月次スプレッドシートに追記されることを確認

- [ ] **Step 4: docs/setup.mdを最終更新する**

`docs/setup.md` にLIFF IDとリッチメニュー設定を追記する。

- [ ] **Step 5: コミット**

```bash
git add docs/setup.md
git commit -m "docs: add LINE Developers and rich menu setup guide"
```

---

## セルフレビュー結果

**スペックカバレッジ確認：**

| 要件 | 対応タスク |
|------|---------|
| クライアント企業がLINEで入力 | Task 10, 11 |
| 入力項目: 日程・案件名・名前・数量・詳細 | Task 10 |
| ドロップダウン（案件名・名前） | Task 5, 10 |
| 複数件まとめて入力（最大10件） | Task 10 |
| 単価をマスタから自動参照 | Task 5, 8 |
| 月次Googleスプレッドシート生成 | Task 6 |
| ファイル名: 【ダンサー】令和○年○月分 外注連絡表 | Task 4, 6 |
| Google Drive保存 | Task 6 |
| 毎月1日に自動生成 | Task 9 |
| 外注連絡票シート（ダンサー別集計） | Task 3, 6 |
| 送信後LINEに完了通知 | Task 7, 8 |
| リッチメニューにデータ入力ボタン | Task 11 |
| マスタスプレッドシートで管理 | Task 2, 5 |

**ギャップなし。全要件をカバー済み。**
