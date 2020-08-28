const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const accounts = require('../../config/accounts.js');
const sites = require('../../config/sites.js');
const XLSX = require('xlsx');
const createCsvObjectWriter = require('csv-writer').createObjectCsvWriter;

const skyportal = {
  browser: null,
  page: null,
  options: {
    headless: false,
    defaultViewport : {
      width: 4000,
      height: 2000,
      timeout: 0
    }
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
  goToAssetsPage: async () => {
    await skyportal.page.goto(skyportal.assetsURL);
    await skyportal.page.waitFor(2000);

    await skyportal.page.waitFor(2000);

    const itemPerPage = '.k-pager-sizes .k-select';
    await skyportal.page.click(itemPerPage);

    await skyportal.page.waitFor(1000);

    const itemShow100 = '.k-animation-container .k-list-scroller ul.k-list li:last-child';
    await skyportal.page.click(itemShow100);

    await skyportal.page.waitFor(2000);
  },
  scrapePages: async () => {

    let pageCount = await skyportal.page.evaluate(() => {
      let pageNumbers = document.querySelectorAll('.k-pager-wrap .k-pager-numbers li:not(.k-current-page)');
      return pageNumbers.length;
    });

    let allAssets = [];

    for (let index = 0; index < pageCount; index++) {
      await skyportal.page.waitFor(1000);
      allAssets = allAssets.concat(await skyportal.scrapeAssets());
      if (index != pageCount - 1) {
        await skyportal.page.click('.k-pager-wrap a[title="Go to the next page"]');
        await skyportal.page.waitFor(3000);
      }
    }

    return allAssets;

  },
  scrapeAssets: async () => {
		console.log("...getting assets");
    skyportal.page.waitFor(3000);
		const assets = await skyportal.page.evaluate(() => {

			let assetsList = document.querySelectorAll('.page-content .k-grid-content table tbody tr');

			let allAssets = [];

			assetsList.forEach(presseroAsset => {
        let asset = {};
        asset.Product = presseroAsset.querySelector('td:nth-child(4)').textContent;
				asset.URL = presseroAsset.querySelector('td:nth-child(1) a').href;
				allAssets.push(asset)
			})

			return allAssets;
		});

		return assets;
	},
  writeFile: async (assets) => {
    console.log('...writing excel file');

    const workbook = XLSX.utils.book_new();
    const worksheet = 'AssetURLS';
    const worksheetData = XLSX.utils.json_to_sheet(assets);

    XLSX.utils.book_append_sheet(workbook, worksheetData, worksheet);
    XLSX.writeFile(workbook, '../excel/assetURLS.xlsx');

    // https://github.com/SheetJS/sheetjs/issues/1473
    // autofit the columns before writing?

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


async function createAssetURLS() {
	await skyportal.signIn();
	await skyportal.goToAssetsPage();
	let assets = await skyportal.scrapePages();
  await skyportal.writeFile(assets);
	await skyportal.signOut();
}

createAssetURLS();
