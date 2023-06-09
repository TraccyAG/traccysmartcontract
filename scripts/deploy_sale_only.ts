import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deploySale } from "./util";

async function main() {
  const deployer = (<SignerWithAddress[]>await ethers.getSigners())[0];
  await deploySale(deployer, "<token_address>");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
