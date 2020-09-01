const path = require('path');
const fs = require('fs');
const csvjson = require('csvjson');
const createCsvObjectWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');

const products = {
  sortByCategory: async () => {
    let category = fs.readFileSync('../csv/categories/im.csv', 'utf8');
    let categoryJSON = csvjson.toObject(category);

    let products = fs.readFileSync('../csv/allProducts.csv', 'utf8');
    let productsJSON = csvjson.toObject(products);

    let categorizedProducts = [];

    productsJSON.forEach(product => {

      categoryJSON.forEach(category => {
        if (product.ProductURL === category.URLString) {
          categorizedProducts.push(product);
        }
      })
    });

		return categorizedProducts;
  },
  writeExcel: async (products) => {

    console.log('...writing excel file');
    // const workbook = XLSX.utils.book_new();
    // if book exist then open and add new worksheet, else create it!
    let workbook = XLSX.readFile("../excel/Products.xlsx");
    const worksheet = 'Presentation Materials';
    const worksheetData = XLSX.utils.json_to_sheet(products);

    XLSX.utils.book_append_sheet(workbook, worksheetData, worksheet);
    XLSX.writeFile(workbook, '../excel/Products.xlsx');
  },
}


async function categorizeProducts() {
	let sortedProducts = await products.sortByCategory();
  await products.writeExcel(sortedProducts);
}

categorizeProducts();
