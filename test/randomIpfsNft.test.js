const { assert, expect } = require("chai");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { network, deployments, getNamedAccounts, ethers } = require("hardhat");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft unit tests", () => {
          let randomIpfsNft, deployer, vrfCoordinatorMock;
          beforeEach(async () => {
              deployer = (await ethers.getSigners())[0];
              await deployments.fixture(["randomipfsnft", "mocks"]);
              randomIpfsNft = await ethers.getContract("RandomIpfsNft");
              vrfCoordinatorMock = await ethers.getContract("VRFCoordinatorV2Mock");
          });

          describe("constructor", () => {
              it("constructor should initialize state variables correctly", async () => {
                  const owner = await randomIpfsNft.owner();
                  const tokenUris = await randomIpfsNft.getDogTokenUris(0);
                  const mintFee = await randomIpfsNft.getMintFee();
                  assert.equal(owner, deployer.address);
                  assert.equal(mintFee.toString(), networkConfig[network.config.chainId].mintFee.toString());
                  assert.equal(tokenUris.length > 0,true);
              });
          });

          describe("requestNft", () => {
              it("should revert if value is less than mint fee", async () => {
                  await expect(
                      randomIpfsNft.requestNft({ value: ethers.utils.parseEther("0.0001") })
                  ).to.be.revertedWith("RandomIpfsNft__NeedMoreEthSent");
              });

              it("should emit nft requested", async () => {
                  await expect(
                      randomIpfsNft.requestNft({ value: ethers.utils.parseEther("0.1") })
                  ).to.emit(randomIpfsNft, "NftRequested");
              });
          });
          describe("fullfillRandomWords", () => {
              it("should mint nft after random number is fulfilled", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0");
                              const tokenCounter = await randomIpfsNft.getTokenCounter();
                              assert.equal(tokenCounter.toString(), "1");
                              assert.equal(tokenUri.toString().includes("ipfs://"),true);
                              resolve();
                          } catch (e) {
                              console.log(e);
                              reject(e);
                          }
                      });
                      try {
                          const tx = await randomIpfsNft.requestNft({
                              value: ethers.utils.parseEther("0.1"),
                          });
                          const txReceipt = await tx.wait(1);
                          const { requestId } = txReceipt.events[1].args;
                          await vrfCoordinatorMock.fulfillRandomWords(
                              requestId,
                              randomIpfsNft.address
                          );
                      } catch (e) {
                          console.log(e);
                          reject(e);
                      }
                  });
              });
          });
        describe("getBreedFromModdedRng", () => {
              it("should return pug if moddedRng < 10", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromRng(7)
                  assert.equal(0, expectedValue)
              })
              it("should return shiba-inu if moddedRng is between 10 - 39", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromRng(21)
                  assert.equal(1, expectedValue)
              })
              it("should return st. bernard if moddedRng is between 40 - 99", async function () {
                  const expectedValue = await randomIpfsNft.getBreedFromRng(77)
                  assert.equal(2, expectedValue)
              })
              it("should revert if moddedRng > 99", async function () {
                  await expect(randomIpfsNft.getBreedFromRng(100)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds"
                  )
              })
          })
      });
