import { useState, useCallback } from "react"
import { apiClient, ApiResult } from "@/lib/apiClient"
/**
 * 统一 API Hook
 * - call(fn): 传入无参函数（推荐配合 api.get/post 使用，已自动解包 data）
 * - fetchApi<T>(url, method?, body?): 便捷方法，自动走 BASE_URL + {code,data} 解包
 */
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const call = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      return await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误")
      return null
    } finally {
      setLoading(false)
    }
  }, [])
  /**
   * 便捷方法：直接传 url + method + body
   * 自动拼接 BASE_URL，自动解析 {code, data} 响应格式
   * 用于 DataManagement 等组件替换硬编码 fetch 调用
   */
  const fetchApi = useCallback(async <T>(
    url: string,
    method: string = "GET",
    body?: unknown
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      return await apiClient.request<T>(url, {
        method,
        body: method !== "GET" && body !== undefined
          ? JSON.stringify(body)
          : undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误")
      return null
    } finally {
      setLoading(false)
    }
  }, [])
  
  return {
    call,
    fetchApi,
    api: apiClient,
    loading,
    error
  }
}