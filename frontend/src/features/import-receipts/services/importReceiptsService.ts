/*
Thông tin ghi chú:
- File nay la service layer cua module Import Receipts, nam giua hooks va API layer.
- Phu thuoc vao `importReceiptsApi` de thao tac du lieu va cung cap helper enrich/filter cho trang.
- Khong dua React state vao service; giu use-case dung chung de trang/components gon va de bao tri.
*/

import { importReceiptsApi } from '../api/importReceiptsApi'
import type {
  CreateImportReceiptPayload,
  CreateImportReceiptResponse,
  ImportReceipt,
  ImportReceiptDisplay,
  ImportReceiptItemActionResponse,
  LocationOption,
  ProductOption,
  PutawayRequest,
  PutawayRequestApproveResponse,
  TrayOption,
} from '../types/importReceiptTypes'

export const importReceiptsService = {
  // Ghi chú: Lay danh sach phieu nhap.
  getImportReceipts: async (): Promise<ImportReceipt[]> => {
    return importReceiptsApi.getImportReceipts()
  },

  // Ghi chú: Lay chi tiet phieu nhap theo id.
  getImportReceiptById: async (id: number): Promise<ImportReceipt> => {
    return importReceiptsApi.getImportReceiptById(id)
  },

  // Ghi chú: Tao phieu nhap moi.
  createImportReceipt: async (
    payload: CreateImportReceiptPayload,
  ): Promise<CreateImportReceiptResponse> => {
    return importReceiptsApi.createImportReceipt(payload)
  },

  assignImportReceiptItem: async (itemId: number, staffId: number): Promise<ImportReceiptItemActionResponse> => {
    return importReceiptsApi.assignImportReceiptItem(itemId, staffId)
  },

  unassignImportReceiptItem: async (itemId: number): Promise<ImportReceiptItemActionResponse> => {
    return importReceiptsApi.unassignImportReceiptItem(itemId)
  },

  getProductOptions: async (): Promise<ProductOption[]> => {
    const products = await importReceiptsApi.getProducts()
    return products.filter((product) => product.is_active)
  },

  getTrayOptions: async (): Promise<TrayOption[]> => {
    const trays = await importReceiptsApi.getTrays()
    return trays.filter((tray) => tray.is_active)
  },

  getLocationOptions: async (): Promise<LocationOption[]> => {
    const locations = await importReceiptsApi.getLocations()
    return locations.filter((location) => location.is_active)
  },

  getPutawayRequests: async (status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING'): Promise<PutawayRequest[]> => {
    return importReceiptsApi.getPutawayRequests(status)
  },

  approvePutawayRequest: async (id: number): Promise<PutawayRequestApproveResponse> => {
    return importReceiptsApi.approvePutawayRequest(id)
  },

  rejectPutawayRequest: async (id: number, reason: string): Promise<PutawayRequestApproveResponse> => {
    return importReceiptsApi.rejectPutawayRequest(id, reason)
  },

  mapReceiptsForDisplay: (receipts: ImportReceipt[]): ImportReceiptDisplay[] => {
    return receipts.map((receipt) => {
      const totalQuantity = receipt.items.reduce((sum, item) => sum + item.quantity, 0)
      const totalActualQuantity = receipt.items.reduce((sum, item) => sum + (item.actual_quantity || 0), 0)
      return {
        ...receipt,
        item_count: receipt.items.length,
        total_quantity: totalQuantity,
        total_actual_quantity: totalActualQuantity,
      }
    })
  },

  filterReceiptsByKeyword: (
    receipts: ImportReceiptDisplay[],
    keywordRaw: string,
  ): ImportReceiptDisplay[] => {
    const keyword = keywordRaw.trim().toLowerCase()
    if (!keyword) return receipts

    return receipts.filter((receipt) => {
      return (
        receipt.receipt_code.toLowerCase().includes(keyword) ||
        (receipt.supplier_name || '').toLowerCase().includes(keyword) ||
        (receipt.note || '').toLowerCase().includes(keyword)
      )
    })
  },
}
