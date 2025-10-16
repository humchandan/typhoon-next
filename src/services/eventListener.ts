import { ethers } from "ethers";
import { pool } from "../pages/api/db";
import contractAbi from "../contracts/TyphoonABI.json";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS not set in environment");
}

// Create provider and contract instance
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);

// Event listener functions
export class EventListenerService {
  private isListening = false;

  // Start listening to all events
  async startListening() {
    if (this.isListening) {
      console.log("Event listener already running");
      return;
    }

    this.isListening = true;
    console.log("🎧 Starting event listeners...");

    // Listen to SnowballPurchased events
    contract.on("SnowballPurchased", async (blockId, buyer, quantity, totalPaid, event) => {
      console.log("📦 SnowballPurchased event detected");
      await this.handleSnowballPurchased(blockId, buyer, quantity, totalPaid, event);
    });

    // Listen to ReferrerSet events
    contract.on("ReferrerSet", async (user, referrer, event) => {
      console.log("🔗 ReferrerSet event detected");
      await this.handleReferrerSet(user, referrer, event);
    });

    // Listen to ReferralBonusAccrued events
    contract.on("ReferralBonusAccrued", async (referrer, level, amount, event) => {
      console.log("💰 ReferralBonusAccrued event detected");
      await this.handleReferralBonusAccrued(referrer, level, amount, event);
    });

    // Listen to RewardPaid events
    contract.on("RewardPaid", async (blockId, user, rewardAmount, event) => {
      console.log("🎁 RewardPaid event detected");
      await this.handleRewardPaid(blockId, user, rewardAmount, event);
    });

    // Listen to ReferralRewardsClaimed events
    contract.on("ReferralRewardsClaimed", async (user, amount, event) => {
      console.log("💵 ReferralRewardsClaimed event detected");
      await this.handleReferralRewardsClaimed(user, amount, event);
    });

    // Listen to BlockCreated events
    contract.on("BlockCreated", async (blockId, snowballCount, event) => {
      console.log("🆕 BlockCreated event detected");
      await this.handleBlockCreated(blockId, snowballCount, event);
    });

    // Listen to BlockFullyClaimed events
    contract.on("BlockFullyClaimed", async (blockId, timestamp, event) => {
      console.log("✅ BlockFullyClaimed event detected");
      await this.handleBlockFullyClaimed(blockId, timestamp, event);
    });

    console.log("✅ All event listeners started successfully");
  }

  // Stop listening
  stopListening() {
    contract.removeAllListeners();
    this.isListening = false;
    console.log("🛑 Event listeners stopped");
  }

  // Handler for SnowballPurchased event
  private async handleSnowballPurchased(
    blockId: bigint,
    buyer: string,
    quantity: bigint,
    totalPaid: bigint,
    event: any
  ) {
    try {
      const txHash = event.log.transactionHash;
      const blockNumber = event.log.blockNumber;

      // Get user from database
      const [users] = await pool.execute(
        "SELECT id FROM users WHERE walletAddress = ?",
        [buyer]
      );

      if ((users as any[]).length === 0) {
        console.log(`User ${buyer} not found in database`);
        return;
      }

      const userId = (users as any[])[0].id;

      // Insert or update purchase record
      await pool.execute(
        `INSERT INTO purchases (userId, walletAddress, snowballsPurchased, totalBlockSize, blockNumber, transactionHash)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE snowballsPurchased = snowballsPurchased + VALUES(snowballsPurchased)`,
        [userId, buyer, Number(quantity), Number(quantity), blockNumber, txHash]
      );

      // Update user's totalPurchase
      const totalPaidInINRT = ethers.formatUnits(totalPaid, 18);
      await pool.execute(
        "UPDATE users SET totalPurchase = totalPurchase + ? WHERE id = ?",
        [totalPaidInINRT, userId]
      );

      console.log(`✅ Recorded purchase: ${quantity} snowballs by ${buyer}`);
    } catch (error) {
      console.error("Error handling SnowballPurchased:", error);
    }
  }

  // Handler for ReferrerSet event
  private async handleReferrerSet(user: string, referrer: string, event: any) {
    try {
      // Update user's sponsor in database
      const [referrerData] = await pool.execute(
        "SELECT referralId FROM users WHERE walletAddress = ?",
        [referrer]
      );

      if ((referrerData as any[]).length === 0) {
        console.log(`Referrer ${referrer} not found`);
        return;
      }

      const sponsorReferralId = (referrerData as any[])[0].referralId;

      await pool.execute(
        "UPDATE users SET sponsorReferralId = ? WHERE walletAddress = ?",
        [sponsorReferralId, user]
      );

      // Increment sponsor's directCount
      await pool.execute(
        "UPDATE users SET directCount = directCount + 1 WHERE referralId = ?",
        [sponsorReferralId]
      );

      console.log(`✅ Referrer set: ${user} -> ${referrer}`);
    } catch (error) {
      console.error("Error handling ReferrerSet:", error);
    }
  }

  // Handler for ReferralBonusAccrued event
  private async handleReferralBonusAccrued(
    referrer: string,
    level: bigint,
    amount: bigint,
    event: any
  ) {
    try {
      const amountInINRT = ethers.formatUnits(amount, 18);

      // Update user's referral earnings
      await pool.execute(
        "UPDATE users SET totalReferralEarnings = totalReferralEarnings + ? WHERE walletAddress = ?",
        [amountInINRT, referrer]
      );

      console.log(`✅ Referral bonus: ${amountInINRT} INRT for ${referrer} at level ${level}`);
    } catch (error) {
      console.error("Error handling ReferralBonusAccrued:", error);
    }
  }

  // Handler for RewardPaid event
  private async handleRewardPaid(
    blockId: bigint,
    user: string,
    rewardAmount: bigint,
    event: any
  ) {
    try {
      const rewardInINRT = ethers.formatUnits(rewardAmount, 18);

      console.log(`✅ Reward paid: ${rewardInINRT} INRT to ${user} for block ${blockId}`);
    } catch (error) {
      console.error("Error handling RewardPaid:", error);
    }
  }

  // Handler for ReferralRewardsClaimed event
  private async handleReferralRewardsClaimed(user: string, amount: bigint, event: any) {
    try {
      const amountInINRT = ethers.formatUnits(amount, 18);

      // Update user's claimed referral rewards
      await pool.execute(
        "UPDATE users SET totalReferralClaimed = totalReferralClaimed + ? WHERE walletAddress = ?",
        [amountInINRT, user]
      );

      console.log(`✅ Referral rewards claimed: ${amountInINRT} INRT by ${user}`);
    } catch (error) {
      console.error("Error handling ReferralRewardsClaimed:", error);
    }
  }

  // Handler for BlockCreated event
  private async handleBlockCreated(blockId: bigint, snowballCount: bigint, event: any) {
    try {
      console.log(`✅ New block created: Block #${blockId} with ${snowballCount} snowballs`);
    } catch (error) {
      console.error("Error handling BlockCreated:", error);
    }
  }

  // Handler for BlockFullyClaimed event
  private async handleBlockFullyClaimed(blockId: bigint, timestamp: bigint, event: any) {
    try {
      console.log(`✅ Block fully claimed: Block #${blockId} at ${new Date(Number(timestamp) * 1000)}`);
    } catch (error) {
      console.error("Error handling BlockFullyClaimed:", error);
    }
  }
}

// Singleton instance
export const eventListener = new EventListenerService();
