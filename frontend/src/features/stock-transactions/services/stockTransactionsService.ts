/*
Senior Handover Note:
- File nay la service layer cua module Stock Transactions, nam giua hooks va API layer.
- Phu thuoc vao `stockTransactionsApi` de fetch du lieu va xu ly map/filter phuc vu UI.
- Giu page/components sach khoi logic bien doi data de de bao tri theo clean architecture.
*/

import { stockTransactionsApi } from '../api/stockTransactionsApi'
import type {
  StockTransaction,
  StockTransactionDisplayItem,
  StockTransactionFilters,
  StockTransactionProductOption,
  StockTransactionType,
} from '../types/stockTransactionTypes'

export const stockTransactionsService = {
  getStockTransactions: async (
    transactionType: StockTransactionType | 'ALL',
  ): Promise<StockTransaction[]> => {
    if (transactionType === 'ALL') {
      return stockTransactionsApi.getStockTransactions({ limit: 200 })
    }

    return stockTransactionsApi.getStockTransactions({
      transaction_type: transactionType,
      limit: 200,
    })
  },

  getProductOptions: async (): Promise<StockTransactionProductOption[]> => {
    const products = await stockTransactionsApi.getProducts()
    return products.filter((product) => product.is_active)
  },

  mapTransactionsForDisplay: (
    transactions: StockTransaction[],
    products: StockTransactionProductOption[],
  ): StockTransactionDisplayItem[] => {
    const productMap = new Map<number, StockTransactionProductOption>(
      products.map((product) => [product.id, product]),
    )

    return transactions.map((tx) => {
      const product = productMap.get(tx.product_id)

      return {
        ...tx,
        product_code: product?.product_code || `#${tx.product_id}`,
        product_name: product?.product_name || '-',
      }
    })
  },

  // Senior Handover: Filter block - tim theo product_code/product_name/reference_code tren dataset da enrich.
  filterTransactions: (
    transactions: StockTransactionDisplayItem[],
    filters: StockTransactionFilters,
  ): StockTransactionDisplayItem[] => {
    const keyword = filters.searchKeyword.trim().toLowerCase()

    return transactions.filter((item) => {
      if (filters.transactionType !== 'ALL' && item.transaction_type !== filters.transactionType) {
        return false
      }

      if (!keyword) return true

      return (
        item.product_code.toLowerCase().includes(keyword) ||
        item.product_name.toLowerCase().includes(keyword) ||
        (item.reference_code || '').toLowerCase().includes(keyword)
      )
    })
  },
}
