import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/config/db'
import { adminsTable } from '@/config/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const ADMIN_TOKEN_NAME = 'admin-token'

export interface AdminUser {
    id: number
    name: string
    email: string
    role: string
    active: boolean
}

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword)
}

export function generateAdminToken(admin: AdminUser): string {
    return jwt.sign(
        { 
            id: admin.id, 
            email: admin.email, 
            role: admin.role,
            type: 'admin'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    )
}

export function verifyAdminToken(token: string): AdminUser | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        if (decoded.type !== 'admin') return null
        return {
            id: decoded.id,
            name: '', // Will be fetched from DB if needed
            email: decoded.email,
            role: decoded.role,
            active: true
        }
    } catch (error) {
        return null
    }
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
    try {
        const admin = await db
            .select()
            .from(adminsTable)
            .where(eq(adminsTable.email, email))
            .limit(1)

        if (admin.length === 0 || !admin[0].active) {
            return null
        }

        const isValid = await verifyPassword(password, admin[0].password)
        if (!isValid) {
            return null
        }

        // Update last login
        await db
            .update(adminsTable)
            .set({ lastLogin: new Date() })
            .where(eq(adminsTable.id, admin[0].id))

        return {
            id: admin[0].id,
            name: admin[0].name,
            email: admin[0].email,
            role: admin[0].role!,
            active: admin[0].active!
        }
    } catch (error) {
        console.error('Admin authentication error:', error)
        return null
    }
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get(ADMIN_TOKEN_NAME)?.value

        if (!token) {
            return null
        }

        const decoded = verifyAdminToken(token)
        if (!decoded) {
            return null
        }

        // Verify admin still exists and is active
        const admin = await db
            .select()
            .from(adminsTable)
            .where(eq(adminsTable.id, decoded.id))
            .limit(1)

        if (admin.length === 0 || !admin[0].active) {
            return null
        }

        return {
            id: admin[0].id,
            name: admin[0].name,
            email: admin[0].email,
            role: admin[0].role!,
            active: admin[0].active!
        }
    } catch (error) {
        console.error('Get current admin error:', error)
        return null
    }
}

export async function setAdminAuthCookie(admin: AdminUser) {
    const token = generateAdminToken(admin)
    const cookieStore = await cookies()
    
    cookieStore.set(ADMIN_TOKEN_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 // 24 hours
    })
}

export async function clearAdminAuthCookie() {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_TOKEN_NAME)
}

export async function requireAdminAuth(): Promise<AdminUser> {
    const admin = await getCurrentAdmin()
    if (!admin) {
        throw new Error('Admin authentication required')
    }
    return admin
}
