import request from '@/utils/request'

const API_BASE_URL = 'http://localhost:8080'

export const createSession = (num = 3) => {
  return request({
    url: '/session',
    method: 'post',
    params: { n: num },
  })
}

export const getHotExamples = (num = 3) => {
  return request({
    url: '/session/hot',
    method: 'get',
    params: { n: num },
  })
}

export const getSessionMessages = (sessionId) => {
  return request({
    url: `/session/${sessionId}`,
    method: 'get',
  })
}

export const getHistorySessions = () => {
  return request({
    url: '/session/history',
    method: 'get',
  })
}

export const deleteHistorySession = (sessionId) => {
  return request({
    url: '/session/history',
    method: 'delete',
    params: { sessionId },
  })
}

export const updateHistorySessionTitle = (sessionId, title) => {
  return request({
    url: '/session/history',
    method: 'put',
    params: { sessionId, title },
  })
}

export const stopChat = (sessionId) => {
  return request({
    url: '/chat/stop',
    method: 'post',
    params: { sessionId },
  })
}

export async function streamChat({ question, sessionId, signal, onEvent }) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: token || '',
    },
    body: JSON.stringify({ question, sessionId }),
    signal,
  })

  if (!response.ok || !response.body) {
    throw new Error('AI 助手连接失败')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() || ''

    for (const rawEvent of events) {
      const parsed = parseSseEvent(rawEvent)
      if (parsed) {
        onEvent(parsed)
      }
    }
  }

  buffer += decoder.decode()
  const lastEvent = parseSseEvent(buffer)
  if (lastEvent) {
    onEvent(lastEvent)
  }
}

function parseSseEvent(rawEvent) {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())

  if (dataLines.length === 0) return null

  const data = dataLines.join('\n')
  if (!data || data === '[DONE]') return null

  try {
    return JSON.parse(data)
  } catch (error) {
    return {
      eventType: 1001,
      eventData: data,
    }
  }
}
