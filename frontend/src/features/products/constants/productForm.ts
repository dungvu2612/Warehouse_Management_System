import type { ProductPayload } from '../types/productTypes'

/*
Thong tin handover:
- File nay chua gia tri mac dinh form Product de page/dialog tai su dung.
- Phu thuoc vao type `ProductPayload`.
- Luu y bao tri: khi them field moi cho Product form (vd image_url), cap nhat default tai day de tranh state undefined.
*/

// Giá trị mặc định form product.
export const defaultProductForm: ProductPayload = {
  product_code: '',
  qr_code: '',
  product_name: '',
  product_type: 'COMPONENT',
  image_url: '',
  description: '',
  unit: 'pcs',
  min_stock: 0,
  price: 0,
}
