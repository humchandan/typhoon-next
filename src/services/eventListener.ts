import { ethers } from "ethers";
import { pool } from "../pages/api/db";
import contractAbi from "../contracts/TyphoonABI.json";

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const WS_URL = process.env.NEXT_PUBLIC_WS_RPC_URL || "wss://api.avax-test.network/ext/bc/C/ws";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

if (!CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS not set in environment");
}

// Create WebSocket provider for real-time events
let provider: ethers.WebSocketProvider | ethers.JsonRpcProvider;
let contract: ethers.Contract;

try {
  // Try WebSocket first
  provider = new ethers.WebSocketProvider(WS_URL);
  console.log("✅ Using WebSocket provider");
} catch (error) {
  // Fallback to HTTP with polling
  provider = new ethers.JsonRpcProvider(RPC_URL);
  console.log("⚠️ WebSocket unavailable, using HTTP provider with polling");
}

contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider);

export class EventListenerService {
  private isListening = false;
  private lastProcessedBlock: number = 0;
  private pollingInterval: NodeJS.Timeout | null = null;

  async startListening() {
    if (this.isListening) {
      console.log("Event listener already running");
      return;
    }

    this.isListening = true;
    console.log("🎧 Starting event listeners...");

    // Get current block number to start from
    const currentBlock = await provider.getBlockNumber();
    this.lastProcessedBlock = currentBlock;
    console.log(`📍 Starting from block: ${currentBlock}`);

    // Use queryFilter with block range polling instead of live filters
    this.startPolling();

    console.log("✅ Event listener started with polling mechanism");
  }

  private startPolling() {
    // Poll every 10 seconds for new events
    this.pollingInterval = setInterval(async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        
        if (currentBlock > this.lastProcessedBlock) {
          console.log(`🔍 Checking blocks ${this.lastProcessedBlock + 1} to ${currentBlock}`);
          await this.processBlockRange(this.lastProcessedBlock + 1, currentBlock);
          this.lastProcessedBlock = currentBlock;
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 10000); // Poll every 10 seconds
  }

  private async processBlockRange(fromBlock: number, toBlock: number) {
    try {
      // Query all events in the block range
      const events = [
        { name: "SnowballPurchased", handler: this.handleSnowballPurchased.bind(this) },
        { name: "ReferrerSet", handler: this.handleReferrerSet.bind(this) },
        { name: "ReferralBonusAccrued", handler: this.handleReferralBonusAccrued.bind(this) },
        { name: "RewardPaid", handler: this.handleRewardPaid.bind(this) },
        { name: "ReferralRewardsClaimed", handler: this.handleReferralRewardsClaimed.bind(this) },
        { name: "BlockCreated", handler: this.handleBlockCreated.bind(this) },
        { name: "BlockFullyClaimed", handler: this.handleBlockFullyClaimed.bind(this) },
      ];

      for (const eventConfig of events) {
        const filter = contract.filters[eventConfig.name]();
        const eventLogs = await contract.queryFilter(filter, fromBlock, toBlock);

        for (const log of eventLogs) {
          console.log(`📦 ${eventConfig.name} event detected in block ${log.blockNumber}`);
          await eventConfig.handler(...log.args, log);
        }
      }
    } catch (error) {
      console.error("Error processing block range:", error);
    }
  }

  stopListening() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
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
      const txHash = event.transactionHash;
      const blockNumber = event.blockNumber;

      // Get user from database
      const [users] = await pool.execute(
        "SELECT id FROM users WHERE walletAddress = ?",
        [buyer]
      );

      if ((users as any[]).length === 0) {
        console.log(`User ${buyer} not found in database, skipping`);
        return;
      }

      const userId = (users as any[])[0].id;

      // Check if already recorded
      const [existing] = await pool.execute(
        "SELECT id FROM purchases WHERE transactionHash = ?",
        [txHash]
      );

      if ((existing as any[]).length > 0) {
        return; // Already processed
      }

      // Insert purchase record
      await pool.execute(
        `INSERT INTO purchases (userId, walletAddress, snowballsPurchased, totalBlockSize, blockNumber, transactionHash)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, buyer, Number(quantity), Number(quantity), blockNumber, txHash]
      );

      // Update user's totalPurchase
      const totalPaidInINRT = ethers.formatUnits(totalPaid, 18);
      await pool.execute(
        "UPDATE users SET totalPurchase = totalPurchase + ? WHERE id = ?",
        [totalPaidInINRT, userId]
      );

      console.log(`✅ Recorded purchase: ${quantity} snowballs by ${buyer} in block ${blockNumber}`);
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
        "UPDATE users SET sponsorReferralId = ? WHERE walletAddress = ? AND sponsorReferralId IS NULL",
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

export const eventListener = new EventListenerService();
