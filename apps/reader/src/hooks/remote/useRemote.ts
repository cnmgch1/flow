import useSWR from 'swr/immutable'

import {
  DATA_FILENAME,
  webdavBooksFetcher,
  webdavFilesFetcher,
} from '@flow/reader/sync'

export function useRemoteFiles() {
  return useSWR('/files', webdavFilesFetcher, { shouldRetryOnError: false })
}

export function useRemoteBooks() {
  return useSWR(`/${DATA_FILENAME}`, webdavBooksFetcher, {
    shouldRetryOnError: false,
  })
}
