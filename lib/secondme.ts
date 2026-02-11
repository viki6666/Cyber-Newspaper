/**
 * SecondMe API 客户端
 *
 * 端点参考（来自官方文档）：
 * - 授权页面: https://go.second.me/oauth/
 * - Token 换取: POST https://app.mindos.com/gate/lab/api/oauth/token/code
 * - Token 刷新: POST https://app.mindos.com/gate/lab/api/oauth/token/refresh
 * - 用户信息: GET https://app.mindos.com/gate/lab/api/secondme/user/info
 */

const SECONDME_API_URL = 'https://app.mindos.com/gate/lab'
const APP_ID = process.env.SECONDME_APP_ID!
const APP_SECRET = process.env.SECONDME_APP_SECRET!

export interface SecondMeUser {
  id: string
  name: string
  email?: string
  avatar?: string
  bio?: string
}

/**
 * 获取 OAuth 授权 URL
 * 文档: https://go.second.me/oauth/?client_id=...&redirect_uri=...&response_type=code&state=...
 */
export function getAuthUrl(redirectUri: string) {
  const state = Math.random().toString(36).substring(2, 15)
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  })
  return `https://go.second.me/oauth/?${params}`
}

/**
 * 用授权码换取 access token
 * 端点: POST https://app.mindos.com/gate/lab/api/oauth/token/code
 * 注意: 必须使用 application/x-www-form-urlencoded 格式
 */
export async function exchangeToken(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: APP_ID,
    client_secret: APP_SECRET,
  })

  const response = await fetch(`${SECONDME_API_URL}/api/oauth/token/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Exchange token failed:', response.status, errorText)
    throw new Error(`Failed to exchange token: ${response.status}`)
  }

  const result = await response.json()

  // 响应格式: { code: 0, data: { accessToken, refreshToken, expiresIn, ... } }
  if (result.code === 0 && result.data) {
    return {
      access_token: result.data.accessToken,
      refresh_token: result.data.refreshToken,
      expires_in: result.data.expiresIn,
    }
  }

  throw new Error(`Token exchange error: ${JSON.stringify(result)}`)
}

/**
 * 获取用户资料
 * 端点: GET https://app.mindos.com/gate/lab/api/secondme/user/info
 */
export async function getUserProfile(accessToken: string): Promise<SecondMeUser> {
  const response = await fetch(`${SECONDME_API_URL}/api/secondme/user/info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Get user profile failed:', response.status, errorText)
    throw new Error(`Failed to get user profile: ${response.status}`)
  }

  const result = await response.json()

  // 响应格式: { code: 0, data: { email, name, avatarUrl, route, ... } }
  if (result.code === 0 && result.data) {
    return {
      id: result.data.route || result.data.email,
      name: result.data.name,
      email: result.data.email,
      avatar: result.data.avatarUrl,
      bio: result.data.bio,
    }
  }

  throw new Error(`Invalid user profile response: ${JSON.stringify(result)}`)
}

/**
 * 获取用户兴趣标签 (Shades)
 * 端点: GET https://app.mindos.com/gate/lab/api/secondme/user/shades
 */
export async function getUserShades(accessToken: string) {
  const response = await fetch(`${SECONDME_API_URL}/api/secondme/user/shades`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    console.error('Get user shades failed:', response.status)
    return []
  }

  const result = await response.json()
  if (result.code === 0 && result.data?.shades) {
    return result.data.shades as Array<{
      shadeName: string
      shadeDescription: string
      shadeContent: string
      confidenceLevel: string
    }>
  }
  return []
}

/**
 * 流式聊天 - 调用用户的 AI 分身进行对话
 * 端点: POST https://app.mindos.com/gate/lab/api/secondme/chat/stream
 * 返回完整的回复文本（内部消费 SSE 流）
 */
export async function chatWithAvatar(
  accessToken: string,
  message: string,
  options?: {
    sessionId?: string
    systemPrompt?: string
  }
): Promise<{ content: string; sessionId?: string }> {
  const body: Record<string, unknown> = {
    message,
  }
  if (options?.sessionId) body.sessionId = options.sessionId
  if (options?.systemPrompt) body.systemPrompt = options.systemPrompt

  const response = await fetch(`${SECONDME_API_URL}/api/secondme/chat/stream`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-App-Id': APP_ID,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Chat with avatar failed:', response.status, errorText)
    throw new Error(`Chat failed: ${response.status}`)
  }

  // 消费 SSE 流，拼接完整回复
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let content = ''
  let sessionId: string | undefined

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('event: session')) {
        // 下一行的 data 包含 sessionId
        continue
      }
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim()
        if (data === '[DONE]') break

        try {
          const parsed = JSON.parse(data)
          // session 事件
          if (parsed.sessionId) {
            sessionId = parsed.sessionId
            continue
          }
          // 聊天内容增量
          const delta = parsed.choices?.[0]?.delta?.content
          if (delta) {
            content += delta
          }
        } catch {
          // 非 JSON 行，跳过
        }
      }
    }
  }

  return { content, sessionId }
}

/**
 * 刷新 token
 * 端点: POST https://app.mindos.com/gate/lab/api/oauth/token/refresh
 * 注意: 必须使用 application/x-www-form-urlencoded 格式
 * 注意: 刷新后旧的 refresh_token 失效
 */
export async function refreshAccessToken(refreshToken: string) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: APP_ID,
    client_secret: APP_SECRET,
  })

  const response = await fetch(`${SECONDME_API_URL}/api/oauth/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Refresh token failed:', response.status, errorText)
    throw new Error(`Failed to refresh token: ${response.status}`)
  }

  const result = await response.json()

  // 响应格式: { code: 0, data: { accessToken, refreshToken, expiresIn, ... } }
  if (result.code === 0 && result.data) {
    return {
      access_token: result.data.accessToken,
      refresh_token: result.data.refreshToken,
      expires_in: result.data.expiresIn,
    }
  }

  throw new Error(`Token refresh error: ${JSON.stringify(result)}`)
}
