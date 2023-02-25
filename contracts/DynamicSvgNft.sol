// SPDX-License-Identifier: MIT

pragma solidity 0.8.12;
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";

contract DynamicSvgNft is ERC721 {
    // mint
    // store svg info
    //logic to show x or y image(dynamic)

    uint256 private s_tokenCounter;
    string private i_lowImageURI;
    string private i_highImageURI;
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint256 => int256) public s_tokenIdToHighValue;

    event CreatedNft(uint256 indexed tokenId, int256 highValue, address indexed owner);

    constructor(
        address priceFeed,
        string memory lowSvg,
        string memory highSvg
    ) ERC721("Dynamic svg Nft", "DSN") {
        s_tokenCounter = 0;
        i_priceFeed = AggregatorV3Interface(priceFeed);
        i_lowImageURI = svgToImageURI(lowSvg);
        i_highImageURI = svgToImageURI(highSvg);
    }

    function svgToImageURI(string memory svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode(bytes(string(abi.encodePacked(svg))));
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function mintNft(int256 highValue) public {
        s_tokenCounter += 1;
        s_tokenIdToHighValue[s_tokenCounter] = highValue;

        _safeMint(msg.sender, s_tokenCounter);

        emit CreatedNft(s_tokenCounter, highValue, msg.sender);
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // data:image/svg+xml;base64, for image
        // data:application/json;base64,  for json
        require(_exists(tokenId), "URI Query for nonexistent token");
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImageURI;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }

        return (
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '","description":"nft that changes based on chainlink feed",',
                                '"attributes": [{"trait_type":"coolness","value": 100}],"image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            )
        );
    }
}
