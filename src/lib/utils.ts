import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Agora'
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const icons: Record<string, string> = {
    ts: 'code',
    tsx: 'code',
    js: 'code',
    jsx: 'code',
    json: 'braces',
    html: 'code',
    css: 'code',
    scss: 'code',
    md: 'file-text',
    txt: 'file-text',
    py: 'code',
    rs: 'code',
    go: 'code',
    java: 'code',
    cpp: 'code',
    c: 'code',
    h: 'code',
    png: 'image',
    jpg: 'image',
    jpeg: 'image',
    webp: 'image',
    gif: 'image',
    svg: 'image',
    pdf: 'file-text',
    zip: 'archive',
    tar: 'archive',
    gz: 'archive',
  }
  return icons[ext || ''] || 'file'
}

export function getFileLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  const languages: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    sh: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    sql: 'sql',
  }
  return languages[ext || ''] || 'plaintext'
}

export function extractCodeBlocks(content: string): Array<{ language: string; code: string }> {
  const blocks: Array<{ language: string; code: string }> = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ language: match[1] || 'plaintext', code: match[2].trim() })
  }
  return blocks
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function getFileTypeFromName(name: string): 'image' | 'code' | 'text' | 'other' {
  const ext = name.split('.').pop()?.toLowerCase()
  const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico']
  const codeExts = ['ts', 'tsx', 'js', 'jsx', 'json', 'html', 'css', 'scss', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'swift', 'kt', 'vue', 'svelte', 'md', 'mdx', 'sql', 'sh', 'yml', 'yaml', 'xml', 'toml', 'ini', 'cfg', 'conf', 'dockerfile', 'makefile']

  if (imageExts.includes(ext || '')) return 'image'
  if (codeExts.includes(ext || '')) return 'code'
  return 'other'
}

export const getFileType = getFileTypeFromName

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}

export function throttle<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let lastCall = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= ms) {
      lastCall = now
      fn(...args)
    }
  }
}