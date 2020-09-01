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
    let workbook = XLSX.readFile('./product-update.xlsx');
    var sheetName = workbook.SheetNames;
    skyportal.excelJSON = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName[0]]);
  },
  updateProducts: async () => {
    for (let i = 0; i < skyportal.excelJSON.length; i++) {
      console.log("Product: ", skyportal.excelJSON[i].Product);
      await skyportal.updateProduct(skyportal.excelJSON[i]);
    }
  },
  updateProduct: async (product) => {
    skyportal.page.goto(product.ProductEditURL);
    await skyportal.page.waitFor(2000);

    await skyportal.updateDescription();
    await skyportal.updateFile(product);

    const saveButton = '.page-action-footer input[name="Save"]';
    await skyportal.page.click(saveButton);
    await skyportal.page.waitFor(3000);
    // await skyportal.page.waitForNavigation({waitUntil: 'networkidle0'});

  },
  updateDescription: async () => {
    const descriptionTab = '.nav-tabs li:nth-child(2)';
    const shortDescription = 'textarea#ShortDescription';

    await skyportal.page.click(descriptionTab);
    await skyportal.page.waitFor(1000);

    await skyportal.page.waitForSelector(shortDescription);
    await skyportal.page.focus(shortDescription);

    const existingShortDescription = await skyportal.page.$eval(shortDescription, el => el.value);

    await skyportal.page.click(shortDescription);
    for (let i = 0; i < existingShortDescription.length; i++) {
      await skyportal.page.keyboard.press('Backspace');
    }

    await skyportal.page.type(shortDescription, skyportal.shortDescription);
  },
  updateFile: async (product) => {
    const artworkTab = '.nav-tabs li:nth-child(4)';
    const uploadButton = '#btnProductImageUpload';
    const inputFileUpload = 'input#logo';
    const uploadModal = '#productImageUploadModal';
    const closeModalButton = '.modal-header button.btn-close-upload';

    await skyportal.page.click(artworkTab);
    await skyportal.page.waitFor(1000);

    await skyportal.page.waitForSelector(uploadButton);
    await skyportal.page.click(uploadButton);

    await skyportal.page.waitFor(2000);

    await skyportal.page.waitForSelector(uploadModal);
    await skyportal.page.waitForSelector(inputFileUpload);

    const inputUploadHandle = await skyportal.page.$(inputFileUpload);
    await inputUploadHandle.uploadFile(product.ThumbnailPath);
    await skyportal.page.waitFor(1000);

    await skyportal.page.click('#productImageUploadModal .btn-close-upload');

    await skyportal.page.waitFor(2000);

    const secondThumbButton = "#ProductImagesList .product-image-list-item:nth-child(2) .btnSetPrimaryImage";
    const thumbToDelete = "#ProductImagesList .product-image-list-item:nth-child(2) .btn-remove-image-component";

    await skyportal.page.click(secondThumbButton);
    await skyportal.page.click(thumbToDelete);

    await skyportal.page.waitFor(2000);
    await skyportal.page.click('.k-confirm .k-dialog-button-layout-stretched button.k-primary');

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

async function updateProducts() {
	await skyportal.signIn();
	await skyportal.setupSpreadsheet();
  await skyportal.updateProducts();
	await skyportal.signOut();
}

updateProducts();
