import TelegramBot from "node-telegram-bot-api";
import { FundingRateAnalisator } from "../funding-rate.ts/index.ts";
import { Logger } from "../logger.js";

type Props = {
  id: number;
  CFRV: number;
  NFRV: number;
  updateInterval: number;
  tgBot: TelegramBot;
  msg: TelegramBot.Message;
};

export class FRBot {
  private runningFlag: boolean = false;
  private interval: NodeJS.Timeout | null = null;

  private readonly id: number;
  private readonly CFRV: number;
  private readonly NFRV: number;
  private readonly updateInterval: number;
  private readonly tgBot: TelegramBot;
  private readonly msg: TelegramBot.Message;

  constructor({ id, CFRV, NFRV, updateInterval, tgBot, msg }: Props) {
    this.id = id;
    this.CFRV = CFRV;
    this.NFRV = NFRV;
    this.updateInterval = updateInterval;
    this.tgBot = tgBot;
    this.msg = msg;
  }

  private analise() {
    const funding = new FundingRateAnalisator({
      CFRV: this.CFRV,
      NFRV: this.NFRV,
    });

    this.interval = setInterval(async () => {
      if (!this.runningFlag && this.interval) {
        clearInterval(this.interval);
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
        await this.tgBot.sendMessage(
          this.msg.chat.id,
          `⭐️ Бот № ${
            this.id
          } \n\n 📈 <b>Обновлен список монет доступных для входа</b> \n\n${symbols_message} \n\n${currTime}\ntask timestamp: ${new Date().getTime()}`,
          { parse_mode: "HTML" },
        );
      }
    }, 1000 * this.updateInterval);
  }

  public start(): void {
    this.runningFlag = true;
    const chatId = this.msg.chat.id;
    this.tgBot.sendMessage(chatId, `🟢 <b>Бот ${this.id} запущен</b> 🟢`, { parse_mode: "HTML" });
    this.analise();
  }

  public stop(): void {
    this.runningFlag = false;
    const chatId = this.msg.chat.id;
    this.tgBot.sendMessage(chatId, `🔴 <b>Бот ${this.id} остановлен</b> 🔴`, {
      parse_mode: "HTML",
    });
  }
}
