import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function adminMiddleware(request: NextRequest) {
    try {
        const { userId, sessionClaims } = await auth()
        
        if (!userId || !sessionClaims?.email) {
            return NextResponse.redirect(new URL('/sign-in', request.url))
        }

        // For now, we'll check if the email contains admin
        // Later this will check the database role
        const isAdmin = sessionClaims.email.includes('admin') || sessionClaims.email.includes('@admin')
        
        if (!isAdmin) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Admin middleware error:', error)
        return NextResponse.redirect(new URL('/sign-in', request.url))
    }
}
