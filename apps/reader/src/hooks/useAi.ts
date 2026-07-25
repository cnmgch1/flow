import { useCallback } from 'react'
import { atom, useRecoilState } from 'recoil'

import { localStorageEffect } from '../state'

export interface AiSettings {
  baseUrl: string
  apiKey: string
  model: string
  systemPrompt?: string
}

export interface AiChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  selectedText?: string
}

export const defaultAiSettings: AiSettings = {
  baseUrl: '',
  apiKey: '',
  model: '',
  systemPrompt:
    '你是一个专业且耐心的 AI 读书助手。请对用户提供的电子书选中文本或提问进行详细解释、背景扩充和深度解读，结构清晰，语言简洁明了。',
}

export const aiSettingsState = atom<AiSettings>({
  key: 'aiSettings',
  default: defaultAiSettings,
  effects: [localStorageEffect('aiSettings', defaultAiSettings)],
})

export const defaultAiHistory: AiChatMessage[] = []

export const aiHistoryState = atom<AiChatMessage[]>({
  key: 'aiHistory',
  default: defaultAiHistory,
  effects: [localStorageEffect<AiChatMessage[]>('aiHistory', defaultAiHistory)],
})

export const aiLoadingState = atom<boolean>({
  key: 'aiLoading',
  default: false,
})

export function useAi() {
  const [settings, setSettings] = useRecoilState(aiSettingsState)
  const [history, setHistory] = useRecoilState(aiHistoryState)
  const [loading, setLoading] = useRecoilState(aiLoadingState)

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  const sendMessage = useCallback(
    async (prompt: string, selectedText?: string) => {
      if (loading) return
      setLoading(true)

      const userMessageId = 'msg_' + Date.now()
      const assistantMessageId = 'msg_' + (Date.now() + 1)

      const userMsg: AiChatMessage = {
        id: userMessageId,
        role: 'user',
        content: prompt,
        selectedText,
        timestamp: Date.now(),
      }

      const initialAssistantMsg: AiChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      }

      setHistory((prev) => [...prev, userMsg, initialAssistantMsg])

      if (!settings.apiKey) {
        setHistory((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    '⚠️ 请先配置 API Key。请点击侧边栏右上角 ⚙️ 设置按钮填写您的 API URL、API Key 及 Model。',
                }
              : msg,
          ),
        )
        setLoading(false)
        return
      }

      try {
        const activeSystemPrompt =
          settings.systemPrompt || defaultAiSettings.systemPrompt!

        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseUrl: settings.baseUrl,
            apiKey: settings.apiKey,
            model: settings.model,
            messages: [
              { role: 'system', content: activeSystemPrompt },
              {
                role: 'user',
                content: selectedText
                  ? `请解释以下电子书选中文本：\n\n"${selectedText}"${prompt ? `\n\n问题或说明：${prompt}` : ''}`
                  : prompt,
              },
            ],
            stream: true,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API Error ${response.status}: ${errorText}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        if (reader) {
          let done = false
          let buffer = ''
          while (!done) {
            const { value, done: doneReading } = await reader.read()
            done = doneReading
            if (value) {
              buffer += decoder.decode(value, { stream: true })
              const lines = buffer.split('\n')
              buffer = lines.pop() ?? ''

              for (const line of lines) {
                const trimmed = line.trim()
                if (trimmed.startsWith('data: ')) {
                  const dataStr = trimmed.slice(6)
                  if (dataStr === '[DONE]') break
                  try {
                    const parsed = JSON.parse(dataStr)
                    const delta = parsed.choices?.[0]?.delta?.content ?? ''
                    if (delta) {
                      fullText += delta
                      setHistory((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: fullText }
                            : msg,
                        ),
                      )
                    }
                  } catch {
                    // Ignore malformed JSON chunks
                  }
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error('AI Explanation Error:', err)
        setHistory((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `⚠️ 请求失败: ${err?.message || '无法连接到 AI 服务，请检查网络或 API 配置。'}`,
                }
              : msg,
          ),
        )
      } finally {
        setLoading(false)
      }
    },
    [loading, setLoading, setHistory, settings],
  )

  const explainText = useCallback(
    (text: string) => {
      return sendMessage(`请解释选中的文本："${text}"`, text)
    },
    [sendMessage],
  )

  return {
    settings,
    setSettings,
    history,
    loading,
    explainText,
    sendMessage,
    clearHistory,
  }
}
