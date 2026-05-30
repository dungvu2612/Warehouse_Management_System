/*
Thong tin handover:
- File nay la API layer thuan HTTP cho module Import Receipts.
- Phu thuoc vao shared `http` client de tai su dung auth token/interceptor hien co.
- Chi chua request/response typed; khong dat business logic UI tai day.
*/

import { http } from '../../../shared/lib/http'
import type {
  CreateImportReceiptPayload,
  CreateImportReceiptResponse,
  ImportReceipt,
  LocationOption,
  ProductOption,
  PutawayRequest,
  PutawayRequestApproveResponse,
  TrayOption,
} from '../types/importReceiptTypes'

export const importReceiptsApi = {
  // Senior Handover: Fetch danh sach phieu nhap tu endpoint GET /import-receipts.
  getImportReceipts: async (): Promise<ImportReceipt[]> => {
    const { data } = await http.get<ImportReceipt[]>('/import-receipts')
    return data
  },

  // Senior Handover: Fetch chi tiet 1 phieu nhap tu endpoint GET /import-receipts/:id.
  getImportReceiptById: async (id: number): Promise<ImportReceipt> => {
    const { data } = await http.get<ImportReceipt>(`/import-receipts/${id}`)
    return data
  },

  // Senior Handover: Submit tao phieu nhap moi theo endpoint POST /import-receipts.
  createImportReceipt: async (
    payload: CreateImportReceiptPayload,
  ): Promise<CreateImportReceiptResponse> => {
    const { data } = await http.post<CreateImportReceiptResponse>('/import-receipts', payload)
    return data
  },

  // Senior Handover: Lay options de render form item nhieu dong.
  getProducts: async (): Promise<ProductOption[]> => {
    const { data } = await http.get<ProductOption[]>('/products')
    return data
  },

  getTrays: async (): Promise<TrayOption[]> => {
    const { data } = await http.get<TrayOption[]>('/trays')
    return data
  },

  getLocations: async (): Promise<LocationOption[]> => {
    const { data } = await http.get<LocationOption[]>('/locations')
    return data
  },

  getPutawayRequests: async (status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL' = 'PENDING'): Promise<PutawayRequest[]> => {
    const { data } = await http.get<PutawayRequest[]>('/inventory/putaway-requests', {
      params: { status },
    })
    return data
  },

  approvePutawayRequest: async (id: number): Promise<PutawayRequestApproveResponse> => {
    const { data } = await http.post<PutawayRequestApproveResponse>(`/inventory/putaway-requests/${id}/approve`)
    return data
  },

  rejectPutawayRequest: async (id: number, reason: string): Promise<PutawayRequestApproveResponse> => {
    const { data } = await http.post<PutawayRequestApproveResponse>(`/inventory/putaway-requests/${id}/reject`, {
      reason,
    })
    return data
  },
}
