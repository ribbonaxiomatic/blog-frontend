import request from '@/utils/request'

// 后端地址（与 utils/request.js 中 baseURL 保持一致）
const BASE_URL = 'http://localhost:8080'

// ===== 会话管理接口（/session）=====

// 新建会话，返回 SessionVO：{ sessionId, title, describe, examples }
export const createSession = (n = 3) => {
  return request({
    url: '/session',
    method: 'post',
    params: { n },
  })
}

// 获取热门问题，返回 List<Example>
export const getHotQuestions = (n = 3) => {
  return request({
    url: '/session/hot',
    method: 'get',
    params: { n },
  })
}

// 查询单个会话的历史消息，返回 List<MessageVO>
export const getSessionMessages = (sessionId) => {
  return request({
    url: `/session/${sessionId}`,
    method: 'get',
  })
}

// 查询历史会话列表（按时间段分组），返回 Map<String, List<ChatSessionVO>>
export const getSessionHistory = () => {
  return request({
    url: '/session/history',
    method: 'get',
  })
}

// 删除历史会话
export const deleteSession = (sessionId) => {
  return request({
    url: '/session/history',
    method: 'delete',
    params: { sessionId },
  })
}

// 修改会话标题
export const renameSession = (sessionId, title) => {
  return request({
    url: '/session/history',
    method: 'put',
    params: { sessionId, title },
  })
}

// ===== 对话接口（/chat，SSE 流式）=====

/**
 * 中止当前会话的流式生成
 */
export const stopChat = (sessionId) => {
  return request({
    url: '/chat/stop',
    method: 'post',
    params: { sessionId },
  })
}

/**
 * 发起流式对话（POST + SSE）。
 * 浏览器原生 EventSource 仅支持 GET，故用 fetch + ReadableStream 自行解析。
 *
 * @param {Object} options
 * @param {string} options.question 用户问题
 * @param {string} options.sessionId 会话ID
 * @param {AbortSignal} options.signal 可选，用于中止请求
 * @param {(evt: { eventData: any, eventType: number }) => void} [options.onEvent] 每个事件回调
 * @param {(err: Error) => void} [options.onError] 错误回调
 * @param {() => void} [options.onDone] 流结束回调（含主动 abort）
 * @returns {Promise<void>}
 */
export const chatStream = ({ question, sessionId, signal, onEvent, onError, onDone }) => {
  const token = localStorage.getItem('token') || ''

  return fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      token,
    },
    body: JSON.stringify({ question, sessionId }),
    signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`请求失败：${response.status}`)
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      // 从一帧文本中提取并派发所有 data: 行
      const dispatchFrame = (frame) => {
        const lines = frame.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (!data) continue
          try {
            onEvent?.(JSON.parse(data))
          } catch {
            // 非 JSON 数据帧，忽略
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // SSE 以空行（\n\n）分帧
        const frames = buffer.split('\n\n')
        buffer = frames.pop() // 保留最后未完成的片段
        for (const frame of frames) {
          if (frame.trim()) dispatchFrame(frame)
        }
      }
      // 刷新剩余缓冲
      if (buffer.trim()) dispatchFrame(buffer)
      onDone?.()
    })
    .catch((err) => {
      // 主动 abort 不视为错误
      if (err?.name === 'AbortError') {
        onDone?.()
        return
      }
      onError?.(err)
    })
}
