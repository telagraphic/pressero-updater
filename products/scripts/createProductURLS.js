const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const accounts = require('../../config/accounts.js');
const sites = require('../../config/sites.js');
const createCsvObjectWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');

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
  productsURL: sites.GLOBALX.productsPage,
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
  goToProductsPage: async () => {
    await skyportal.page.goto(skyportal.productsURL);
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

    console.log(pageCount);

    let allProducts = [];

    for (let index = 0; index < pageCount; index++) {
      await skyportal.page.waitFor(1000);
      allProducts = allProducts.concat(await skyportal.scrapeProducts());
      if (index != pageCount - 1) {
        await skyportal.page.click('.k-pager-wrap a[title="Go to the next page"]');
        await skyportal.page.waitFor(3000);
      }
    }

    return allProducts;

  },
  scrapeProducts: async () => {
		console.log("...getting products");
    skyportal.page.waitFor(3000);
		const products = await skyportal.page.evaluate(() => {

			let productsList = document.querySelectorAll('.page-content .k-grid-content table tbody tr');

			let allProducts = [];

			productsList.forEach(presseroProduct => {
        let product = {};
        product.name = presseroProduct.querySelector('td:nth-child(3)').textContent;
				product.URL = presseroProduct.querySelector('td:nth-child(1) a').href;
        product.URLString = presseroProduct.querySelector('td:nth-child(4)').textContent;
				allProducts.push(product)
			})

			return allProducts;
		});

		return products;
  },
  writeFile: async (products) => {

    console.log('...writing csv file');

    const csvWriter = createCsvObjectWriter({
      path: `../csv/allProducts.csv`,
      header: [
        {id: 'name', title: 'Product'},
        {id: 'URL', title: 'URL'},
        {id: 'URLString', title: 'ProductURL'}
      ]
    });

    csvWriter
      .writeRecords(products)
      .then(()=> console.log("assets written to CSV at pressero-product-updater/products/csv/assetURLS.csv"));

    console.log('...writing excel file');

    const workbook = XLSX.utils.book_new();
    const worksheet = 'ProductURLS';
    const worksheetData = XLSX.utils.json_to_sheet(products);

    XLSX.utils.book_append_sheet(workbook, worksheetData, worksheet);
    XLSX.writeFile(workbook, '../excel/ProductURLS.xlsx');
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


async function createProductURLS() {
	await skyportal.signIn();
  await skyportal.goToProductsPage();
	let products = await skyportal.scrapePages();
  await skyportal.writeFile(products);
	await skyportal.signOut();
}

createProductURLS();
