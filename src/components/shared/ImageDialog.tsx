'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface ImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  title?: string
  subtitle?: string
}

export function ImageDialog({
  open,
  onOpenChange,
  imageUrl,
  title,
  subtitle,
}: ImageDialogProps) {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = title || 'attendance.jpg'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="relative">
          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10 flex items-start justify-between">
            <div className="text-white">
              {title && <DialogTitle className="text-white mb-1">{title}</DialogTitle>}
              {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={handleDownload}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                className="bg-white/20 hover:bg-white/30 border-white/30"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Image */}
          <img
            src={imageUrl}
            alt={title || 'Preview'}
            className="w-full h-auto max-h-[80vh] object-contain bg-black"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
