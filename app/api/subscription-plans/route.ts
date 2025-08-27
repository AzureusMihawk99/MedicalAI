import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/config/db'
import { subscriptionPlansTable, usersTable, userSubscriptionsTable } from '@/config/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
    try {
        const user = await currentUser()

        if (!user?.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get all active subscription plans
        const plans = await db
            .select()
            .from(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.active, true))
            .orderBy(subscriptionPlansTable.price)
        
        // Get user's current subscription if any - create user if doesn't exist
        let userRecord = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress))
            .limit(1)

        // Create user if doesn't exist
        if (userRecord.length === 0) {
            const newUser = await db.insert(usersTable).values({
                name: user.fullName || user.firstName || 'User',
                email: user.primaryEmailAddress.emailAddress,
                credits: 10 // Free trial credits
            }).returning()
            userRecord = newUser
        }

        let currentSubscription = null
        if (userRecord.length > 0 && userRecord[0].subscriptionPlanId) {
            const currentSub = await db
                .select({
                    subscription: userSubscriptionsTable,
                    plan: subscriptionPlansTable
                })
                .from(userSubscriptionsTable)
                .leftJoin(subscriptionPlansTable, eq(userSubscriptionsTable.planId, subscriptionPlansTable.id))
                .where(eq(userSubscriptionsTable.userId, userRecord[0].id))
                .limit(1)

            if (currentSub.length > 0) {
                currentSubscription = currentSub[0]
            }
        }

        // Format plans for frontend
        const formattedPlans = plans.map(plan => {
            const features = (plan.features as any)?.features || []
            const credits = (plan.features as any)?.credits || 0
            
            return {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                price: plan.price,
                currency: plan.currency || 'USD',
                intervalType: plan.intervalType,
                intervalCount: plan.intervalCount || 1,
                stripePriceId: plan.stripePriceId,
                features: features,
                credits: credits,
                active: plan.active,
                isCurrentPlan: currentSubscription?.plan?.id === plan.id
            }
        })

        return NextResponse.json({ 
            plans: formattedPlans,
            currentSubscription: currentSubscription ? {
                ...currentSubscription.subscription,
                plan: currentSubscription.plan
            } : null,
            user: userRecord[0] || null
        })
    } catch (error) {
        console.error('Get subscription plans error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
