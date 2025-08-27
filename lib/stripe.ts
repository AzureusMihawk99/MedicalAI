import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    typescript: true,
})

export const getStripeSession = async (sessionId: string) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        return session
    } catch (error) {
        console.error('Error retrieving Stripe session:', error)
        throw error
    }
}

export const createStripeCustomer = async (email: string, name?: string) => {
    try {
        const customer = await stripe.customers.create({
            email,
            name: name || undefined,
        })
        return customer
    } catch (error) {
        console.error('Error creating Stripe customer:', error)
        throw error
    }
}

export const createCheckoutSession = async ({
    priceId,
    customerId,
    successUrl,
    cancelUrl,
}: {
    priceId: string
    customerId: string
    successUrl: string
    cancelUrl: string
}) => {
    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                customerId,
            },
        })
        return session
    } catch (error) {
        console.error('Error creating checkout session:', error)
        throw error
    }
}

export const createPortalSession = async (customerId: string, returnUrl: string) => {
    try {
        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        })
        return session
    } catch (error) {
        console.error('Error creating portal session:', error)
        throw error
    }
}
