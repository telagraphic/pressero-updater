const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const billing = {
  excelJSON: null,
  workbookPathToRead: '../new-updates/Updates11-4.xlsx',
  workbookPathToWrite: '../billing/billing.xlsx',
  workbookReadJSON: null,
  workbookWriteJSON: null,
  productNames: [],
  billingColumns: {
    changeRequest: 1,
    date: '11/5/2020',
    time: '5PM',
    requestedBy: 'Megan von Feldt',
    completedBy: 'Nick Lyons',
    completedOn: '11/5/2020',
    timeSpent: '.25'
  },
  setupSpreadsheet: async () => {
    let workbook = XLSX.readFile(billing.workbookPathToRead);
    var sheetName = workbook.SheetNames;
    billing.workbookReadJSON = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName[0]]);

    console.log(`spreadsheet setup...`);
  },
  getProducts: async () => {
    for (let i = 0; i < billing.workbookReadJSON.length; i++) {
      billing.productNames.push(billing.workbookReadJSON[i].Product);
    }

  },
  createRows: async () => {

    console.log(`writing rows...`);
    console.log(` `);

    let records = [];

    billing.productNames.forEach((product, index) => {

      let row = {
        "Change Request" : billing.billingColumns.changeRequest,
        "Date" : billing.billingColumns.date,
        "Time" : billing.billingColumns.time,
        "Requested By" : billing.billingColumns.requestedBy,
        "# of Assets" : ++index,
        "Product Name" : product,
        "Completed By" : billing.billingColumns.completedBy,
        "Completed On" : billing.billingColumns.completedOn,
        "Time Spent" : billing.billingColumns.timeSpent
      }

      records.push(row)

    });

    // billing.workbookWriteJSON = JSON.stringify(records);
    billing.workbookWriteJSON = records;

  },
  writeFile: async () => {
    console.log('...writing excel file');

    console.log(billing.workbookWriteJSON);

    let formattedColumnsWidth = billing.formatColumns(billing.workbookWriteJSON);

    const workbook = XLSX.utils.book_new();
    const worksheet = 'Billing';
    const worksheetData = XLSX.utils.json_to_sheet(billing.workbookWriteJSON);
    worksheetData["!cols"] = formattedColumnsWidth;

    console.log(formattedColumnsWidth);

    XLSX.utils.book_append_sheet(workbook, worksheetData, worksheet);
    XLSX.writeFile(workbook, billing.workbookPathToWrite);

  },
  formatColumns: (columns) => {
    let objectMaxLength = [];
    for (let i = 0; i < columns.length; i++) {
      let value = Object.values(columns[i]);
      for (let j = 0; j < value.length; j++) {
        if (typeof value[j] == "number") {
          objectMaxLength[j] = 10;
        } else {
          objectMaxLength[j] = objectMaxLength[j] >= value[j].length ? objectMaxLength[j] : value[j].length;
        }
      }
    };

    var wscols = [
      { width: 15 },
      { width: 11 },
      { width: 5 },
      { width: objectMaxLength[3] },
      { width: objectMaxLength[4] },
      { width: objectMaxLength[5] },
      { width: 12 },
      { width: 13 },
      { width: 10 }
    ];

    return wscols;
  },
}

async function billingSheet() {
  await billing.setupSpreadsheet();
  await billing.getProducts();
  await billing.createRows();
  await billing.writeFile();
}

billingSheet();
