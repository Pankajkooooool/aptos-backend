import { Router } from "express";
import { z } from "zod";
import { submit, treasury, func } from "../aptos.js";
import { db } from "../db.js";

export const campaigns = Router();

const createSchema = z.object({
  merchant_addr: z.string(),
  title: z.string(), description: z.string().default(""),
  image: z.string().default(""),
  kpi_target: z.number().int().positive(),
  window_secs: z.number().int().positive(),
  base_fee: z.number().int().nonnegative(),
  bonus_fee: z.number().int().nonnegative(),
  budget_hint: z.number().int().nonnegative(),
  thresholds: z.array(z.number().int().nonnegative()),
  influencers: z.array(z.string()).min(1)
});

campaigns.get('/', (req, res) => {
  const rows = db.prepare("SELECT * FROM campaigns").all();
  return rows
});

campaigns.post("/", async (req, res) => {
  const b = createSchema.parse(req.body);

  const r = await submit(treasury, {
    function: func("create_campaign"),
    functionArguments: [
      b.merchant_addr, b.title, b.description, b.image,
      b.kpi_target, b.window_secs, b.base_fee, b.bonus_fee,
      b.budget_hint, b.thresholds, b.influencers
    ]
  });

  // naive extract id from chain? for hackathon, just autoincrement locally
  const id = (db.prepare("SELECT IFNULL(MAX(id),0)+1 AS id FROM campaigns").get() as any).id;

  db.prepare(`INSERT INTO campaigns(id,title,description,image,kpi_target,window_secs,base_fee,bonus_fee,budget_hint,thresholds,influencers,merchant_addr,status,start_ts)
              VALUES (@id,@title,@description,@image,@kpi_target,@window_secs,@base_fee,@bonus_fee,@budget_hint,@thresholds,@influencers,@merchant,'Active',strftime('%s','now'))`)
    .run({
      id, title: b.title, description: b.description, image: b.image,
      kpi_target: b.kpi_target, window_secs: b.window_secs,
      base_fee: b.base_fee, bonus_fee: b.bonus_fee, budget_hint: b.budget_hint,
      thresholds: JSON.stringify(b.thresholds),
      influencers: JSON.stringify(b.influencers),
      merchant: b.merchant_addr
    });

  res.json({ ok: true, id, chain: r.hash });
});

campaigns.post("/:id/evaluate", async (req, res) => {
  const id = Number(req.params.id);
  const r = await submit(treasury, { function: func("evaluate_and_maybe_reassign"), functionArguments: [id] });
  res.json({ ok: true, chain: r.hash });
});

campaigns.post("/:id/finalize", async (req, res) => {
  const id = Number(req.params.id);
  const r = await submit(treasury, { function: func("finalize_and_payout"), functionArguments: [id] });
  res.json({ ok: true, chain: r.hash });
});
