import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProductDetailsComponent } from './product-details.component';

@NgModule({
  imports: [CommonModule],
  declarations: [ProductDetailsComponent],
  providers: [],
  exports: [ProductDetailsComponent]
})
export class ProductDetailsComponentModule {}
