import { mockUsers, mockTags, mockArticles, mockComments, mockJwt } from './data.js'

// 是否启用 mock 模式
// 开发环境默认启用，生产环境需要手动设置为 false
// 如果需要连接真实后端，将此值改为 false
const USE_MOCK = false

// 模拟延迟
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

// 模拟成功响应
const success = (data) => ({
  code: 1,
  msg: 'success',
  data,
})

// 模拟失败响应
const error = (msg) => ({
  code: 0,
  msg,
  data: null,
})

// Mock API 实现
export const mockApi = {
  // 登录
  async login(data) {
    await delay()
    const user = mockUsers.find((u) => u.email === data.email)
    
    if (!user) {
      return error('邮箱或密码错误')
    }
    
    // 所有测试账号的密码都是 123456
    if (data.password === '123456') {
      return success({
        ...user,
        jwt: mockJwt,
      })
    }
    
    return error('邮箱或密码错误')
  },

  // 注册
  async register(data) {
    await delay()
    const exists = mockUsers.find((u) => u.email === data.email)
    if (exists) {
      return error('ACCOUNT ALREADY EXISTS')
    }
    const newUser = {
      userId: mockUsers.length + 1,
      identifier: String(100000000 + mockUsers.length + 1),
      userName: `user${100000000 + mockUsers.length + 1}`,
      email: data.email,
      password: null,
      role: 0,
      status: 0,
      avatar: 'https://via.placeholder.com/100',
      gender: 0,
      birthday: null,
      signature: null,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      jwt: mockJwt,
    }
    mockUsers.push(newUser)
    return success(newUser)
  },

  // 用户列表
  async getUserList(params) {
    await delay()
    let filtered = [...mockUsers]

    if (params.query) {
      filtered = filtered.filter(
        (u) =>
          u.userName.includes(params.query) || u.email.includes(params.query)
      )
    }

    if (params.userId) {
      filtered = filtered.filter((u) => u.userId === Number(params.userId))
    }

    if (params.status !== undefined) {
      filtered = filtered.filter((u) => u.status === Number(params.status))
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return success({
      total: filtered.length,
      rows: filtered.slice(start, end),
    })
  },

  // 根据 ID 获取用户
  async getUserById(id) {
    await delay()
    const user = mockUsers.find((u) => u.userId === Number(id))
    if (user) {
      return success({ ...user })
    }
    return error('用户不存在')
  },

  // 文章列表
  async getArticleList(params) {
    await delay()
    let filtered = [...mockArticles]

    if (params.query) {
      filtered = filtered.filter(
        (a) =>
          a.title.includes(params.query) || a.content.includes(params.query)
      )
    }

    if (params.articleId) {
      filtered = filtered.filter((a) => a.articleId === Number(params.articleId))
    }

    if (params.userId) {
      filtered = filtered.filter((a) => a.userId === Number(params.userId))
    }

    if (params.tag) {
      filtered = filtered.filter((a) => a.tagName === params.tag)
    }

    if (params.status !== undefined) {
      filtered = filtered.filter((a) => a.status === Number(params.status))
    }

    if (params.isDeleted !== undefined) {
      filtered = filtered.filter((a) => a.isDeleted === Number(params.isDeleted))
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return success({
      total: filtered.length,
      rows: filtered.slice(start, end),
    })
  },

  // 根据 ID 获取文章
  async getArticleById(id) {
    await delay()
    const article = mockArticles.find((a) => a.articleId === Number(id))
    if (article) {
      // 增加阅读量
      article.viewCount = (article.viewCount || 0) + 1
      return success({ ...article })
    }
    return error('文章不存在')
  },

  // 添加文章
  async addArticle(data) {
    await delay()
    const newArticle = {
      articleId: mockArticles.length + 1,
      userId: data.userId,
      tagId: data.tagId || null,
      tagName: mockTags.find((t) => t.tagId === data.tagId)?.tagName || '',
      title: data.title,
      content: data.content,
      summary: data.summary || '',
      coverImage: data.coverImage || '',
      status: data.status || 0,
      viewCount: 0,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0,
      isDeleted: 0,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      publishedAt: data.status === 1 ? (data.publishedAt || new Date().toISOString().slice(0, 19).replace('T', ' ')) : null,
    }
    mockArticles.unshift(newArticle)
    return success(null)
  },

  // 更新文章
  async updateArticle(data) {
    await delay()
    const article = mockArticles.find((a) => a.articleId === data.articleId)
    if (article) {
      Object.assign(article, {
        ...data,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      return success(null)
    }
    return error('文章不存在')
  },

  // 删除文章
  async deleteArticles(ids) {
    await delay()
    const idArray = ids.split(',').map(Number)
    idArray.forEach((id) => {
      const index = mockArticles.findIndex((a) => a.articleId === id)
      if (index !== -1) {
        mockArticles[index].isDeleted = 1
      }
    })
    return success(null)
  },

  // 评论列表
  async getCommentList(params) {
    await delay()
    let filtered = mockComments.filter((c) => c.articleId === Number(params.articleId))

    if (params.parentId) {
      filtered = filtered.filter((c) => c.parentId === Number(params.parentId))
    } else {
      filtered = filtered.filter((c) => !c.parentId)
    }

    if (params.userId) {
      filtered = filtered.filter((c) => c.userId === Number(params.userId))
    }

    // 为每个评论附加用户信息（userName）
    const rows = filtered.map((comment) => {
      const user = mockUsers.find((u) => u.userId === comment.userId)
      return {
        ...comment,
        userName: user ? user.userName : `用户 ${comment.userId}`,
      }
    })

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return success({
      total: filtered.length,
      rows: rows.slice(start, end),
    })
  },

  // 添加评论
  async addComment(data) {
    await delay()
    const newComment = {
      commentId: mockComments.length + 1,
      articleId: data.articleId,
      userId: data.userId,
      parentId: data.parentId || null,
      content: data.content,
      isDeleted: 0,
      deletedReason: null,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    mockComments.push(newComment)
    // 更新文章评论数
    const article = mockArticles.find((a) => a.articleId === data.articleId)
    if (article) {
      article.commentCount = (article.commentCount || 0) + 1
    }
    return success(null)
  },

  // 删除评论
  async deleteComments(ids) {
    await delay()
    const idArray = ids.split(',').map(Number)
    idArray.forEach((id) => {
      const index = mockComments.findIndex((c) => c.commentId === id)
      if (index !== -1) {
        mockComments[index].isDeleted = 1
      }
    })
    return success(null)
  },

  // 点赞/取消点赞
  async toggleArticleLike(data) {
    await delay()
    const article = mockArticles.find((a) => a.articleId === data.articleId)
    if (article) {
      // 简化处理，实际应该检查是否已点赞
      article.likeCount = (article.likeCount || 0) + 1
    }
    return success(data)
  },

  // 收藏/取消收藏
  async toggleArticleFavorite(data) {
    await delay()
    const article = mockArticles.find((a) => a.articleId === data.articleId)
    if (article) {
      // 简化处理，实际应该检查是否已收藏
      article.favoriteCount = (article.favoriteCount || 0) + 1
    }
    return success(null)
  },

  // 收藏列表
  async getFavoriteList(params) {
    await delay()
    // 简化处理，返回所有文章
    const filtered = mockArticles.filter((a) => a.status === 1 && a.isDeleted === 0)
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return success({
      total: filtered.length,
      rows: filtered.slice(start, end),
    })
  },

  // 关注/取消关注
  async toggleFollow(data) {
    await delay()
    return success(null)
  },

  // 关注列表
  async getFollowingList(params) {
    await delay()
    const filtered = mockUsers.filter((u) => u.userId !== Number(params.followerId))
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return success({
      total: filtered.length,
      rows: filtered.slice(start, end),
    })
  },

  // 粉丝列表
  async getFollowerList(params) {
    await delay()
    const filtered = mockUsers.filter((u) => u.userId !== Number(params.followingId))
    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return success({
      total: filtered.length,
      rows: filtered.slice(start, end),
    })
  },

  // 标签列表
  async getTagList(params) {
    await delay()
    let filtered = [...mockTags]

    if (params.status !== undefined) {
      filtered = filtered.filter((t) => t.status === Number(params.status))
    }

    const page = params.page || 1
    const pageSize = params.pageSize || 10
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return success({
      total: filtered.length,
      rows: filtered.slice(start, end),
    })
  },

  // 根据 ID 获取标签
  async getTagById(id) {
    await delay()
    const tag = mockTags.find((t) => t.tagId === Number(id))
    if (tag) {
      return success(tag)
    }
    return error('标签不存在')
  },

  // 添加标签
  async addTag(data) {
    await delay()
    const exists = mockTags.find((t) => t.tagName === data.tagName)
    if (exists) {
      return error('标签已存在')
    }
    const newTag = {
      tagId: mockTags.length + 1,
      tagName: data.tagName,
      useCount: 0,
      status: data.status || 1,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }
    mockTags.push(newTag)
    return success(null)
  },

  // 更新标签
  async updateTag(data) {
    await delay()
    const tag = mockTags.find((t) => t.tagId === data.tagId)
    if (tag) {
      Object.assign(tag, {
        ...data,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      return success(null)
    }
    return error('标签不存在')
  },

  // 删除标签
  async deleteTags(ids) {
    await delay()
    const idArray = ids.split(',').map(Number)
    idArray.forEach((id) => {
      const index = mockTags.findIndex((t) => t.tagId === id)
      if (index !== -1) {
        mockTags.splice(index, 1)
      }
    })
    return success(null)
  },

  // 文件上传
  async uploadImage(file) {
    await delay(1000)
    // 模拟上传成功，返回一个占位图 URL
    const url = `https://via.placeholder.com/800x400?text=${encodeURIComponent(file.name)}`
    return success(url)
  },

  // 添加用户
  async addUser(data) {
    await delay()
    const exists = mockUsers.find((u) => u.email === data.email)
    if (exists) {
      return error('ACCOUNT ALREADY EXISTS')
    }
    const newUser = {
      userId: mockUsers.length + 1,
      identifier: String(100000000 + mockUsers.length + 1),
      userName: data.userName,
      email: data.email,
      password: null,
      role: data.role || 0,
      status: data.status || 0,
      avatar: data.avatar || 'https://via.placeholder.com/100',
      gender: data.gender || 0,
      birthday: data.birthday || null,
      signature: data.signature || null,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      jwt: null,
    }
    mockUsers.push(newUser)
    return success(null)
  },

  // 更新用户
  async updateUser(data) {
    await delay()
    const user = mockUsers.find((u) => u.userId === data.userId)
    if (user) {
      Object.assign(user, {
        ...data,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      })
      return success(null)
    }
    return error('用户不存在')
  },

  // 删除用户
  async deleteUsers(ids) {
    await delay()
    const idArray = ids.split(',').map(Number)
    idArray.forEach((id) => {
      const index = mockUsers.findIndex((u) => u.userId === id)
      if (index !== -1) {
        mockUsers.splice(index, 1)
      }
    })
    return success(null)
  },

  // 修改密码
  async updatePassword(data) {
    await delay()
    const user = mockUsers.find((u) => u.userId === data.userId)
    if (user) {
      // 简化处理，实际应该验证旧密码
      return success(null)
    }
    return error('用户不存在')
  },
}

// 导出是否使用 mock
export { USE_MOCK }

