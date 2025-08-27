'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardStats {
    totalUsers: number
    activeSubscriptions: number
    monthlyRevenue: number
    newSignups: number
    totalSessions: number
    userGrowth: number
    revenueGrowth: number
}

interface RecentActivity {
    type: string
    message: string
    timestamp: string
    color: string
}

interface DashboardData {
    stats: DashboardStats
    recentActivity: RecentActivity[]
}

function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/admin/dashboard')
            if (response.ok) {
                const data = await response.json()
                setDashboardData(data.dashboard)
            } else {
                console.error('Failed to fetch dashboard data')
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatGrowth = (growth: number) => {
        const sign = growth >= 0 ? '+' : ''
        return `${sign}${growth.toFixed(1)}%`
    }

    const getActivityColor = (color: string) => {
        switch (color) {
            case 'green': return 'bg-green-500'
            case 'blue': return 'bg-blue-500'
            case 'orange': return 'bg-orange-500'
            case 'red': return 'bg-red-500'
            default: return 'bg-gray-500'
        }
    }

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 60) {
            return `${diffMins}m ago`
        } else if (diffHours < 24) {
            return `${diffHours}h ago`
        } else {
            return `${diffDays}d ago`
        }
    }

    if (loading) {
        return <div className="p-8">Loading dashboard...</div>
    }

    if (!dashboardData) {
        return (
            <div className="p-8">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Failed to load dashboard data</p>
                    <Button onClick={fetchDashboardData}>Retry</Button>
                </div>
            </div>
        )
    }

    const { stats, recentActivity } = dashboardData

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your application, users, and subscriptions</p>
                </div>
                <Button onClick={fetchDashboardData} variant="outline">
                    Refresh Data
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <span className="text-2xl">👥</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                        <p className={`text-xs ${stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatGrowth(stats.userGrowth)} from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                        <span className="text-2xl">💳</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSubscriptions.toLocaleString()}</div>
                        <p className="text-xs text-blue-600">
                            {stats.totalUsers > 0 ? 
                                `${((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)}% conversion` : 
                                '0% conversion'
                            }
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                        <span className="text-2xl">💰</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
                        <p className={`text-xs ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatGrowth(stats.revenueGrowth)} from last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                        <span className="text-2xl">📈</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.newSignups.toLocaleString()}</div>
                        <p className="text-xs text-blue-600">Last 7 days</p>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                        <span className="text-2xl">🤖</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSessions.toLocaleString()}</div>
                        <p className="text-xs text-gray-600">AI consultations this month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ARPU</CardTitle>
                        <span className="text-2xl">💵</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.activeSubscriptions > 0 
                                ? formatCurrency(stats.monthlyRevenue / stats.activeSubscriptions)
                                : formatCurrency(0)
                            }
                        </div>
                        <p className="text-xs text-gray-600">Average revenue per user</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <span className="text-2xl">📊</span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalUsers > 0 
                                ? `${((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)}%`
                                : '0%'
                            }
                        </div>
                        <p className="text-xs text-gray-600">Free to paid conversion</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-80 overflow-y-auto">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.color)}`}></div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm text-gray-900">{activity.message}</span>
                                            <div className="text-xs text-gray-500">{formatRelativeTime(activity.timestamp)}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 py-4">
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <button 
                                className="w-full text-left px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                onClick={() => window.location.href = '/admin/plans'}
                            >
                                Create New Subscription Plan
                            </button>
                            <button 
                                className="w-full text-left px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                onClick={() => window.location.href = '/admin/users'}
                            >
                                Manage Users
                            </button>
                            <button 
                                className="w-full text-left px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                                onClick={() => window.location.href = '/admin/analytics'}
                            >
                                View Analytics Report
                            </button>
                            <button 
                                className="w-full text-left px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                                onClick={() => window.location.href = '/admin/settings'}
                            >
                                Configure Settings
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default AdminDashboard
