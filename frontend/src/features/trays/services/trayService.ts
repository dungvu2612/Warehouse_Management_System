/*
Thong tin handover:
- File nay la service layer cua module Trays, nam giua hooks va API layer.
- Phu thuoc vao `traysApi` de thao tac du lieu va cung cap helper filter/search cho page.
- Khong dua React state vao service; giu cac use-case dung chung de de test va maintain.
*/

import { traysApi } from '../api/traysApi'
import type {
  LocationOption,
  ProductOption,
  Tray,
  TrayDisplay,
  TrayPayload,
} from '../types/trayTypes'

export const trayService = {
  // Senior Handover: Lay danh sach trays tu backend.
  getTrays: async (): Promise<Tray[]> => {
    return traysApi.getTrays()
  },

  // Senior Handover: Tao tray moi.
  createTray: async (payload: TrayPayload): Promise<Tray> => {
    return traysApi.createTray(payload)
  },

  // Senior Handover: Cap nhat tray.
  updateTray: async (id: number, payload: TrayPayload): Promise<Tray> => {
    return traysApi.updateTray(id, payload)
  },

  // Senior Handover: Xoa mem tray.
  deleteTray: async (id: number): Promise<{ message: string }> => {
    return traysApi.deleteTray(id)
  },

  // Senior Handover: Lay product options active de tao tray.
  getProductOptions: async (): Promise<ProductOption[]> => {
    const products = await traysApi.getProductOptions()
    return products.filter((product) => product.is_active)
  },

  // Senior Handover: Lay location options active de tao tray.
  getLocationOptions: async (): Promise<LocationOption[]> => {
    const locations = await traysApi.getLocationOptions()
    return locations.filter((location) => location.is_active)
  },

  // Senior Handover: Loc list tray theo ma khay / qr / mo ta / id.
  // Senior Handover: Join trays voi locations de hien thi location_code + location_description thay vi location_id.
  mapTraysForDisplay: (
    trays: Tray[],
    locations: LocationOption[],
    products: ProductOption[],
  ): TrayDisplay[] => {
    const locationMap = new Map<number, LocationOption>(locations.map((location) => [location.id, location]))
    const productMap = new Map<number, ProductOption>(products.map((product) => [product.id, product]))

    return trays.map((tray) => {
      const location = locationMap.get(tray.location_id)
      const product = productMap.get(tray.product_id)
      return {
        ...tray,
        product_code: product?.product_code || `#${tray.product_id}`,
        product_name: product?.product_name || '-',
        product_image_url: product?.image_url || '',
        location_code: location?.location_code || `#${tray.location_id}`,
        location_description: location?.description || location?.shelf || '',
      }
    })
  },

  filterTraysByKeyword: (trays: TrayDisplay[], keywordRaw: string): TrayDisplay[] => {
    const keyword = keywordRaw.trim().toLowerCase()
    if (!keyword) return trays

    return trays.filter(
      (tray) =>
        tray.tray_code.toLowerCase().includes(keyword) ||
        tray.qr_code.toLowerCase().includes(keyword) ||
        tray.description.toLowerCase().includes(keyword) ||
        tray.location_code.toLowerCase().includes(keyword) ||
        tray.location_description.toLowerCase().includes(keyword) ||
        String(tray.id).includes(keyword),
    )
  },
}
