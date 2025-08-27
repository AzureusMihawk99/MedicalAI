'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Setting {
    value: string
    encrypted: boolean
    description: string
}

interface Settings {
    [key: string]: Setting
}

function AdminSettings() {
    const [settings, setSettings] = useState<Settings>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Record<string, string>>({})

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/admin/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings(data.settings)
                
                // Initialize form data with current values
                const initialFormData: Record<string, string> = {}
                Object.entries(data.settings).forEach(([key, setting]) => {
                    initialFormData[key] = (setting as Setting).value || ''
                })
                setFormData(initialFormData)
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            toast.error('Failed to fetch settings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const saveSettings = async (category: string[]) => {
        setSaving(true)
        try {
            const settingsToUpdate: Record<string, string> = {}
            category.forEach(key => {
                if (formData[key] !== undefined) {
                    settingsToUpdate[key] = formData[key]
                }
            })

            const response = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ settings: settingsToUpdate }),
            })

            if (response.ok) {
                toast.success('Settings saved successfully!')
                fetchSettings() // Refresh settings
            } else {
                toast.error('Failed to save settings')
            }
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8">Loading settings...</div>
    }

    const renderInputField = (key: string, label: string, type: string = 'text', placeholder?: string) => {
        const setting = settings[key]
        const isEncrypted = setting?.encrypted || false
        
        return (
            <div key={key}>
                <label className="block text-sm font-medium mb-2">{label}</label>
                <input 
                    type={isEncrypted ? 'password' : type}
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={placeholder || (setting?.description || '')}
                    className="w-full px-3 py-2 border rounded-lg"
                />
                {setting?.description && (
                    <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Manage application settings and configuration</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {renderInputField('app_name', 'Application Name')}
                        {renderInputField('support_email', 'Support Email', 'email')}
                        {renderInputField('max_credits_per_user', 'Max Credits per User', 'number')}
                        {renderInputField('trial_period_days', 'Trial Period (days)', 'number')}
                        
                        <Button 
                            onClick={() => saveSettings(['app_name', 'support_email', 'max_credits_per_user', 'trial_period_days'])}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save General Settings'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Stripe Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stripe Payment Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {renderInputField('stripe_publishable_key', 'Stripe Publishable Key', 'password')}
                        {renderInputField('stripe_secret_key', 'Stripe Secret Key', 'password')}
                        {renderInputField('stripe_webhook_secret', 'Stripe Webhook Secret', 'password')}
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>Important:</strong> These keys are encrypted and stored securely. 
                                Make sure to use your live keys for production.
                            </p>
                        </div>
                        
                        <Button 
                            onClick={() => saveSettings(['stripe_publishable_key', 'stripe_secret_key', 'stripe_webhook_secret'])}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Stripe Settings'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Credits & Billing */}
                <Card>
                    <CardHeader>
                        <CardTitle>Credits & Billing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {renderInputField('default_credits_per_plan', 'Default Credits per Plan', 'number')}
                        
                        <div>
                            <label className="block text-sm font-medium mb-2">Credit Usage Rules</label>
                            <textarea
                                className="w-full px-3 py-2 border rounded-lg"
                                rows={3}
                                placeholder="Define how credits are consumed per action..."
                                value={formData['credit_usage_rules'] || ''}
                                onChange={(e) => handleInputChange('credit_usage_rules', e.target.value)}
                            />
                        </div>
                        
                        <Button 
                            onClick={() => saveSettings(['default_credits_per_plan', 'credit_usage_rules'])}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Credit Settings'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {renderInputField('session_timeout_minutes', 'Session Timeout (minutes)', 'number')}
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Two-Factor Authentication</h4>
                                <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                            </div>
                            <Button variant="outline" size="sm">Enable</Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium">Login Logs</h4>
                                <p className="text-sm text-gray-600">Track admin login activity</p>
                            </div>
                            <Button variant="outline" size="sm">View Logs</Button>
                        </div>
                        
                        <Button 
                            onClick={() => saveSettings(['session_timeout_minutes'])}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Security Settings'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Environment Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Environment Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Database</span>
                            <span className="text-green-600 text-sm">Connected</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">Stripe</span>
                            <span className={`text-sm ${settings.stripe_secret_key?.value ? 'text-green-600' : 'text-red-600'}`}>
                                {settings.stripe_secret_key?.value ? 'Configured' : 'Not Configured'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium">OpenAI</span>
                            <span className="text-yellow-600 text-sm">Check Required</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default AdminSettings
