import { Router } from "express";
import { db } from "../db.js";
import { predictNext } from "../services/predictor.js";

export const reports = Router();

reports.get("/campaign/:id/metrics", (req, res) => {
  const id = Number(req.params.id);
  const c = db.prepare("SELECT * FROM campaigns WHERE id=?").get(id) as any;
  if (!c) return res.status(404).json({ error: "not found" });

  const rows = db.prepare("SELECT * FROM sales WHERE campaign_id=? ORDER BY ts").all(id) as any[];
  const total = rows.reduce((a,r)=>a + r.amount, 0);

  // naive “ROI per influencer” & CPC, needs your denom conventions
  const perInfluencer: Record<string, any> = {};
  for (const r of rows) {
    perInfluencer[r.influencer_addr] ??= { amount: 0, txs: 0 };
    perInfluencer[r.influencer_addr].amount += r.amount;
    perInfluencer[r.influencer_addr].txs += 1;
  }

  const thresholds: number[] = JSON.parse(c.thresholds || "[]");
  const influencers: string[] = JSON.parse(c.influencers || "[]");

  // prediction: simple OLS on sales over time buckets
  const times = rows.map(r => r.ts);
  const values = rows.map(r => r.amount);
  const predictedNext = predictNext(times.length ? times : [0,1], values.length ? values : [0,0]);

  res.json({
    id, title: c.title, kpi_target: c.kpi_target,
    total_sales: total,
    influencers,
    per_influencer: perInfluencer,
    thresholds,
    prediction_next_tick: Math.max(0, Math.round(predictedNext)),
    cost_per_conversion_hint: c.base_fee ? (c.base_fee / Math.max(1, total)) : null
  });
});
