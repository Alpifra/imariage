import { api } from '../api/client'

const DELETE_CONCURRENCY = 4

export async function deletePhotos(ids: string[]): Promise<{ deleted: string[]; failed: number }> {
  const queue = [...ids]
  const deleted: string[] = []
  let failed = 0
  const worker = async () => {
    for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
      try {
        await api.deletePhoto(id)
        deleted.push(id)
      } catch {
        failed++
      }
    }
  }
  await Promise.all(Array.from({ length: DELETE_CONCURRENCY }, worker))

  return { deleted, failed }
}
