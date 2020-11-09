const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const accounts = require('../../config/accounts.js');
const sites = require('../../config/sites.js');
const XLSX = require('xlsx');

const skyportal = {
  browser: null,
  page: null,
  options: {
    headless: false,
    defaultViewport : null
  },
  pageURL: sites.LOGIN.loginPage,
  assetsURL: 'https://admin.chi.v6.pressero.com/site/quartet.gsbskyportal.com/Assets?ignoreSavedState=True',
  excelJSON: null,
  workbookPath: 'assets/files/assets.xlsx',
  signIn: async () => {
		skyportal.browser = await puppeteer.launch(skyportal.options);
		skyportal.page = await skyportal.browser.newPage();

		console.log("...signing in");
		skyportal.page.goto(skyportal.pageURL, {waitUntil: 'load', timeout: 0});
		await skyportal.page.waitForSelector('.login-form');

		const username = 'input[id="username"]';
		const password = 'input[id="password"]';
		const loginButton = 'input[id="btnLogin"]';

		await skyportal.page.click(username);
		await skyportal.page.keyboard.type(accounts.SKYPORTAL.username);

		await skyportal.page.click(password);
		await skyportal.page.keyboard.type(accounts.SKYPORTAL.password);

		await skyportal.page.click(loginButton);

		await skyportal.page.waitFor(2000);
  },
  setupSpreadsheet: async () => {
    let workbook = XLSX.readFile(skyportal.workbookPath);
    var sheetName = workbook.SheetNames;
    skyportal.excelJSON = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName[0]]);

    console.log(`spreadsheet setup`);
  },
  deleteAllAssets: async () => {
    for (let i = 0; i < skyportal.excelJSON.length; i++) {
      console.log(`Processing ${skyportal.excelJSON[i].Product}...`);
      await skyportal.deleteAsset(skyportal.excelJSON[i]);
    }
  },
  deleteAsset: async (product) => {
    skyportal.page.goto(product.URL);
    await skyportal.page.waitFor(2000);

    await skyportal.page.on('dialog', async dialog => {
      await dialog.accept();
    });
    const deleteButton = '.page-action-footer .btn-danger';
    const cancelButton = '.btn-default';

    try {
      await skyportal.page.waitForSelector(deleteButton, { timeout: 2000 });
      await skyportal.page.click(deleteButton);
      await skyportal.page.waitFor(3000);
    } catch {
      await skyportal.page.click(cancelButton);
    }
  },
  signOut: async () => {
    const signout = '.navbar-right a[href="/authentication/logout"]';
    await skyportal.page.click(signout);
    console.log("...signing out");
    await skyportal.page.waitFor(1000);
    await skyportal.browser.close();
    process.exit(0);
  }
}

async function updateAssets() {
  await skyportal.signIn();
  await skyportal.setupSpreadsheet();
  await skyportal.deleteAllAssets();
  await skyportal.signOut();
}

updateAssets();
