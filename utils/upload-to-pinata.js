const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY || "your key";
const pinataApiSecrete = process.env.PINATA_API_SECRETE || "YOUR SECRETE";
const pinata = new pinataSDK(pinataApiKey, pinataApiSecrete);
// ./image/randomNft
async function storeImages(filePath) {
    console.log("Uploading to IPFS........");
    const fullImagePath = path.resolve(filePath);
    const files = fs.readdirSync(fullImagePath).filter((file) => file.includes(".png"));
    let responses = [];
    for (fileIndex in files) {
        const readableFileStream = fs.createReadStream(`${fullImagePath}/${files[fileIndex]}`);
        let options = {
            pinataMetadata: {
                name: files[fileIndex],
            },
        };
        try {
            const response = await pinata.pinFileToIPFS(readableFileStream, options);
            responses.push(response);
        } catch (error) {
            console.log(error);
        }
    }
    return { responses, files };
}

async function storeTokenMetadata(metadata) {
    const options = {
        pinataMetadata: {
            name: metadata.name,
        },
    };
    try {
        const response = await pinata.pinJSONToIPFS(metadata, options);
        return response;
    } catch (error) {
        console.log(error);
    }
    return null;
}
module.exports = { storeImages, storeTokenMetadata };
