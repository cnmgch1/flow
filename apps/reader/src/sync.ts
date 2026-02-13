import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { parseCookies } from 'nookies'

import { BookRecord, db } from './db'

export const WEBDAV_CONFIG_KEY = 'webdav-config'

export interface WebDAVConfig {
  url: string
  directory: string
  username: string
  password: string
}

export function getWebDAVConfig(): WebDAVConfig | null {
  const cookies = parseCookies()
  const raw = cookies[WEBDAV_CONFIG_KEY]
  if (!raw) return null
  try {
    return JSON.parse(atob(raw)) as WebDAVConfig
  } catch {
    return null
  }
}

interface RemoteFile {
  name: string
}

interface SerializedBooks {
  version: number
  dbVersion: number
  books: BookRecord[]
}

const VERSION = 1
export const DATA_FILENAME = 'data.json'

function serializeData(books?: BookRecord[]) {
  return JSON.stringify({
    version: VERSION,
    dbVersion: db?.verno,
    books,
  })
}

function deserializeData(text: string) {
  const { version, dbVersion, books } = JSON.parse(text) as SerializedBooks

  if (version < VERSION) {
    // migrate `data.json`
  }
  if (db && dbVersion < db.verno) {
    // migrate `BookRecord`
  }

  return books
}

export async function uploadData(books: BookRecord[]) {
  return fetch(`/api/webdav/upload?path=/${DATA_FILENAME}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: serializeData(books),
  })
}

export async function uploadFile(name: string, file: File | Blob) {
  return fetch(
    `/api/webdav/upload?path=/files/${encodeURIComponent(name)}`,
    {
      method: 'PUT',
      body: file,
    },
  )
}

export async function downloadFile(name: string): Promise<Blob> {
  const res = await fetch(
    `/api/webdav/download?path=/files/${encodeURIComponent(name)}`,
  )
  if (!res.ok) throw new Error('Download failed')
  return res.blob()
}

export async function deleteFiles(names: string[]) {
  return fetch('/api/webdav/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paths: names.map((n) => `/files/${n}`),
    }),
  })
}

export const webdavFilesFetcher = (path: string) => {
  if (!getWebDAVConfig()) return Promise.reject()
  return fetch(`/api/webdav/list?path=${encodeURIComponent(path)}`).then(
    (res) => {
      if (!res.ok) return Promise.reject()
      return res.json() as Promise<RemoteFile[]>
    },
  )
}

export const webdavBooksFetcher = (path: string) => {
  if (!getWebDAVConfig()) return Promise.reject()
  return fetch(
    `/api/webdav/download?path=${encodeURIComponent(path)}`,
  ).then((res) => {
    if (!res.ok) return Promise.reject()
    return res.text().then((d) => deserializeData(d))
  })
}

export async function pack() {
  const books = await db?.books.toArray()
  const covers = await db?.covers.toArray()
  const files = await db?.files.toArray()

  const zip = new JSZip()
  zip.file(DATA_FILENAME, serializeData(books))
  zip.file('covers.json', JSON.stringify(covers))

  const folder = zip.folder('files')
  files?.forEach((f) => folder?.file(f.file.name, f.file))

  const date = new Intl.DateTimeFormat('fr-CA').format().replaceAll('-', '')

  return zip.generateAsync({ type: 'blob' }).then((content) => {
    saveAs(content, `flow_backup_${date}.zip`)
  })
}

export async function unpack(file: File) {
  const zip = new JSZip()
  await zip.loadAsync(file)

  const booksJSON = zip.file(DATA_FILENAME)
  const coversJSON = zip.file('covers.json')
  if (!booksJSON || !coversJSON) return

  const books = deserializeData(await booksJSON.async('text'))

  db?.books.bulkPut(books)

  const coversText = await coversJSON.async('text')
  db?.covers.bulkPut(JSON.parse(coversText))

  const folder = zip.folder('files')
  folder?.forEach(async (_, f) => {
    const book = books.find((b) => `files/${b.name}` === f.name)
    if (!book) return

    const data = await f.async('blob')
    const file = new File([data], book.name)
    db?.files.put({ file, id: book.id })
  })
}
