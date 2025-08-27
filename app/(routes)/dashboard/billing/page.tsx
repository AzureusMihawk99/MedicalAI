'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Plan {
    id: number
    name: string
    description: string
    price: string
    currency: string
    intervalType: string
    intervalCount: number
    stripePriceId: string | null
    features: string[]
    credits: number
    active: boolean
    isCurrentPlan: boolean
}

interface CurrentSubscription {
    id: number
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    plan: {
        name: string
        price: string
        intervalType: string
    }
}

interface BillingData {
    plans: Plan[]
    currentSubscription: CurrentSubscription | null
    user: {
        id: number
        name: string
        email: string
        credits: number
        subscriptionStatus: string
    } | null
}

function Billing() {
    const [billingData, setBillingData] = useState<BillingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [subscribing, setSubscribing] = useState<number | null>(null)

    const fetchBillingData = async () => {
        try {
            const response = await fetch('/api/subscription-plans')
            if (response.ok) {
                const data = await response.json()
                setBillingData(data)
            } else {
                toast.error('Failed to load billing information')
            }
        } catch (error) {
            console.error('Error fetching billing data:', error)
            toast.error('Failed to load billing information')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBillingData()
    }, [])

    const handleSubscribe = async (planId: number) => {
        setSubscribing(planId)
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ planId }),
            })

            if (response.ok) {
                const data = await response.json()
                if (data.url) {
                    window.location.href = data.url
                } else {
                    toast.error('Failed to create checkout session')
                }
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Failed to start subscription')
            }
        } catch (error) {
            console.error('Error subscribing:', error)
            toast.error('Failed to start subscription')
        } finally {
            setSubscribing(null)
        }
    }

    const handleManageSubscription = async () => {
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                if (data.url) {
                    window.location.href = data.url
                } else {
                    toast.error('Failed to access billing portal')
                }
            } else {
                toast.error('Failed to access billing portal')
            }
        } catch (error) {
            console.error('Error accessing portal:', error)
            toast.error('Failed to access billing portal')
        }
    }

    const formatCurrency = (amount: string, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(parseFloat(amount))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    if (loading) {
        return <div className="p-8">Loading billing information...</div>
    }

    if (!billingData) {
        return <div className="p-8">Failed to load billing information</div>
    }

    return (
        <div className='px-10 md:px-24 lg:px-48 space-y-8'>
            {/* Current Subscription Status */}
            {billingData.currentSubscription && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-green-800">Current Subscription</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-medium">Plan</h4>
                                <p>{billingData.currentSubscription.plan.name}</p>
                            </div>
                            <div>
                                <h4 className="font-medium">Status</h4>
                                <Badge className={`${
                                    billingData.currentSubscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {billingData.currentSubscription.status}
                                </Badge>
                            </div>
                            <div>
                                <h4 className="font-medium">Next Billing</h4>
                                <p>{formatDate(billingData.currentSubscription.currentPeriodEnd)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* User Credits */}
            {billingData.user && (
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-medium">Name</h4>
                                <p>{billingData.user.name}</p>
                            </div>
                            <div>
                                <h4 className="font-medium">Credits Remaining</h4>
                                <p className="text-2xl font-bold text-blue-600">{billingData.user.credits || 0}</p>
                            </div>
                            <div>
                                <h4 className="font-medium">Subscription Status</h4>
                                <Badge className={`${
                                    billingData.user.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {billingData.user.subscriptionStatus || 'free'}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="text-center">
                <h2 className='font-bold text-3xl mb-4'>Choose Your Plan</h2>
                <p className="text-gray-600">Select the perfect plan for your medical consultation needs</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {billingData.plans.map((plan) => {
                    const isPopular = plan.name.toLowerCase().includes('pro') && !plan.name.toLowerCase().includes('annual')
                    const isFree = parseFloat(plan.price) === 0

                    return (
                        <Card key={plan.id} className={`relative ${
                            isPopular ? 'border-blue-500 shadow-lg' : ''
                        } ${plan.isCurrentPlan ? 'border-green-500 bg-green-50' : ''}`}>
                            {isPopular && !plan.isCurrentPlan && (
                                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                                    Most Popular
                                </Badge>
                            )}
                            {plan.isCurrentPlan && (
                                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                                    Current Plan
                                </Badge>
                            )}
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <p className="text-gray-600">{plan.description}</p>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">
                                        {formatCurrency(plan.price, plan.currency)}
                                    </span>
                                    <span className="text-gray-600">
                                        /{plan.intervalCount > 1 ? `${plan.intervalCount} ` : ''}{plan.intervalType}
                                        {plan.intervalCount > 1 ? 's' : ''}
                                    </span>
                                </div>
                                {plan.credits > 0 && (
                                    <p className="text-sm text-blue-600 font-medium">
                                        {plan.credits} credits included
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2">
                                    {plan.features.map((feature: string, index: number) => (
                                        <li key={index} className="flex items-center">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className={`w-full ${
                                        isPopular && !plan.isCurrentPlan ? 'bg-blue-500 hover:bg-blue-600' : ''
                                    }`}
                                    disabled={plan.isCurrentPlan || subscribing === plan.id || isFree}
                                    onClick={() => handleSubscribe(plan.id)}
                                >
                                    {plan.isCurrentPlan ? 'Current Plan' : 
                                     subscribing === plan.id ? 'Processing...' :
                                     isFree ? 'Free Plan' : 'Subscribe Now'}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {billingData.plans.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-gray-500">No subscription plans available at the moment.</p>
                        <p className="text-sm text-gray-400 mt-2">Please check back later.</p>
                    </CardContent>
                </Card>
            )}

            <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Manage Your Subscription</h3>
                <p className="text-gray-600">
                    Already have a subscription? Manage your billing and view invoices.
                </p>
                <Button variant="outline" onClick={handleManageSubscription}>
                    Manage Subscription
                </Button>
            </div>
        </div>
    )
}

export default Billing
