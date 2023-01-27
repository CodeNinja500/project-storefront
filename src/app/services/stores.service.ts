import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { StoreModel } from '../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoresService {
  constructor(private _httpClient: HttpClient) {}

  getAllStores(): Observable<StoreModel[]> {
    return this._httpClient.get<StoreModel[]>('https://6384fca14ce192ac60696c4b.mockapi.io/freshcart-stores');
  }

  getSingleStoreById(storeId: string): Observable<StoreModel> {
    return this._httpClient.get<StoreModel>('https://6384fca14ce192ac60696c4b.mockapi.io/freshcart-stores/' + storeId);
  }

  getStoresMap(): Observable<Record<string, StoreModel>> {
    return this._httpClient
      .get<StoreModel[]>('https://6384fca14ce192ac60696c4b.mockapi.io/freshcart-stores')
      .pipe(map((stores) => stores.reduce((a, c) => ({ ...a, [c.id]: c }), {} as Record<string, StoreModel>)));
  }
}
