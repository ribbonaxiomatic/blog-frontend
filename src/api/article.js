import request from '@/utils/request'

// 文章列表查询
export const getArticleList = (params) => {
  return request({
    url: '/articles/select',
    method: 'get',
    params,
  })
}

// 根据 ID 查询文章
export const getArticleById = (id) => {
  return request({
    url: `/articles/${id}`,
    method: 'get',
  })
}

// 添加文章
export const addArticle = (data) => {
  return request({
    url: '/articles',
    method: 'post',
    data,
  })
}

// 修改文章
export const updateArticle = (data) => {
  return request({
    url: '/articles',
    method: 'put',
    data,
  })
}

// 删除文章
export const deleteArticles = (ids) => {
  return request({
    url: `/articles/${ids}`,
    method: 'delete',
  })
}

// 同步已发布文章到向量库
export const syncArticleVectors = () => {
  return request({
    url: '/articles/sync-vectors',
    method: 'post',
  })
}

// 查询文章向量库状态
export const getArticleVectorStatus = () => {
  return request({
    url: '/articles/vector-status',
    method: 'get',
  })
}

// 发布文章（将 status 改为 1）
export const publishArticle = (articleId) => {
  return request({
    url: '/articles',
    method: 'put',
    data: { articleId, status: 1 },
  })
}
