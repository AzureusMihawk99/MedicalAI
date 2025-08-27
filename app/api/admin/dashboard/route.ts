import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/config/db'
import { usersTable, userSubscriptionsTable, transactionsTable, SessionChatTable } from '@/config/schema'
import { requireAdminAuth } from '@/lib/admin-auth-custom'
import { eq, count, sum, desc, gte, lte, and } from 'drizzle-orm'

export async function GET() {
    try {
        await requireAdminAuth()
        
        // Get total users
        const totalUsersResult = await db
            .select({ count: count() })
            .from(usersTable)
        
        // Get active subscriptions
        const activeSubscriptionsResult = await db
            .select({ count: count() })
            .from(userSubscriptionsTable)
            .where(eq(userSubscriptionsTable.status, 'active'))
        
        // Get monthly revenue (current month)
        const currentMonth = new Date()
        currentMonth.setDate(1)
        currentMonth.setHours(0, 0, 0, 0)
        
        const monthlyRevenueResult = await db
            .select({ total: sum(transactionsTable.amount) })
            .from(transactionsTable)
            .where(
                and(
                    eq(transactionsTable.status, 'completed'),
                    gte(transactionsTable.createdAt, currentMonth)
                )
            )
        
        // Get new signups (last 7 days)
        const lastWeek = new Date()
        lastWeek.setDate(lastWeek.getDate() - 7)
        
        const newSignupsResult = await db
            .select({ count: count() })
            .from(usersTable)
            .where(gte(usersTable.createdAt, lastWeek))
        
        // Get total sessions this month
        const totalSessionsResult = await db
            .select({ count: count() })
            .from(SessionChatTable)
            .where(gte(SessionChatTable.createdOn, currentMonth.toISOString()))
        
        // Get recent activity (recent users, subscriptions, transactions)
        const recentUsers = await db
            .select({
                name: usersTable.name,
                email: usersTable.email,
                createdAt: usersTable.createdAt
            })
            .from(usersTable)
            .orderBy(desc(usersTable.createdAt))
            .limit(5)
        
        const recentTransactions = await db
            .select({
                id: transactionsTable.id,
                amount: transactionsTable.amount,
                status: transactionsTable.status,
                description: transactionsTable.description,
                createdAt: transactionsTable.createdAt,
                userName: usersTable.name,
                userEmail: usersTable.email
            })
            .from(transactionsTable)
            .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
            .orderBy(desc(transactionsTable.createdAt))
            .limit(5)
        
        // Calculate previous month stats for comparison
        const previousMonth = new Date()
        previousMonth.setMonth(previousMonth.getMonth() - 1)
        previousMonth.setDate(1)
        previousMonth.setHours(0, 0, 0, 0)
        
        const endOfPreviousMonth = new Date()
        endOfPreviousMonth.setDate(1)
        endOfPreviousMonth.setHours(0, 0, 0, 0)
        
        const previousMonthUsersResult = await db
            .select({ count: count() })
            .from(usersTable)
            .where(
                and(
                    gte(usersTable.createdAt, previousMonth),
                    lte(usersTable.createdAt, endOfPreviousMonth)
                )
            )
        
        const previousMonthRevenueResult = await db
            .select({ total: sum(transactionsTable.amount) })
            .from(transactionsTable)
            .where(
                and(
                    eq(transactionsTable.status, 'completed'),
                    gte(transactionsTable.createdAt, previousMonth),
                    lte(transactionsTable.createdAt, endOfPreviousMonth)
                )
            )
        
        // Calculate growth percentages
        const totalUsers = totalUsersResult[0]?.count || 0
        const activeSubscriptions = activeSubscriptionsResult[0]?.count || 0
        const monthlyRevenue = Number(monthlyRevenueResult[0]?.total || 0)
        const newSignups = newSignupsResult[0]?.count || 0
        const totalSessions = totalSessionsResult[0]?.count || 0
        
        const previousMonthUsers = previousMonthUsersResult[0]?.count || 0
        const previousMonthRevenue = Number(previousMonthRevenueResult[0]?.total || 0)
        
        const userGrowth = previousMonthUsers > 0 
            ? ((newSignups / previousMonthUsers) * 100).toFixed(1)
            : '0'
        
        const revenueGrowth = previousMonthRevenue > 0 
            ? (((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1)
            : '0'
        
        // Format recent activity
        const recentActivity = [
            ...recentUsers.map(user => ({
                type: 'user_registered',
                message: `New user registered: ${user.email}`,
                timestamp: user.createdAt,
                color: 'green'
            })),
            ...recentTransactions.map(transaction => ({
                type: transaction.status === 'completed' ? 'payment_success' : 'payment_failed',
                message: transaction.status === 'completed' 
                    ? `Payment received: $${transaction.amount} from ${transaction.userEmail}`
                    : `Payment failed: ${transaction.userEmail}`,
                timestamp: transaction.createdAt,
                color: transaction.status === 'completed' ? 'blue' : 'orange'
            }))
        ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        
        const dashboardData = {
            stats: {
                totalUsers,
                activeSubscriptions,
                monthlyRevenue,
                newSignups,
                totalSessions,
                userGrowth: parseFloat(userGrowth),
                revenueGrowth: parseFloat(revenueGrowth)
            },
            recentActivity
        }
        
        return NextResponse.json({ dashboard: dashboardData })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Dashboard data error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
