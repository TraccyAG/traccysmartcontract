// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * This smart contract acts as a decentralized sales unit for a specific token.
 * It supports the configuration of different sales phases with different prices
 * and different volumes.
 * Accepted payment options are USDT and USDC.
 */
contract PhaseableSale is Ownable, ReentrancyGuard {

    struct Phase {
        uint256 startTimestamp;
        uint256 endTimestamp;
        uint256 priceUsd;
        uint256 amountTotal;
        uint256 amountSold;
        bool closed;
    }

    uint256 public phaseCounter = 0;
    mapping(uint256 => Phase) private _idToPhase;

    IERC20 immutable token;

    modifier validPhaseId(uint256 id) {
        require(id <= phaseCounter, "Sale: Not a valid phasse id");
        _;
    }

    modifier phaseIsActive() {
       // check if at least 1 phase exits
        require(phaseCounter > 0, "Sale: No phase has been created.");

        // check if latest phase is not closed already
        Phase memory phase = _idToPhase[phaseCounter-1];
        require(!phase.closed, "Sale: Latest phase is already closed.");
        _;
    }

    constructor(address _token) {
        token = IERC20(_token);
    }

    /**
     * Get information on the phase with the specified id.
     * The id of the latest phase is `phaseCounter -1` or `0` for the very first phase.
     */
    function phaseInfo(uint256 id)
        public
        view
        validPhaseId(id)
        returns (Phase memory)
    {
        return _idToPhase[id];
    }

    /**
     * Create a new token sale phase. Make sure, that this contract owns at least
     * the amount of tokens of the specified phase sale amount.
     * @param priceUsd Price in USDT/C for 1 full token unit (10^18). 
     *                 Since USDT and USDC support 6 decimals uint, this needs to be be specified
     *                 with 6 decimals uint, which means a value of 1 USDT/C needs to be specified as `1000000`
     *                 or a value of 0.5 USDT/C needs to be specigied as `500000`.
     * @param amount Phase sale volume in the tokens decimals unit, which is 18 digits. 
     *               For example, a phase sale amount of 1000 full token units needs to be specified as 
     *               `1000 * 10^18`
     */
    function createPhase(
        uint256 priceUsd,
        uint256 amount
    ) external onlyOwner {
        
        // check if current phase is closed
        if (phaseCounter > 0){
            Phase memory prevPhase = phaseInfo(phaseCounter - 1);
            require(prevPhase.closed, "Sale: Current phase is not closed.");
        }

        // check if the sale contract owns enough tokens for the phases amount
        require(token.balanceOf(address(this)) >= amount, "Sale: Sale contract does not own enough tokens.");


        Phase memory phase = Phase(
            block.timestamp,
            0,
            priceUsd,
            amount,
            0,
            false
        );
        _idToPhase[phaseCounter] = phase;
        phaseCounter = phaseCounter + 1;
    }

    /**
     * Close the current phase.
     */
    function closePhase() external onlyOwner phaseIsActive {
        Phase memory phase = _idToPhase[phaseCounter-1];
        phase.endTimestamp = block.timestamp;
        phase.closed = true;

        _idToPhase[phaseCounter-1] = phase;
    }

    /**
     * Withdraw the specified amount of tokens from this sale contract
     * to its owner.
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        token.transfer(owner(), amount);
    }

    /**
     * Use USDT to purchase tokens according to the token price that is specified
     * by the currently active phase.
     * The customer needs to ensure, that they set the appropriate USDT allowance
     * for this sale contract.
     */
    function purchaseUsdt(uint256 invest) external nonReentrant phaseIsActive {
        IERC20(0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7).transferFrom(msg.sender, owner(), invest);
        _purchase(invest);
    }

    /**
     * Use USDC to purchase tokens according to the token price that is specified
     * by the currently active phase.
     * The customer needs to ensure, that they set the appropriate USDT allowance
     * for this sale contract.
     */
    function purchaseUsdc(uint256 invest) external nonReentrant phaseIsActive {
        IERC20(0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E).transferFrom(msg.sender, owner(), invest);
        _purchase(invest);
    }

    function _purchase(uint256 invest) private {

        // check sale phase balance
        Phase memory phase = _idToPhase[phaseCounter-1];
        uint256 tokenValue = (invest / phase.priceUsd) * 1 ether;
        require(
            tokenValue <= (phase.amountTotal - phase.amountSold),
            "Sale: Purchase amount exceeds phase supply."
        );

        // send tokens to recipient
        token.transfer(msg.sender, tokenValue);

        // update phase
        phase.amountSold = phase.amountSold + tokenValue;
        _idToPhase[phaseCounter-1] = phase;
    }

    /**
     * Send back any native currency that is sent to this contract.
     */
    receive() external payable {
        payable(msg.sender).transfer(msg.value);
    }
}