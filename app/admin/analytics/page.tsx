'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
    overview: {
        totalUsers: number
        activeSubscriptions: number
        totalRevenue: number
        monthlyRevenue: number
        totalSessions: number
        recentUsers: number
        conversionRate: number
        arpu: number
        customerRetention: number
    }
    usersByStatus: Array<{
        status: string
        count: number
    }>
    topPlans: Array<{
        planName: string
        subscriberCount: number
        revenue: number
    }>
    recentTransactions: Array<{
        id: number
        amount: string
        currency: string
        status: string
        description: string
        createdAt: string
        userName: string
        userEmail: string
    }>
    growth: {
        users: Array<{ date: string; count: number }>
        revenue: Array<{ date: string; amount: number }>
    }
}

function AdminAnalytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchAnalytics = async () => {
        try {
            const response = await fetch('/api/admin/analytics')
            if (response.ok) {
                const data = await response.json()
                setAnalytics(data.analytics)
            }
        } catch (error) {
            console.error('Error fetching analytics:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAnalytics()
    }, [])

    if (loading) {
        return <div className="p-8">Loading analytics...</div>
    }

    if (!analytics) {
        return <div className="p-8">Failed to load analytics data</div>
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-2">Real-time insights and performance metrics</p>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.totalUsers.toLocaleString()}</div>
                        <p className="text-xs text-blue-600">
                            {analytics.overview.recentUsers} new in last 30 days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.activeSubscriptions.toLocaleString()}</div>
                        <p className="text-xs text-green-600">
                            {analytics.overview.conversionRate}% conversion rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
                        <p className="text-xs text-green-600">
                            {formatCurrency(analytics.overview.monthlyRevenue)} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.customerRetention}%</div>
                        <p className="text-xs text-blue-600">
                            ARPU: {formatCurrency(analytics.overview.arpu)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.overview.totalSessions.toLocaleString()}</div>
                        <p className="text-xs text-gray-600">AI consultations completed</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analytics.overview.monthlyRevenue)}</div>
                        <p className="text-xs text-gray-600">Current month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Revenue/User</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analytics.overview.arpu)}</div>
                        <p className="text-xs text-gray-600">Per active subscriber</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>User Growth Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics.growth.users.map((point, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium">{point.date}</span>
                                    <span className="text-sm">{point.count} users</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {analytics.growth.revenue.map((point, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="text-sm font-medium">{point.date}</span>
                                    <span className="text-sm">{formatCurrency(point.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users by Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Users by Subscription Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.usersByStatus.map((status, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <h3 className="font-medium capitalize">{status.status || 'Unknown'}</h3>
                                    <p className="text-sm text-gray-600">{status.count} users</p>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{status.count}</div>
                                    <div className="text-sm text-gray-600">
                                        {((status.count / analytics.overview.totalUsers) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Top Subscription Plans */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Subscription Plans</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.topPlans.length > 0 ? (
                            analytics.topPlans.map((plan, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium">{plan.planName}</h3>
                                        <p className="text-sm text-gray-600">{plan.subscriberCount} subscribers</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{formatCurrency(Number(plan.revenue) || 0)}</div>
                                        <div className="text-sm text-gray-600">total revenue</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                No subscription plans with active subscribers yet
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.recentTransactions.length > 0 ? (
                            analytics.recentTransactions.map((transaction, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium">{transaction.userName || 'Unknown User'}</h3>
                                        <p className="text-sm text-gray-600">{transaction.description || 'Payment'}</p>
                                        <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">
                                            {formatCurrency(Number(transaction.amount))}
                                        </div>
                                        <div className={`text-sm ${
                                            transaction.status === 'completed' ? 'text-green-600' : 
                                            transaction.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                                        }`}>
                                            {transaction.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                No transactions yet
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminAnalytics
