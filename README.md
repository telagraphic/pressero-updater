# Products

## Copy Excel
**sites/client** contains a master excel of all products and assets.
Copy that to **new-updates**
Copy product updates from client into the New Updates tab.  Product and Asset Paths columns will update.

## Copy Press Files and Thumbnails
Copy the generated press and thumbnail files into the **new-updates/press-files** and **new-updates/thumbnails**

## Generate Thumbnail Paths
**products/scripts/create-thumbnail-paths** will create a file with the correct system paths for the uploader.
Copy the contents from the **thumbnailPaths.csv** generated in **products/files** into the excel file under the column labeled "ThumbnailPaths"

## Generate Asset Paths
**assets/scripts/create-press-paths** will create a file with the correct system paths for the uploader.
Copy the contents from the **press-paths.csv** generated in **assets/files** into the excel file under the column labeled "AssetPaths"


## Double Check
Check that each asset and thumbnail path is on the correct product row!

## Run the updater
You will need to run the update for assets and products


# FIXES

- remove the step to add paths to the **new-updates.xlsx**, write these paths to the excel file directly
