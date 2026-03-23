/**
 * BRIDGE CLIENT v10 - SEGURANÇA TOTAL E PRODUÇÃO
 *
 * Instruções:
 * 1. No Google Sheets, vá em Extensões > Apps Script.
 * 2. Cole este código no arquivo Code.js.
 * 3. Altere a constante SECRET_TOKEN para a mesma chave definida no seu .env.
 * 4. Clique em Implementar > Gerenciar Implantações > Tipo: App da Web.
 * 5. Configure: "Quem pode acessar: Qualquer pessoa" (Anyone).
 * 6. Copie a URL gerada e coloque na variável APPS_SCRIPT_URL do seu .env.
 */
const SECRET_TOKEN = "MINHA_CHAVE"; // <--- COLOQUE O MESMO DO .ENV AQUI

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);

    if (params.secret !== SECRET_TOKEN) {
      return createResponse(false, "Não autorizado: Token inválido");
    }

    const ss = SpreadsheetApp.openById(params.spreadsheetId);

    switch (params.action) {
      case "SETUP":
        return setupSpreadsheet(ss, params.headers);
      case "GET_VALUES":
        return getValues(ss, params.tab, params.range);
      case "UPDATE_VALUES":
        return updateValues(ss, params.tab, params.values);
      default:
        return createResponse(false, "Ação desconhecida");
    }
  } catch (err) {
    return createResponse(false, "Erro no Script: " + err.toString());
  }
}

function updateValues(ss, tabName, values) {
  let sheet = ss.getSheetByName(tabName);
  if (!sheet) sheet = ss.insertSheet(tabName);

  sheet.clear();
  const bandings = sheet.getBandings();
  bandings.forEach((b) => b.remove());

  const rows = values.length;
  const cols = values[0].length;
  const range = sheet.getRange(1, 1, rows, cols);
  range.setValues(values);

  range
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center")
    .setFontFamily("Arial")
    .setFontSize(10);
  range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREEN);

  const headerRange = sheet.getRange(1, 1, 1, cols);
  headerRange
    .setFontWeight("bold")
    .setBackground("#34A853")
    .setFontColor("#FFFFFF");

  if (sheet.getFilter()) sheet.getFilter().remove();
  range.createFilter();
  range.setBorder(
    true,
    true,
    true,
    true,
    true,
    true,
    "#e0e0e0",
    SpreadsheetApp.BorderStyle.SOLID,
  );

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, cols);
  return createResponse(true);
}

function setupSpreadsheet(ss, headers) {
  const configTab = "_config";
  let sheet = ss.getSheetByName(configTab);
  if (!sheet) sheet = ss.insertSheet(configTab);

  const configHeaders = [
    "Query SQL",
    "Aba Destino",
    "Range",
    "Status",
    "Frequência",
  ];
  sheet
    .getRange(1, 1, 1, configHeaders.length)
    .setValues([configHeaders])
    .setFontWeight("bold")
    .setBackground("#34A853")
    .setFontColor("#FFFFFF");

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["ATIVO", "INATIVO"])
    .build();
  sheet.getRange("D2:D500").setDataValidation(statusRule);
  const freqRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["M1", "M5", "M15", "H1", "D1"])
    .build();
  sheet.getRange("E2:E500").setDataValidation(freqRule);

  const rangeStatus = sheet.getRange("D2:D500");
  const rules = sheet.getConditionalFormatRules();
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("ATIVO")
      .setBackground("#E2F0D9")
      .setFontColor("#38761D")
      .setRanges([rangeStatus])
      .build(),
  );
  rules.push(
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("INATIVO")
      .setBackground("#FADBD8")
      .setFontColor("#A93226")
      .setRanges([rangeStatus])
      .build(),
  );
  sheet.setConditionalFormatRules(rules);

  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, configHeaders.length);
  return createResponse(true);
}

function getValues(ss, tabName, rangeName) {
  const sheet = ss.getSheetByName(tabName);
  const values = sheet.getRange(rangeName || "A1:Z500").getValues();
  return createResponse(
    true,
    null,
    values.filter((r) => r.some((c) => c !== "")),
  );
}

function createResponse(success, error, data) {
  return ContentService.createTextOutput(
    JSON.stringify({ isSuccess: success, error: error, data: data }),
  ).setMimeType(ContentService.MimeType.JSON);
}
