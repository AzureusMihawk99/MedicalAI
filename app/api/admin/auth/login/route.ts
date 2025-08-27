import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin, setAdminAuthCookie } from '@/lib/admin-auth-custom'

export async function POST(request: NextRequest) {
    try {
        console.log('Admin login API route called!')
        const { email, password } = await request.json()
        console.log('Login attempt for:', email)

        if (!email || !password) {
            console.log('Missing email or password')
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        console.log('Calling authenticateAdmin...')
        const admin = await authenticateAdmin(email, password)
        console.log('Authentication result:', admin ? 'SUCCESS' : 'FAILED')

        if (!admin) {
            console.log('Authentication failed - invalid credentials')
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        console.log('Setting admin auth cookie...')
        await setAdminAuthCookie(admin)
        console.log('Cookie set successfully')

        return NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        })
    } catch (error) {
        console.error('Admin login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
