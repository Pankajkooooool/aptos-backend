import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import "dotenv/config";

// pick network from env
const network =
  process.env.APTOS_NETWORK?.toLowerCase() === "mainnet"
    ? Network.MAINNET
    : process.env.APTOS_NETWORK?.toLowerCase() === "devnet"
    ? Network.DEVNET
    : Network.TESTNET;

// configure client
export const aptos = new Aptos(
  new AptosConfig({
    network,
    fullnode: process.env.APTOS_NODE, // optional override
  })
);

// module info
export const moduleAddr = process.env.MODULE_ADDRESS!;
export const moduleName = process.env.MODULE_NAME ?? "influencer_mkt";

// load treasury account

export const treasury = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.TREASURY_PRIVATE_KEY!)
});


// helper to fully qualify functions
export function func(name: string) {
  return `${moduleAddr}::${moduleName}::${name}`;
}

// submit a transaction
export async function submit(account: Account, payload: any) {
  // build
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress.toString(),
    data: payload,
  });

  // sign + submit
  const committed = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  // wait until executed
  return aptos.waitForTransaction({ transactionHash: committed.hash });
}
