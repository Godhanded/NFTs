const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { storeImages, storeTokenMetadata } = require("../utils/upload-to-pinata");

const imagesLocation = "./images/randomNfts/";

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
};
const FUND_AMOUNT = ethers.utils.parseEther("10");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let tokenUris;
    //  get ipfs hashes and images
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris();
    }

    let vrfCoordinatorMock,vrfCoordinatorAddress, subscriptionId;
    if (developmentChains.includes(network.name)) {
        vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorAddress = vrfCoordinatorMock.address;
        const tx = await vrfCoordinatorMock.createSubscription();
        const txReceipt = await tx.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
        await vrfCoordinatorMock.fundSubscription(subscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }

    log("----------------------------");

    const args = [
        vrfCoordinatorAddress,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
        networkConfig[chainId].mintFee,
    ];

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

  if (chainId == 31337) {
        await vrfCoordinatorMock.addConsumer(subscriptionId, randomIpfsNft.address)
    }
  
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verifying...");
        await verify(basicNft.address, args);
    }

    log("----------------------------------");
};
async function handleTokenUris() {
    const tokenUris = [];
    //stor image  //then store metadata
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation);
    for (uploadResponseIndex in imageUploadResponses) {
        // create and upload metadata
        let tokenUriMetadata = { ...metadataTemplate };
        //pug.png
        tokenUriMetadata.name = files[uploadResponseIndex].replace(".png", "");
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup`;
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[uploadResponseIndex].IpfsHash}`;
        console.log(`uploading ${tokenUriMetadata.name}...`);
        //store json to ipfs
        const metadataUploadResponse = await storeTokenMetadata(tokenUriMetadata);
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
    }
    console.log("TokenUris Uploaded");
    console.log(tokenUris);
    return tokenUris;
}

module.exports.tags = ["all", "randomipfsnft", "main"];
