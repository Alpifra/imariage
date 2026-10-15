import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 24, strokeWidth = 2, children, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export const PlusIcon = (p: IconProps) => <Icon strokeWidth={2.4} {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const ArrowUpIcon = (p: IconProps) => <Icon strokeWidth={2.4} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Icon>
export const PauseIcon = (p: IconProps) => <Icon strokeWidth={2.4} {...p}><path d="M9 6v12M15 6v12" /></Icon>
export const CheckIcon = (p: IconProps) => <Icon strokeWidth={3} {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Icon>
export const ChevronRightIcon = (p: IconProps) => <Icon strokeWidth={2.2} {...p}><path d="M9 5l7 7-7 7" /></Icon>
export const ChevronLeftIcon = (p: IconProps) => <Icon strokeWidth={2.4} {...p}><path d="M15 5l-7 7 7 7" /></Icon>
export const PhotoIcon = (p: IconProps) => <Icon strokeWidth={1.8} {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></Icon>
export const CameraIcon = (p: IconProps) => <Icon strokeWidth={1.8} {...p}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="4" /></Icon>
export const TrashIcon = (p: IconProps) => <Icon strokeWidth={1.8} {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" /></Icon>
export const OfflineIcon = (p: IconProps) => <Icon strokeWidth={1.8} {...p}><path d="M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 12.6a10 10 0 0 1 4-2.4M14.5 10.3a10 10 0 0 1 4.5 2.3M2 8.8A15 15 0 0 1 6.4 6M10 4.2A15 15 0 0 1 22 8.8M12 20h.01" /></Icon>
export const AlbumIcon = (p: IconProps) => <Icon strokeWidth={1.5} {...p}><rect x="3" y="5" width="15" height="14" rx="2.5" /><path d="M7 3h11a3 3 0 0 1 3 3v10" /><circle cx="8" cy="10" r="1.6" /><path d="M18 15l-4-4-8 8" /></Icon>
export const QrIcon = (p: IconProps) => <Icon strokeWidth={1.9} {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 14h3v3M21 14v.01M17 21h4v-4M14 18v3" /></Icon>
export const DownloadIcon = (p: IconProps) => <Icon strokeWidth={2} {...p}><path d="M12 4v12M6 10l6 6 6-6M5 20h14" /></Icon>
export const CloseIcon = (p: IconProps) => <Icon strokeWidth={2.2} {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
