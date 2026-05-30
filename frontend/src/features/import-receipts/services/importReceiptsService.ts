/*
Thong tin handover:
- File nay la service layer cua module Import Receipts, nam giua hooks va API layer.
- Phu thuoc vao `importReceiptsApi` de thao tac du lieu va cung cap helper enrich/filter cho page.
- Khong dua React state vao service; giu use-case dung chung de page/components gon va de bao tri.
*/

import { importReceiptsApi } from '../api/importReceiptsApi'
import type {
  CreateImportReceiptPayload,
  CreateImportReceiptResponse,
  ImportReceipt,
  ImportReceiptDisplay,
  LocationOption,
  ProductOption,
  PutawayRequest,
  PutawayRequestApproveResponse,
  TrayOption,
} from '../types/importReceiptTypes'

export const importReceiptsService = {
  // Senior Handover: Lay danh sach phieu nhap.
  getImportReceipts: async (): Promise<ImportReceipt[]> => {
    return importReceiptsApi.getImportReceipts()
  },

  // Senior Handover: Lay chi tiet phieu nhap theo id.
  getImportReceiptById: async (id: number): Promise<ImportReceipt> => {
    return importReceiptsApi.getImportReceiptById(id)
  },

  // Senior Handover: Tao phieu nhap moi.
  createImportReceipt: async (
    payload: CreateImportReceiptPayload,
  ): Promise<CreateImportReceiptResponse> => {
    return importReceiptsApi.createImportReceipt(payload)
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
      return {
        ...receipt,
        item_count: receipt.items.length,
        total_quantity: totalQuantity,
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
