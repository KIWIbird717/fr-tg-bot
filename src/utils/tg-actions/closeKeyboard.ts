import { bot } from "../../../src";
import TelegramBot from "node-telegram-bot-api";

// Закрытие главного меню
export const closeKeyboard = (msg: TelegramBot.Message, text = "Меню закрыто") => {
  bot.sendMessage(msg.chat.id, text, {
    reply_markup: {
      remove_keyboard: true,
    },
  });
};
