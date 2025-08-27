import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, createCheckoutSession, createStripeCustomer } from '@/lib/stripe'
import { db } from '@/config/db'
import { usersTable, subscriptionPlansTable } from '@/config/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
    try {
        const { userId, sessionClaims } = await auth()
        
        if (!userId || !sessionClaims?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = await request.json()

        if (!planId) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        // Get user from database
        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, sessionClaims.email as string))
            .limit(1)

        if (user.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get subscription plan
        const plan = await db
            .select()
            .from(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.id, planId))
            .limit(1)

        if (plan.length === 0) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        let customerId = user[0].stripeCustomerId

        // Create Stripe customer if doesn't exist
        if (!customerId) {
            const customer = await createStripeCustomer(
                sessionClaims.email as string,
                user[0].name
            )
            customerId = customer.id

            // Update user with Stripe customer ID
            await db
                .update(usersTable)
                .set({ stripeCustomerId: customerId })
                .where(eq(usersTable.id, user[0].id))
        }

        // Create checkout session
        const session = await createCheckoutSession({
            priceId: plan[0].stripePriceId || '', // TODO: Add real Stripe price IDs
            customerId,
            successUrl: `${request.nextUrl.origin}/dashboard/billing?success=true`,
            cancelUrl: `${request.nextUrl.origin}/dashboard/billing?canceled=true`,
        })

        return NextResponse.json({ sessionId: session.id, url: session.url })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
