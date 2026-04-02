import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  UnderlineType
} from 'docx';
import fs from 'fs';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const thickBorder = { style: BorderStyle.SINGLE, size: 4, color: '1A56A0' };
const thickBorders = { top: thickBorder, bottom: thickBorder, left: thickBorder, right: thickBorder };

const TABLE_WIDTH = 9360; // A4 with 25mm margins

function makeHeader(title, sub) {
  return new Header({
    children: [
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '1A56A0' } },
        children: [
          new TextRun({ text: title, font: 'Arial', size: 20, color: '1A56A0', bold: true }),
          new TextRun({ text: '　' + (sub || ''), font: 'Meiryo UI', size: 18, color: '888888' }),
        ],
      }),
    ],
  });
}

function makeFooter() {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } },
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'ページ ', font: 'Meiryo UI', size: 18, color: '888888' }),
          new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '888888' }),
          new TextRun({ text: ' / ', font: 'Arial', size: 18, color: '888888' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Arial', size: 18, color: '888888' }),
        ],
      }),
    ],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1A56A0' } },
    children: [new TextRun({ text, font: 'Meiryo UI', size: 32, bold: true, color: '1A56A0' })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    children: [
      new TextRun({ text: '■ ', font: 'Arial', size: 26, bold: true, color: '2E75B6' }),
      new TextRun({ text, font: 'Meiryo UI', size: 26, bold: true, color: '2E75B6' }),
    ],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, font: 'Meiryo UI', size: 24, bold: true, color: '333333' })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Meiryo UI', size: 22, ...opts })],
  });
}

function bullet(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360, hanging: 200 },
    children: [
      new TextRun({ text: '・', font: 'Meiryo UI', size: 22, color: '1A56A0' }),
      new TextRun({ text, font: 'Meiryo UI', size: 22 }),
    ],
  });
}

function cell(text, isHeader = false, width = 2000) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: isHeader ? { fill: 'D6E4F7', type: ShadingType.CLEAR } : { fill: 'FFFFFF', type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 160, right: 160 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Meiryo UI', size: 20, bold: isHeader })],
    })],
  });
}

function twoColTable(rows, col1Width = 3000, col2Width = 6360) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: [col1Width, col2Width],
    rows: rows.map(([a, b]) => new TableRow({
      children: [cell(a, true, col1Width), cell(b, false, col2Width)],
    })),
  });
}

function threeColTable(headers, rows, widths = [2400, 4000, 2960]) {
  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({
        children: headers.map((h, i) => cell(h, true, widths[i])),
      }),
      ...rows.map(r => new TableRow({
        children: r.map((v, i) => cell(v, false, widths[i])),
      })),
    ],
  });
}

function space(n = 1) {
  return new Paragraph({ spacing: { before: 80 * n, after: 0 }, children: [new TextRun('')] });
}

// ========================================================
// 要件定義書
// ========================================================
function createRequirementsDoc() {
  const coverPage = [
    space(8),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [new TextRun({ text: 'LINE請求書自動作成システム', font: 'Meiryo UI', size: 52, bold: true, color: '1A56A0' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 480 },
      children: [new TextRun({ text: '要件定義書', font: 'Meiryo UI', size: 48, bold: true, color: '333333' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: 'バージョン：1.0', font: 'Meiryo UI', size: 24, color: '666666' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: '作成日：2026年4月2日', font: 'Meiryo UI', size: 24, color: '666666' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: 'ステータス：承認済み', font: 'Meiryo UI', size: 24, color: '666666' })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const overviewSection = [
    h1('1. 目的・背景'),
    space(),
    h2('1.1 背景'),
    p('ダンサー派遣会社（以下、「派遣会社」）は、クライアント企業からダンサーを発注された際に、毎月の勤務・案件情報を手動でExcelスプレッドシートに入力し、外注費支払表を作成していた。この作業は手作業による入力ミスや集計漏れのリスクがあり、業務効率化が求められていた。'),
    space(),
    h2('1.2 目的'),
    p('本システムは以下の目的を達成するために構築する。'),
    bullet('クライアント企業がLINE公式アカウントを通じてダンサーの案件情報を入力できる仕組みを提供する'),
    bullet('入力された情報をGoogle Drive上の月次スプレッドシートに自動的に追記する'),
    bullet('毎月1日に当月分の外注連絡表スプレッドシートを自動生成する'),
    bullet('手作業による入力ミスや集計漏れを排除し、業務効率を向上させる'),
    space(),
    h2('1.3 適用範囲'),
    twoColTable([
      ['対象業務', 'ダンサー外注費の月次集計・支払表作成業務'],
      ['利用者', 'クライアント企業（発注側）、派遣会社管理者'],
      ['対象期間', '2026年4月以降（継続運用）'],
    ]),
    space(2),
  ];

  const usersSection = [
    h1('2. 利用者・ステークホルダー'),
    space(),
    threeColTable(
      ['利用者', '役割', '利用方法'],
      [
        ['クライアント企業', 'ダンサーを発注する企業', 'LINE公式アカウントのLIFFフォームから案件情報を入力'],
        ['派遣会社管理者', '支払処理・管理を行う担当者', 'Google Sheetsで月次スプレッドシートを確認・修正'],
        ['ダンサー', '外注ダンサー（直接は利用しない）', '（間接対象：支払情報の受取人）'],
      ],
      [2800, 3200, 3360]
    ),
    space(2),
  ];

  const functionalSection = [
    h1('3. 機能要件'),
    space(),
    h2('3.1 案件情報入力機能（LIFF フォーム）'),
    h3('3.1.1 フォーム表示'),
    bullet('LINE公式アカウントのトーク画面下部のリッチメニューに「データ入力」ボタンを常時表示する'),
    bullet('「データ入力」ボタンをタップすると、LINE内ブラウザ（LIFF）でWebフォームが開く'),
    bullet('フォームはLINEの認証を経て開くため、送信者のLINE User IDを自動取得する'),
    space(),
    h3('3.1.2 入力フィールド'),
    threeColTable(
      ['フィールド名', '入力方式', '必須/任意'],
      [
        ['日程', 'カレンダーピッカー（デフォルト：本日）', '必須'],
        ['案件名', 'ドロップダウン（マスタから動的取得）', '必須'],
        ['名前（ダンサー芸名）', 'ドロップダウン（マスタから動的取得）', '必須'],
        ['数量', '数値入力（最小値：1）', '必須'],
        ['詳細', 'テキスト入力', '任意'],
      ],
      [2200, 4200, 2960]
    ),
    space(),
    h3('3.1.3 複数件入力'),
    bullet('1回の送信で最大10件の案件情報をまとめて入力できる'),
    bullet('「行を追加」ボタンで入力行を追加できる'),
    bullet('追加した行は「✕」ボタンで削除できる'),
    space(),
    h3('3.1.4 送信後の動作'),
    bullet('送信完了後、LINEのトーク画面に完了通知メッセージが届く'),
    bullet('完了通知には追加件数・日程・スプレッドシートのURLが含まれる'),
    bullet('フォームはリセットされ、再入力可能な状態になる'),
    space(2),
    h2('3.2 マスタデータ管理機能'),
    h3('3.2.1 案件マスタ'),
    bullet('案件名・現場コード・単価・項目区分をGoogleスプレッドシートで管理する'),
    bullet('管理者がスプレッドシートを直接編集することでマスタを更新できる'),
    bullet('LIFFフォームの「案件名」ドロップダウンは案件マスタから動的に生成される'),
    space(),
    h3('3.2.2 ダンサーマスタ'),
    bullet('ダンサーの芸名・本名・コード・時給・交通費・在籍・銀行口座情報・住所・連絡先をGoogleスプレッドシートで管理する'),
    bullet('LIFFフォームの「名前」ドロップダウンはダンサーマスタから動的に生成される'),
    bullet('外注連絡票の口座情報・住所はダンサーマスタから自動参照される'),
    space(2),
    h2('3.3 月次スプレッドシート自動生成機能'),
    bullet('毎月1日0時〜1時の間にGASのタイムトリガーが実行される'),
    bullet('テンプレートスプレッドシートを複製し、ファイル名を「【ダンサー】令和○年○月分 外注連絡表」とする'),
    bullet('ファイル名の年号は和暦（令和）で自動計算される'),
    bullet('生成されたファイルは指定のGoogle Driveフォルダに保存される'),
    bullet('外注連絡票シートのタイトル行に当月の和暦表示を自動設定する'),
    bullet('ダンサーマスタから全ダンサーの情報（口座・住所等）を外注連絡票シートに自動転記する'),
    space(2),
    h2('3.4 データ追記機能'),
    bullet('LIFFフォームからの送信を受け取り、当月の月次スプレッドシートが存在しない場合は自動生成する'),
    bullet('入力された案件情報（日程・案件名・詳細・名前・数量）を入力表シートの末尾に追記する'),
    bullet('案件名に対応する単価をマスタから自動参照し、合計金額（数量×単価）を算出して記録する'),
    bullet('追記時に登録日時をタイムスタンプとして自動記録する'),
    space(2),
    h2('3.5 LINE通知機能'),
    bullet('フォーム送信完了時に送信者のLINEアカウントへプッシュメッセージを送信する'),
    bullet('通知内容：追加件数・日程・当月スプレッドシートのURL'),
    bullet('通知にはLINE Messaging API（プッシュメッセージ）を使用する'),
    space(2),
  ];

  const nonFunctionalSection = [
    h1('4. 非機能要件'),
    space(),
    h2('4.1 パフォーマンス'),
    threeColTable(
      ['項目', '要件', '備考'],
      [
        ['フォーム応答時間', '3秒以内', 'マスタデータ取得含む'],
        ['送信処理時間', '5秒以内', 'スプレッドシート追記+LINE通知'],
        ['月次シート生成時間', '30秒以内', 'タイムトリガー実行時'],
        ['同時利用者数', '10名以下を想定', 'GAS実行制限内で対応可能'],
      ],
      [2400, 3600, 3360]
    ),
    space(2),
    h2('4.2 可用性'),
    bullet('Google Apps ScriptはGoogleのインフラで動作するため、99.9%以上の稼働率を期待できる'),
    bullet('GASの1日の実行時間上限（90分/日）を超えないよう運用する'),
    bullet('月初のシート生成失敗時は管理者が手動で実行できる仕組みを提供する'),
    space(2),
    h2('4.3 セキュリティ'),
    bullet('LIFFフォームはLINEログイン済みユーザーのみ利用可能'),
    bullet('GAS WebアプリのURLはLINE Developers登録URLのみに公開し、外部漏洩を防ぐ'),
    bullet('LINE Channel Access TokenはGASスクリプトプロパティで管理し、コードに直書きしない'),
    bullet('スプレッドシートIDはGASスクリプトプロパティで管理する'),
    bullet('ダンサーの個人情報（口座情報・住所）は派遣会社のGoogleアカウントで管理するGoogleスプレッドシートにのみ保存する'),
    space(2),
    h2('4.4 保守性'),
    bullet('マスタデータ（案件マスタ・ダンサーマスタ）はGoogleスプレッドシートで管理し、エンジニア不要で更新可能'),
    bullet('月次テンプレートはGoogleスプレッドシートで管理し、フォーマット変更に対応できる'),
    bullet('GASコードはGitHubで管理し、変更履歴を追跡できる'),
    space(2),
  ];

  const constraintsSection = [
    h1('5. 制約条件'),
    space(),
    threeColTable(
      ['区分', '制約内容', '対策'],
      [
        ['LINE API', '月1,000通まで無料（プッシュメッセージ）', '月1,000件を超える場合は有料プランを検討'],
        ['GAS', '1実行あたり最大6分', '通常の追記処理では問題なし'],
        ['GAS', 'Webアプリは再デプロイでURLが変わる場合あり', '「既存のデプロイを管理」で同一URL維持'],
        ['LIFF', 'LINEアプリ内でのみ動作', 'PCブラウザでのデモにはLIFF URLアクセス不可'],
        ['GAS', 'GASからGoogle Driveへのアクセスは同一Googleアカウント内のみ', '管理用アカウントを統一して使用する'],
      ],
      [1600, 4500, 3260]
    ),
    space(2),
  ];

  const glossarySection = [
    h1('6. 用語定義'),
    space(),
    twoColTable([
      ['LIFF', 'LINE Front-end Framework。LINEアプリ内でWebアプリを動作させる仕組み'],
      ['GAS', 'Google Apps Script。Googleのサービスを操作・自動化するスクリプト環境'],
      ['外注連絡票', 'ダンサーへの月次支払いをまとめた一覧表。出演費・交通費・所得税・振込金額等を含む'],
      ['案件マスタ', '案件名・単価・現場コードを管理するマスタスプレッドシート'],
      ['ダンサーマスタ', 'ダンサーの芸名・口座情報・交通費等を管理するマスタスプレッドシート'],
      ['リッチメニュー', 'LINEトーク画面下部に常時表示されるメニューUI'],
      ['プッシュメッセージ', 'LINE Messaging APIを使って任意のタイミングでユーザーに送信するメッセージ'],
      ['和暦', '日本の元号を使った年号表記（例：令和8年）'],
    ]),
    space(2),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Meiryo UI', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Meiryo UI', color: '1A56A0' },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Meiryo UI', color: '2E75B6' },
          paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Meiryo UI', color: '333333' },
          paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 },
        },
      },
      headers: { default: makeHeader('LINE請求書自動作成システム', '要件定義書 v1.0') },
      footers: { default: makeFooter() },
      children: [
        ...coverPage,
        ...overviewSection,
        ...usersSection,
        ...functionalSection,
        ...nonFunctionalSection,
        ...constraintsSection,
        ...glossarySection,
      ],
    }],
  });

  return doc;
}

// ========================================================
// システム概要書
// ========================================================
function createSystemOverviewDoc() {
  const coverPage = [
    space(8),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [new TextRun({ text: 'LINE請求書自動作成システム', font: 'Meiryo UI', size: 52, bold: true, color: '1A56A0' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 480 },
      children: [new TextRun({ text: 'システム概要書', font: 'Meiryo UI', size: 48, bold: true, color: '333333' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: 'バージョン：1.0', font: 'Meiryo UI', size: 24, color: '666666' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: '作成日：2026年4月2日', font: 'Meiryo UI', size: 24, color: '666666' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: 'ステータス：承認済み', font: 'Meiryo UI', size: 24, color: '666666' })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const overviewSection = [
    h1('1. システム概要'),
    space(),
    p('本システムは、ダンサー派遣会社がクライアント企業からLINE公式アカウントを通じて案件・勤務情報を受け取り、Google Drive上に月次外注連絡表を自動生成・管理するシステムである。'),
    space(),
    twoColTable([
      ['システム名', 'LINE請求書自動作成システム'],
      ['目的', 'ダンサー外注費の月次集計業務の自動化'],
      ['利用者', 'クライアント企業（入力）、派遣会社管理者（確認・修正）'],
      ['稼働環境', 'Google Cloud（GAS）・LINE Platform・Google Drive'],
      ['開発・管理', 'Google Apps Script（GAS）＋ LIFF（HTML/JS）'],
    ]),
    space(2),
  ];

  const archSection = [
    h1('2. システム構成'),
    space(),
    h2('2.1 全体構成'),
    p('本システムは以下の3層で構成される。'),
    space(),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [2000, 3500, 3860],
      rows: [
        new TableRow({ children: [cell('層', true, 2000), cell('コンポーネント', true, 3500), cell('説明', true, 3860)] }),
        new TableRow({ children: [cell('フロントエンド', false, 2000), cell('LIFFフォーム（HTML/CSS/JS）', false, 3500), cell('LINE内ブラウザで動作するWebフォーム。案件情報の入力UI', false, 3860)] }),
        new TableRow({ children: [cell('バックエンド', false, 2000), cell('Google Apps Script（GAS）', false, 3500), cell('Webアプリとしてデプロイ。データ処理・スプレッドシート操作・LINE通知を担当', false, 3860)] }),
        new TableRow({ children: [cell('データストア', false, 2000), cell('Google Sheets / Google Drive', false, 3500), cell('マスタデータ・月次スプレッドシートを管理', false, 3860)] }),
      ],
    }),
    space(2),
    h2('2.2 コンポーネント構成'),
    threeColTable(
      ['コンポーネント', 'ファイル', '役割'],
      [
        ['エントリーポイント', 'Code.gs', 'doPost/doGet。LIFFからのリクエスト受信・振り分け'],
        ['ユーティリティ', 'Utils.gs', '和暦変換・日付フォーマット・タイムスタンプ生成'],
        ['マスタ参照', 'MasterSheet.gs', '案件マスタから単価取得・ダンサーマスタ操作'],
        ['月次シート管理', 'MonthlySheet.gs', '月次スプレッドシート作成・行追記・月初トリガー'],
        ['LINE連携', 'LineApi.gs', 'LINE Messaging API push送信'],
        ['テスト関数', 'TestHelpers.gs', 'GASエディタで手動実行するテスト関数群'],
        ['LIFFフォーム', 'gas/liff/index.html', 'フォームUI・LIFF SDK連携・送信処理'],
      ],
      [2200, 2800, 4360]
    ),
    space(2),
  ];

  const techSection = [
    h1('3. 技術スタック'),
    space(),
    threeColTable(
      ['区分', '技術・サービス', 'バージョン/プラン'],
      [
        ['フロントエンド', 'LIFF SDK', 'v2（CDN配信）'],
        ['フロントエンド', 'HTML / CSS / JavaScript', 'ES2020+'],
        ['バックエンド', 'Google Apps Script', 'V8ランタイム'],
        ['データストア', 'Google Sheets', 'Google Workspace'],
        ['ストレージ', 'Google Drive', 'Google Workspace'],
        ['通知', 'LINE Messaging API', 'プッシュメッセージ（月1,000通無料）'],
        ['フォームホスティング', 'GAS Webアプリ（doGet）', '-'],
        ['開発ツール', 'clasp', 'v2.x（ローカル開発・Push）'],
        ['バージョン管理', 'Git / GitHub', '-'],
      ],
      [2000, 4000, 3360]
    ),
    space(2),
  ];

  const dataFlowSection = [
    h1('4. データフロー'),
    space(),
    h2('4.1 案件情報入力フロー'),
    space(),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [800, 8560],
      rows: [
        new TableRow({ children: [cell('Step', true, 800), cell('処理内容', true, 8560)] }),
        new TableRow({ children: [cell('①', false, 800), cell('クライアント企業がLINEのリッチメニュー「データ入力」をタップ', false, 8560)] }),
        new TableRow({ children: [cell('②', false, 800), cell('LIFFが起動し、LIFF SDKがLINEログイン認証を行う（liff.init → liff.getProfile）', false, 8560)] }),
        new TableRow({ children: [cell('③', false, 800), cell('GAS（doGet?action=getMaster）から案件名・ダンサー名のリストを取得し、ドロップダウンを生成', false, 8560)] }),
        new TableRow({ children: [cell('④', false, 800), cell('クライアントがフォームに入力（日程・案件名・名前・数量・詳細）し「送信」をタップ', false, 8560)] }),
        new TableRow({ children: [cell('⑤', false, 800), cell('LIFFがGAS WebアプリへHTTPS POSTで送信（userId + rows配列）', false, 8560)] }),
        new TableRow({ children: [cell('⑥', false, 800), cell('GASが案件マスタから単価を参照し、合計金額（数量×単価）を計算', false, 8560)] }),
        new TableRow({ children: [cell('⑦', false, 800), cell('GASが当月の月次スプレッドシートを取得（存在しない場合はテンプレートからコピーして作成）', false, 8560)] }),
        new TableRow({ children: [cell('⑧', false, 800), cell('GASが入力表シートの末尾に行を追記（日程・案件名・詳細・名前・数量・単価・合計・登録日時）', false, 8560)] }),
        new TableRow({ children: [cell('⑨', false, 800), cell('GASがLINE Messaging API（push）で送信者に完了通知を送信', false, 8560)] }),
        new TableRow({ children: [cell('⑩', false, 800), cell('LINEトーク画面に「✅ ○件追加しました（日付）」とスプレッドシートURLが届く', false, 8560)] }),
      ],
    }),
    space(2),
    h2('4.2 月次スプレッドシート自動生成フロー'),
    space(),
    new Table({
      width: { size: TABLE_WIDTH, type: WidthType.DXA },
      columnWidths: [800, 8560],
      rows: [
        new TableRow({ children: [cell('Step', true, 800), cell('処理内容', true, 8560)] }),
        new TableRow({ children: [cell('①', false, 800), cell('毎月1日0時〜1時にGASのタイムトリガーがcreateMonthlySheetTrigger()を実行', false, 8560)] }),
        new TableRow({ children: [cell('②', false, 800), cell('toWareki()で当月の和暦ファイル名を生成（例：「【ダンサー】令和8年4月分 外注連絡表」）', false, 8560)] }),
        new TableRow({ children: [cell('③', false, 800), cell('Google DriveのテンプレートファイルをコピーしてDriveフォルダに保存', false, 8560)] }),
        new TableRow({ children: [cell('④', false, 800), cell('外注連絡票シートのA1セルに当月の和暦タイトルを設定', false, 8560)] }),
        new TableRow({ children: [cell('⑤', false, 800), cell('ダンサーマスタから全ダンサーの情報（在籍・コード・芸名・氏名・口座情報・住所）を外注連絡票シートに転記', false, 8560)] }),
      ],
    }),
    space(2),
  ];

  const sheetSection = [
    h1('5. スプレッドシート構造'),
    space(),
    h2('5.1 月次スプレッドシート'),
    h3('入力表シート'),
    threeColTable(
      ['列', '項目名', '説明'],
      [
        ['A', '日程', 'YYYY/MM/DD形式。LIFFフォームから入力'],
        ['B', '案件名', '案件マスタの案件名'],
        ['C', '詳細', '任意のメモ'],
        ['D', '名前', 'ダンサー芸名'],
        ['E', '数量', '数値'],
        ['F', '単価', '案件マスタから自動参照した金額'],
        ['G', '合計金額', '数量×単価（GASで計算して書き込み）'],
        ['H', '登録日時', 'GASが自動記録するタイムスタンプ'],
      ],
      [800, 2200, 6360]
    ),
    space(),
    h3('外注連絡票シート'),
    threeColTable(
      ['列', '項目名', '説明'],
      [
        ['A', '在籍', 'ダンサーマスタ参照（例：THP Dancers）'],
        ['B', 'コード', 'ダンサーコード'],
        ['C', '芸名', 'ダンサー芸名'],
        ['D', '氏名', 'ダンサー本名'],
        ['E', '案件報酬（出演費）', '入力表から集計'],
        ['F', '案件報酬（インセンティブ）', '入力表から集計'],
        ['G', '交通費', 'ダンサーマスタ×出勤日数'],
        ['H', '課税支払', '=E+F+G'],
        ['I', '所得税（10.21%）', '=ROUND(H×0.1021, 0)'],
        ['J', '差引支払額', '=H-I'],
        ['K', '立替', '手動入力'],
        ['L', '振込金額', '=J-K'],
        ['M〜P', '振込先口座情報・住所', 'ダンサーマスタ参照'],
      ],
      [800, 2800, 5760]
    ),
    space(2),
    h2('5.2 マスタスプレッドシート'),
    h3('案件マスタシート'),
    threeColTable(
      ['列', '項目名', '説明'],
      [
        ['A', '案件名', 'LIFFドロップダウンの選択肢'],
        ['B', '現場コード', '現場の略称コード'],
        ['C', '単価', '1件あたりの単価（円）'],
        ['D', '項目区分', 'TIP / チェキ / ゲスト / VIP 等'],
      ],
      [800, 2200, 6360]
    ),
    space(),
    h3('ダンサーマスタシート'),
    threeColTable(
      ['列', '項目名', '説明'],
      [
        ['A', '芸名', 'LIFFドロップダウンの選択肢'],
        ['B', '本名', '支払い名義'],
        ['C', 'コード', 'ダンサー管理コード'],
        ['D', '時給', '基本時給（円）'],
        ['E', '交通費', '1出勤あたり交通費（円）'],
        ['F', '在籍', '所属グループ名'],
        ['G', '金融機関', '銀行名・支店名'],
        ['H', '口座番号', '振込先口座番号'],
        ['I', '口座名義（カナ）', '振込先名義'],
        ['J', '住所', '住所（〒含む）'],
        ['K', '連絡先', '電話番号'],
      ],
      [800, 2200, 6360]
    ),
    space(2),
  ];

  const externalSection = [
    h1('6. 外部連携'),
    space(),
    threeColTable(
      ['連携先', '連携方式', '用途'],
      [
        ['LINE Messaging API', 'HTTPS（Bearer Token認証）', 'プッシュメッセージ送信'],
        ['LIFF SDK', 'CDN（script.line-scdn.net）', 'LINE認証・プロファイル取得'],
        ['Google Sheets API', 'SpreadsheetApp（GAS組み込み）', 'マスタ参照・月次シート操作'],
        ['Google Drive API', 'DriveApp（GAS組み込み）', 'スプレッドシートのコピー・移動'],
      ],
      [2200, 3200, 3960]
    ),
    space(2),
  ];

  const envSection = [
    h1('7. 環境・設定情報'),
    space(),
    h2('7.1 GASスクリプトプロパティ'),
    twoColTable([
      ['LINE_CHANNEL_ACCESS_TOKEN', 'LINE Messaging APIのチャネルアクセストークン（長期）'],
      ['MASTER_SPREADSHEET_ID', 'マスタスプレッドシートのGoogle DriveファイルID'],
      ['MONTHLY_FOLDER_ID', '月次ファイルを保存するGoogle DriveフォルダのID'],
      ['TEMPLATE_SPREADSHEET_ID', '月次テンプレートスプレッドシートのID'],
      ['LIFF_ID', 'LINE DevelopersコンソールのLIFF ID'],
    ]),
    space(2),
    h2('7.2 GASトリガー設定'),
    twoColTable([
      ['関数名', 'createMonthlySheetTrigger'],
      ['種別', '時間主導型（月ベース）'],
      ['実行タイミング', '毎月1日 0時〜1時'],
      ['目的', '当月の月次スプレッドシート自動生成'],
    ]),
    space(2),
    h2('7.3 LINE Developers設定'),
    twoColTable([
      ['チャネル種別', 'Messaging API'],
      ['LIFFアプリ名', '案件入力フォーム'],
      ['LIFFサイズ', 'Full'],
      ['LIFFエンドポイントURL', 'GAS WebアプリのURL（/exec）'],
      ['LIFFスコープ', 'profile'],
      ['Webhook URL', 'GAS WebアプリのURL（/exec）'],
    ]),
    space(2),
  ];

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Meiryo UI', size: 22 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 32, bold: true, font: 'Meiryo UI', color: '1A56A0' },
          paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 26, bold: true, font: 'Meiryo UI', color: '2E75B6' },
          paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 24, bold: true, font: 'Meiryo UI', color: '333333' },
          paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 2 } },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 },
        },
      },
      headers: { default: makeHeader('LINE請求書自動作成システム', 'システム概要書 v1.0') },
      footers: { default: makeFooter() },
      children: [
        ...coverPage,
        ...overviewSection,
        ...archSection,
        ...techSection,
        ...dataFlowSection,
        ...sheetSection,
        ...externalSection,
        ...envSection,
      ],
    }],
  });

  return doc;
}

// Generate both documents
const reqDoc = createRequirementsDoc();
const sysDoc = createSystemOverviewDoc();

await Promise.all([
  Packer.toBuffer(reqDoc).then(buf => fs.writeFileSync('docs/LINE請求書自動作成システム_要件定義書.docx', buf)),
  Packer.toBuffer(sysDoc).then(buf => fs.writeFileSync('docs/LINE請求書自動作成システム_システム概要書.docx', buf)),
]);

console.log('Done: 要件定義書 and システム概要書 created.');
