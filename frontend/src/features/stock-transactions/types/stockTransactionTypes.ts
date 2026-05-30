/*
Senior Handover Note:
- File nay dinh nghia contracts TypeScript cho module Stock Transactions o frontend.
- Phu thuoc truc tiep vao endpoint backend GET /stock-transactions va metadata san pham GET /products.
- Khi backend doi shape transaction/product, cap nhat type tai day truoc de giu strict typing cho cac layer con.
*/

export type StockTransactionType = 'IMPORT' | 'EXPORT' | 'ADJUST' | 'ROLLBACK'

export interface StockTransaction {
  id: number
  transaction_type: StockTransactionType
  product_id: number
  tray_id: number | null
  quantity: number
  before_quantity: number
  after_quantity: number
  reference_code: string
  note: string
  created_by: number | null
  created_at: string
}

export interface StockTransactionProductOption {
  id: number
  product_code: string
  product_name: string
  is_active: boolean
}

export interface StockTransactionDisplayItem extends StockTransaction {
  product_code: string
  product_name: string
}

export interface StockTransactionFilters {
  transactionType: StockTransactionType | 'ALL'
  searchKeyword: string
}
