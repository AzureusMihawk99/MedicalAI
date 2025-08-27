import { NextResponse } from 'next/server'

export async function GET() {
    return NextResponse.json({ message: 'Admin API routes working!' })
}

export async function POST() {
    return NextResponse.json({ message: 'Admin POST routes working!' })
}
