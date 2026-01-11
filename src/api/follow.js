import request from '@/utils/request'

// 关注/取消关注
export const toggleFollow = (data) => {
  return request({
    url: '/user-follow',
    method: 'post',
    data,
  })
}

// 关注列表查询
export const getFollowingList = (params) => {
  return request({
    url: '/user-follow/following',
    method: 'get',
    params,
  })
}

// 粉丝列表查询
export const getFollowerList = (params) => {
  return request({
    url: '/user-follow/follower',
    method: 'get',
    params,
  })
}

