import { marked } from 'marked'
import React, { useState, useRef, useEffect, useMemo } from 'react'
import { MdAutoAwesome, MdRefresh, MdSend } from 'react-icons/md'
import { VscTrash, VscSettingsGear } from 'react-icons/vsc'

import { useAi, defaultAiSettings } from '../../hooks/useAi'
import { useTranslation } from '../../hooks/useTranslation'
import { Button } from '../Button'
import { TextField } from '../Form'
import { PaneViewProps, PaneView } from '../base'

marked.setOptions({
  gfm: true,
  breaks: true,
})

export const AiView: React.FC<PaneViewProps> = (props) => {
  const t = useTranslation('ai')
  const { settings, setSettings, history, loading, sendMessage, clearHistory } = useAi()
  const [showSettings, setShowSettings] = useState(false)
  const [inputPrompt, setInputPrompt] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Local state for editing API settings & System Prompt
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || '')
  const [apiKey, setApiKey] = useState(settings.apiKey || '')
  const [model, setModel] = useState(settings.model || '')
  const [systemPrompt, setSystemPrompt] = useState(
    settings.systemPrompt || defaultAiSettings.systemPrompt || '',
  )

  useEffect(() => {
    setBaseUrl(settings.baseUrl || '')
    setApiKey(settings.apiKey || '')
    setModel(settings.model || '')
    setSystemPrompt(settings.systemPrompt || defaultAiSettings.systemPrompt || '')

    if (!settings.apiKey) {
      setShowSettings(true)
    }
  }, [settings])

  // Scroll to bottom when history updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, loading])

  const handleSaveSettings = () => {
    setSettings({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      systemPrompt: systemPrompt.trim(),
    })
    setShowSettings(false)
  }

  const handleResetSettings = () => {
    setSystemPrompt(defaultAiSettings.systemPrompt || '')
  }

  const handleSend = () => {
    if (!inputPrompt.trim() || loading) return
    sendMessage(inputPrompt.trim())
    setInputPrompt('')
  }

  return (
    <PaneView
      actions={[
        {
          id: 'clear-history',
          title: t('clear_history') || '清空对话',
          Icon: VscTrash,
          handle: clearHistory,
        },
        {
          id: 'settings',
          title: t('settings') || 'API 设置',
          Icon: VscSettingsGear,
          handle: () => setShowSettings((prev) => !prev),
        },
      ]}
      {...props}
    >
      <div className="select-text flex h-full flex-col overflow-hidden bg-surface text-on-surface">
        {/* API & Prompt Settings Dropdown Panel */}
        {showSettings && (
          <div className="border-b border-surface-variant bg-surface-variant/20 p-3 space-y-2 text-xs select-text">
            <div className="font-bold text-on-surface-variant mb-1 flex items-center justify-between">
              <span>{t('settings_title') || 'AI 大模型 & 提示词配置'}</span>
              <button
                type="button"
                onClick={handleResetSettings}
                className="text-primary hover:underline flex items-center gap-0.5"
                title="恢复默认系统提示词"
              >
                <MdRefresh size={14} />
                <span>恢复默认提示词</span>
              </button>
            </div>
            <div>
              <label className="block text-outline mb-0.5">API URL</label>
              <TextField
                as="input"
                name="baseUrl"
                value={baseUrl}
                hideLabel
                placeholder="https://www.wintoken.dev/v1"
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-outline mb-0.5">API Key</label>
              <TextField
                as="input"
                name="apiKey"
                type="password"
                value={apiKey}
                hideLabel
                placeholder="sk-..."
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-outline mb-0.5">Model</label>
              <TextField
                as="input"
                name="model"
                value={model}
                hideLabel
                placeholder="deepseek-v4-flash"
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-outline mb-0.5">System Prompt (系统提示词)</label>
              <TextField
                as="textarea"
                name="systemPrompt"
                value={systemPrompt}
                hideLabel
                rows={3}
                placeholder="设定 AI 助手的角色、视角或回答要求..."
                className="w-full text-xs max-h-28 resize-none"
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>
            <div className="pt-1 flex justify-end gap-2">
              <Button compact variant="secondary" onClick={() => setShowSettings(false)}>
                取消
              </Button>
              <Button compact onClick={handleSaveSettings}>
                保存设置
              </Button>
            </div>
          </div>
        )}

        {/* Message History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3 select-text">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-outline/80 p-4 space-y-2 select-none">
              <MdAutoAwesome size={36} className="text-primary/60" />
              <p className="text-sm font-medium">AI 读书助手已就绪</p>
              <p className="text-xs">
                在电子书中框选文本并点击 <span className="font-bold text-primary">“AI 解释”</span>，或在下方直接发送问题。
              </p>
            </div>
          ) : (
            history.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start w-full'
                }`}
              >
                {/* Selected Text Quote Pill */}
                {msg.selectedText && (
                  <div className="mb-1 max-w-[85%] rounded bg-primary/10 px-2.5 py-1 text-xs text-primary border-l-2 border-primary italic select-text">
                    “{msg.selectedText}”
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`rounded-lg px-3 py-2 text-xs leading-relaxed break-words shadow-sm select-text cursor-text ${
                    msg.role === 'user'
                      ? 'max-w-[85%] bg-primary text-on-primary rounded-br-none'
                      : 'w-full bg-surface-variant/40 text-on-surface rounded-bl-none border border-surface-variant/50'
                  }`}
                >
                  {msg.content ? (
                    msg.role === 'assistant' ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      <div className="whitespace-pre-wrap font-sans select-text">{msg.content}</div>
                    )
                  ) : loading && msg.role === 'assistant' ? (
                    <span className="animate-pulse flex items-center gap-1 text-outline select-none">
                      <MdAutoAwesome className="animate-spin" /> AI 思考中...
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-surface-variant/60 p-2 bg-surface select-text">
          <div className="flex items-end gap-1.5">
            <div className="flex-1">
              <TextField
                as="textarea"
                name="aiPrompt"
                value={inputPrompt}
                hideLabel
                rows={1}
                placeholder="发送消息或追问..."
                className="w-full text-xs max-h-24 resize-none"
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
            </div>
            <button
              type="button"
              disabled={!inputPrompt.trim() || loading}
              onClick={handleSend}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40 hover:opacity-90 transition-opacity"
              title="发送"
            >
              <MdSend size={14} />
            </button>
          </div>
        </div>
      </div>
    </PaneView>
  )
}

const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content) as string
    } catch {
      return content
    }
  }, [content])

  return (
    <div
      className="markdown-body select-text cursor-text space-y-1.5 leading-relaxed text-xs [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_h1]:text-sm [&_h1]:font-bold [&_h2]:text-xs [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-semibold [&_code]:bg-surface-variant/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_pre]:bg-surface-variant/80 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_blockquote]:border-l-2 [&_blockquote]:border-outline/50 [&_blockquote]:pl-2 [&_blockquote]:italic text-on-surface"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
