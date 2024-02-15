import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("SaveEth Test", function () {
  async function deploySaveEth() {
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;

    const [owner, addr1, addr2] = await ethers.getSigners();

    const SaveEth = await ethers.getContractFactory("SaveEth");
    const saveEth = await SaveEth.deploy();

    const depositAmount = await ethers.parseEther("3");
    const deployedAccount = await saveEth
      .connect(owner)
      .deposit({ value: depositAmount });

    return {
      saveEth,
      owner,
      addr1,
      addr2,
      lockedAmount,
      depositAmount,
      deployedAccount,
    };
  }

  describe("Testing the functions", () => {
    it("should check if balance is 3 ETH", async () => {
      const { saveEth, depositAmount } = await loadFixture(deploySaveEth);
      const balance = await saveEth.checkBalance();

      expect(balance).to.equal(depositAmount);
    });

    it("should allow deposits", async function () {
      const { saveEth, depositAmount, addr1 } = await loadFixture(
        deploySaveEth
      );

      await saveEth.connect(addr1).deposit({ value: depositAmount });
      expect(await saveEth.checkSavings(addr1.address)).to.equal(depositAmount);
    });

    it("should not allow zero value deposits", async function () {
      const { saveEth, addr1 } = await loadFixture(deploySaveEth);
      await expect(
        saveEth.connect(addr1).deposit({ value: 0 })
      ).to.be.revertedWith("cannot save 0 value");
    });

    it("should check savings", async () => {
      const { saveEth, depositAmount, owner } = await loadFixture(
        deploySaveEth
      );
      const balance = await saveEth.checkSavings(owner.address);

      expect(balance).to.equal(depositAmount);
    });

    it("should allow withdrawals", async function () {
      const { saveEth, depositAmount, addr1 } = await loadFixture(
        deploySaveEth
      );
      await saveEth.connect(addr1).deposit({ value: depositAmount });
      await saveEth.connect(addr1).withdraw();
      expect(await saveEth.checkSavings(addr1.address)).to.equal(0);
    });

    it("should not allow withdrawals if no savings", async function () {
      const { saveEth, addr1 } = await loadFixture(deploySaveEth);
      await expect(saveEth.connect(addr1).withdraw()).to.be.revertedWith(
        "You don't have any savings"
      );
    });
  });

  describe("SendOutSavings", function () {
    it("should transfer savings to the specified receiver", async function () {
      const { owner, saveEth, addr1 } = await loadFixture(deploySaveEth);

      await saveEth.deposit({ value: ethers.parseEther("2.0") });

      //First deposit
      const firstBal = await saveEth.checkSavings(owner.address);
      // Send funds to receiver
      const sendAmount = ethers.parseEther("1.0");
      await saveEth.sendOutSavings(addr1.address, sendAmount);

      // Verify sender's savings
      const senderBalance = await saveEth.checkSavings(owner.address);
      expect(senderBalance).to.equal(firstBal - sendAmount);
    });

    it("should revert if sender has insufficient savings", async function () {
      const { saveEth, addr1, addr2 } = await loadFixture(deploySaveEth);

      // Attempt to transfer more savings than addr1 has
      const transferAmount = ethers.parseEther("1");
      await expect(
        saveEth.connect(addr1).sendOutSavings(addr2.address, transferAmount)
      ).to.be.revertedWith("You do not have enough value to transfer");
    });

    it("should revert if amount is zero", async function () {
      const { saveEth, addr1, addr2 } = await loadFixture(deploySaveEth);

      // Attempt to transfer zero savings
      await expect(
        saveEth.connect(addr1).sendOutSavings(addr2.address, 0)
      ).to.be.revertedWith("Can not send 0 value");
    });

    it("should revert if receiver address is zero", async function () {
      const { saveEth, addr1 } = await loadFixture(deploySaveEth);

      const transferAmount = ethers.parseEther("1");
      await expect(
        saveEth
          .connect(addr1)
          .sendOutSavings(
            "0x0000000000000000000000000000000000000000",
            transferAmount
          )
      ).to.be.revertedWith("You do not have enough value to transfer");
    });
  });
});
