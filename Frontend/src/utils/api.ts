import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request Interceptor: Add Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Response Interceptor: Handle Auth Errors
api.interceptors.response.use((response) => {
  return response
}, (error) => {
  if (error.response && error.response.status === 401) {
    // Token invalid or expired
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // Optional: Redirect to login or show modal
    // window.location.reload()
  }
  return Promise.reject(error)
})

export default api
