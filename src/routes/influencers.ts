import { Router } from "express";
import { z } from "zod";
import { submit, treasury, func } from "../aptos.js";
import { db } from "../db.js";

export const influencers = Router();

const schema = z.object({
  addr: z.string(),
  contact: z.string(),
  category: z.string(),
  followers: z.number().int().nonnegative(),
  location: z.string(),
  base_price: z.number().int().nonnegative(),
  credibility: z.number().int().min(0).max(100)
});

influencers.post("/register", async (req, res) => {
  const body = schema.parse(req.body);
  // on-chain register (admin = treasury for demo)
  await submit(treasury, {
    function: func("register_influencer"),
    functionArguments: [
      body.addr, body.contact, body.category, body.followers, body.location, body.base_price, body.credibility
    ]
  });

  db.prepare(`INSERT OR REPLACE INTO influencers(addr, contact, category, followers, location, base_price, credibility)
              VALUES (@addr,@contact,@category,@followers,@location,@base_price,@credibility)`)
    .run(body);
  res.json({ ok: true });
});
