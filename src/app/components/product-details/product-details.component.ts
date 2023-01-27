import { AfterViewInit, ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, ReplaySubject, combineLatest } from 'rxjs';
import { map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { ProductModel } from '../../models/product.model';
import { ProductDetailsQueryModel } from '../../query-models/product-details.query-model';
import { ProductsService } from '../../services/products.service';
import { CategoriesService } from '../../services/categories.service';
import { StoresService } from '../../services/stores.service';
import { CategoryModel } from '../../models/category.model';
import { StoreModel } from '../../models/store.model';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailsComponent implements AfterViewInit {
  readonly storeId$: Observable<string | undefined> = this._activatedRoute.queryParams.pipe(
    map((params) => params['store'] ?? null),
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
    ),
    shareReplay(1)
  );
  private _isInStoreFromQueryParamsSubject: ReplaySubject<boolean> = new ReplaySubject<boolean>();
  public isInStoreFromQueryParams$: Observable<boolean> = this._isInStoreFromQueryParamsSubject.asObservable();

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _productsService: ProductsService,
    private _categoriesService: CategoriesService,
    private _storesService: StoresService
  ) {}

  setStoreControl(): void {
    this.storeId$
      .pipe(
        switchMap((storeId) =>
          this.productDetails$.pipe(
            tap((productDetails) => {
              if (storeId) {
                if (productDetails.stores.find((store) => store.id == storeId)) {
                  this._isInStoreFromQueryParamsSubject.next(true);
                  this.storeSelectControl.setValue(storeId);
                } else {
                  this._isInStoreFromQueryParamsSubject.next(false);
                  this.storeSelectControl.setValue(productDetails.stores[0].id);
                }
              } else {
                this.storeSelectControl.setValue(productDetails.stores[0].id);
              }
            })
          )
        )
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
