import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TRCYN, TRCYN__factory, PhaseableSale, PhaseableSale__factory } from "../typechain-types";

export const deployToken = async (deployer: SignerWithAddress) => {

  console.log("Deploying token contract ...");

  const tokenFactory: TRCYN__factory = <TRCYN__factory>(
    await ethers.getContractFactory("TRCYN")
  );
  const token: TRCYN = <TRCYN>(await tokenFactory.deploy());
  console.log("Token address:", token.address);
  return token;
}

export const deploySale = async (deployer: SignerWithAddress, tokenAddress: string) => {

  console.log("Deploying sale contract ...");
  const saleFactory: PhaseableSale__factory = <PhaseableSale__factory>(
    await ethers.getContractFactory("PhaseableSale")
  );
  const sale: PhaseableSale = <PhaseableSale>(await saleFactory.deploy(tokenAddress));
  console.log("Sale address:", sale.address);
  return sale;
}

export const deployContracts = async (deployer: SignerWithAddress) => {
  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance before:",(await deployer.getBalance()).toString());

  const token: TRCYN = await deployToken(deployer);
  const sale: PhaseableSale = await deploySale(deployer, token.address);

  console.log("Account balance after:",(await deployer.getBalance()).toString());

  return {token: token, sale: sale}
};