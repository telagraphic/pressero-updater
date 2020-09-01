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
  assetsURL: sites.GLOBALX.assetsPage,
  excelJSON: null,
  shortDescription: 'Updated 8/27/2020',

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
    let workbook = XLSX.readFile('factsheets-assets.xlsx');
    var sheetName = workbook.SheetNames;
    skyportal.excelJSON = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName[0]]);

    console.log(`spreadsheet setup`);
  },
  updateAssets: async () => {
    for (let i = 0; i < skyportal.excelJSON.length; i++) {
      console.log(`Processing ${skyportal.excelJSON[i].Product}...`);
      await skyportal.updateAsset(skyportal.excelJSON[i]);
    }
  },
  updateAsset: async (product) => {
    skyportal.page.goto(product.AssetURL);
    await skyportal.page.waitFor(2000);

    // update description date
    let descriptionTextarea = 'textarea#Description';
    let existingDescription = await skyportal.page.$eval(descriptionTextarea, el => el.value);

    await skyportal.page.click(descriptionTextarea);
    for (let i = 0; i < existingDescription.length; i++) {
      await skyportal.page.keyboard.press('Backspace');
    }

    await skyportal.page.type(descriptionTextarea, skyportal.shortDescription);

    //upload file
    let uploadFile = 'input#assetFile';
    await skyportal.page.waitForSelector(uploadFile);
    const inputUploadHandle = await skyportal.page.$(uploadFile);

    inputUploadHandle.uploadFile(product.PressPath)

    let saveButton = '.page-action-footer input[type="submit"]';
    await skyportal.page.click(saveButton);
    await skyportal.page.waitForNavigation({ waitUntil: 'networkidle0' })
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
  await skyportal.updateAssets();
  await skyportal.signOut();
}

updateAssets();
