import request from '@/utils/request'

// 文件上传
export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return request({
    url: '/upload',
    method: 'post',
    data: formData,
  })
}

