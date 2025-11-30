// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BaseShooterSBT
 * @dev Soulbound Token (SBT) for Base the Shooter game
 * @notice This is a non-transferable NFT that proves completion of Level 3
 * 
 * Features:
 * - Non-transferable (Soulbound)
 * - Mintable by owner only
 * - Each address can mint multiple times
 * - TokenURI points to the achievement image
 */
contract BaseShooterSBT is ERC721URIStorage, Ownable, ReentrancyGuard {
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Token counter
    uint256 private _tokenCounter;
    
    // Mapping to track minted tokens per address
    mapping(address => uint256[]) private _tokensByOwner;
    
    // Events
    event SBTMinted(address indexed to, uint256 indexed tokenId);
    
    /**
     * @dev Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param baseTokenURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        _tokenCounter = 0;
    }
    
    /**
     * @dev Mint SBT to an address
     * @param to Address to mint the SBT to
     * @notice Only owner can mint
     * @notice Address can mint unlimited times
     */
    function mint(address to) external onlyOwner nonReentrant {
        require(to != address(0), "BaseShooterSBT: Cannot mint to zero address");
        
        uint256 tokenId = _tokenCounter;
        _tokenCounter++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _baseTokenURI);
        
        _tokensByOwner[to].push(tokenId);
        
        emit SBTMinted(to, tokenId);
    }
    
    /**
     * @dev Batch mint SBTs to multiple addresses
     * @param recipients Array of addresses to mint to
     * @notice Only owner can mint
     */
    function batchMint(address[] calldata recipients) external onlyOwner nonReentrant {
        require(recipients.length > 0, "BaseShooterSBT: Empty recipients array");
        require(recipients.length <= 100, "BaseShooterSBT: Too many recipients");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "BaseShooterSBT: Cannot mint to zero address");
            
            uint256 tokenId = _tokenCounter;
            _tokenCounter++;
            
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, _baseTokenURI);
            
            _tokensByOwner[recipients[i]].push(tokenId);
            
            emit SBTMinted(recipients[i], tokenId);
        }
    }
    
    /**
     * @dev Get all token IDs owned by an address
     * @param owner Address to query
     * @return Array of token IDs
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _tokensByOwner[owner];
    }
    
    /**
     * @dev Get total number of tokens minted
     * @return Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenCounter;
    }
    
    /**
     * @dev Update base token URI
     * @param newBaseURI New base URI
     * @notice Only owner can update
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    /**
     * @dev Get base token URI
     * @return Base URI string
     */
    function baseURI() external view returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Override transfer functions to make token non-transferable (Soulbound)
     * This is the main function that prevents transfers
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        // Allow minting (when token doesn't exist yet - from == address(0))
        address from = _ownerOf(tokenId);
        if (from == address(0)) {
            // This is a mint, allow it
            return super._update(to, tokenId, auth);
        }
        
        // Revert all transfers (token already exists, so this is a transfer)
        revert("BaseShooterSBT: Token is non-transferable (Soulbound)");
    }
    
    /**
     * @dev Override approve to prevent approvals (which would allow transfers)
     */
    function approve(address /* to */, uint256 /* tokenId */) public override(ERC721, IERC721) {
        revert("BaseShooterSBT: Token is non-transferable (Soulbound)");
    }
    
    /**
     * @dev Override setApprovalForAll to prevent approvals
     */
    function setApprovalForAll(address /* operator */, bool /* approved */) public override(ERC721, IERC721) {
        revert("BaseShooterSBT: Token is non-transferable (Soulbound)");
    }
}

