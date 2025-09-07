import Database from "better-sqlite3";

export const db = new Database("data.db");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS influencers (
  addr TEXT PRIMARY KEY,
  contact TEXT, category TEXT, followers INTEGER, location TEXT,
  base_price INTEGER, credibility INTEGER
);
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY,
  title TEXT, description TEXT, image TEXT,
  kpi_target INTEGER, window_secs INTEGER,
  base_fee INTEGER, bonus_fee INTEGER,
  budget_hint INTEGER, thresholds TEXT,       -- JSON array of numbers
  influencers TEXT,                           -- JSON array of addresses
  merchant_addr TEXT,
  status TEXT DEFAULT 'Active',
  current_idx INTEGER DEFAULT 0,
  start_ts INTEGER
);
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER,
  influencer_addr TEXT,
  amount INTEGER,
  ts INTEGER
);
CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT);
`);
