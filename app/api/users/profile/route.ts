import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/config/db'
import { usersTable, userSubscriptionsTable, subscriptionPlansTable, transactionsTable, SessionChatTable } from '@/config/schema'
import { eq, and, sum, count } from 'drizzle-orm'

export async function GET() {
    try {
        const user = await currentUser()

        if (!user?.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user from database - create if doesn't exist
        let userRecord = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress))
            .limit(1)

        if (userRecord.length === 0) {
            // Create user if doesn't exist
            const newUser = await db.insert(usersTable).values({
                name: user.fullName || user.firstName || 'User',
                email: user.primaryEmailAddress.emailAddress,
                credits: 10 // Free trial credits
            }).returning()
            userRecord = newUser
        }

        const userData = userRecord[0]

        // Get current subscription if any
        let currentSubscription = null
        if (userData.subscriptionPlanId) {
            const subscription = await db
                .select({
                    subscription: userSubscriptionsTable,
                    plan: subscriptionPlansTable
                })
                .from(userSubscriptionsTable)
                .leftJoin(subscriptionPlansTable, eq(userSubscriptionsTable.planId, subscriptionPlansTable.id))
                .where(
                    and(
                        eq(userSubscriptionsTable.userId, userData.id),
                        eq(userSubscriptionsTable.status, 'active')
                    )
                )
                .limit(1)
            
            if (subscription.length > 0) {
                currentSubscription = {
                    ...subscription[0].subscription,
                    plan: subscription[0].plan
                }
            }
        }

        // Get user sessions count
        const sessionsResult = await db
            .select({ count: count() })
            .from(SessionChatTable)
            .where(eq(SessionChatTable.createdBy, userData.email))

        const sessionsCount = sessionsResult[0]?.count || 0

        // Get total spent (sum of completed transactions)
        const totalSpentResult = await db
            .select({ total: sum(transactionsTable.amount) })
            .from(transactionsTable)
            .where(
                and(
                    eq(transactionsTable.userId, userData.id),
                    eq(transactionsTable.status, 'completed')
                )
            )

        const totalSpent = Number(totalSpentResult[0]?.total || 0)

        const profileData = {
            user: userData,
            subscription: currentSubscription,
            sessionsCount,
            totalSpent
        }

        return NextResponse.json(profileData)
    } catch (error) {
        console.error('Get profile error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser()

        if (!user?.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name } = await request.json()

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        // Update user in database
        const updatedUser = await db
            .update(usersTable)
            .set({
                name,
                updatedAt: new Date()
            })
            .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress))
            .returning()

        if (updatedUser.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ 
            message: 'Profile updated successfully',
            user: updatedUser[0] 
        })
    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
