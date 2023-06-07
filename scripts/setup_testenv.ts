import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployContracts } from "./util";

import { IERC20Mock, IERC20Mock__factory } from "../typechain-types";
import { transferERC20From } from "../test/util/util";

const usdt: IERC20Mock = IERC20Mock__factory.connect(
  "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
  ethers.provider
);
const usdc: IERC20Mock = IERC20Mock__factory.connect(
  "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  ethers.provider
);

// configuring helper functions that drain ERC20 tokens from large volume wallets
const getUsdt = async (to: string, amount: string) => {
  await transferERC20From(
    ethers.provider,
    usdt.address,
    "0x4aefa39caeadd662ae31ab0ce7c8c2c9c0a013e8",
    to,
    amount
  );
};
const getUsdc = async (to: string, amount: string) => {
  await transferERC20From(
    ethers.provider,
    usdc.address,
    "0x4aefa39caeadd662ae31ab0ce7c8c2c9c0a013e8",
    to,
    amount
  );
};

async function main() {
  const testWallets = <SignerWithAddress[]>await ethers.getSigners();
  const deployer = testWallets[0];
  const customer = testWallets[1];


  // deploy contract 
  const contracts = await deployContracts(deployer);

  // load funds to customer
  await getUsdt(customer.address, "1000");
  await getUsdc(customer.address, "1000");

  // create first phase
  contracts.token.connect(deployer).transfer(contracts.sale.address, ethers.utils.formatEther("80000"));
  contracts.sale.connect(deployer).createPhase(ethers.utils.parseUnits("0.25", 6), ethers.utils.formatEther("80000"));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
