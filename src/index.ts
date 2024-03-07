import TelegramBot from "node-telegram-bot-api";
import { commands } from "./commands.js";
import { BotsType } from "./types.js";
import dotenv from "dotenv";
import { Logger } from "./utils/logger.js";
import MenuHandlers from "@/src/utils/tg-actions/MenuHandlers.js";
import FirstBotHandlers from "@/src/utils/tg-actions/FirstBotHandlers.js";
import SecondBotHandlers from "@/src/utils/tg-actions/SecondBotHandler.js";

dotenv.config();

/** ============= Bootstrap ============= */
export const bot = new TelegramBot(process.env.API_KEY_BOT as string, {
  polling: {
    interval: 300,
    autoStart: true,
  },
});
bot.on("polling_error", (err) => Logger.error(err));
bot.setMyCommands(commands);

export const BOTS: BotsType = {
  first: {
    status: "stopped",
    settings: {
      NFRV: 0.01,
      CFRV: -0.02,
      updateInterval: 60 * 3,
    },
  },
  second: {
    status: "stopped",
    settings: {
      NFRV: 0.01,
      CFRV: -0.02,
      updateInterval: 60 * 3,
    },
  },
};

try {
  MenuHandlers();
  FirstBotHandlers();
  SecondBotHandlers();
  Logger.log("Bot is running");
} catch (error) {
  Logger.error(error);
}
