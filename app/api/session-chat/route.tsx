import { db } from "@/config/db";
import { SessionChatTable, usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from 'uuid';

const CREDITS_PER_SESSION = 1; // Cost in credits per AI session

export async function POST(req: NextRequest) {
    const { notes, selectedDoctor } = await req.json();
    const user = await currentUser();
    
    if (!user?.primaryEmailAddress?.emailAddress) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    try {
        // Check user's current credits
        const userRecord = await db.select()
            .from(usersTable)
            .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress))
            .limit(1);

        if (userRecord.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentCredits = userRecord[0].credits || 0;

        // Check if user has enough credits
        if (currentCredits < CREDITS_PER_SESSION) {
            return NextResponse.json({ 
                error: 'Insufficient credits', 
                message: `You need ${CREDITS_PER_SESSION} credit(s) to start a session. You have ${currentCredits} credit(s).`,
                creditsNeeded: CREDITS_PER_SESSION,
                creditsAvailable: currentCredits
            }, { status: 402 }); // 402 Payment Required
        }

        const sessionId = uuidv4();
        
        // Deduct credits first
        const updatedUser = await db.update(usersTable)
            .set({ 
                credits: currentCredits - CREDITS_PER_SESSION,
                updatedAt: new Date()
            })
            .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress))
            .returning();

        if (updatedUser.length === 0) {
            return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 });
        }

        // Create session after successful credit deduction
        const result = await db.insert(SessionChatTable).values({
            sessionId: sessionId,
            createdBy: user.primaryEmailAddress.emailAddress,
            notes: notes,
            selectedDoctor: selectedDoctor,
            createdOn: (new Date()).toString()
            //@ts-ignore
        }).returning({ SessionChatTable });

        return NextResponse.json({
            session: result[0]?.SessionChatTable,
            creditsUsed: CREDITS_PER_SESSION,
            creditsRemaining: updatedUser[0].credits
        });
    } catch (e) {
        console.error('Session creation error:', e);
        return NextResponse.json({ 
            error: 'Failed to create session',
            details: e
        }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const user = await currentUser();

    if (!user?.primaryEmailAddress?.emailAddress) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    try {
        if (sessionId == 'all') {
            const result = await db.select().from(SessionChatTable)
                //@ts-ignore
                .where(eq(SessionChatTable.createdBy, user.primaryEmailAddress.emailAddress))
                .orderBy(desc(SessionChatTable.id));

            return NextResponse.json(result);
        }
        else {
            const result = await db.select().from(SessionChatTable)
                //@ts-ignore
                .where(eq(SessionChatTable.sessionId, sessionId));

            return NextResponse.json(result[0]);
        }
    } catch (e) {
        console.error('Session retrieval error:', e);
        return NextResponse.json({ 
            error: 'Failed to retrieve session(s)',
            details: e
        }, { status: 500 });
    }
}
