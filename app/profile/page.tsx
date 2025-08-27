'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useUser } from '@clerk/nextjs'

interface UserProfile {
    id: number
    name: string
    email: string
    credits: number
    subscriptionStatus: string
    subscriptionPlanId: number | null
    stripeCustomerId: string | null
    createdAt: string
    updatedAt: string
}

interface UserSubscription {
    id: number
    status: string
    currentPeriodStart: string
    currentPeriodEnd: string
    plan: {
        id: number
        name: string
        description: string
        price: string
        currency: string
        intervalType: string
        features: any
    }
}

interface ProfileData {
    user: UserProfile
    subscription: UserSubscription | null
    sessionsCount: number
    totalSpent: number
}

function ProfilePage() {
    const { user: clerkUser } = useUser()
    const [profileData, setProfileData] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    })

    const fetchProfileData = async () => {
        try {
            const response = await fetch('/api/users/profile')
            if (response.ok) {
                const data = await response.json()
                setProfileData(data)
                setFormData({
                    name: data.user.name || '',
                    email: data.user.email || ''
                })
            } else {
                toast.error('Failed to load profile information')
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Failed to load profile information')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfileData()
    }, [])

    const handleUpdateProfile = async () => {
        setUpdating(true)
        try {
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email
                }),
            })

            if (response.ok) {
                toast.success('Profile updated successfully!')
                fetchProfileData()
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Failed to update profile')
            }
        } catch (error) {
            console.error('Error updating profile:', error)
            toast.error('Failed to update profile')
        } finally {
            setUpdating(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (!profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Failed to load profile information</p>
                    <Button onClick={fetchProfileData} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Information */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-4 mb-6">
                                    {clerkUser?.imageUrl && (
                                        <img
                                            src={clerkUser.imageUrl}
                                            alt="Profile"
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold">{profileData.user.name}</h3>
                                        <p className="text-gray-600">{profileData.user.email}</p>
                                        <p className="text-sm text-gray-500">
                                            Member since {formatDate(profileData.user.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Email cannot be changed here. Use your account settings.
                                        </p>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleUpdateProfile}
                                    disabled={updating}
                                    className="mt-4"
                                >
                                    {updating ? 'Updating...' : 'Update Profile'}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Subscription Information */}
                        {profileData.subscription && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Subscription</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="font-medium text-gray-900">Plan Details</h4>
                                            <p className="text-lg font-semibold text-blue-600">
                                                {profileData.subscription.plan.name}
                                            </p>
                                            <p className="text-gray-600">
                                                {profileData.subscription.plan.description}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {formatCurrency(parseFloat(profileData.subscription.plan.price))} 
                                                /{profileData.subscription.plan.intervalType}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">Status</h4>
                                            <Badge className={`${
                                                profileData.subscription.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            } mb-2`}>
                                                {profileData.subscription.status}
                                            </Badge>
                                            <p className="text-sm text-gray-600">
                                                Current period: {formatDate(profileData.subscription.currentPeriodStart)} - {formatDate(profileData.subscription.currentPeriodEnd)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Plan Features */}
                                    <div className="mt-4">
                                        <h4 className="font-medium text-gray-900 mb-2">Plan Features</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {(profileData.subscription.plan.features?.features || []).map((feature: string, index: number) => (
                                                <div key={index} className="flex items-center">
                                                    <span className="text-green-500 mr-2">✓</span>
                                                    <span className="text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Account Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {profileData.user.credits || 0}
                                    </div>
                                    <p className="text-sm text-gray-600">Credits Remaining</p>
                                </div>
                                
                                <div className="border-t pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Total Sessions</span>
                                        <span className="font-medium">{profileData.sessionsCount || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Total Spent</span>
                                        <span className="font-medium">{formatCurrency(profileData.totalSpent || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Status</span>
                                        <Badge className={`${
                                            profileData.user.subscriptionStatus === 'active' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {profileData.user.subscriptionStatus || 'free'}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = '/dashboard/billing'}
                                >
                                    Manage Subscription
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = '/dashboard/history'}
                                >
                                    View Session History
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = '/dashboard'}
                                >
                                    Start New Session
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
