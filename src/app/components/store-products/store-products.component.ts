import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { TagModel } from '../../models/tag.model';
import { StoreQueryModel } from '../../query-models/store.query-model';
import { ProductModel } from '../../models/product.model';
import { StoresService } from '../../services/stores.service';
import { ProductsService } from '../../services/products.service';
import { TagsService } from '../../services/tags.service';
import { StoreModel } from '../../models/store.model';

@Component({
  selector: 'app-store-products',
  styleUrls: ['./store-products.component.scss'],
  templateUrl: './store-products.component.html',
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StoreProductsComponent {
  private _keyWordForSearchSubject: BehaviorSubject<string> = new BehaviorSubject<string>('');
  public keyWordForSearch$: Observable<string> = this._keyWordForSearchSubject.asObservable();

  readonly storeId$: Observable<string> = this._activatedRoute.params.pipe(
    map((params) => params['storeId']),
    shareReplay(1)
  );
  readonly tagsMap$: Observable<Record<string, TagModel>> = this._tagsService.getTagsMap();

  readonly storeDetails$: Observable<StoreQueryModel> = combineLatest([this.storeId$, this.tagsMap$]).pipe(
    switchMap(([storeId, tagsMap]) =>
      this._storesService.getSingleStoreById(storeId).pipe(map((store) => this.mapToStoreQueryModel(tagsMap, store)))
    )
  );

  readonly productsInStoreList$: Observable<ProductModel[]> = combineLatest([
    this.keyWordForSearch$,
    this.storeId$
  ]).pipe(
    switchMap(([keyWord, storeId]) =>
      this._productsService
        .getAllProducts()
        .pipe(
          map((products) =>
            products.filter((product) =>
              product.storeIds.some(
                (productStoreId) => productStoreId === storeId && product.name.toLowerCase().includes(keyWord)
              )
            )
          )
        )
    )
  );

  readonly storeSearch: FormGroup = new FormGroup({ keyWord: new FormControl() });

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _storesService: StoresService,
    private _productsService: ProductsService,
    private _tagsService: TagsService
  ) {}

  mapToStoreQueryModel(tagsMap: Record<string, TagModel>, store: StoreModel): StoreQueryModel {
    return {
      id: store.id,
      name: store.name,
      logoUrl: store.logoUrl,
      distanceInKm: Math.round(store.distanceInMeters / 100) / 10,
      tags: store.tagIds.map((tagId) => tagsMap[tagId]?.name)
    };
  }

  onStoreSearchSubmitted(storeSearch: FormGroup): void {
    //for debugging
    console.log('Searching for products with keyWord: ' + storeSearch.value.keyWord);
    this._keyWordForSearchSubject.next(storeSearch.value.keyWord.toLowerCase());
  }

  onDeleteSearchButtonClick(): void {
    this._keyWordForSearchSubject.next('');
    this.storeSearch.setValue({ keyWord: '' });
  }
}
