import { Component } from '@angular/core';
import { Observable, of, shareReplay } from 'rxjs';
import { CategoryModel } from './models/category.model';
import { StoreModel } from './models/store.model';
import { CategoriesService } from './services/categories.service';
import { StoresService } from './services/stores.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ng-freshcard-bootstrap-theme';

  readonly categoryList$: Observable<CategoryModel[]> = this._categoriesService.getAllCategories().pipe(shareReplay(1));
  readonly storeList$: Observable<StoreModel[]> = this._storesService.getAllStores();
  readonly getToKnowUsOptionList$: Observable<string[]> = of(['Company', 'About', 'Blog', 'Help Center', 'Our Value']);

  constructor(private _categoriesService: CategoriesService, private _storesService: StoresService) {}
}
