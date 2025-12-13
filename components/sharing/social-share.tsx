"use client"

import { useState, useEffect, useRef } from "react"
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check, Loader2, Linkedin, Send, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toastSuccess, toastError } from "@/lib/toast"
import { useAuth } from "@/contexts/auth-context"

interface SocialShareProps {
  url: string
  title: string
  description?: string
  className?: string
  deckId?: string // ID del mazo para generar código corto
}

export function SocialShare({ url, title, description = "", className = "", deckId }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false)
  const [supportsNativeShare, setSupportsNativeShare] = useState(false)
  const { user } = useAuth()
  const hasGeneratedRef = useRef<string | null>(null) // Rastrear qué deckId ya se procesó

  // Verificar soporte para Web Share API
  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setSupportsNativeShare(true)
    }
  }, [])

  // Generar código corto automáticamente si hay deckId
  useEffect(() => {
    if (!deckId || hasGeneratedRef.current === deckId) return

    const generateShortUrl = async () => {
      hasGeneratedRef.current = deckId
      setIsGeneratingShortUrl(true)
      try {
        const response = await fetch(`/api/decks/${deckId}/share`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: user?.id || "" }),
        })

        if (response.ok) {
          const data = await response.json()
          const newShortUrl = data.shareCode?.shortUrl || null
          if (newShortUrl) {
            setShortUrl(newShortUrl)
            console.log("Código corto generado:", newShortUrl)
          } else {
            console.warn("No se recibió código corto en la respuesta")
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.warn("No se pudo generar código corto:", response.status, errorData)
        }
      } catch (error) {
        console.error("Error al generar código corto:", error)
        hasGeneratedRef.current = null // Resetear para permitir reintento
      } finally {
        setIsGeneratingShortUrl(false)
      }
    }

    generateShortUrl()
  }, [deckId, user?.id])

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url
  const shareUrl = shortUrl || fullUrl
  const shareText = description ? `${title} - ${description}` : title

  // Debug: Log cuando cambia shareUrl
  useEffect(() => {
    console.log("shareUrl actualizado:", shareUrl, "shortUrl:", shortUrl, "fullUrl:", fullUrl)
  }, [shareUrl, shortUrl, fullUrl])

  // Tracking de analytics para compartir
  const trackShareEvent = async (platform: string) => {
    try {
      const { trackShare } = await import("@/lib/analytics/events")
      trackShare(platform, deckId, shareUrl)
    } catch {
      // Silenciar errores de analytics
    }
  }

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedTitle = encodeURIComponent(title)
    const encodedText = encodeURIComponent(shareText)

    let platformUrl = ""

    switch (platform) {
      case "facebook":
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "twitter":
        platformUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case "whatsapp":
        platformUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        break
      case "linkedin":
        platformUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
        break
      case "telegram":
        platformUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
        break
      case "reddit":
        platformUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
        break
      default:
        return
    }

    if (platformUrl) {
      window.open(platformUrl, "_blank", "width=600,height=400")
      trackShareEvent(platform)
    }
  }

  // Usar Web Share API nativo cuando esté disponible
  const handleNativeShare = async () => {
    if (!supportsNativeShare || typeof navigator === "undefined" || !navigator.share) {
      return
    }

    try {
      await navigator.share({
        title,
        text: shareText,
        url: shareUrl,
      })
      trackShareEvent("native")
      toastSuccess("Compartido correctamente")
    } catch (error: any) {
      // Error si el usuario cancela el diálogo de compartir
      if (error.name !== "AbortError") {
        console.error("Error al compartir:", error)
        toastError("Error al compartir")
      }
    }
  }

  const handleCopyLink = async () => {
    // Si está generando el código corto, esperar un momento
    if (isGeneratingShortUrl && deckId) {
      toastError("Espera a que se genere el enlace corto...")
      return
    }

    // Usar el valor actual de shortUrl o fullUrl
    const urlToCopy = shortUrl || fullUrl
    console.log("=== DEBUG COPY ===")
    console.log("shortUrl:", shortUrl)
    console.log("fullUrl:", fullUrl)
    console.log("urlToCopy:", urlToCopy)
    console.log("isGeneratingShortUrl:", isGeneratingShortUrl)
    console.log("deckId:", deckId)

    if (!urlToCopy || urlToCopy.trim() === "") {
      console.error("No hay URL para copiar")
      toastError("No hay enlace disponible para copiar")
      return
    }

    try {
      // Intentar usar Clipboard API moderna
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        console.log("Usando Clipboard API moderna")
        await navigator.clipboard.writeText(urlToCopy)
        console.log("Texto copiado exitosamente con Clipboard API")
      } else if (typeof document !== "undefined") {
        // Fallback para navegadores que no soportan Clipboard API
        console.log("Usando fallback execCommand")
        const textarea = document.createElement("textarea")
        textarea.value = urlToCopy
        textarea.style.position = "fixed"
        textarea.style.top = "0"
        textarea.style.left = "0"
        textarea.style.width = "2em"
        textarea.style.height = "2em"
        textarea.style.padding = "0"
        textarea.style.border = "none"
        textarea.style.outline = "none"
        textarea.style.boxShadow = "none"
        textarea.style.background = "transparent"
        textarea.style.opacity = "0"
        textarea.style.pointerEvents = "none"
        textarea.setAttribute("readonly", "")
        document.body.appendChild(textarea)
        
        // Seleccionar en iOS
        if (navigator.userAgent.match(/ipad|iphone/i)) {
          const range = document.createRange()
          range.selectNodeContents(textarea)
          const selection = window.getSelection()
          if (selection) {
            selection.removeAllRanges()
            selection.addRange(range)
          }
          textarea.setSelectionRange(0, 999999)
        } else {
          textarea.select()
        }
        
        try {
          const success = document.execCommand("copy")
          console.log("execCommand resultado:", success)
          if (!success) {
            throw new Error("execCommand('copy') falló")
          }
        } finally {
          document.body.removeChild(textarea)
        }
      } else {
        throw new Error("Clipboard API no disponible")
      }
      
      // Verificar que se copió correctamente (solo en desarrollo)
      if (process.env.NODE_ENV === "development") {
        try {
          const copiedText = await navigator.clipboard.readText()
          console.log("Verificación: Texto en portapapeles:", copiedText)
        } catch {
          // Ignorar error de verificación
        }
      }
      
      setCopied(true)
      toastSuccess(shortUrl ? "Enlace corto copiado al portapapeles" : "Enlace copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
      trackShareEvent("copy")
    } catch (error) {
      console.error("Error al copiar enlace:", error)
      toastError(`No se pudo copiar el enlace: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* Web Share API nativo (si está disponible) */}
        {supportsNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Send className="h-4 w-4 mr-2" />
              Compartir nativo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {/* Redes sociales */}
        <DropdownMenuItem onClick={() => handleShare("facebook")}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("twitter")}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("linkedin")}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("telegram")}>
          <Send className="h-4 w-4 mr-2" />
          Telegram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("reddit")}>
          <Link2 className="h-4 w-4 mr-2" />
          Reddit
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Copiar enlace */}
        <DropdownMenuItem onClick={handleCopyLink} disabled={isGeneratingShortUrl}>
          {isGeneratingShortUrl ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              {shortUrl ? "Copiar enlace corto" : "Copiar enlace"}
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}




