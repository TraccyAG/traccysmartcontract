import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployContracts } from "./util";

async function main() {
  const deployer = (<SignerWithAddress[]>await ethers.getSigners())[0];
  await deployContracts(deployer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
