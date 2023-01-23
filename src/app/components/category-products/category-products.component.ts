import { AfterViewInit, ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, combineLatest, from, of } from 'rxjs';
import { filter, map, shareReplay, startWith, switchMap, take, tap } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { QueryParamsQueryModel } from '../../query-models/query-params.query-model';
import { SortOptionModel } from '../../models/sort-option.model';
import { ProductQueryModel } from '../../query-models/product.query-model';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { ProductModel } from '../../models/product.model';
import { RatingQueryModel } from 'src/app/query-models/rating.query-model';

@Component({
  selector: 'app-category-products',
  styleUrls: ['./category-products.component.scss'],
  templateUrl: './category-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryProductsComponent implements AfterViewInit {
  readonly categoryList$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories();
  readonly categoryId$: Observable<string> = this._activatedRoute.params.pipe(
    map((params) => params['categoryId']),
    shareReplay(1)
  );
  readonly queryParams$: Observable<QueryParamsQueryModel> = this._activatedRoute.queryParams.pipe(
    map((params) => ({
      sort: params['sort'] ?? 'featureValue',
      order: params['order'] ?? 'desc',
      limit: params['limit'] ? Math.max(+params['limit'], 5) : 5,
      page: params['page'] ? Math.max(+params['page'], 1) : 1,
      priceFrom: params['priceFrom'] ?? null,
      priceTo: params['priceTo'] ?? null,
      minRating: params['minRating'] ?? null,
      stores: params['stores'] ? new Set<string>(params['stores'].split(',')) : new Set<string>([])
    })),
    shareReplay(1),
    tap((data) => this.setControlFromQueryParams(data))
  );

  readonly ratingOptions$: Observable<RatingQueryModel[]> = of([
    { value: 5, stars: this.mapRatingNumberToStars(5) },
    { value: 4, stars: this.mapRatingNumberToStars(4) },
    { value: 3, stars: this.mapRatingNumberToStars(3) },
    { value: 2, stars: this.mapRatingNumberToStars(2) },
    { value: 1, stars: this.mapRatingNumberToStars(1) }
  ]);

  readonly sortingOpts$: Observable<SortOptionModel[]> = of([
    { display: 'Featured', key: 'featureValue;desc' },
    { display: 'Price Low to High', key: 'price;asc' },
    { display: 'Price High to Low', key: 'price;desc' },
    { display: 'Avg. Rating', key: 'ratingValue;desc' }
  ]);

  readonly categoryDetails$: Observable<CategoryModel> = this.categoryId$.pipe(
    switchMap((categoryId) => this._categoriesService.getSingleCategoryById(categoryId))
  );
  readonly productInCategoryList$: Observable<ProductQueryModel[]> = this.categoryId$.pipe(
    switchMap((categoryId) =>
      this._productsService
        .getAllProducts()
        .pipe(
          map((products) =>
            products
              .filter((product) => product.categoryId === categoryId)
              .map((product) => this.mapToProductQueryModel(product))
          )
        )
    )
  );

  readonly sortForm: FormControl = new FormControl();

  readonly productsFilteredAndSorted$: Observable<ProductQueryModel[]> = combineLatest([
    this.queryParams$,
    this.productInCategoryList$
  ]).pipe(
    map(([params, products]) =>
      products

        .sort((a, b) => {
          const prev = Object.assign(a);
          const next = Object.assign(b);
          if (prev[params['sort']] > next[params['sort']]) {
            return params['order'] === 'asc' ? 1 : -1;
          }
          if (prev[params['sort']] < next[params['sort']]) {
            return params['order'] === 'asc' ? -1 : 1;
          } else return 0;
        })
        .filter((product) => (params.priceFrom ? product.price >= params.priceFrom : true))
        .filter((product) => (params.priceTo ? product.price <= params.priceTo : true))
        .filter((product) => (params['minRating'] ? product.ratingValue >= +params['minRating'] : true))
        .filter((product) => (params.stores ? product.storeIds.find((storeId) => params.stores?.has(storeId)) : true))
    ),
    shareReplay(1),
    tap((data) => this.calcNumberOfPages(data)),
    tap((data) => this.checkPaginationAfterFilterAdded(data))
  );

  readonly productsPaginated$: Observable<ProductQueryModel[]> = combineLatest([
    this.productsFilteredAndSorted$,
    this.queryParams$
  ]).pipe(map(([products, params]) => products.slice((params.page - 1) * params.limit, params.page * params.limit)));

  readonly limitOpts: Observable<number[]> = of([5, 10, 15]);

  private _pagesSubject: Subject<number[]> = new Subject<number[]>();
  public pages$: Observable<number[]> = this._pagesSubject.asObservable();

  readonly filterForm: FormGroup = new FormGroup({ priceFrom: new FormControl(), priceTo: new FormControl() });

  constructor(
    private _categoriesService: CategoriesService,
    private _activatedRoute: ActivatedRoute,
    private _productsService: ProductsService,
    private _router: Router
  ) {}

  mapToProductQueryModel(product: ProductModel): ProductQueryModel {
    return {
      id: product.id,
      categoryId: product.categoryId,
      featureValue: product.featureValue,
      imageUrl: product.imageUrl,
      name: product.name,
      price: product.price,
      ratingCount: product.ratingCount,
      ratingValue: product.ratingValue,
      storeIds: product.storeIds,
      ratingStars: this.mapRatingNumberToStars(product.ratingValue)
    };
  }

  mapRatingNumberToStars(rating: number): number[] {
    const ratingRounded = Math.round(rating * 2) / 2;
    const starsArray = Array.from(Array(5).keys()).map((n) => {
      if (n < Math.floor(ratingRounded)) {
        return 1;
      }
      if (n == Math.floor(ratingRounded)) {
        if (ratingRounded - Math.floor(ratingRounded) >= 0.5) return 0.5;
        else return 0;
      } else {
        return 0;
      }
    });
    return starsArray;
  }

  setControlFromQueryParams(params: QueryParamsQueryModel): void {
    this.sortForm.setValue(params.sort + ';' + params.order);
  }

  calcNumberOfPages(products: ProductQueryModel[]): void {
    this.queryParams$
      .pipe(
        take(1),
        tap((params: QueryParamsQueryModel) => {
          this._pagesSubject.next(
            Array.from(Array(Math.ceil(products.length / params.limit)).keys()).map((key) => key + 1)
          );
        })
      )
      .subscribe();
  }

  onPageChanged(page: number, queryParams: QueryParamsQueryModel): void {
    const stores: Set<string> = queryParams.stores;
    this._router.navigate([], {
      queryParams: Object.assign({}, queryParams, {
        page: page,
        stores: Array.from(stores).join().length > 0 ? Array.from(stores).join() : null
      })
    });
  }

  onLimitChanged(limit: number, queryParams: QueryParamsQueryModel): void {
    const stores: Set<string> = queryParams.stores;
    this.productsFilteredAndSorted$
      .pipe(
        take(1),
        tap((products) => {
          this._router.navigate([], {
            queryParams: Object.assign({}, queryParams, {
              limit: limit,
              page: queryParams.page > products.length / limit ? Math.ceil(products.length / limit) : queryParams.page,
              stores: Array.from(stores).join().length > 0 ? Array.from(stores).join() : null
            })
          });
        })
      )
      .subscribe();
  }

  checkPaginationAfterFilterAdded(products: ProductQueryModel[]): void {
    this.queryParams$
      .pipe(
        take(1),
        tap((params) => {
          const stores: Set<string> = params.stores;
          if (params.page > Math.ceil(products.length / params.limit)) {
            this._router.navigate([], {
              queryParams: Object.assign({}, params, {
                page: Math.ceil(products.length / params.limit),
                stores: Array.from(stores).join().length > 0 ? Array.from(stores).join() : null
              })
            });
          }
        })
      )
      .subscribe();
  }

  onMinRatingChanged(rating: number, params: QueryParamsQueryModel): void {
    const stores: Set<string> = params.stores;
    this._router.navigate([], {
      queryParams: Object.assign({}, params, {
        minRating: rating == params.minRating ? null : rating,
        stores: Array.from(stores).join().length > 0 ? Array.from(stores).join() : null
      })
    });
  }

  ngAfterViewInit(): void {
    this.queryParams$
      .pipe(
        switchMap((params: QueryParamsQueryModel) =>
          combineLatest([
            this.sortForm.valueChanges.pipe(
              tap((formValue) => {
                const stores: Set<string> = params.stores;
                const sortArray = formValue.split(';');
                this._router.navigate([], {
                  queryParams: Object.assign({}, params, {
                    sort: sortArray[0],
                    order: sortArray[1],
                    stores: Array.from(stores).join().length > 0 ? Array.from(stores).join() : null
                  })
                });
              })
            ),
            this.filterForm.valueChanges.pipe(
              tap((formValue) => {
                const stores: Set<string> = params.stores;
                this._router.navigate([], {
                  queryParams: Object.assign({}, params, {
                    priceFrom: formValue.priceFrom ? formValue.priceFrom : null,
                    priceTo: formValue.priceTo ? formValue.priceTo : null,
                    stores: Array.from(stores).join().length > 0 ? Array.from(stores).join() : null
                  })
                });
              })
            )
          ])
        )
      )
      .subscribe();
  }
}
