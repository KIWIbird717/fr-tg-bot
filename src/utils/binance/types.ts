import type { PositionSide_LT } from "binance-api-node";

export type timeScalesTypes = "1m" | "5m" | "10m" | "15m" | "30m" | "1h" | "1w";

export interface IFuturesOrder {
  symbol: string;
  quantity: number;
  leverage: number;
  side: "BUY" | "SELL";
  positionSide: PositionSide_LT;
  type: "MARKET" | "LIMIT";
}

export type UpdateUserDataRes = {
  balances: [
    {
      asset: string;
      balanceChange: string;
      crossWalletBalance: string;
      walletBalance: string;
    },
  ];
  eventReasonType: string;
  eventTime: Date;
  eventType: string;
  positions: Array<any>;
  transactionTime: Date;
};

export interface IWsFuturesDepth {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Mark price
  i: string; // Index price
  P: string; // Estimated Settle Price, only useful in the last hour before the settlement starts
  r: string; // Funding rate
  T: number; // Next funding time
}
