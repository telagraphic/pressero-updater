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
  assetsURL: 'https://admin.chi.v6.pressero.com/site/mfg.gsbskyportal.com/Assets?ignoreSavedState=True',
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
      await skyportal.page.waitFor(3000);
      console.log(`scraping page ${index+1}`);
      allAssets = allAssets.concat(await skyportal.scrapeAssets());
      if (index != pageCount - 1) {
        await skyportal.page.click('.k-pager-wrap a[title="Go to the next page"]');
        await skyportal.page.waitFor(3000);
      }
    }

    return allAssets;

  },
  scrapePageNumber: async (pageNumber) => {
    let pageCount = await skyportal.page.evaluate(() => {
      let pageNumbers = document.querySelectorAll('.k-pager-wrap .k-pager-numbers li:not(.k-current-page)');
      return pageNumbers.length;
    });

    let allAssets = [];

    if (pageNumber === 1) {
      await skyportal.page.waitFor(3000);
      allAssets = await skyportal.scrapeAssetsOnPage();
    } else {
      const pageToScrape = `.k-pager-numbers a[data-page="${pageNumber}"]`;
      await skyportal.page.click(pageToScrape);
      await skyportal.page.waitFor(3000);
      allAssets = await skyportal.scrapeAssetsOnPage();
    }

    return allAssets;
  },
  scrapeAssetsOnPage: async () => {
		console.log("...getting assets");
    skyportal.page.waitFor(3000);
		const assets = await skyportal.page.evaluate(() => {

			let assetsList = document.querySelectorAll('.page-content .k-grid-content table tbody tr');

			let allAssets = [];

			assetsList.forEach(presseroAsset => {
        let asset = {};
        asset.Asset = presseroAsset.querySelector('td:nth-child(4)').textContent;
				asset.AssetEditURL = presseroAsset.querySelector('td:nth-child(1) a').href;
				allAssets.push(asset)
			})

			return allAssets;
		});

    for (let index=0; index < assets.length; index++) {
      assets[index].ProductLink = await skyportal.scrapeAsset(assets[index]);
    }

		return assets;
	},
  scrapeAsset: async (asset) => {
    console.log(`scraping ${asset.Asset}`);

    await skyportal.page.goto(asset.AssetEditURL);
    await skyportal.page.waitFor(5000);

    const assetProduct = await skyportal.page.evaluate(() => {
      let productName = document.querySelector("#asset-usage-product .k-dropdown-wrap .k-input");
      return productName.textContent;
    });

    skyportal.page.click(".page-action-footer .btn.btn-default");
    await skyportal.page.waitFor(2000);

    console.log(`product asset is: ${assetProduct}`);
    return assetProduct;
  },
  writeFile: async (assets) => {
    console.log('...writing excel file');

    let formattedColumnsWidth = skyportal.formatColumns(assets);

    const workbook = XLSX.utils.book_new();
    const worksheet = 'Assets';
    const worksheetData = XLSX.utils.json_to_sheet(assets);
    worksheetData["!cols"] = formattedColumnsWidth;

    XLSX.utils.book_append_sheet(workbook, worksheetData, worksheet);
    XLSX.writeFile(workbook, skyportal.workbookPath);

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
      { width: objectMaxLength[0] },
      { width: objectMaxLength[1] },
      { width: objectMaxLength[2] }
    ];

    return wscols;
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
	let assets = await skyportal.scrapePageNumber(1);
  await skyportal.writeFile(assets);
	await skyportal.signOut();
}

createAssetURLS();
