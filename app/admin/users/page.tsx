'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

interface User {
    id: number
    name: string
    email: string
    role: string
    subscriptionStatus: string
    credits: number
    createdAt: string
    updatedAt: string
    stripeCustomerId: string | null
    currentPlan: {
        id: number
        name: string
        price: string
    } | null
    subscriptionDetails: {
        id: number
        status: string
        currentPeriodStart: string
        currentPeriodEnd: string
    } | null
}

interface UserStats {
    totalUsers: number
    activeSubscribers: number
    freeUsers: number
    adminUsers: number
}

interface UsersData {
    users: User[]
    stats: UserStats
}

function UsersManagement() {
    const [usersData, setUsersData] = useState<UsersData | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<number | null>(null)

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users')
            if (response.ok) {
                const data = await response.json()
                setUsersData(data)
            } else {
                toast.error('Failed to fetch users')
            }
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleUpdateUser = async (userId: number, updates: Partial<User>) => {
        setUpdating(userId)
        try {
            const response = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, ...updates }),
            })

            if (response.ok) {
                toast.success('User updated successfully')
                fetchUsers() // Refresh data
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Failed to update user')
            }
        } catch (error) {
            console.error('Error updating user:', error)
            toast.error('Failed to update user')
        } finally {
            setUpdating(null)
        }
    }

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success('User deleted successfully')
                fetchUsers() // Refresh data
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Failed to delete user')
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            toast.error('Failed to delete user')
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800'
            case 'user': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getSubscriptionBadgeColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'free': return 'bg-gray-100 text-gray-800'
            case 'canceled': return 'bg-red-100 text-red-800'
            case 'inactive': return 'bg-yellow-100 text-yellow-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    if (loading) {
        return <div className="p-8">Loading users...</div>
    }

    if (!usersData) {
        return <div className="p-8">Failed to load users data</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-600 mt-2">Manage user accounts, roles, and subscriptions</p>
                </div>
                <Button onClick={fetchUsers}>
                    Refresh Data
                </Button>
            </div>

            {/* Users Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersData.stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersData.stats.activeSubscribers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Free Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersData.stats.freeUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{usersData.stats.adminUsers}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    {usersData.users.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Credits</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usersData.users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getRoleBadgeColor(user.role)}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getSubscriptionBadgeColor(user.subscriptionStatus)}>
                                                {user.subscriptionStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.currentPlan ? (
                                                <div>
                                                    <div className="font-medium">{user.currentPlan.name}</div>
                                                    <div className="text-sm text-gray-500">${user.currentPlan.price}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No plan</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.credits}</TableCell>
                                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    disabled={updating === user.id}
                                                    onClick={() => {
                                                        const newCredits = prompt('Enter new credit amount:', user.credits.toString())
                                                        if (newCredits && !isNaN(parseInt(newCredits))) {
                                                            handleUpdateUser(user.id, { credits: parseInt(newCredits) })
                                                        }
                                                    }}
                                                >
                                                    {updating === user.id ? 'Updating...' : 'Edit Credits'}
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No users found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default UsersManagement
