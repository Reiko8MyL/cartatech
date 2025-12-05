import { NextResponse } from 'next/server'

export async function GET() {
  // Redirigir al logo de Cloudinary
  return NextResponse.redirect(
    'https://res.cloudinary.com/dpbmbrekj/image/upload/v1764480944/noseaun_jll4ef.webp',
    302
  )
}

