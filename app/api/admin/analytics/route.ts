import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/config/db'
import { usersTable, userSubscriptionsTable, subscriptionPlansTable, transactionsTable, SessionChatTable } from '@/config/schema'
import { requireAdminAuth } from '@/lib/admin-auth-custom'
import { eq, sql, count, sum, desc, and, gte } from 'drizzle-orm'

export async function GET() {
    try {
        await requireAdminAuth()
        
        // Get total users
        const totalUsersResult = await db
            .select({ count: count() })
            .from(usersTable)
        
        // Get total active subscriptions
        const activeSubscriptionsResult = await db
            .select({ count: count() })
            .from(userSubscriptionsTable)
            .where(eq(userSubscriptionsTable.status, 'active'))
        
        // Get total revenue (sum of all completed transactions)
        const totalRevenueResult = await db
            .select({ total: sum(transactionsTable.amount) })
            .from(transactionsTable)
            .where(eq(transactionsTable.status, 'completed'))
        
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
        
        // Get total sessions
        const totalSessionsResult = await db
            .select({ count: count() })
            .from(SessionChatTable)
        
        // Get users by subscription status
        const usersByStatusResult = await db
            .select({
                status: usersTable.subscriptionStatus,
                count: count()
            })
            .from(usersTable)
            .groupBy(usersTable.subscriptionStatus)
        
        // Get top subscription plans
        const topPlansResult = await db
            .select({
                planName: subscriptionPlansTable.name,
                subscriberCount: count(userSubscriptionsTable.id),
                revenue: sum(transactionsTable.amount)
            })
            .from(subscriptionPlansTable)
            .leftJoin(userSubscriptionsTable, eq(subscriptionPlansTable.id, userSubscriptionsTable.planId))
            .leftJoin(transactionsTable, eq(userSubscriptionsTable.id, transactionsTable.subscriptionId))
            .where(eq(userSubscriptionsTable.status, 'active'))
            .groupBy(subscriptionPlansTable.name)
            .orderBy(desc(count(userSubscriptionsTable.id)))
            .limit(5)
        
        // Get recent transactions
        const recentTransactionsResult = await db
            .select({
                id: transactionsTable.id,
                amount: transactionsTable.amount,
                currency: transactionsTable.currency,
                status: transactionsTable.status,
                description: transactionsTable.description,
                createdAt: transactionsTable.createdAt,
                userName: usersTable.name,
                userEmail: usersTable.email
            })
            .from(transactionsTable)
            .leftJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
            .orderBy(desc(transactionsTable.createdAt))
            .limit(10)
        
        // Get recent user registrations (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const recentUsersResult = await db
            .select({ count: count() })
            .from(usersTable)
            .where(gte(usersTable.createdAt, thirtyDaysAgo))
        
        // Calculate metrics
        const totalUsers = totalUsersResult[0]?.count || 0
        const activeSubscriptions = activeSubscriptionsResult[0]?.count || 0
        const totalRevenue = Number(totalRevenueResult[0]?.total || 0)
        const monthlyRevenue = Number(monthlyRevenueResult[0]?.total || 0)
        const totalSessions = totalSessionsResult[0]?.count || 0
        const recentUsers = recentUsersResult[0]?.count || 0
        
        // Calculate conversion rate (active subscriptions / total users)
        const conversionRate = totalUsers > 0 ? (activeSubscriptions / totalUsers) * 100 : 0
        
        // Calculate average revenue per user
        const arpu = activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0
        
        // Calculate customer retention (simplified - active subs vs total subs ever created)
        const totalEverSubscriptionsResult = await db
            .select({ count: count() })
            .from(userSubscriptionsTable)
        
        const totalEverSubscriptions = totalEverSubscriptionsResult[0]?.count || 0
        const customerRetention = totalEverSubscriptions > 0 ? (activeSubscriptions / totalEverSubscriptions) * 100 : 0
        
        const analytics = {
            overview: {
                totalUsers,
                activeSubscriptions,
                totalRevenue,
                monthlyRevenue,
                totalSessions,
                recentUsers,
                conversionRate: Math.round(conversionRate * 100) / 100,
                arpu: Math.round(arpu * 100) / 100,
                customerRetention: Math.round(customerRetention * 100) / 100
            },
            usersByStatus: usersByStatusResult,
            topPlans: topPlansResult,
            recentTransactions: recentTransactionsResult,
            // Growth metrics (mock data for now - would need time series data)
            growth: {
                users: [
                    { date: '2024-01', count: Math.max(0, totalUsers - 50) },
                    { date: '2024-02', count: Math.max(0, totalUsers - 30) },
                    { date: '2024-03', count: totalUsers }
                ],
                revenue: [
                    { date: '2024-01', amount: Math.max(0, monthlyRevenue - 1000) },
                    { date: '2024-02', amount: Math.max(0, monthlyRevenue - 500) },
                    { date: '2024-03', amount: monthlyRevenue }
                ]
            }
        }
        
        return NextResponse.json({ analytics })
    } catch (error) {
        if (error instanceof Error && error.message === 'Admin authentication required') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        
        console.error('Analytics error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
