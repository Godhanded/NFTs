const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let V3Aggregator, V3Address;
    if (developmentChains.includes(network.name)) {
        V3Aggregator = await ethers.getContract("MockV3Aggregator");
        V3Address = V3Aggregator.address;
    } else {
        V3Address = networkConfig[chainId].ethUsdPriceFeed;
    }
    const lowSvg = await fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf-8" });
    const highSvg = await fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf-8" });
    args = [V3Address, lowSvg, highSvg];
    log("--------------------------");
    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API) {
        log("verifying.....");
        await verify(dynamicSvgNft.address, args);
    }
};

module.exports.tags = ["all", "dynamicsvg", "main"];
