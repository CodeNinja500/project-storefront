import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { TagModel } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagsService {
  constructor(private _httpClient: HttpClient) {}

  getTagsMap(): Observable<Record<string, TagModel>> {
    return this._httpClient
      .get<TagModel[]>('https://6384fca14ce192ac60696c4b.mockapi.io/freshcart-store-tags')
      .pipe(map((tags) => tags.reduce((a, c) => ({ ...a, [c.id]: c }), {} as Record<string, TagModel>)));
  }
}
