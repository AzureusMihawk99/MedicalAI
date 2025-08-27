import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/config/db'
import { adminsTable } from '@/config/schema'
import { eq } from 'drizzle-orm'

export async function POST() {
    try {
        const email = 'admin@medicai.com'
        const password = 'admin123'
        const hashedPassword = await bcrypt.hash(password, 12)

        // Check if admin already exists
        const existingAdmin = await db
            .select()
            .from(adminsTable)
            .where(eq(adminsTable.email, email))
            .limit(1)

        if (existingAdmin.length > 0) {
            // Update password
            await db
                .update(adminsTable)
                .set({ password: hashedPassword })
                .where(eq(adminsTable.email, email))
        } else {
            // Create new admin
            await db.insert(adminsTable).values({
                name: 'Admin User',
                email: email,
                password: hashedPassword,
                role: 'admin',
                active: true
            })
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Admin setup completed',
            credentials: {
                email: email,
                password: password
            }
        })
    } catch (error) {
        console.error('Admin setup error:', error)
        return NextResponse.json(
            { error: 'Setup failed' },
            { status: 500 }
        )
    }
}
