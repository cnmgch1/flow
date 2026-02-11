import Dexie from 'dexie'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { parseCookies, destroyCookie } from 'nookies'

import {
  ColorScheme,
  useColorScheme,
  useTranslation,
} from '@flow/reader/hooks'
import { useSettings } from '@flow/reader/state'
import { WEBDAV_CONFIG_KEY, WebDAVConfig, getWebDAVConfig } from '@flow/reader/sync'

import { Button } from '../Button'
import { Checkbox, Select } from '../Form'
import { Page } from '../Page'

export const Settings: React.FC = () => {
  const { scheme, setScheme } = useColorScheme()
  const { asPath, push, locale } = useRouter()
  const [settings, setSettings] = useSettings()
  const t = useTranslation('settings')

  return (
    <Page headline={t('title')}>
      <div className="space-y-6">
        <Item title={t('language')}>
          <Select
            value={locale}
            onChange={(e) => {
              push(asPath, undefined, { locale: e.target.value })
            }}
          >
            <option value="en-US">English</option>
            <option value="zh-CN">简体中文</option>
            <option value="ja-JP">日本語</option>
          </Select>
        </Item>
        <Item title={t('color_scheme')}>
          <Select
            value={scheme}
            onChange={(e) => {
              setScheme(e.target.value as ColorScheme)
            }}
          >
            <option value="system">{t('color_scheme.system')}</option>
            <option value="light">{t('color_scheme.light')}</option>
            <option value="dark">{t('color_scheme.dark')}</option>
          </Select>
        </Item>
        <Item title={t('text_selection_menu')}>
          <Checkbox
            name={t('text_selection_menu.enable')}
            checked={settings.enableTextSelectionMenu}
            onChange={(e) => {
              setSettings({
                ...settings,
                enableTextSelectionMenu: e.target.checked,
              })
            }}
          />
        </Item>
        <Synchronization />
        <Item title={t('cache')}>
          <Button
            variant="secondary"
            onClick={() => {
              window.localStorage.clear()
              Dexie.getDatabaseNames().then((names) => {
                names.forEach((n) => Dexie.delete(n))
              })
            }}
          >
            {t('cache.clear')}
          </Button>
        </Item>
      </div>
    </Page>
  )
}

const inputClassName =
  'typescale-body-medium text-on-surface-variant bg-default w-full max-w-xs px-1.5 py-1 !text-[13px]'

const Synchronization: React.FC = () => {
  const config = getWebDAVConfig()
  const t = useTranslation('settings.synchronization')

  const [url, setUrl] = useState('')
  const [directory, setDirectory] = useState('/flow')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConnect = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/webdav/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          directory,
          username,
          password,
        } as WebDAVConfig),
      })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        setError(data.error || t('connect_failed'))
      }
    } catch {
      setError(t('connect_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Item title={t('title')}>
      {config ? (
        <div>
          <p className="typescale-body-medium text-on-surface-variant break-all">
            {config.url}
            {config.directory}
          </p>
          <p className="typescale-body-small text-outline mt-1">
            {config.username}
          </p>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => {
              destroyCookie(null, WEBDAV_CONFIG_KEY, { path: '/' })
              window.location.reload()
            }}
          >
            {t('disconnect')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <label className="typescale-label-medium text-on-surface-variant mb-1 block !text-[13px]">
              {t('url')}
            </label>
            <input
              type="url"
              className={inputClassName}
              placeholder="https://dav.example.com/dav"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="typescale-label-medium text-on-surface-variant mb-1 block !text-[13px]">
              {t('directory')}
            </label>
            <input
              type="text"
              className={inputClassName}
              placeholder="/flow"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
            />
          </div>
          <div>
            <label className="typescale-label-medium text-on-surface-variant mb-1 block !text-[13px]">
              {t('username')}
            </label>
            <input
              type="text"
              className={inputClassName}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="typescale-label-medium text-on-surface-variant mb-1 block !text-[13px]">
              {t('password')}
            </label>
            <input
              type="password"
              className={inputClassName}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <p className="typescale-body-small text-red-500">{error}</p>
          )}
          <Button
            onClick={handleConnect}
            disabled={loading || !url || !username || !password}
          >
            {loading ? t('connecting') : t('connect')}
          </Button>
        </div>
      )}
    </Item>
  )
}

interface PartProps {
  title: string
}
const Item: React.FC<PartProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="typescale-title-small text-on-surface-variant">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  )
}

Settings.displayName = 'settings'
