import type { Metadata } from "next"
import { generateMetadata as genMeta } from "@/lib/metadata"
import { prisma } from "@/lib/db/prisma"

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ username: string }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await params
  
  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        createdAt: true,
      },
    })

    if (!user) {
      return genMeta({
        title: "Perfil de Usuario",
        description: "Perfil de usuario de CartaTech",
        path: `/perfil/${username}`,
        noindex: true,
      })
    }

    return genMeta({
      title: `Perfil de ${user.username}`,
      description: `Perfil de ${user.username} en CartaTech. Explora sus mazos públicos, estadísticas y actividad en la comunidad de Mitos y Leyendas.`,
      keywords: [user.username, "perfil", "usuario", "mazos", "estadísticas"],
      path: `/perfil/${username}`,
    })
  } catch (error) {
    return genMeta({
      title: "Perfil de Usuario",
      description: "Perfil de usuario de CartaTech",
      path: `/perfil/${username}`,
      noindex: true,
    })
  }
}

export default async function UserProfileLayout({ children, params }: LayoutProps) {
  return <>{children}</>
}

