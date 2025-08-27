'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

function AdminLogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            await fetch('/api/admin/auth/logout', {
                method: 'POST',
            })
            
            router.push('/admin/login')
            router.refresh()
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    return (
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="text-red-600 border-red-300 hover:bg-red-50"
        >
            Logout
        </Button>
    )
}

export default AdminLogoutButton
