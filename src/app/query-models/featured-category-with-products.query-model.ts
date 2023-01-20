export interface FeaturedCategoryWithProductsQueryModel {
  readonly id: string;
  readonly name: string;
  readonly products: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    featureValue: number;
  }[];
}
