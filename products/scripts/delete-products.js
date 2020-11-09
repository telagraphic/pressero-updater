const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sites = require('../../config/sites.js');
const accounts = require('../../config/accounts.js');
const createCsvArrayWriter = require('csv-writer').createArrayCsvWriter;
const XLSX = require('xlsx');

const skyportal = {
  browser: null,
  page: null,
  options: {
    headless: false,
    defaultViewport : null
  },
  pageURL: sites.LOGIN.loginPage,
  excelJSON: null,
  shortDescription: 'Updated 8/27/2020',
  workbookPath: 'products/files/products.xlsx',
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
  },
  deleteProducts: async () => {
    for (let i = 0; i < skyportal.excelJSON.length; i++) {
      console.log("Product: ", skyportal.excelJSON[i].Product);
      await skyportal.deleteProduct(skyportal.excelJSON[i]);
    }
  },
  deleteProduct: async (product) => {
    skyportal.page.goto(product.ProductEditURL);
    await skyportal.page.waitFor(3000);
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

async function deleteProducts() {
	await skyportal.signIn();
	await skyportal.setupSpreadsheet();
  await skyportal.deleteProducts();
	await skyportal.signOut();
}

deleteProducts();
