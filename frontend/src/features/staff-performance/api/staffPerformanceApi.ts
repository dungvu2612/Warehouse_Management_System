import { http } from '../../../shared/lib/http'
import type { StaffPerformanceFilters, StaffPerformanceResponse } from '../types/staffPerformanceTypes'

export const staffPerformanceApi = {
  getStaffPerformance: async (filters: StaffPerformanceFilters): Promise<StaffPerformanceResponse> => {
    const { data } = await http.get<StaffPerformanceResponse>('/admin/reports/staff-performance', {
      params: filters,
    })
    return data
  },
}
