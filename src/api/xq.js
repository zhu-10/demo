import axios from './axios.js'


export function getbokeById(id) {
  // 获取单篇博客（GET daily/{id}/）
  return axios.get(`/shu/daily/${id}/`)
}

export function addboke(data) {
  // 添加博客（POST daily/）
  return axios.post('/shu/daily/', data)
}

export function updateboke(id, data) {
  // 更新博客（PUT daily{id}/）
  return axios.put(`/shu/${id}/`, data)
}

export function deleteboke(id) {
  // 删除博客（DELETE /student/student/{id}/）
  return axios.delete(`/shu/${id}/`)
}

export default {
  getboke,
  getbokeById,
  addboke,
  updateboke,
  deleteboke,
}
