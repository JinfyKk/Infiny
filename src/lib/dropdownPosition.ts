'use client'

/**
 * Função utilitária para calcular a posição de um dropdown portalizado.
 * Trata o viewport da janela como um bounding box físico e faz clamp das coordenadas
 * para garantir que o dropdown nunca saia da tela.
 *
 * @param triggerRef - Referência ao elemento trigger (botão que abre o dropdown)
 * @param dropdownRef - Referência ao elemento dropdown (para medir largura/altura real)
 * @param options - Opções de configuração
 * @returns { left, top, placement, maxHeight, width } - Posição calculada e altura máxima permitida
 */
export interface DropdownPositionOptions {
  /** Margem mínima em relação às bordas da janela (padrão: 8px) */
  margin?: number
  /** Largura mínima do dropdown (padrão: 200px) */
  minWidth?: number
  /** Largura máxima do dropdown (padrão: 280px) */
  maxWidth?: number
  /** Se deve preferir abrir abaixo do trigger (padrão: true) */
  preferBottom?: boolean
}

export interface DropdownPositionResult {
  /** Posição horizontal em pixels (relative ao viewport) */
  left: number
  /** Posição vertical em pixels (relative ao viewport) */
  top: number
  /** Onde o dropdown foi posicionado em relação ao trigger */
  placement: 'top' | 'bottom'
  /** Altura máxima permitida para o dropdown */
  maxHeight: number
  /** Largura calculada do dropdown */
  width: number
}

/**
 * Calcula a posição ideal do dropdown garantindo que ele permaneça 100% dentro do viewport.
 *
 * Algoritmo:
 * 1. Mede o trigger e o dropdown (se já renderizado)
 * 2. Calcula posição preferida (abaixo ou acima do trigger)
 * 3. Verifica se cabe no viewport com a margem especificada
 * 4. Se não couber, tenta o lado oposto (flip)
 * 5. Se não couber em nenhum lado, faz clamp e limita altura
 * 6. Retorna posição final com placement e maxHeight
 */
export function calculateDropdownPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  dropdownRef: React.RefObject<HTMLElement | null>,
  options: DropdownPositionOptions = {}
): DropdownPositionResult {
  const {
    margin = 8,
    minWidth = 200,
    maxWidth = 280,
    preferBottom = true,
  } = options

  // Validações iniciais
  if (!triggerRef.current) {
    return {
      left: margin,
      top: margin,
      placement: 'bottom',
      maxHeight: window.innerHeight - margin * 2,
      width: minWidth,
    }
  }

  const trigger = triggerRef.current
  const triggerRect = trigger.getBoundingClientRect()

  // Dimensões do viewport (janela Electron)
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Dimensões do dropdown - usa valores reais se já renderizado, senão estima
  let dropdownWidth = minWidth
  let dropdownHeight = 300 // estimativa inicial razoável

  if (dropdownRef.current) {
    dropdownWidth = Math.max(minWidth, Math.min(maxWidth, dropdownRef.current.offsetWidth))
    dropdownHeight = dropdownRef.current.offsetHeight
  }

  // Calcula espaço disponível acima e abaixo do trigger
  const spaceBelow = viewportHeight - triggerRect.bottom - margin
  const spaceAbove = triggerRect.top - margin

  // Determina placement inicial baseado na preferência e espaço disponível
  let placement: 'top' | 'bottom' = preferBottom ? 'bottom' : 'top'

  // Se preferir bottom mas não couber, tenta top
  if (placement === 'bottom' && spaceBelow < dropdownHeight) {
    if (spaceAbove >= dropdownHeight || spaceAbove > spaceBelow) {
      placement = 'top'
    }
  }
  // Se preferir top mas não couber, tenta bottom
  else if (placement === 'top' && spaceAbove < dropdownHeight) {
    if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
      placement = 'bottom'
    }
  }

  // Calcula posição vertical baseada no placement
  let top: number
  if (placement === 'bottom') {
    top = triggerRect.bottom + margin
  } else {
    top = triggerRect.top - margin - dropdownHeight
  }

  // Calcula posição horizontal (alinhado à esquerda do trigger, com clamp)
  let left = triggerRect.left

  // Clamp horizontal: max(MARGIN, min(left, window.innerWidth - dropdownWidth - MARGIN))
  const maxLeft = viewportWidth - dropdownWidth - margin
  if (left > maxLeft) {
    left = Math.max(margin, maxLeft)
  }
  if (left < margin) {
    left = margin
  }

  // Clamp vertical: garante que não saia do viewport
  // Se placement é bottom mas top + height > viewportHeight - margin
  // Se placement é top mas top < margin
  if (placement === 'bottom') {
    const maxTop = viewportHeight - dropdownHeight - margin
    if (top > maxTop) {
      top = Math.max(margin, maxTop)
    }
  } else {
    if (top < margin) {
      top = margin
    }
  }

  // Calcula maxHeight real disponível baseado na posição final
  let maxHeight = dropdownHeight
  if (placement === 'bottom') {
    maxHeight = Math.max(100, viewportHeight - top - margin)
  } else {
    maxHeight = Math.max(100, top + dropdownHeight - margin)
  }
  // Limita ao viewport menos margens
  maxHeight = Math.min(maxHeight, viewportHeight - margin * 2)

  return {
    left: Math.round(left),
    top: Math.round(top),
    placement,
    maxHeight: Math.round(maxHeight),
    width: Math.round(dropdownWidth),
  }
}