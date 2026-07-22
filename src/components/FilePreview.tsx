import { FileText, Image, Code, Download, ExternalLink, X, FolderOpen } from 'lucide-react'
import { formatFileSize, getFileTypeFromName } from '@/lib/utils'

interface FilePreviewProps {
  file: {
    name: string
    path: string
    size: number
    type: string
  }
  onClose: () => void
  onOpen: () => void
  onDownload: () => void
  onShowInFolder: () => void
}

export function FilePreview({ file, onClose, onOpen, onDownload, onShowInFolder }: FilePreviewProps) {
  const type = getFileTypeFromName(file.name)
  const isImage = type === 'image'
  const isCode = type === 'code'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in-200">
      <div className="glass w-full max-w-4xl max-h-[90vh] rounded-2xl border border-glassBorder shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in-200 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glassBorder">
          <div className="flex items-center gap-3">
            {isImage ? (
              <Image className="w-5 h-5 text-primary" />
            ) : isCode ? (
              <Code className="w-5 h-5 text-accent" />
            ) : (
              <FileText className="w-5 h-5 text-textSecondary" />
            )}
            <div>
              <p className="font-medium text-textPrimary truncate max-w-[300px]">{file.name}</p>
              <p className="text-xs text-textMuted">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onOpen} className="p-2 rounded-lg hover:bg-surfaceHover transition-colors" aria-label="Abrir arquivo">
              <FolderOpen className="w-4 h-4 text-textSecondary" />
            </button>
            <button onClick={onDownload} className="p-2 rounded-lg hover:bg-surfaceHover transition-colors" aria-label="Baixar">
              <Download className="w-4 h-4 text-textSecondary" />
            </button>
            <button onClick={onShowInFolder} className="p-2 rounded-lg hover:bg-surfaceHover transition-colors" aria-label="Mostrar na pasta">
              <ExternalLink className="w-4 h-4 text-textSecondary" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surfaceHover transition-colors" aria-label="Fechar">
              <X className="w-4 h-4 text-textSecondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {isImage ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <img
                src={file.path}
                alt={file.name}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          ) : isCode ? (
            <pre className="bg-surface rounded-lg p-4 overflow-auto"><code className="font-mono text-sm text-textPrimary">{file.path}</code></pre>
          ) : (
            <div className="flex items-center justify-center min-h-[400px] text-textMuted">
              <FileText className="w-12 h-12 mb-2" />
              <p>Pré-visualização não disponível para este tipo de arquivo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}