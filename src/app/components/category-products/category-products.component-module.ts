import { NgModule } from '@angular/core';
import { CategoryProductsComponent } from './category-products.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [CommonModule, RouterModule],
  declarations: [CategoryProductsComponent],
  providers: [],
  exports: [CategoryProductsComponent]
})
export class CategoryProductsComponentModule {}
