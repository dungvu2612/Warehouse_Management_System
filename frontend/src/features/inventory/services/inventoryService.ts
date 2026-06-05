/*
Thông tin ghi chú:
- File nay la service layer cua module Inventory, nam giua hooks va API layer.
- Phu thuoc vao `inventoryApi` de thao tac du lieu va cung cap helper enrich/filter/canh bao ton thap.
- Khong dua React state vao service; giu use-case dung chung de trang/components gon va de bao tri.
*/

import { inventoryApi } from '../api/inventoryApi'
import type {
  InventoryAdjustPayload,
  InventoryAdjustResponse,
  InventoryDisplayItem,
  InventoryItem,
  LocationOption,
  ProductOption,
  TrayOption,
} from '../types/inventoryTypes'

export const inventoryService = {
  // Ghi chú: Lay danh sach inventory tho tu backend.
  getInventory: async (): Promise<InventoryItem[]> => {
    return inventoryApi.getInventory()
  },

  // Ghi chú: Dieu chinh ton kho (+/-) theo inventory id.
  adjustInventory: async (
    id: number,
    payload: InventoryAdjustPayload,
  ): Promise<InventoryAdjustResponse> => {
    return inventoryApi.adjustInventory(id, payload)
  },

  getProductOptions: async (): Promise<ProductOption[]> => {
    const products = await inventoryApi.getProducts()
    return products.filter((product) => product.is_active)
  },

  getTrayOptions: async (): Promise<TrayOption[]> => {
    const trays = await inventoryApi.getTrays()
    return trays.filter((tray) => tray.is_active)
  },

  getLocationOptions: async (): Promise<LocationOption[]> => {
    const locations = await inventoryApi.getLocations()
    return locations.filter((location) => location.is_active)
  },

  // Ghi chú: Enrich inventory list bang product/tray/location de phuc vu filter + low-stock warning UI.
  mapInventoryForDisplay: (
    inventory: InventoryItem[],
    products: ProductOption[],
    trays: TrayOption[],
    locations: LocationOption[],
  ): InventoryDisplayItem[] => {
    const productMap = new Map<number, ProductOption>(products.map((product) => [product.id, product]))
    const trayMap = new Map<number, TrayOption>(trays.map((tray) => [tray.id, tray]))
    const locationMap = new Map<number, LocationOption>(
      locations.map((location) => [location.id, location]),
    )

    const realRows = inventory.map((item) => {
      const product = productMap.get(item.product_id)
      const tray = trayMap.get(item.tray_id)
      const location = tray ? locationMap.get(tray.location_id) : undefined
      const minStock = Number(product?.min_stock || 0)

      return {
        ...item,
        product_code: product?.product_code || `#${item.product_id}`,
        product_name: product?.product_name || '-',
        product_image_url: product?.image_url || '',
        min_stock: minStock,
        tray_code: tray?.tray_code || `#${item.tray_id}`,
        location_code: location?.location_code || '-',
        location_description: location?.description || location?.shelf || '',
        is_low_stock: item.quantity <= minStock,
        is_virtual_row: false,
      }
    })

    // Ghi chú: Bo sung dong inventory ao cho cac product active chua co ban ghi ton de UI hien thi day du danh muc san pham.
    const existingProductIds = new Set(realRows.map((row) => row.product_id))
    const maxId = realRows.reduce((acc, row) => Math.max(acc, row.id), 0)
    let syntheticIdSeed = maxId + 1

    const virtualRows = products
      .filter((product) => !existingProductIds.has(product.id))
      .map((product) => {
        const minStock = Number(product.min_stock || 0)
        const item: InventoryDisplayItem = {
          id: syntheticIdSeed++,
          product_id: product.id,
          tray_id: 0,
          quantity: 0,
          created_at: new Date(0).toISOString(),
          updated_at: new Date(0).toISOString(),
          product_code: product.product_code,
          product_name: product.product_name,
          product_image_url: product.image_url || '',
          min_stock: minStock,
          tray_code: '-',
          location_code: '-',
          location_description: '',
          is_low_stock: minStock > 0,
          is_virtual_row: true,
        }
        return item
      })

    return [...realRows, ...virtualRows]
  },

  filterInventory: (
    inventory: InventoryDisplayItem[],
    filters: {
      keyword: string
      productId: number | 'ALL'
      trayId: number | 'ALL'
      locationCode: string | 'ALL'
      lowStockOnly: boolean
    },
  ): InventoryDisplayItem[] => {
    const keyword = filters.keyword.trim().toLowerCase()

    return inventory.filter((item) => {
      if (filters.productId !== 'ALL' && item.product_id !== filters.productId) return false
      if (filters.trayId !== 'ALL' && item.tray_id !== filters.trayId) return false
      if (filters.locationCode !== 'ALL' && item.location_code !== filters.locationCode) return false
      if (filters.lowStockOnly && !item.is_low_stock) return false

      if (!keyword) return true

      return (
        item.product_code.toLowerCase().includes(keyword) ||
        item.product_name.toLowerCase().includes(keyword) ||
        item.tray_code.toLowerCase().includes(keyword) ||
        item.location_code.toLowerCase().includes(keyword) ||
        item.location_description.toLowerCase().includes(keyword)
      )
    })
  },
}
