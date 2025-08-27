import { auth } from '@clerk/nextjs/server'
import { db } from '@/config/db'
import { usersTable } from '@/config/schema'
import { eq } from 'drizzle-orm'

export async function isAdmin(): Promise<boolean> {
    try {
        const { userId } = await auth()
        if (!userId) return false

        // Get user from Clerk
        const user = await auth()
        if (!user.userId) return false

        // Check if user exists in our database and has admin role
        const dbUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, user.sessionClaims?.email as string))
            .limit(1)

        return dbUser.length > 0 && dbUser[0].role === 'admin'
    } catch (error) {
        console.error('Error checking admin status:', error)
        return false
    }
}

export async function requireAdmin() {
    const adminStatus = await isAdmin()
    if (!adminStatus) {
        throw new Error('Admin access required')
    }
    return adminStatus
}

export async function getCurrentUser() {
    try {
        const { userId } = await auth()
        if (!userId) return null

        const user = await auth()
        if (!user.sessionClaims?.email) return null

        const dbUser = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, user.sessionClaims.email as string))
            .limit(1)

        return dbUser.length > 0 ? dbUser[0] : null
    } catch (error) {
        console.error('Error getting current user:', error)
        return null
    }
}
