import { ethers } from "hardhat";
import { expect } from "chai";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractFactory } from "ethers";

import {
  TRCYN,
  PhaseableSale,
  IERC20Mock,
  IERC20Mock__factory,
} from "../typechain-types";

import { transferERC20From } from "./util/util";


describe("TRCYN PhaseableSale Tests", () => {

    const usdt: IERC20Mock = IERC20Mock__factory.connect("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", ethers.provider);
    const usdc: IERC20Mock = IERC20Mock__factory.connect("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", ethers.provider);

    let token: TRCYN;
    let sale: PhaseableSale;
    let accounts: SignerWithAddress[];
    let owner: SignerWithAddress;
    let customer1: SignerWithAddress;
    let customer2: SignerWithAddress;
    let customer3: SignerWithAddress;

    // configuring helper functions that drain ERC20 tokens from large volume wallets
    const getUsdt = async (to: string, amount: string) => {
        await transferERC20From(ethers.provider, usdt.address, "0x4aefa39caeadd662ae31ab0ce7c8c2c9c0a013e8", to, amount);
    }
    const getUsdc = async (to: string, amount: string) => {
        await transferERC20From(ethers.provider, usdc.address, "0x4aefa39caeadd662ae31ab0ce7c8c2c9c0a013e8", to, amount);
    }

    before(async () => {
        accounts = await ethers.getSigners();
        owner = accounts[0];
        customer1 = accounts[1];
        customer2 = accounts[2];
        customer3 = accounts[3];

        // deploy contracts
        const tokenFactory: ContractFactory = await ethers.getContractFactory("TRCYN", owner);
        token = (await tokenFactory.deploy()) as TRCYN;
        await token.deployed();

        const saleFactory: ContractFactory = await ethers.getContractFactory("PhaseableSale", owner);
        sale = (await saleFactory.deploy(token.address)) as PhaseableSale;
        await sale.deployed();

        // transfer usdt & usdc to customers
        await getUsdt(customer1.address, "100");
        await getUsdt(customer2.address, "100");
        await getUsdc(customer1.address, "100");
        await getUsdc(customer2.address, "100");
    });

    describe("phase creation", async () => {

        it("valid phase creation", async() => {
            const phaseTokenAmount = ethers.utils.parseEther("800000");
            const phaseTokenPrice = ethers.utils.parseUnits("0.25", 6);
            // send tokens to sale contract before phase creation
            await token.connect(owner).transfer(sale.address, phaseTokenAmount);
            // create phase
            await sale.connect(owner).createPhase(phaseTokenPrice, phaseTokenAmount);

            expect(await sale.phaseCounter()).to.eq(1);

            const phase = await sale.phaseInfo(0);
            expect(phase.priceUsd).to.eq(phaseTokenPrice);
            expect(phase.amountTotal).to.eq(phaseTokenAmount);
            expect(phase.amountSold).to.eq(BigNumber.from(0));
            expect(phase.closed).to.be.false;
        })
    })

    describe("sale", async () => {
        it("valid usdt sale", async() => {
            const investAmount = ethers.utils.parseUnits("10", 6);
            const tokenAmount = ethers.utils.parseEther("40");

            const customer1UsdtBalanceBefore = await usdt.balanceOf(customer1.address);
            const treasuryUsdtBalanceBefore =  await usdt.balanceOf(owner.address);
            const customerTokenBalanceBefore = await token.balanceOf(customer1.address);
            const saleTokenBalanceBefore = await token.balanceOf(sale.address);
            const phaseInfoBefore = await sale.phaseInfo(0);

            await usdt.connect(customer1).approve(sale.address, investAmount);
            await sale.connect(customer1).purchaseUsdt(investAmount);

            const customer1UsdtBalanceAfter = await usdt.balanceOf(customer1.address);
            const treasuryUsdtBalanceAfter =  await usdt.balanceOf(owner.address);
            const customerTokenBalanceAfter = await token.balanceOf(customer1.address);
            const saleTokenBalanceAfter = await token.balanceOf(sale.address);
            const phaseInfoAfter = await sale.phaseInfo(0);

            expect(customer1UsdtBalanceAfter).to.eq(customer1UsdtBalanceBefore.sub(investAmount));
            expect(treasuryUsdtBalanceAfter).to.eq(treasuryUsdtBalanceBefore.add(investAmount));
            expect(customerTokenBalanceAfter).to.eq(customerTokenBalanceBefore.add(tokenAmount));
            expect(saleTokenBalanceAfter).to.eq(saleTokenBalanceBefore.sub(tokenAmount));
            expect(phaseInfoAfter.amountSold).to.eq(phaseInfoBefore.amountSold.add(tokenAmount));
        })

        it("valid usdc sale", async() => {
            const investAmount = ethers.utils.parseUnits("10", 6);
            const tokenAmount = ethers.utils.parseEther("40");

            const customer1UsdcBalanceBefore = await usdc.balanceOf(customer1.address);
            const treasuryUsdcBalanceBefore =  await usdc.balanceOf(owner.address);
            const customerTokenBalanceBefore = await token.balanceOf(customer1.address);
            const saleTokenBalanceBefore = await token.balanceOf(sale.address);
            const phaseInfoBefore = await sale.phaseInfo(0);

            await usdc.connect(customer1).approve(sale.address, investAmount);
            await sale.connect(customer1).purchaseUsdc(investAmount);

            const customer1UsdcBalanceAfter = await usdc.balanceOf(customer1.address);
            const treasuryUsdcBalanceAfter =  await usdc.balanceOf(owner.address);
            const customerTokenBalanceAfter = await token.balanceOf(customer1.address);
            const saleTokenBalanceAfter = await token.balanceOf(sale.address);
            const phaseInfoAfter = await sale.phaseInfo(0);

            expect(customer1UsdcBalanceAfter).to.eq(customer1UsdcBalanceBefore.sub(investAmount));
            expect(treasuryUsdcBalanceAfter).to.eq(treasuryUsdcBalanceBefore.add(investAmount));
            expect(customerTokenBalanceAfter).to.eq(customerTokenBalanceBefore.add(tokenAmount));
            expect(saleTokenBalanceAfter).to.eq(saleTokenBalanceBefore.sub(tokenAmount));
            expect(phaseInfoAfter.amountSold).to.eq(phaseInfoBefore.amountSold.add(tokenAmount));
        })

        it("invalid sale (no allowance)", async () => {
            const investAmount = ethers.utils.parseUnits("10", 6);
            await (expect(sale.connect(customer2).purchaseUsdc(investAmount))).to.be.reverted;
        })

        it("invalid sale (not enough funds in wallet)", async () => {
            const investAmount = ethers.utils.parseUnits("10", 6);
            await usdc.connect(customer3).approve(sale.address, investAmount);
            await (expect(sale.connect(customer3).purchaseUsdc(investAmount))).to.be.reverted;
        })
    });

    describe("phase shift", async () => {
        it("close current phase", async () => {
            await sale.connect(owner).closePhase();
            const phaseInfoAfter = await sale.phaseInfo(0);

            expect(phaseInfoAfter.closed).to.be.true;
            
            // no more purchase possible
            const investAmount = ethers.utils.parseUnits("10", 6);
            await usdc.connect(customer1).approve(sale.address, investAmount);
            await (expect(sale.connect(customer1).purchaseUsdc(investAmount))).to.be.reverted;
        })

        it("create next phase", async () => {
            const phaseTokenAmount = ethers.utils.parseEther("800000");
            const phaseTokenPrice = ethers.utils.parseUnits("0.5", 6);
            // send tokens to sale contract before phase creation
            await token.connect(owner).transfer(sale.address, phaseTokenAmount);
            // create phase
            await sale.connect(owner).createPhase(phaseTokenPrice, phaseTokenAmount);

            expect(await sale.phaseCounter()).to.eq(2); 

            const phase = await sale.phaseInfo(1);
            expect(phase.priceUsd).to.eq(phaseTokenPrice);
            expect(phase.amountTotal).to.eq(phaseTokenAmount);
            expect(phase.amountSold).to.eq(BigNumber.from(0));
            expect(phase.closed).to.be.false;
        })

        it("valid purchase from new phase", async () => {
            const investAmount = ethers.utils.parseUnits("10", 6);
            const tokenAmount = ethers.utils.parseEther("20");

            const customer1UsdtBalanceBefore = await usdt.balanceOf(customer1.address);
            const treasuryUsdtBalanceBefore =  await usdt.balanceOf(owner.address);
            const customerTokenBalanceBefore = await token.balanceOf(customer1.address);
            const saleTokenBalanceBefore = await token.balanceOf(sale.address);
            const phaseInfoBefore = await sale.phaseInfo(1);

            await usdt.connect(customer1).approve(sale.address, investAmount);
            await sale.connect(customer1).purchaseUsdt(investAmount);

            const customer1UsdtBalanceAfter = await usdt.balanceOf(customer1.address);
            const treasuryUsdtBalanceAfter =  await usdt.balanceOf(owner.address);
            const customerTokenBalanceAfter = await token.balanceOf(customer1.address);
            const saleTokenBalanceAfter = await token.balanceOf(sale.address);
            const phaseInfoAfter = await sale.phaseInfo(1);

            expect(customer1UsdtBalanceAfter).to.eq(customer1UsdtBalanceBefore.sub(investAmount));
            expect(treasuryUsdtBalanceAfter).to.eq(treasuryUsdtBalanceBefore.add(investAmount));
            expect(customerTokenBalanceAfter).to.eq(customerTokenBalanceBefore.add(tokenAmount));
            expect(saleTokenBalanceAfter).to.eq(saleTokenBalanceBefore.sub(tokenAmount));
            expect(phaseInfoAfter.amountSold).to.eq(phaseInfoBefore.amountSold.add(tokenAmount));
        })
    });

    describe("others", async () => {
        it("withdraw remaining tokens", async () => {
            const saleTokenBalanceBefore = await token.balanceOf(sale.address);
            const treasuryTokenBalanceBefore = await token.balanceOf(owner.address);

            await sale.connect(owner).withdrawTokens(saleTokenBalanceBefore);

            const saleTokenBalanceAfter = await token.balanceOf(sale.address);
            const treasuryTokenBalanceAfter = await token.balanceOf(owner.address);
            expect(treasuryTokenBalanceAfter).to.eq(treasuryTokenBalanceBefore.add(saleTokenBalanceBefore));
            expect(saleTokenBalanceAfter).to.eq(0);
        })

        it("current phase must be closed before new phase", async () => {
            const phaseTokenAmount = ethers.utils.parseEther("800000");
            const phaseTokenPrice = ethers.utils.parseUnits("0.5", 6);
            await (expect(sale.connect(owner).createPhase(phaseTokenPrice, phaseTokenAmount))).to.be.reverted;
        })

        it("only owner can close/open phases", async () => {
            const phaseTokenAmount = ethers.utils.parseEther("10");
            const phaseTokenPrice = ethers.utils.parseUnits("1", 6);

            await (expect(sale.connect(customer1).closePhase())).to.be.reverted;

            await sale.connect(owner).closePhase();
            await token.connect(owner).transfer(sale.address, phaseTokenAmount);

            await (expect(sale.connect(customer1).createPhase(phaseTokenPrice, phaseTokenAmount))).to.be.reverted;
            await sale.connect(owner).createPhase(phaseTokenPrice, phaseTokenAmount);
        })

        it("purchase exceeds phase boundaries", async () => {
            const investAmount = ethers.utils.parseUnits("11", 6);
            await usdc.connect(customer1).approve(sale.address, investAmount);
            await (expect(sale.connect(customer1).purchaseUsdc(investAmount))).to.be.reverted;
        })

        it("only owner can withdraw remaining tokens", async () => {
            await (expect(sale.connect(customer1).withdrawTokens(BigNumber.from(1)))).to.be.reverted;
        });
    });
});
