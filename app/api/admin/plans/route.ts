import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/config/db'
import { subscriptionPlansTable } from '@/config/schema'
import { requireAdminAuth } from '@/lib/admin-auth-custom'
import { eq } from 'drizzle-orm'

export async function GET() {
    try {
        await requireAdminAuth()
        
        const plans = await db.select().from(subscriptionPlansTable)
        
        return NextResponse.json({ plans })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Get plans error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdminAuth()
        
        const { name, description, price, currency, intervalType, intervalCount, credits, features } = await request.json()

        if (!name || price === undefined) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
        }

        const newPlan = await db.insert(subscriptionPlansTable).values({
            name,
            description: description || '',
            price: price.toString(),
            currency: currency || 'USD',
            intervalType: intervalType || 'month',
            intervalCount: intervalCount || 1,
            features: { features: features || [], credits: credits || 100 },
            active: true
        }).returning()

        return NextResponse.json({ plan: newPlan[0] })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Create plan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        await requireAdminAuth()
        
        const { id, name, description, price, currency, intervalType, intervalCount, features, active } = await request.json()

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        const updatedPlan = await db
            .update(subscriptionPlansTable)
            .set({
                name,
                description,
                price: price?.toString(),
                currency,
                intervalType,
                intervalCount,
                features: features ? { features } : undefined,
                active,
                updatedAt: new Date()
            })
            .where(eq(subscriptionPlansTable.id, id))
            .returning()

        return NextResponse.json({ plan: updatedPlan[0] })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Update plan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await requireAdminAuth()
        
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 })
        }

        await db
            .delete(subscriptionPlansTable)
            .where(eq(subscriptionPlansTable.id, parseInt(id)))

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Delete plan error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
