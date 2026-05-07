'use client'

import { Camera, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRef, useState } from 'react'

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onClose?: () => void
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      setStream(mediaStream)
      setError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)

        const imageData = canvas.toDataURL('image/jpeg', 0.9)
        setCapturedImage(imageData)
        onCapture(imageData)
        stopCamera()
      }
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleClose = () => {
    stopCamera()
    onClose?.()
  }

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage)
      handleClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Ambil Foto Selfie</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="h-full w-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>

        <div className="flex gap-2">
          {!stream && !capturedImage && (
            <Button
              className="flex-1"
              onClick={startCamera}
            >
              <Camera className="mr-2 h-4 w-4" />
              Buka Kamera
            </Button>
          )}

          {stream && !capturedImage && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={stopCamera}
              >
                Batal
              </Button>
              <Button
                className="flex-1"
                onClick={captureImage}
              >
                <Camera className="mr-2 h-4 w-4" />
                Ambil Foto
              </Button>
            </>
          )}

          {capturedImage && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={retakePhoto}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Foto Ulang
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
              >
                Konfirmasi
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
