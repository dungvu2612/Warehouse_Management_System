/*
Thông tin ghi chú:
- File hien thi bang danh sach BOM.
- Phu thuoc vao types BOM va callback tu trang container.
- Luu y bao tri: cot "Thanh pham cha" can hien thi du anh + ma + ten de thao tac kho truc quan.
*/

import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import { DeleteOutlined, EditOutlined, VisibilityOutlined, ShoppingCartOutlined } from '@mui/icons-material'
import type { BOM } from '../types/bomTypes'
import { ProductImageThumb } from '../../../shared/components/ProductImageThumb'

interface BOMTableProps {
  boms: BOM[]
  isLoading: boolean
  isError: boolean
  canManage: boolean
  onViewItems: (bom: BOM) => void
  onEdit: (bom: BOM) => void
  onDelete: (bom: BOM) => void
  onCreateOrder: (bom: BOM) => void
}

// Bang BOM.
export function BOMTable({
  boms,
  isLoading,
  isError,
  canManage,
  onViewItems,
  onEdit,
  onDelete,
  onCreateOrder,
}: BOMTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Thành phẩm cha</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Tên BOM</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mô tả</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Số loại linh kiện</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Tổng SL linh kiện</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Người tạo</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Ngày tạo</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Cập nhật</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={10}>Đang tải danh sách BOM...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={10}>Không tải được danh sách BOM.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && boms.length === 0 && (
            <TableRow>
              <TableCell colSpan={10}>Chưa có BOM nào.</TableCell>
            </TableRow>
          )}

          {boms.map((bom) => {
            const itemCount = Array.isArray(bom.items) ? bom.items.length : 0
            const totalQty = Array.isArray(bom.items)
              ? bom.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
              : 0
            const creatorText = bom.creator
              ? `${bom.creator.full_name} (${bom.creator.username})`
              : bom.created_by
                ? `User #${bom.created_by}`
                : '-'

            return (
              <TableRow key={bom.id} hover>
                <TableCell>#{bom.id}</TableCell>
                <TableCell>
                  {/* Ghi chú: Hien thi anh + ma + ten thanh pham de nguoi van hanh nhan dien nhanh tren bang BOM. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ProductImageThumb
                      src={bom.product?.image_url}
                      alt={bom.product?.product_name || `Sản phẩm ${bom.product_id}`}
                      size={40}
                    />
                    <Chip
                      size="small"
                      color="secondary"
                      label={
                        bom.product
                          ? `${bom.product.product_code} - ${bom.product.product_name}`
                          : `Product #${bom.product_id}`
                      }
                    />
                  </div>
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{bom.bom_name || '-'}</TableCell>
                <TableCell>{bom.description || '-'}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{itemCount}</TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>{totalQty}</TableCell>
                <TableCell>{creatorText}</TableCell>
                <TableCell>{new Date(bom.created_at).toLocaleString('vi-VN')}</TableCell>
                <TableCell>{new Date(bom.updated_at).toLocaleString('vi-VN')}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  <Tooltip title="Xem linh kiện">
                    <IconButton color="info" size="small" onClick={() => onViewItems(bom)}>
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Tạo đơn hàng từ BOM">
                    <span>
                      <IconButton
                        color="success"
                        size="small"
                        disabled={!canManage}
                        onClick={() => onCreateOrder(bom)}
                      >
                        <ShoppingCartOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Sửa BOM">
                    <span>
                      <IconButton
                        color="primary"
                        size="small"
                        disabled={!canManage}
                        onClick={() => onEdit(bom)}
                      >
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Xóa BOM">
                    <span>
                      <IconButton
                        color="error"
                        size="small"
                        disabled={!canManage}
                        onClick={() => onDelete(bom)}
                      >
                        <DeleteOutlined fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
