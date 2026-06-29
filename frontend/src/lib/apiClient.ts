const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1"

export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  })

  const json: ApiResult<T> = await res.json()

  if (json.code !== 200) {
    throw new Error(json.message || "请求失败")
  }

  return json.data
}

export const apiClient = {
  request,
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  put: <T>(url: string, body?: any) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  delete: <T>(url: string) =>
    request<T>(url, { method: "DELETE" })
}