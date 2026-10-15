import { useImperativeHandle, useRef, useState, type Ref } from 'react'
import { useNavigate } from 'react-router'
import { CameraIcon, PhotoIcon } from '../components/icons'
import { ActionSheet } from '../components/Sheet'
import { useUploads } from './uploads'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

export interface AddPhotosHandle {
  open: () => void
}

/** "Ajouter" action sheet: library (multiple) or camera, then the upload queue screen */
export function AddPhotos({ ref }: { ref: Ref<AddPhotosHandle> }) {
  const [open, setOpen] = useState(false)
  const library = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const uploads = useUploads()
  const navigate = useNavigate()

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), [])

  const onFiles = (files: FileList | null) => {
    setOpen(false)
    if (!files || files.length === 0) return
    uploads.add(files)
    navigate('/envoi')
  }

  return (
    <>
      <input ref={library} type="file" accept={ACCEPT} multiple hidden onChange={(event) => { onFiles(event.target.files); event.target.value = '' }} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(event) => { onFiles(event.target.files); event.target.value = '' }} />
      {open && (
        <ActionSheet
          title="Ajouter des photos à l'album"
          onCancel={() => setOpen(false)}
          actions={[
            { label: 'Choisir dans mes photos', icon: <PhotoIcon size={26} />, onSelect: () => library.current?.click() },
            { label: 'Prendre une photo', icon: <CameraIcon size={26} />, onSelect: () => camera.current?.click() },
          ]}
        />
      )}
    </>
  )
}
