"use client"

import { useState, useEffect, useRef } from "react"

interface UseMobilePanelDragOptions {
  minHeight: number
  getMaxHeight: () => number
  isMobile: boolean
}

interface UseMobilePanelDragReturn {
  panelHeight: number
  isDragging: boolean
  overlayOpacity: number
  handleDragStart: (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => void
  handleDragMove: (e: MouseEvent | TouchEvent) => void
  handleDragEnd: () => void
  collapsePanel: () => void
}

export function useMobilePanelDrag({
  minHeight,
  getMaxHeight,
  isMobile,
}: UseMobilePanelDragOptions): UseMobilePanelDragReturn {
  const [panelHeight, setPanelHeight] = useState(200)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragStartHeight, setDragStartHeight] = useState(0)

  // Handlers para el drag del panel (solo en pantallas < 1024px)
  function handleDragStart(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if (!isMobile) return
    
    setIsDragging(true)
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStartY(clientY)
    setDragStartHeight(panelHeight)
    
    // Prevenir scroll del fondo
    e.preventDefault()
    e.stopPropagation()
    
    // Prevenir scroll del body
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  }

  function handleDragMove(e: MouseEvent | TouchEvent) {
    if (!isDragging || !isMobile) return
    
    // Prevenir scroll del fondo
    e.preventDefault()
    e.stopPropagation()
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = dragStartY - clientY // Negativo cuando arrastra hacia arriba
    const maxHeight = getMaxHeight()
    const newHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeight + deltaY))
    setPanelHeight(newHeight)
  }

  function handleDragEnd() {
    if (!isDragging || !isMobile) return
    
    setIsDragging(false)
    
    // Restaurar scroll del body
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    
    const maxHeight = getMaxHeight()
    // Snap a posiciones cercanas
    const threshold = (maxHeight - minHeight) / 3
    if (panelHeight < minHeight + threshold) {
      setPanelHeight(minHeight)
    } else if (panelHeight > maxHeight - threshold) {
      setPanelHeight(maxHeight)
    } else {
      // Snap al medio
      setPanelHeight((minHeight + maxHeight) / 2)
    }
  }

  // Efectos para manejar eventos globales de drag
  useEffect(() => {
    if (isDragging && isMobile) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      document.addEventListener('touchmove', handleDragMove, { passive: false })
      document.addEventListener('touchend', handleDragEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
        document.removeEventListener('touchmove', handleDragMove)
        document.removeEventListener('touchend', handleDragEnd)
      }
    }
  }, [isDragging, isMobile, dragStartY, dragStartHeight, panelHeight])

  // Actualizar altura cuando cambia el tamaño de la ventana
  useEffect(() => {
    if (!isMobile) return
    
    function updateMaxHeight() {
      const newMaxHeight = getMaxHeight()
      if (panelHeight > newMaxHeight) {
        setPanelHeight(newMaxHeight)
      }
    }
    
    window.addEventListener('resize', updateMaxHeight)
    return () => window.removeEventListener('resize', updateMaxHeight)
  }, [panelHeight, isMobile, getMaxHeight])

  // Prevenir scroll del fondo cuando el panel está expandido en móvil
  // PERO solo cuando el usuario está arrastrando el handle
  useEffect(() => {
    if (!isMobile) return
    
    if (isDragging && panelHeight > minHeight + 50) {
      // Solo prevenir scroll cuando se está arrastrando activamente
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      // Permitir scroll del fondo siempre que no se esté arrastrando
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    
    return () => {
      // Limpiar al desmontar o cambiar a desktop
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isDragging, panelHeight, isMobile, minHeight])

  const maxHeight = getMaxHeight()
  const overlayOpacity = isMobile && panelHeight > minHeight + 50 
    ? (panelHeight - minHeight) / (maxHeight - minHeight)
    : 0

  // Reset altura cuando vuelve a desktop
  useEffect(() => {
    if (!isMobile) {
      setPanelHeight(200)
    }
  }, [isMobile])

  // Función para colapsar el panel
  function collapsePanel() {
    if (isMobile) {
      setPanelHeight(minHeight)
    }
  }

  return {
    panelHeight,
    isDragging,
    overlayOpacity,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    collapsePanel,
  }
}

