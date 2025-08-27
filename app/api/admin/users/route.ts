import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/config/db'
import { usersTable, userSubscriptionsTable, subscriptionPlansTable } from '@/config/schema'
import { requireAdminAuth } from '@/lib/admin-auth-custom'
import { eq, count, desc } from 'drizzle-orm'

export async function GET() {
    try {
        await requireAdminAuth()
        
        // Get all users with their subscription details
        const users = await db
            .select({
                user: usersTable,
                subscription: userSubscriptionsTable,
                plan: subscriptionPlansTable
            })
            .from(usersTable)
            .leftJoin(userSubscriptionsTable, eq(usersTable.id, userSubscriptionsTable.userId))
            .leftJoin(subscriptionPlansTable, eq(userSubscriptionsTable.planId, subscriptionPlansTable.id))
            .orderBy(desc(usersTable.createdAt))
        
        // Get user counts by status
        const totalUsersResult = await db
            .select({ count: count() })
            .from(usersTable)
        
        const activeSubscribersResult = await db
            .select({ count: count() })
            .from(usersTable)
            .where(eq(usersTable.subscriptionStatus, 'active'))
        
        const freeUsersResult = await db
            .select({ count: count() })
            .from(usersTable)
            .where(eq(usersTable.subscriptionStatus, 'free'))
        
        const adminUsersResult = await db
            .select({ count: count() })
            .from(usersTable)
            .where(eq(usersTable.role, 'admin'))
        
        // Format user data
        const formattedUsers = users.map(item => ({
            id: item.user.id,
            name: item.user.name,
            email: item.user.email,
            role: item.user.role || 'user',
            subscriptionStatus: item.user.subscriptionStatus || 'free',
            credits: item.user.credits || 0,
            createdAt: item.user.createdAt,
            updatedAt: item.user.updatedAt,
            stripeCustomerId: item.user.stripeCustomerId,
            currentPlan: item.plan ? {
                id: item.plan.id,
                name: item.plan.name,
                price: item.plan.price
            } : null,
            subscriptionDetails: item.subscription ? {
                id: item.subscription.id,
                status: item.subscription.status,
                currentPeriodStart: item.subscription.currentPeriodStart,
                currentPeriodEnd: item.subscription.currentPeriodEnd
            } : null
        }))
        
        const stats = {
            totalUsers: totalUsersResult[0]?.count || 0,
            activeSubscribers: activeSubscribersResult[0]?.count || 0,
            freeUsers: freeUsersResult[0]?.count || 0,
            adminUsers: adminUsersResult[0]?.count || 0
        }
        
        return NextResponse.json({ 
            users: formattedUsers,
            stats
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Get users error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        await requireAdminAuth()
        
        const { userId, role, subscriptionStatus, credits } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        const updatedUser = await db
            .update(usersTable)
            .set({
                role: role || undefined,
                subscriptionStatus: subscriptionStatus || undefined,
                credits: credits !== undefined ? credits : undefined,
                updatedAt: new Date()
            })
            .where(eq(usersTable.id, userId))
            .returning()

        if (updatedUser.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ 
            message: 'User updated successfully',
            user: updatedUser[0] 
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Update user error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await requireAdminAuth()
        
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        await db
            .delete(usersTable)
            .where(eq(usersTable.id, parseInt(userId)))

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Delete user error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
