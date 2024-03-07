import { BOTS, bot } from "@/src";
import { KEYBOARD } from "@/src/keyboard";

/** --------------------------------------------------- *
 *                      Menu handlers                   *
 * ---------------------------------------------------- */
export default function MenuHandlers() {
  // Главное меню
  bot.onText(/\/menu/, (msg) => {
    bot.sendMessage(msg.chat.id, "⚪️ Funding Rate Bots", {
      reply_markup: {
        keyboard: [
          [
            {
              text: BOTS.first.status === "stopped" ? KEYBOARD.startFirsBot : KEYBOARD.stopFirstBot,
            },
            {
              text:
                BOTS.second.status === "stopped" ? KEYBOARD.startSecondBot : KEYBOARD.stopSecondBot,
            },
          ],
          [
            {
              text: KEYBOARD.settingsFirstBot,
            },
            {
              text: KEYBOARD.settingsSecondBot,
            },
          ],
          // [
          //   {
          //     text: KEYBOARD.statusFirstBot,
          //   },
          //   {
          //     text: KEYBOARD.statusSecondBot,
          //   },
          // ],
          [
            {
              text: KEYBOARD.closeMenu,
            },
          ],
        ],
      },
    });
  });

  // Закрытие главного меню
  bot.onText(new RegExp(KEYBOARD.closeMenu), async (msg) => {
    await bot.sendMessage(msg.chat.id, "Меню закрыто", {
      reply_markup: {
        remove_keyboard: true,
      },
    });
  });
}
