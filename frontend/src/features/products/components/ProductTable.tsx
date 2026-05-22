import {
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { DeleteOutlined, EditOutlined } from '@mui/icons-material'
import type { Product } from '../types/productTypes'

interface ProductTableProps {
  products: Product[]
  isLoading: boolean
  isError: boolean
  isAdmin: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

// Bảng hiển thị danh sách sản phẩm.
export function ProductTable({
  products,
  isLoading,
  isError,
  isAdmin,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
    <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 800 }}>Mã SP</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Tên sản phẩm</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Loại</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Đơn vị</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Min stock</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Giá</TableCell>
            <TableCell sx={{ fontWeight: 800 }}>Mô tả</TableCell>
            <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Thao tác</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8}>Đang tải dữ liệu...</TableCell>
            </TableRow>
          )}

          {isError && (
            <TableRow>
              <TableCell colSpan={8}>Không tải được dữ liệu sản phẩm.</TableCell>
            </TableRow>
          )}

          {!isLoading && !isError && products.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>Không có sản phẩm phù hợp.</TableCell>
            </TableRow>
          )}

          {products.map((product) => (
            <TableRow key={product.id} hover>
              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'secondary.main' }}>
                {product.product_code}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{product.product_name}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={product.product_type === 'FINISHED_GOOD' ? 'secondary' : 'default'}
                  label={
                    product.product_type === 'FINISHED_GOOD'
                      ? 'Thành phẩm'
                      : 'Linh kiện'
                  }
                />
              </TableCell>
              <TableCell>{product.unit}</TableCell>
              <TableCell sx={{ textAlign: 'right' }}>{product.min_stock}</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 700 }}>
                {Number(product.price).toLocaleString('vi-VN')} đ
              </TableCell>
              <TableCell>{product.description || '-'}</TableCell>
              <TableCell sx={{ textAlign: 'center' }}>
                <IconButton
                  size="small"
                  color="primary"
                  disabled={!isAdmin}
                  onClick={() => onEdit(product)}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  disabled={!isAdmin}
                  onClick={() => onDelete(product)}
                >
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
