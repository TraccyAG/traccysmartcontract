import { ethers } from "hardhat";
import { JsonRpcProvider } from "@ethersproject/providers";

import {
    IERC20Mock__factory,
  } from "../../typechain-types";

/**
 * Drain specified amount of an ERC20 token from a wallet to an receiving wallet.
 * This function can be used when you fork a network and want to test with actual tokens.
 */
export const transferERC20From = async (provider: JsonRpcProvider, tokenAddr: string, fromAddr: string, toAddr: string, amount: string) => {
    const token =  IERC20Mock__factory.connect(tokenAddr, provider);
    const signer = await ethers.getImpersonatedSigner(fromAddr);
    await token.connect(signer).transfer(toAddr, ethers.utils.parseUnits(amount, await token.decimals()));
}