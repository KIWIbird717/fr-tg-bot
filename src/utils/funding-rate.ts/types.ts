import type { MarkPriceResult } from "binance-api-node";
import {
  OutboundAccountInfo,
  ExecutionReport,
  AccountUpdate,
  OrderUpdate,
  AccountConfigUpdate,
  MarginCall,
} from "binance-api-node";

/**
 * Base MarkPriceResult interface
 * with some extra types
 *
 * result after `futuresMarkPrice()` function
 */
export interface IMarkPriceResult extends MarkPriceResult {
  indexPrice: string;
  estimatedSettlePrice: string;
}

export interface ISFRelement extends IMarkPriceResult {
  latestUpdate?: Date;
}

export interface IFundingRate {
  symbol: string;
  markPrice: string;
  lastFundingRate: string;
  nextFundingTime: number;
  time: number;
}

export type DealEnterenceConfig = {
  tradingSymbol: string;
  username: string;
};

export type futuresUserEventType =
  | OutboundAccountInfo
  | ExecutionReport
  | AccountUpdate
  | OrderUpdate
  | AccountConfigUpdate
  | MarginCall;
