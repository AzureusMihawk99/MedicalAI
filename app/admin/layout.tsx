import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { getCurrentAdmin } from '@/lib/admin-auth-custom'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import AdminLogoutButton from './_components/AdminLogoutButton'

const adminMenuOptions = [
    {
        id: 1,
        name: 'Dashboard',
        path: '/admin',
        icon: '📊'
    },
    {
        id: 2,
        name: 'Users',
        path: '/admin/users',
        icon: '👥'
    },
    {
        id: 3,
        name: 'Subscription Plans',
        path: '/admin/plans',
        icon: '💳'
    },
    {
        id: 4,
        name: 'Analytics',
        path: '/admin/analytics',
        icon: '��'
    },
    {
        id: 5,
        name: 'Settings',
        path: '/admin/settings',
        icon: '⚙️'
    }
]

async function AdminLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Get the current pathname to check if it's the login page
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') || ''

    // Skip authentication check for login page
    if (pathname === '/admin/login') {
        return (
            <div className="min-h-screen bg-gray-50">
                {children}
            </div>
        )
    }

    // Check if admin is authenticated for other admin pages
    const admin = await getCurrentAdmin()

    if (!admin) {
        redirect('/admin/login')
    }
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Admin Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <Image src="/logo.png" alt="Logo" width={120} height={60} />
                        <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">ADMIN</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div className="text-sm text-gray-600">
                            Welcome, <span className="font-medium">{admin.name}</span>
                        </div>
                        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                            Back to User Dashboard
                        </Link>
                        <AdminLogoutButton />
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-white shadow-sm min-h-screen">
                    <nav className="p-6">
                        <div className="space-y-2">
                            {adminMenuOptions.map((option) => (
                                <Link
                                    key={option.id}
                                    href={option.path}
                                    className="flex items-center space-x-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <span className="text-lg">{option.icon}</span>
                                    <span className="font-medium">{option.name}</span>
                                </Link>
                            ))}
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
