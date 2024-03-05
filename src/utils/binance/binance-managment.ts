import Binance, { Binance as BinanceType } from "binance-api-node";
import type {
  FuturesAsset,
  FuturesLeverageResult,
  FuturesOrder,
  MarginType_LT,
} from "binance-api-node";
import type { timeScalesTypes, IFuturesOrder } from "./types.js";
import { Logger } from "../logger.js";

/**
 * Functional class with kit for binance usege.
 * Contains function to manage binance operations
 */
export class BinanceManagment {
  protected client: BinanceType;

  constructor(apiKey?: string, apiSecret?: string) {
    this.client = Binance({
      apiKey: apiKey,
      apiSecret: apiSecret,
    });
  }

  protected futuresSymbolPrice = async (symbol: string) => {
    try {
      return Number((await this.client.futuresBook({ symbol, limit: 10 })).asks[0].price);
    } catch (error) {
      Logger.error(`Error in BinanceManagment, futuresSymbolPrice(). ${error}`);
    }
  };

  /**
   * Get binance futures balance
   * @returns Futures balanse
   */
  protected myFuturesBalance = async (): Promise<(FuturesAsset | undefined)[] | void> => {
    try {
      const accountInfo = await this.client.futuresAccountInfo();
      const hasFreeBalance = accountInfo.assets
        .map((asset) => {
          if (Number(asset.walletBalance) > 0) return asset;
        })
        .filter((asset) => asset != undefined);
      return hasFreeBalance;
    } catch (err) {
      Logger.error(`Error in BinanceManagment, myFuturesBalance(). ${err}`);
    }
  };

  /** Set margin on symbol */
  protected futuresMarginType = async (symbol: string, margin: MarginType_LT) => {
    try {
      await this.client.futuresMarginType({
        symbol: symbol,
        marginType: margin,
        recvWindow: 10_000,
      });
    } catch (error) {
      Logger.error(`Error in BinanceManagment, futuresMarginType(). ${error}`);
    }
  };

  /**
   * Change user's position mode (Hedge Mode or One-way Mode ) on EVERY symbol
   * "true": Hedge Mode; "false": One-way Mode
   * @returns 'enabled' | 'disabled'
   */
  protected enableHedgeMode = async (mode: boolean): Promise<true | false | Error | unknown> => {
    try {
      const currentMode = await this.client.futuresPositionMode();
      // Chek if current mode already satisfies this mode
      if (currentMode.dualSidePosition == mode) return mode;

      const res = await this.client.futuresPositionModeChange({
        dualSidePosition: `${mode}`,
        recvWindow: 1500,
      });
      if (res.code == 200) {
        return mode;
      } else {
        return new Error("Error while changin hedge mode");
      }
    } catch (err) {
      Logger.error(`Error in BinanceManagment, enableHedgeMode(). ${err}`);
    }
  };

  /**
   * Convert USDT amount to Symbol with leverage param
   * @param symbol
   * @param usdtAmount
   * @param leverage
   * @returns Price in Symbol with leverage
   */
  protected convertUSDTtoSymbolFutures = async (
    symbol: string,
    usdtAmount: number,
    leverage: number,
  ): Promise<number | Error> => {
    try {
      const price = await this.client.futuresPrices();
      const symbolPrice = price[symbol];
      if (!symbolPrice) return new Error(`Price for symbol ${symbol} not found.`);

      const symbolAmount = (usdtAmount * leverage) / parseFloat(symbolPrice);
      return symbolAmount;
    } catch (err) {
      return new Error(`${err}`);
    }
  };

  /**
   * Change symbol leverage on Binance
   * @param symbol
   * @param leverage
   * @returns respone
   */
  protected futuresSetLeverage = async (
    symbol: string,
    leverage: number,
  ): Promise<FuturesLeverageResult | undefined> => {
    try {
      const res = this.client.futuresLeverage({
        symbol: symbol,
        leverage: leverage,
      });
      return res;
    } catch (err) {
      Logger.error(`Error in BinanceManagment, futuresSetLeverage(). ${err}`);
    }
  };

  /**
   * Make futures order
   * @param symbol: string
   * @param quantity: number (USDT without leverage multiplier)
   * @param leverage: number
   * @param side: "BUY" | "SELL"
   * @param positionSide: "LONG" | "SHORT"
   * @param type: "MARKET" | "LIMIT"
   * @returns
   */
  protected futuresOrder = async ({
    symbol,
    quantity,
    leverage,
    side,
    positionSide,
    type,
  }: IFuturesOrder): Promise<undefined | Error | FuturesOrder> => {
    try {
      const setLeverage = await this.futuresSetLeverage(symbol, leverage);
      if (setLeverage?.leverage != leverage) return new Error("Leverage was not aplied");

      if (type == "MARKET") {
        const convertedQuantityRaw = await this.convertUSDTtoSymbolFutures(
          symbol,
          quantity,
          leverage,
        );
        if (typeof convertedQuantityRaw != "number") return;

        // create new futures order
        const res = await this.client.futuresOrder({
          symbol: symbol,
          quantity: convertedQuantityRaw.toString(),
          side: side,
          positionSide: positionSide,
          type: type,
        });
        return res;
      } else {
        return new Error("LIMIT order type is not supported in this function yet");
      }
    } catch (err) {
      throw err;
    }
  };

  protected connectSymbolWS = (symbol: string, timeScale: timeScalesTypes): void => {
    this.client.ws.candles(symbol, timeScale, (candle) => {
      Logger.debug(candle);
    });
  };
}
