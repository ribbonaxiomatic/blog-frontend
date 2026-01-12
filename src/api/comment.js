import request from '@/utils/request'

// 评论列表查询
export const getCommentList = (params) => {
  return request({
    url: '/comments',
    method: 'get',
    params,
  })
}

// 添加评论
export const addComment = (data) => {
  return request({
    url: '/comments',
    method: 'post',
    data,
  })
}

// 删除评论（支持单个或多个 ID）
export const deleteComments = (ids) => {
  // 确保 ids 是数组（即使只删一个）
  const idList = Array.isArray(ids) ? ids : [ids];

  return request({
    url: '/comments',
    method: 'delete',
    params: { ids: idList } // 👈 关键：用 params 传 ids
  })
}
