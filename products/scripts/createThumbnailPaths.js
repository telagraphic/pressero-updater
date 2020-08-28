const path = require('path');
const fs = require('fs');
const createCsvArrayWriter = require('csv-writer').createArrayCsvWriter;
const XLSX = require('xlsx');

const products = {
  updateThumbPaths: async () => {
    let dir = path.join(__dirname, '../thumbnails');
    const files = fs.readdirSync(dir);

    let newPaths = [];
    for (file of files) {
      if(! /^\..*/.test(file)) {
        let pressPath = `${dir}/${file}`;
        newPaths.push(pressPath);
      }
    }

    return newPaths;
  },
  writeThumbnailPathFile: async (paths) => {
    let csvWriter = createCsvArrayWriter({
      path: `../csv/thumbnailPaths.csv`
    });

    let arrayPaths = paths.map(path => [path])

    csvWriter
      .writeRecords(arrayPaths)
      .then(() => console.log("assets written to CSV at pressero-product-updater/products/csv/thumbnailPaths.csv"));
  }
}

async function updateThumbPaths() {
  let newPaths = await products.updateThumbPaths();
  await products.writeThumbnailPathFile(newPaths);
}

updateThumbPaths();
