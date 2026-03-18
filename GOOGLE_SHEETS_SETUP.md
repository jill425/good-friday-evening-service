# Google Sheets 收集 Email 設定教學

由於無法直接存取您的 Google 帳號，請您按照以下步驟設定，以啟用無限量的 Email 收集功能。

## 步驟一：建立 Google Sheet
1. 開啟 [Google Sheets](https://sheets.google.com) 並建立一個新的試算表。
｀2. 將試算表命名為 `Good Friday Emails` (或您喜歡的名稱)。
3. 在第一列 (Row 1) 設定欄位名稱：
   - A1: `Timestamp`
   - B1: `Email`

## 步驟二：設定 Google Apps Script
1. 在試算表中，點選上方選單 **擴充功能 (Extensions)** > **Apps Script**。
2. 清空編輯器中的所有程式碼，貼上以下內容：

```javascript
/* Google Apps Script */
var SHEET_NAME = "工作表1"; // 請確認您的工作表名稱是否為 工作表1

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName(SHEET_NAME);

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1;

    var newRow = headers.map(function(header) {
      if(header === 'Timestamp'){ return new Date(); }
      return e.parameter[header];
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  finally {
    lock.releaseLock();
  }
}
```

3. 按下儲存 (磁碟片圖示)。

## 步驟三：部署 Web App
1. 點擊右上角的藍色按鈕 **部署 (Deploy)** > **新增部署 (New deployment)**。
2. 左側選擇 **網頁應用程式 (Web app)** (齒輪圖示)。
3. 設定如下：
   - **說明 (Description)**: Email Collector
   - **執行身分 (Execute as)**: **我 (Me)**
   - **誰可以存取 (Who has access)**: **所有人 (Anyone)** <--- *這點非常重要！*
4. 點擊 **部署 (Deploy)**。
5. Google 可能會要求授權，請依照畫面指示允許 (若出現「Google 尚未驗證此應用程式」，請點選「進階」>「前往...（不安全）」)。
6. 複製產生的 **網頁應用程式網址 (Web App URL)** (以 `https://script.google.com/macros/s/.../exec` 結尾)。

## 步驟四：設定專案環境變數
1. 回到本專案。
2. 在專案根目錄建立或編輯 `.env.local` 檔案。
3. 加入以下內容 (將 URL 替換為您剛剛複製的網址)：

```bash
NEXT_PUBLIC_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/您的ID/exec
```

4. **重新啟動開發伺服器** (Ctrl+C 停止，再執行 `npm run dev`)。

設定完成！現在使用者的 Email 將會直接存入您的 Google Sheet。
