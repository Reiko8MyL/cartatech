"use client"

import { useState, useEffect } from "react"
import { Share2, Facebook, Twitter, MessageCircle, Copy, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const { user } = useAuth()

  // Generar código corto automáticamente si hay deckId
  useEffect(() => {
    if (deckId && !shortUrl && !isGeneratingShortUrl) {
      generateShortUrl()
    }
  }, [deckId])

  const generateShortUrl = async () => {
    if (!deckId) return

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
        setShortUrl(data.shareCode?.shortUrl || null)
      } else {
        // Si falla, usar URL larga
        console.warn("No se pudo generar código corto, usando URL larga")
      }
    } catch (error) {
      console.error("Error al generar código corto:", error)
      // Si falla, usar URL larga
    } finally {
      setIsGeneratingShortUrl(false)
    }
  }

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url
  const shareUrl = shortUrl || fullUrl
  const shareText = description ? `${title} - ${description}` : title

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
      default:
        return
    }

    if (platformUrl) {
      window.open(platformUrl, "_blank", "width=600,height=400")
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toastSuccess("Enlace copiado al portapapeles")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error al copiar enlace:", error)
      toastError("Error al copiar enlace")
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
      <DropdownMenuContent align="end">
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




