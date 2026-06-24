import axios from 'axios'

export interface ApiErrorInfo {
  status?: number
  message?: string
  code?: string
  hasResponse: boolean
  isTimeout: boolean
}

export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  if (!axios.isAxiosError(error)) {
    return {
      hasResponse: false,
      isTimeout: false,
      message: error instanceof Error ? error.message : undefined,
    }
  }

  const data = error.response?.data as { error?: string; error_code?: string; message?: string } | undefined
  return {
    status: error.response?.status,
    message: data?.error || data?.message || error.message,
    code: data?.error_code,
    hasResponse: Boolean(error.response),
    isTimeout: error.code === 'ECONNABORTED',
  }
}

export function mapNetworkApiError(info: ApiErrorInfo): string | null {
  if (info.hasResponse) return null
  if (info.isTimeout) return 'Kết nối API quá lâu, kiểm tra backend hoặc mạng.'
  return 'Không kết nối được API. Kiểm tra backend service, Nginx /api hoặc địa chỉ API của frontend.'
}
