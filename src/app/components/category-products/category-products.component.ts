import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { CategoryModel } from '../../models/category.model';
import { ProductModel } from '../../models/product.model';
import { CategoriesService } from '../../services/categories.service';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-category-products',
  styleUrls: ['./category-products.component.scss'],
  templateUrl: './category-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryProductsComponent {
  readonly categoryList$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories();
  readonly categoryId$: Observable<string> = this._activatedRoute.params.pipe(
    map((params) => params['categoryId']),
    shareReplay(1)
  );
  readonly categoryDetails$: Observable<CategoryModel> = this.categoryId$.pipe(
    switchMap((categoryId) => this._categoriesService.getSingleCategoryById(categoryId))
  );
  readonly productInCategoryList$: Observable<ProductModel[]> = this.categoryId$.pipe(
    switchMap((categoryId) =>
      this._productsService
        .getAllProducts()
        .pipe(map((products) => products.filter((product) => product.categoryId === categoryId)))
    )
  );

  constructor(
    private _categoriesService: CategoriesService,
    private _activatedRoute: ActivatedRoute,
    private _productsService: ProductsService
  ) {}
}
