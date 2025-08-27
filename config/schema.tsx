import { boolean, decimal, integer, json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    credits: integer(),
    role: varchar({ length: 50 }).default('user'),
    subscriptionStatus: varchar('subscription_status', { length: 50 }).default('free'),
    subscriptionPlanId: integer('subscription_plan_id'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

export const subscriptionPlansTable = pgTable('subscription_plans', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    price: decimal({ precision: 10, scale: 2 }).notNull(),
    currency: varchar({ length: 3 }).default('USD'),
    intervalType: varchar('interval_type', { length: 20 }).notNull(),
    intervalCount: integer('interval_count').default(1),
    stripePriceId: varchar('stripe_price_id', { length: 255 }).unique(),
    features: json(),
    active: boolean().default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

export const userSubscriptionsTable = pgTable('user_subscriptions', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
    planId: integer('plan_id').references(() => subscriptionPlansTable.id),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique(),
    status: varchar({ length: 50 }).notNull(),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

export const adminsTable = pgTable('admins', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
    password: varchar({ length: 255 }).notNull(),
    role: varchar({ length: 50 }).default('admin'),
    active: boolean().default(true),
    lastLogin: timestamp('last_login'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

export const SessionChatTable = pgTable('sessionChatTable', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sessionId: varchar().notNull(),
    notes: text(),
    selectedDoctor: json(),
    conversation: json(),
    report: json(),
    createdBy: varchar().references(() => usersTable.email),
    createdOn: varchar(),
})

export const adminSettingsTable = pgTable('admin_settings', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    settingKey: varchar('setting_key', { length: 255 }).notNull().unique(),
    settingValue: text('setting_value'),
    encrypted: boolean().default(false),
    description: text(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

export const transactionsTable = pgTable('transactions', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id').references(() => usersTable.id, { onDelete: 'cascade' }),
    subscriptionId: integer('subscription_id').references(() => userSubscriptionsTable.id),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    amount: decimal({ precision: 10, scale: 2 }).notNull(),
    currency: varchar({ length: 3 }).default('USD'),
    status: varchar({ length: 50 }).notNull(),
    description: text(),
    creditsAwarded: integer('credits_awarded').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});
