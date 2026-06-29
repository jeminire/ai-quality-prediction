import { useState, useEffect, useCallback } from "react"
import { apiClient } from "@/lib/apiClient"

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export function useTableData<T>(endpoint: string, perPage = 20) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient.get<PaginatedResponse<T>>(
        `${endpoint}?page=${page}&per_page=${perPage}`
      )
      setData(result.data ?? [])
      setTotal(result.total ?? 0)
      setCurrentPage(page)
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败")
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [endpoint, perPage])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const goToPage = (page: number) => {
    const totalPagesNum = Math.ceil(total / perPage)
    if (page >= 1 && page <= totalPagesNum) {
      fetchData(page)
    }
  }

  const goToNextPage = () => {
    const totalPagesNum = Math.ceil(total / perPage)
    if (currentPage < totalPagesNum) {
      fetchData(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      fetchData(currentPage - 1)
    }
  }

  const goToFirstPage = () => {
    if (currentPage > 1) {
      fetchData(1)
    }
  }

  const goToLastPage = () => {
    const totalPagesNum = Math.ceil(total / perPage)
    if (currentPage < totalPagesNum) {
      fetchData(totalPagesNum)
    }
  }

  const totalPages = Math.ceil(total / perPage)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2)
      
      if (currentPage <= halfVisible + 1) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - halfVisible) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - halfVisible; i <= currentPage + halfVisible; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return { 
    data, 
    loading, 
    total, 
    error, 
    refresh: () => fetchData(currentPage),
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    getPageNumbers
  }
}
