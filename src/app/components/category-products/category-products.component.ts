import { AfterViewInit, ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, combineLatest, from, of } from 'rxjs';
import { filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { QueryParamsQueryModel } from '../../query-models/query-params.query-model';
import { SortOptionModel } from '../../models/sort-option.model';
import { ProductQueryModel } from '../../query-models/product.query-model';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';
import { ProductModel } from '../../models/product.model';

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
      order: params['order'] ?? 'desc'
    })),
    shareReplay(1),
    tap((data) => this.setControlFromQueryParams(data))
  );

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
      products.sort((a, b) => {
        const prev = Object.assign(a);
        const next = Object.assign(b);
        if (prev[params['sort']] > next[params['sort']]) {
          return params['order'] === 'asc' ? 1 : -1;
        }
        if (prev[params['sort']] < next[params['sort']]) {
          return params['order'] === 'asc' ? -1 : 1;
        } else return 0;
      })
    )
  );

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

  ngAfterViewInit(): void {
    this.sortForm.valueChanges.subscribe((value: string) => {
      const sortArray = value.split(';');
      this._router.navigate([], {
        queryParams: {
          sort: sortArray[0],
          order: sortArray[1]
        }
      });
    });
  }
}
