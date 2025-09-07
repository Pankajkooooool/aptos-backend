import { aptos, treasury } from "../aptos.js";
import { notify } from "./notifier.js";

export async function getAptBalance(address: string) {
  try {
    const res = await aptos.getAccountCoinAmount({ accountAddress: address, coinType: "0x1::aptos_coin::AptosCoin" });
    return BigInt(res);
  } catch { return 0n; }
}

export async function maybeTopupAlert() {
  const min = BigInt(process.env.MIN_TREASURY_BALANCE || "0");
  if (min === 0n) return;
  const bal = await getAptBalance(treasury.accountAddress.toString());
  if (bal < min) {
    await notify(`⚠️ Treasury low: balance=${bal.toString()} octas. Please top up.`);
  }
}

// mock payout; replace with a real on-chain transfer call if desired
export async function payInfluencer(toAddr: string, amount: bigint, campaignId: number, reason: string) {
  await notify(`💸 Auto-paying ${amount} (units) to ${toAddr} for Campaign #${campaignId} (${reason})`);
  // For a real transfer using APT:
  // await aptos.transferCoinTransaction({ sender: treasury, recipient: toAddr, amount: Number(amount), coinType: "0x1::aptos_coin::AptosCoin" })
}
