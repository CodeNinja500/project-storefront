import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CategoryProductsComponent } from './components/category-products/category-products.component';
import { StoreProductsComponent } from './components/store-products/store-products.component';
import { ProductDetailsComponent } from './components/product-details/product-details.component';
import { HomeComponentModule } from './components/home/home.component-module';
import { CategoryProductsComponentModule } from './components/category-products/category-products.component-module';
import { StoreProductsComponentModule } from './components/store-products/store-products.component-module';
import { ProductDetailsComponentModule } from './components/product-details/product-details.component-module';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'categories/:categoryId', component: CategoryProductsComponent },
  { path: 'stores/:storeId', component: StoreProductsComponent },
  { path: 'products/:productId', component: ProductDetailsComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    HomeComponentModule,
    CategoryProductsComponentModule,
    StoreProductsComponentModule,
    ProductDetailsComponentModule
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
