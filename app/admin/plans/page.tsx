'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CreatePlanDialog from './_components/CreatePlanDialog'

interface Plan {
    id: number
    name: string
    description: string | null
    price: string
    currency: string | null
    intervalType: string
    intervalCount: number | null
    features: any
    active: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
}

function PlansManagement() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/admin/plans')
            if (response.ok) {
                const data = await response.json()
                setPlans(data.plans)
            }
        } catch (error) {
            console.error('Error fetching plans:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPlans()
    }, [])

    const togglePlanStatus = async (planId: number, currentStatus: boolean) => {
        try {
            const response = await fetch('/api/admin/plans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: planId,
                    active: !currentStatus
                })
            })

            if (response.ok) {
                fetchPlans()
            }
        } catch (error) {
            console.error('Error updating plan:', error)
        }
    }

    const deletePlan = async (planId: number) => {
        if (!confirm('Are you sure you want to delete this plan?')) return

        try {
            const response = await fetch(`/api/admin/plans?id=${planId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchPlans()
            }
        } catch (error) {
            console.error('Error deleting plan:', error)
        }
    }

    if (loading) {
        return <div className="p-8">Loading plans...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
                    <p className="text-gray-600 mt-2">Manage subscription plans and pricing</p>
                </div>
                <CreatePlanDialog onPlanCreated={fetchPlans} />
            </div>

            {/* Plans Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{plans.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{plans.filter(p => p.active).length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">-</div>
                    </CardContent>
                </Card>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const features = (plan.features as any)?.features || []
                    return (
                        <Card key={plan.id} className="relative">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                        <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                                    </div>
                                    <Badge className={plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                        {plan.active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="text-3xl font-bold">
                                        ${plan.price}
                                        <span className="text-lg font-normal text-gray-600">
                                            /{plan.intervalType}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Created: {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Features:</h4>
                                    <ul className="space-y-1">
                                        {features.map((feature: string, index: number) => (
                                            <li key={index} className="text-sm text-gray-600 flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex space-x-2 pt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => togglePlanStatus(plan.id, plan.active || false)}
                                        className="flex-1"
                                    >
                                        {plan.active ? 'Deactivate' : 'Activate'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deletePlan(plan.id)}
                                        className="flex-1 text-red-600 hover:bg-red-50"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {plans.length === 0 && (
                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-gray-500">No subscription plans found.</p>
                        <p className="text-sm text-gray-400 mt-2">Create your first plan to get started.</p>
                    </CardContent>
                </Card>
            )}

            {/* Recent Subscriptions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-center text-gray-500 py-4">
                            No recent subscription data available
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default PlansManagement
