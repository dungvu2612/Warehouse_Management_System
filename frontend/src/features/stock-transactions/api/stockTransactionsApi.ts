/*
- File nay la API layer thuan HTTP cho module Stock Transactions.
- Phu thuoc vao shared `http` client de tai su dung token/interceptor auth hien co.
- Chi chua request/response typed; khong dat business logic filter/search UI tai day.
*/

import { http } from '../../../shared/lib/http'
import type {
  StockTransaction,
  StockTransactionProductOption,
  StockTransactionType,
} from '../types/stockTransactionTypes'

export const stockTransactionsApi = {
  // Ghi chú: Khối tải dữ liệu - goi GET /stock-transactions voi params filter transaction_type neu co.
  getStockTransactions: async (params?: {
    transaction_type?: StockTransactionType
    limit?: number
  }): Promise<StockTransaction[]> => {
    const { data } = await http.get<StockTransaction[]>('/stock-transactions', { params })
    return data
  },

  getProducts: async (): Promise<StockTransactionProductOption[]> => {
    const { data } = await http.get<StockTransactionProductOption[]>('/products')
    return data
  },
}
