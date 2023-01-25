import { Component } from '@angular/core';
import { BehaviorSubject, Observable, of, shareReplay } from 'rxjs';
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
  private _isMenuVisibleSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isMenuVisible$: Observable<boolean> = this._isMenuVisibleSubject.asObservable();

  onMenuShow(): void {
    this._isMenuVisibleSubject.next(true);
  }
  onMenuHide(): void {
    this._isMenuVisibleSubject.next(false);
  }

  constructor(private _categoriesService: CategoriesService, private _storesService: StoresService) {}
}
