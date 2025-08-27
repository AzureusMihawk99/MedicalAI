import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/config/db'
import { adminSettingsTable } from '@/config/schema'
import { requireAdminAuth } from '@/lib/admin-auth-custom'
import { eq } from 'drizzle-orm'

export async function GET() {
    try {
        await requireAdminAuth()
        
        const settings = await db.select().from(adminSettingsTable)
        
        // Convert array to object for easier use
        const settingsObj: Record<string, any> = {}
        settings.forEach(setting => {
            settingsObj[setting.settingKey] = {
                value: setting.settingValue,
                encrypted: setting.encrypted,
                description: setting.description
            }
        })
        
        return NextResponse.json({ settings: settingsObj })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Get settings error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        await requireAdminAuth()
        
        const { settings } = await request.json()

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: 'Settings object is required' }, { status: 400 })
        }

        // Update each setting
        const updatedSettings = []
        
        for (const [key, value] of Object.entries(settings)) {
            const result = await db
                .update(adminSettingsTable)
                .set({
                    settingValue: value as string,
                    updatedAt: new Date()
                })
                .where(eq(adminSettingsTable.settingKey, key))
                .returning()

            if (result.length > 0) {
                updatedSettings.push(result[0])
            }
        }

        return NextResponse.json({ 
            message: 'Settings updated successfully',
            updatedCount: updatedSettings.length 
        })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Update settings error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdminAuth()
        
        const { settingKey, settingValue, encrypted, description } = await request.json()

        if (!settingKey || settingValue === undefined) {
            return NextResponse.json({ error: 'Setting key and value are required' }, { status: 400 })
        }

        const newSetting = await db.insert(adminSettingsTable).values({
            settingKey,
            settingValue,
            encrypted: encrypted || false,
            description: description || ''
        }).returning()

        return NextResponse.json({ setting: newSetting[0] })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Create setting error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
