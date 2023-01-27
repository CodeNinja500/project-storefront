import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductModel } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private _httpClient: HttpClient) {}

  getAllProducts(): Observable<ProductModel[]> {
    return this._httpClient.get<ProductModel[]>('https://6384fca14ce192ac60696c4b.mockapi.io/freshcart-products');
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
}
