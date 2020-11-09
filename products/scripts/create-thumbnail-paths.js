const path = require('path');
const fs = require('fs');
const createCsvArrayWriter = require('csv-writer').createArrayCsvWriter;
const XLSX = require('xlsx');
const thumbnailFilePath = '../../new-updates/thumbnails';
const thumbPathFile = 'products/files/thumbnail-paths.csv';

const products = {
  updateThumbPaths: async () => {
    let dir = path.join(__dirname, thumbnailFilePath);
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
      path: thumbPathFile
    });

    let arrayPaths = paths.map(path => [path]);

    csvWriter
      .writeRecords(arrayPaths)
      .then(() => console.log("assets written to CSV at pressero-product-updater/products/files/thumbnail-paths.csv"));
  }
}

async function updateThumbPaths() {
  let newPaths = await products.updateThumbPaths();
  await products.writeThumbnailPathFile(newPaths);
}

updateThumbPaths();
