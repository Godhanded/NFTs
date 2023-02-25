const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts();

    // Basic NFT
    const BasicNft = await ethers.getContract("BasicNft", deployer);
    const basicMint = await BasicNft.mintNFT();
    await basicMint.wait(1);
    console.log(`Basic NFT 0 minted with tokenURI:${await BasicNft.tokenURI(0)}`);

    //RandomIPFSNFT
    const randomNft = await ethers.getContract("RandomIpfsNft", deployer);
    const mintFee = await randomNft.getMintFee();
    console.log(mintFee.toString());
    const randomMint = await randomNft.requestNft({ value: mintFee.toString() });
    const mintReceipt = await randomMint.wait(1);
    await new Promise(async (resolve, reject) => {
        setTimeout(async () => {
            await randomNft.withdraw();
            reject("timeout");
        }, 500000);
        randomNft.once("NftMinted", async () => {
            console.log(`RandomIPFSNFT 0 minted with tokenURI: ${await randomNft.tokenURI(0)} `);
            await randomNft.withdraw();
            resolve();
        });

        if (developmentChains.includes(network.name)) {
            const vrf = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            const fulfillWords = await vrf.fulfillRandomWords(
                mintReceipt.events[1].args.requestId.toString(),
                randomNft.address
            );
        }
    });

    //Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("1590");
    const dynamicNft = await ethers.getContract("DynamicSvgNft", deployer);
    const mintNft = await dynamicNft.mintNft(highValue.toString());
    await mintNft.wait(1);
    console.log(`DynamicNFT 1 minted with tokenURI: ${await dynamicNft.tokenURI(1)}`);
};
module.exports.tags = ["all", "mint"];
