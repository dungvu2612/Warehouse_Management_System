/*
Senior Handover Note:
- File nay tap trung React Query hooks cho module Stock Transactions.
- Phu thuoc vao `stockTransactionsService` de giu page sach khoi logic fetch/cache.
- Query key tach rieng theo transaction type de cache linh hoat theo bo loc loai giao dich.
*/

import { useQuery } from '@tanstack/react-query'
import { stockTransactionsService } from '../services/stockTransactionsService'
import type { StockTransactionType } from '../types/stockTransactionTypes'

const STOCK_TRANSACTIONS_QUERY_KEY = ['stock-transactions'] as const
const STOCK_TRANSACTIONS_PRODUCTS_QUERY_KEY = ['stock-transactions-products'] as const

export function useStockTransactionsQuery(transactionType: StockTransactionType | 'ALL') {
  return useQuery({
    queryKey: [...STOCK_TRANSACTIONS_QUERY_KEY, transactionType],
    // Senior Handover: Fetch block - load danh sach giao dich kho theo transaction type filter.
    queryFn: () => stockTransactionsService.getStockTransactions(transactionType),
  })
}

export function useStockTransactionProductsQuery() {
  return useQuery({
    queryKey: STOCK_TRANSACTIONS_PRODUCTS_QUERY_KEY,
    queryFn: stockTransactionsService.getProductOptions,
  })
}
