import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createPortalSession } from '@/lib/stripe'
import { db } from '@/config/db'
import { usersTable } from '@/config/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
    try {
        const { userId, sessionClaims } = await auth()
        
        if (!userId || !sessionClaims?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user from database
        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, sessionClaims.email as string))
            .limit(1)

        if (user.length === 0 || !user[0].stripeCustomerId) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
        }

        // Create portal session
        const session = await createPortalSession(
            user[0].stripeCustomerId,
            `${request.nextUrl.origin}/dashboard/billing`
        )

        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error('Portal error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
