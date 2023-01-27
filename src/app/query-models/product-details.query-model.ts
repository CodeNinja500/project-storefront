export interface ProductDetailsQueryModel {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly category: {
    id: string;
    name: string;
  };
  readonly ratingValue: number;
  readonly ratingCount: number;
  readonly imgUrl: string;
  readonly featureValue: number;
  readonly stores: {
    id: string;
    name: string;
  }[];
}
