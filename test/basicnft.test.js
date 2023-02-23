const { assert } = require("chai")
const { deployments, ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Basic Nft unit tests", () => {
          let basicNft, deployer

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["basicnft"])
              basicNft = await ethers.getContract("BasicNft")
          })

          describe("constructor", () => {
              it("should initialize state varibles correctly", async () => {
                  const name = await basicNft.name()
                  const symbol = await basicNft.symbol()
                  const tokenCounter = await basicNft.getTokenCounter()
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("mintNft", () => {
              let counterBeforeMint;
              beforeEach(async()=>{
                counterBeforeMint=await basicNft.getTokenCounter()
                const txResponse = await basicNft.mintNFT()
                await txResponse.wait(1)
                
              });
              it("should increament token counter by 1", async () => {
                  const counterAfterMint = await basicNft.getTokenCounter()
                  assert.equal(counterBeforeMint.toString(), "0")
                  assert.equal(counterAfterMint.toString(), "1")
                  assert.notEqual(counterAfterMint,counterBeforeMint)
              });
              it("should transfer nft to deployer", async () => {
                  const tokenOwner = await basicNft.ownerOf("0")
                  const ownerBalance = await basicNft.balanceOf(deployer.address)
                  assert.equal(tokenOwner, deployer.address)
                  assert.equal(ownerBalance.toString(), "1")
              });
          });
      });
