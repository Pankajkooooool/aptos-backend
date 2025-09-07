import { Router } from "express";
import { z } from "zod";
import { submit, treasury, func } from "../aptos.js";
import { db } from "../db.js";

export const sales = Router();

const schema = z.object({
  campaign_id: z.number().int(),
  amount: z.number().int().positive()
});

sales.post("/", async (req, res) => {
  const b = schema.parse(req.body);

  const chain = await submit(treasury, {
    function: func("record_sale"),
    functionArguments: [b.campaign_id, b.amount]
  });

  db.prepare(`INSERT INTO sales(campaign_id, influencer_addr, amount, ts)
              VALUES (@campaign_id, (SELECT json_extract(influencers, '$['||current_idx||']') FROM campaigns WHERE id=@campaign_id), @amount, strftime('%s','now'))`)
    .run({ campaign_id: b.campaign_id, amount: b.amount });

  res.json({ ok: true, chain: chain.hash });
});
