const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const createCsvArrayWriter = require('csv-writer').createArrayCsvWriter;

const assets = {
  updatePressPath: async () => {
    let dir = path.join(__dirname, '../press-files');
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
  writePressPathFile: async (paths) => {
    let csvWriter = createCsvArrayWriter({
      path: `../files/press-paths.csv`
    });

    let arrayPaths = paths.map(path => [path])

    csvWriter
      .writeRecords(arrayPaths)
      .then(() => console.log("assets written to CSV at pressero-product-updater/products/files/press-paths.csv"));
  }
}

async function createAssetPaths() {
  let newPaths = await assets.updatePressPath();
  await assets.writePressPathFile(newPaths);
}

createAssetPaths();
