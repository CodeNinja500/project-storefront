export interface QueryParamsQueryModel {
  readonly sort: string;
  readonly order: string;
  readonly limit: number;
  readonly page: number;
  readonly priceFrom?: number;
  readonly priceTo?: number;
}
