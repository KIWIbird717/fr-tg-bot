import TelegramBot from "node-telegram-bot-api";
import { FundingRateAnalisator } from "./utils/funding-rate.ts/index.ts.js";
import { commands } from "./commands.js";
import { BOTType } from "./types.js";
import dotenv from "dotenv";
import { Logger } from "./utils/logger.js";

dotenv.config();

try {
  const bot = new TelegramBot(process.env.API_KEY_BOT as string, {
    polling: {
      interval: 300,
      autoStart: true,
    },
  });

  const CONFIG = {
    bot: {
      NFRV: 0.01,
      CFRV: -0.02,
      updateInterval: 60 * 3,
    },
  };
  const BOT: BOTType = {
    runningFlag: false,
  };

  bot.on("polling_error", (err) => Logger.log(err));
  bot.setMyCommands(commands);

  // Обработчик для команды /set_cfrv
  bot.onText(/\/set_cfrv (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (!match) return;
    const cfrv = parseFloat(match[1]);

    if (!isNaN(cfrv)) {
      CONFIG.bot.CFRV = cfrv;
      bot.sendMessage(
        chatId,
        `✅ Значение <b>CFRV</b> успешно обновлено: <b>${CONFIG.bot.CFRV}</b>`,
        { parse_mode: "HTML" },
      );
    } else {
      bot.sendMessage(chatId, `❌ ошибка: '${match[1]}' не является числом.`);
    }
  });
  bot.on("text", async (msg) => {
    if (msg.text !== "/set_cfrv") return;
    await bot.sendMessage(
      msg.chat.id,
      "❌ ошибка: Не было передано значение CFRV \n\nПример использования: /set_cfrv -0.02",
    );
  });

  // Обработчик для команды /set_nfrv
  bot.onText(/\/set_nfrv (.+)/, (msg, match) => {
    if (!match) return;
    const chatId = msg.chat.id;
    const nfrv = parseFloat(match[1]);

    if (!isNaN(nfrv)) {
      CONFIG.bot.NFRV = nfrv;
      bot.sendMessage(
        chatId,
        `✅ Значение <b>NFRV</b> успешно обновлено: <b>${CONFIG.bot.NFRV}</b>`,
      );
    } else {
      bot.sendMessage(chatId, `Ошибка: '${match[1]}' не является числом.`);
    }
  });
  bot.on("text", async (msg) => {
    if (msg.text !== "/set_nfrv") return;
    await bot.sendMessage(
      msg.chat.id,
      "❌ ошибка: Не было передано значение NFRV \n\nПример использования: /set_nfrv 0.02",
    );
  });

  // Обработчик для команды /set_update_interval
  bot.onText(/\/set_update_interval (.+)/, (msg, match) => {
    if (!match) return;
    const chatId = msg.chat.id;
    const updateInterval = parseInt(match[1]);

    if (!isNaN(updateInterval)) {
      CONFIG.bot.updateInterval = updateInterval;
      bot.sendMessage(
        chatId,
        `✅ Значение <b>updateInterval</b> успешно обновлено: <b>${CONFIG.bot.updateInterval}</b>`,
      );
    } else {
      bot.sendMessage(chatId, `Ошибка: '${match[1]}' не является числом.`);
    }
  });

  // Обработчик для команды /see_config
  bot.onText(/\/see_config/, (msg) => {
    const chatId = msg.chat.id;
    let settings = "";
    for (const key in CONFIG.bot) {
      settings += `• ${key}: <b>${CONFIG.bot[key as keyof (typeof CONFIG)["bot"]]}</b>\n`;
    }
    bot.sendMessage(chatId, `⚙️ <b>Текущие значения настройки бота:</b> \n\n${settings}`, {
      parse_mode: "HTML",
    });
  });

  // Обработчик для команды /start_bot
  bot.onText(/\/start_bot/, (msg) => {
    const chatId = msg.chat.id;
    BOT.runningFlag = true;
    bot.sendMessage(chatId, "🟢 <b>Бот запущен</b> 🟢", { parse_mode: "HTML" });

    const funding = new FundingRateAnalisator({
      CFRV: CONFIG.bot.CFRV,
      NFRV: CONFIG.bot.NFRV,
    });

    const interval = setInterval(async () => {
      if (!BOT.runningFlag) {
        clearInterval(interval);
      }
      await funding.analise();
      const uniqueSymbols = funding.getSymbolsAvaliableToEnter;
      Logger.log("uniqueSymbols", uniqueSymbols);

      if (uniqueSymbols.length > 0) {
        console.log(uniqueSymbols, uniqueSymbols.length);
        let symbols_message = "";
        for (const symbol of uniqueSymbols) {
          symbols_message += `• <b>${symbol.symbol}</b>   FR: ${
            Number(symbol.lastFundingRate) * 100
          }\n`;
        }
        const currTime = `Время: ${new Date().toLocaleTimeString("ru-RU")}`;
        await bot.sendMessage(
          chatId,
          `📈 <b>Обновлен список монет доступных для входа</b> \n\n${symbols_message}\n${currTime}`,
          { parse_mode: "HTML" },
        );
      }
    }, 1000 * CONFIG.bot.updateInterval);
  });

  // Обработчик для команды /stop_bot
  bot.onText(/\/stop_bot/, (msg) => {
    const chatId = msg.chat.id;
    BOT.runningFlag = false;
    bot.sendMessage(chatId, "🔴 <b>Бот остановлен</b> 🔴", { parse_mode: "HTML" });
  });

  Logger.log("Bot is running");
} catch (error) {
  Logger.error(error);
}
