import { AfterViewInit, ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ProductModel } from '../../models/product.model';
import { ProductDetailsQueryModel } from '../../query-models/product-details.query-model';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';
import { CategoryModel } from 'src/app/models/category.model';
import { StoreModel } from 'src/app/models/store.model';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailsComponent implements AfterViewInit {
  readonly storeId$: Observable<string> = this._activatedRoute.queryParams.pipe(
    map((params) => params['store'] ?? ' '),
    shareReplay(1)
  );
  readonly productId$: Observable<string> = this._activatedRoute.params.pipe(
    map((params) => params['productId']),
    shareReplay(1)
  );
  readonly productAllList$: Observable<ProductModel[]> = this._productsService.getAllProducts();

  readonly storeSelectControl: FormControl = new FormControl();

  readonly productDetails$: Observable<ProductDetailsQueryModel> = combineLatest([
    this._storesService.getStoresMap(),
    this.productId$,
    this.productAllList$
  ]).pipe(
    switchMap(([storesMap, productId, allProducts]) =>
      this._categoriesService
        .getSingleCategoryById(allProducts.find((product) => product.id == productId)?.categoryId!)
        .pipe(
          map((category) =>
            this.mapToProductDetailsQueryModel(
              allProducts.find((product) => product.id == productId)!,
              category,
              storesMap
            )
          )
        )
    )
  );
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _productsService: ProductsService,
    private _categoriesService: CategoriesService,
    private _storesService: StoresService
  ) {}

  setStoreControl(): void {
    this.storeId$
      .pipe(
        take(1),
        tap((storeId) => {
          if (storeId) this.storeSelectControl.setValue(storeId);
        })
      )
      .subscribe();
  }

  mapToProductDetailsQueryModel(
    product: ProductModel,
    category: CategoryModel,
    storeMap: Record<string, StoreModel>
  ): ProductDetailsQueryModel {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      featureValue: product.featureValue,
      ratingCount: product.ratingCount,
      ratingValue: product.ratingValue,
      ratingStars: this._productsService.mapRatingNumberToStars(product.ratingValue),
      imgUrl: product.imageUrl,
      category: {
        id: product.categoryId,
        name: category.name
      },
      stores: product.storeIds
        .map((storeId) => storeMap[storeId] ?? [])
        .map((store) => ({ id: store.id, name: store.name }))
    };
  }
  ngAfterViewInit(): void {
    this.setStoreControl();
  }
}
