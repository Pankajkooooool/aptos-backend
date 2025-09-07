import axios from "axios";

const tgToken = process.env.TELEGRAM_BOT_TOKEN!;
const chatId = process.env.TELEGRAM_CHAT_ID!;

export async function notify(msg: string) {
  if (!tgToken || !chatId) return;
  await axios.post(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
    chat_id: chatId, text: msg, parse_mode: "Markdown"
  }).catch(() => {});
}
