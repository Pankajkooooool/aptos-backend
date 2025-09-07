import { aptos, moduleAddr, moduleName } from "../aptos.ts";
import { notify } from "./notifier.js";
import { payInfluencer, maybeTopupAlert } from "./treasury.ts";

type Event = { guid: { creation_number: string, account_address: string }, sequence_number: string, type: string, data: any };

let cursor: string | undefined;

export async function startListener() {
  setInterval(async () => {
    try {
      const events = await aptos.getAccountEvents({
        accountAddress: moduleAddr,
        eventHandle: `${moduleAddr}::${moduleName}::EventHandles`,
        fieldName: "payout_evt", // we’ll pull different streams one by one
        query: { start: cursor ? Number(cursor)+1 : 0, limit: 100 }
      }) as unknown as Event[];

      if (events.length > 0) cursor = events.at(-1)!.sequence_number;

      for (const e of events) {
        if (e.type.endsWith("::PayoutReleased")) {
          const { campaign_id, influencer, amount, reason } = e.data as any;
          await notify(`✅ Payout event: Campaign #${campaign_id} → ${influencer} amount=${amount} reason=${reason}`);
          // Trigger actual payment from treasury (off-chain payment or on-chain transfer)
          await payInfluencer(influencer, BigInt(amount), Number(campaign_id), reason);
        }
      }

      // Optional: also watch reassign / assigned to DM influencers (repeat similar calls with fieldName)
      await maybeTopupAlert();
    } catch (err) {
      // swallow to keep loop going
    }
  }, 4000);
}
