export interface Guest {
  id: string
  firstName: string
  lastName: string
  photoCount: number
  isAdmin: boolean
}

export interface Photo {
  id: string
  authorId: string
  authorName: string
  mine: boolean
  status: 'processing' | 'ready' | 'failed'
  width?: number
  height?: number
  takenAt?: string
  createdAt: string
  thumbnailUrl?: string
  mediumUrl?: string
}

export interface Album {
  photoCount: number
  contributorCount: number
  storageBytes: number
}

export interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'ready' | 'failed'
  authorId?: string
  authorName?: string
  photoCount: number
  processedCount: number
  fileSize?: number
  createdAt: string
  finishedAt?: string
  downloadUrl?: string
}
