import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { TagModel } from '../../models/tag.model';
import { StoreQueryModel } from '../../query-models/store.query-model';
import { ProductModel } from '../../models/product.model';
import { FeaturedCategoryWithProductsQueryModel } from '../../query-models/featured-category-with-products.query-model';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';
import { TagsService } from '../../services/tags.service';
import { ProductsService } from '../../services/products.service';
import { StoreModel } from '../../models/store.model';

@Component({
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  readonly categoryList$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories().pipe(shareReplay(1));

  readonly tagsMap$: Observable<Record<string, TagModel>> = this._tagsService.getTagsMap();

  readonly storeList$: Observable<StoreQueryModel[]> = this.tagsMap$.pipe(
    switchMap((tagsMap) =>
      this._storesService.getAllStores().pipe(map((stores) => this.mapToStoreQueryModel(tagsMap, stores)))
    )
  );

  readonly productList$: Observable<ProductModel[]> = this._productsService.getAllProducts();

  readonly featuredCategoryIds$: Observable<string[]> = of(['5', '2']);

  readonly featuredCategoryListWithProducts$: Observable<FeaturedCategoryWithProductsQueryModel[]> = combineLatest([
    this.featuredCategoryIds$,
    this.productList$,
    this.categoryList$
  ]).pipe(
    map(([categoryIds, products, allCategories]) =>
      this.mapToFeaturedCategoryQueryModel(categoryIds, products, allCategories)
    )
  );

  constructor(
    private _categoriesService: CategoriesService,
    private _storesService: StoresService,
    private _tagsService: TagsService,
    private _productsService: ProductsService
  ) {}

  mapToStoreQueryModel(tagsMap: Record<string, TagModel>, stores: StoreModel[]): StoreQueryModel[] {
    return stores.map((store) => ({
      id: store.id,
      name: store.name,
      distanceInKm: Math.round((store.distanceInMeters * 10) / 1000) / 10,
      logoUrl: store.logoUrl,
      tags: (store.tagIds ?? []).map((tagId) => tagsMap[tagId]?.name)
    }));
  }

  mapToFeaturedCategoryQueryModel(
    categoryIds: string[],
    products: ProductModel[],
    allCategories: CategoryModel[]
  ): FeaturedCategoryWithProductsQueryModel[] {
    const categoryMap = allCategories.reduce((a, c) => ({ ...a, [c.id]: c }), {} as Record<string, CategoryModel>);
    return categoryIds.map((categoryId) => ({
      id: categoryId,
      name: categoryMap[categoryId]?.name,
      products: products
        .filter((product) => product.categoryId === categoryId)
        .map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          featureValue: product.featureValue
        }))
        .slice(0, 5)
        .sort((a, b) => {
          return a.featureValue > b.featureValue ? -1 : 1;
        })
    }));
  }
}
