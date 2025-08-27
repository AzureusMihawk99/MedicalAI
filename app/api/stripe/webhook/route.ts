import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/config/db'
import { usersTable, userSubscriptionsTable, subscriptionPlansTable, transactionsTable } from '@/config/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
    }

    let event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (error) {
        console.error('Webhook signature verification failed:', error)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object
                console.log('Checkout session completed:', session.id)
                
                // Find user by customer ID
                const users = await db
                    .select()
                    .from(usersTable)
                    .where(eq(usersTable.stripeCustomerId, session.customer as string))

                if (users.length > 0) {
                    const user = users[0]
                    
                    if (session.mode === 'subscription' && session.subscription) {
                        // Get subscription details from Stripe
                        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string) as any
                        const priceId = stripeSubscription.items.data[0]?.price.id
                        
                        // Find the plan by stripe price ID
                        const plans = await db
                            .select()
                            .from(subscriptionPlansTable)
                            .where(eq(subscriptionPlansTable.stripePriceId, priceId))
                        
                        if (plans.length > 0) {
                            const plan = plans[0]
                            const planCredits = (plan.features as any)?.credits || 100
                            
                            // Update user with subscription info and add credits
                            await db
                                .update(usersTable)
                                .set({ 
                                    subscriptionStatus: 'active',
                                    subscriptionPlanId: plan.id,
                                    credits: (user.credits || 0) + planCredits,
                                    updatedAt: new Date()
                                })
                                .where(eq(usersTable.id, user.id))

                            // Create subscription record
                            await db.insert(userSubscriptionsTable).values({
                                userId: user.id,
                                planId: plan.id,
                                stripeSubscriptionId: stripeSubscription.id,
                                status: stripeSubscription.status,
                                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                            })

                            // Create transaction record
                            await db.insert(transactionsTable).values({
                                userId: user.id,
                                amount: ((stripeSubscription.items.data[0]?.price.unit_amount || 0) / 100).toString(),
                                currency: stripeSubscription.items.data[0]?.price.currency || 'usd',
                                status: 'completed',
                                description: `Subscription to ${plan.name}`,
                                creditsAwarded: planCredits,
                                stripePaymentIntentId: session.payment_intent as string || null
                            })

                            console.log(`User ${user.email} subscribed to ${plan.name}, awarded ${planCredits} credits`)
                        }
                    }
                }
                break
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as any
                console.log('Subscription updated:', subscription.id)
                
                // Update subscription record
                await db
                    .update(userSubscriptionsTable)
                    .set({
                        status: subscription.status,
                        currentPeriodStart: new Date(subscription.current_period_start * 1000),
                        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                        updatedAt: new Date()
                    })
                    .where(eq(userSubscriptionsTable.stripeSubscriptionId, subscription.id))

                // Update user status based on subscription status
                const userSubs = await db
                    .select()
                    .from(userSubscriptionsTable)
                    .where(eq(userSubscriptionsTable.stripeSubscriptionId, subscription.id))

                if (userSubs.length > 0) {
                    const newStatus = subscription.status === 'active' ? 'active' : 
                                     subscription.status === 'canceled' ? 'free' : 'inactive'
                    
                    await db
                        .update(usersTable)
                        .set({ 
                            subscriptionStatus: newStatus,
                            updatedAt: new Date()
                        })
                        .where(eq(usersTable.id, userSubs[0].userId!))
                }
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any
                console.log('Subscription deleted:', subscription.id)
                
                // Update subscription status
                await db
                    .update(userSubscriptionsTable)
                    .set({ 
                        status: 'canceled',
                        updatedAt: new Date()
                    })
                    .where(eq(userSubscriptionsTable.stripeSubscriptionId, subscription.id))

                // Find and update user status
                const subscriptions = await db
                    .select()
                    .from(userSubscriptionsTable)
                    .where(eq(userSubscriptionsTable.stripeSubscriptionId, subscription.id))

                if (subscriptions.length > 0) {
                    await db
                        .update(usersTable)
                        .set({ 
                            subscriptionStatus: 'free',
                            subscriptionPlanId: null,
                            updatedAt: new Date()
                        })
                        .where(eq(usersTable.id, subscriptions[0].userId!))
                }
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as any
                console.log('Invoice payment succeeded:', invoice.id)
                
                // This handles recurring subscription renewals
                if (invoice.subscription) {
                    const subscriptions = await db
                        .select({
                            subscription: userSubscriptionsTable,
                            plan: subscriptionPlansTable
                        })
                        .from(userSubscriptionsTable)
                        .leftJoin(subscriptionPlansTable, eq(userSubscriptionsTable.planId, subscriptionPlansTable.id))
                        .where(eq(userSubscriptionsTable.stripeSubscriptionId, invoice.subscription as string))

                    if (subscriptions.length > 0) {
                        const { subscription, plan } = subscriptions[0]
                        
                        if (plan) {
                            const planCredits = (plan.features as any)?.credits || 100
                            
                            // Add credits for renewal
                            const users = await db
                                .select()
                                .from(usersTable)
                                .where(eq(usersTable.id, subscription.userId!))
                            
                            if (users.length > 0) {
                                await db
                                    .update(usersTable)
                                    .set({ 
                                        credits: (users[0].credits || 0) + planCredits,
                                        updatedAt: new Date()
                                    })
                                    .where(eq(usersTable.id, users[0].id))

                                // Create transaction record for renewal
                                await db.insert(transactionsTable).values({
                                    userId: users[0].id,
                                    subscriptionId: subscription.id,
                                    amount: ((invoice.amount_paid || 0) / 100).toString(),
                                    currency: invoice.currency || 'usd',
                                    status: 'completed',
                                    description: `${plan.name} renewal`,
                                    creditsAwarded: planCredits,
                                })

                                console.log(`User ${users[0].email} renewed subscription, awarded ${planCredits} credits`)
                            }
                        }
                    }
                }
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as any
                console.log('Invoice payment failed:', invoice.id)
                
                if (invoice.subscription) {
                    // Create failed transaction record
                    const subscriptions = await db
                        .select()
                        .from(userSubscriptionsTable)
                        .where(eq(userSubscriptionsTable.stripeSubscriptionId, invoice.subscription as string))

                    if (subscriptions.length > 0) {
                        await db.insert(transactionsTable).values({
                            userId: subscriptions[0].userId!,
                            subscriptionId: subscriptions[0].id,
                            amount: ((invoice.amount_due || 0) / 100).toString(),
                            currency: invoice.currency || 'usd',
                            status: 'failed',
                            description: 'Payment failed',
                            creditsAwarded: 0,
                        })
                    }
                }
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook handler error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}
