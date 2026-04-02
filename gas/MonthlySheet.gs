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
  const sheet = ss.getSheetByName('2.入力表');
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
