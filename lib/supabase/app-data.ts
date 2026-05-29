import type { Activity, AppData, AppUser, Article, BatchStage, FinanceRecord, FlowerBatch, Plot, Product, SiteSettings, Task, Tree } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"

const APP_DATA_ID = "default"

type AppDataRow = {
  id: string
  data: AppData
  updated_at: string
}

function withoutOwnerData(appData: AppData): AppData {
  return {
    ...appData,
    users: [],
    plots: [],
    activities: [],
    tasks: [],
    finance: [],
  }
}

export async function loadRemoteAppData() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("app_data")
    .select("data")
    .eq("id", APP_DATA_ID)
    .maybeSingle<Pick<AppDataRow, "data">>()

  if (error) throw error
  return data?.data ?? null
}

export async function saveRemoteAppData(appData: AppData, ownerUserId?: string | null) {
  if (ownerUserId) {
    await saveStructuredAppData(appData, ownerUserId)
    return
  }

  const supabase = createClient()
  const { error } = await supabase
    .from("app_data")
    .upsert({
      id: APP_DATA_ID,
      data: withoutOwnerData(appData),
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}

function rowToUser(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as AppUser["role"],
    status: row.status as AppUser["status"],
    provider: (row.provider as string) || "email",
    passwordHash: (row.password_hash as string) || "",
    avatar: (row.avatar_url as string) || undefined,
    coverImage: (row.cover_image as string) || undefined,
    coverPositionX: row.cover_position_x === null || row.cover_position_x === undefined ? undefined : Number(row.cover_position_x),
    coverPositionY: row.cover_position_y === null || row.cover_position_y === undefined ? undefined : Number(row.cover_position_y),
    farmName: (row.farm_name as string) || undefined,
    farmLocation: row.farm_location as AppUser["farmLocation"],
    savedArticleIds: Array.isArray(row.saved_article_ids) ? row.saved_article_ids.filter(id => typeof id === "string") : undefined,
    createdAt: row.created_at as string,
  }
}

function rowToStage(row: Record<string, unknown>): BatchStage {
  return {
    id: row.id as string,
    stage: row.stage as BatchStage["stage"],
    date: row.date as string,
    note: (row.note as string) || "",
  }
}

function rowToBatch(row: Record<string, unknown>): FlowerBatch {
  return {
    id: row.id as string,
    name: row.name as string,
    fruitCount: Number(row.fruit_count ?? 0),
    bloomDate: (row.bloom_date as string) || undefined,
    stages: ((row.batch_stages as Record<string, unknown>[] | null) ?? []).map(rowToStage),
  }
}

function rowToTree(row: Record<string, unknown>): Tree {
  return {
    id: row.id as string,
    treeNumber: row.tree_number as string,
    variety: row.variety as Tree["variety"],
    age: Number(row.age ?? 0),
    stage: row.stage as Tree["stage"],
    health: row.health as Tree["health"],
    notes: (row.notes as string) || "",
    batches: ((row.batches as Record<string, unknown>[] | null) ?? []).map(rowToBatch),
    lastUpdated: row.last_updated as string,
  }
}

function rowToPlot(row: Record<string, unknown>): Plot {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || undefined,
    name: row.name as string,
    area: Number(row.area ?? 0),
    notes: (row.notes as string) || "",
    trees: ((row.trees as Record<string, unknown>[] | null) ?? []).map(rowToTree),
  }
}

function rowToActivity(row: Record<string, unknown>): Activity {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || undefined,
    date: row.date as string,
    plotId: (row.plot_id as string) || "",
    treeId: (row.tree_id as string) || undefined,
    activityType: row.activity_type as Activity["activityType"],
    description: row.description as string,
    cost: Number(row.cost ?? 0),
    createdAt: row.created_at as string,
  }
}

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || undefined,
    date: row.date as string,
    plotId: (row.plot_id as string) || "",
    title: row.title as string,
    description: (row.description as string) || "",
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
  }
}

function rowToFinance(row: Record<string, unknown>): FinanceRecord {
  return {
    id: row.id as string,
    userId: (row.user_id as string) || undefined,
    date: row.date as string,
    type: row.type as FinanceRecord["type"],
    category: row.category as FinanceRecord["category"],
    amount: Number(row.amount ?? 0),
    description: (row.description as string) || "",
    plotId: (row.plot_id as string) || undefined,
  }
}

function rowToArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as string,
    image: row.image as string,
    imageAlt: (row.image_alt as string) || undefined,
    content: row.content as string,
    slug: (row.slug as string) || undefined,
    metaTitle: (row.meta_title as string) || undefined,
    metaDescription: (row.meta_description as string) || undefined,
    keywords: (row.keywords as string) || undefined,
    geoSummary: (row.geo_summary as string) || undefined,
    authorName: (row.author_name as string) || undefined,
    affiliateTitle: (row.affiliate_title as string) || undefined,
    affiliateUrl: (row.affiliate_url as string) || undefined,
    status: (row.status as Article["status"]) || "published",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function rowToProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as string,
    image: row.image as string,
    imageAlt: (row.image_alt as string) || undefined,
    priceLabel: row.price_label as string,
    description: row.description as string,
    affiliateUrl: row.affiliate_url as string,
    slug: (row.slug as string) || undefined,
    metaTitle: (row.meta_title as string) || undefined,
    metaDescription: (row.meta_description as string) || undefined,
    keywords: (row.keywords as string) || undefined,
    geoSummary: (row.geo_summary as string) || undefined,
    brandName: (row.brand_name as string) || undefined,
    sku: (row.sku as string) || undefined,
    status: (row.status as Product["status"]) || "active",
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function rowToSettings(row: Record<string, unknown> | null): SiteSettings {
  return {
    siteName: (row?.site_name as string) || "Durian Flow",
    tagline: (row?.tagline as string) || "Smart Orchard",
    logoUrl: (row?.logo_url as string) || "",
    googleVerification: (row?.google_verification as string) || "",
    googleAnalytics: (row?.google_analytics as string) || "",
  }
}

export async function loadStructuredAppData(ownerUserId?: string | null): Promise<AppData | null> {
  const supabase = createClient()
  const plotsQuery = supabase.from("plots").select("*, trees(*, batches(*, batch_stages(*)))").order("created_at", { ascending: true })
  const activitiesQuery = supabase.from("activities").select("*").order("created_at", { ascending: false })
  const tasksQuery = supabase.from("tasks").select("*").order("created_at", { ascending: false })
  const financeQuery = supabase.from("finance_records").select("*").order("created_at", { ascending: false })

  if (ownerUserId) {
    plotsQuery.eq("user_id", ownerUserId)
    activitiesQuery.eq("user_id", ownerUserId)
    tasksQuery.eq("user_id", ownerUserId)
    financeQuery.eq("user_id", ownerUserId)
  }

  const [
    profilesResult,
    plotsResult,
    activitiesResult,
    tasksResult,
    financeResult,
    articlesResult,
    productsResult,
    settingsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    plotsQuery,
    activitiesQuery,
    tasksQuery,
    financeQuery,
    supabase.from("articles").select("*").order("created_at", { ascending: false }),
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("site_settings").select("*").eq("id", APP_DATA_ID).maybeSingle(),
  ])

  const error = profilesResult.error || plotsResult.error || activitiesResult.error || tasksResult.error || financeResult.error || articlesResult.error || productsResult.error || settingsResult.error
  if (error) throw error

  const hasStructuredData = Boolean(
    profilesResult.data?.length ||
    plotsResult.data?.length ||
    activitiesResult.data?.length ||
    tasksResult.data?.length ||
    financeResult.data?.length ||
    articlesResult.data?.length ||
    productsResult.data?.length ||
    settingsResult.data
  )

  if (!hasStructuredData) return null

  return {
    users: (profilesResult.data ?? []).map(rowToUser),
    plots: (plotsResult.data ?? []).map(rowToPlot),
    activities: (activitiesResult.data ?? []).map(rowToActivity),
    tasks: (tasksResult.data ?? []).map(rowToTask),
    finance: (financeResult.data ?? []).map(rowToFinance),
    articles: (articlesResult.data ?? []).map(rowToArticle),
    products: (productsResult.data ?? []).map(rowToProduct),
    siteSettings: rowToSettings(settingsResult.data),
  }
}

async function deleteMissingRows(table: string, keepIds: string[]) {
  const supabase = createClient()
  const { data, error } = await supabase.from(table).select("id")
  if (error) throw error

  const keep = new Set(keepIds)
  const staleIds = (data ?? [])
    .map(row => row.id as string)
    .filter(id => !keep.has(id))

  if (!staleIds.length) return

  const { error: deleteError } = await supabase.from(table).delete().in("id", staleIds)
  if (deleteError) throw deleteError
}

async function deleteMissingRowsByOwner(table: string, keepIds: string[], ownerUserId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from(table).select("id").eq("user_id", ownerUserId)
  if (error) throw error

  const keep = new Set(keepIds)
  const staleIds = (data ?? [])
    .map(row => row.id as string)
    .filter(id => !keep.has(id))

  if (!staleIds.length) return

  const { error: deleteError } = await supabase.from(table).delete().in("id", staleIds)
  if (deleteError) throw deleteError
}

async function deleteMissingRowsByColumn(table: string, keepIds: string[], column: string, scopeIds: string[]) {
  if (!scopeIds.length) return

  const supabase = createClient()
  const { data, error } = await supabase.from(table).select("id").in(column, scopeIds)
  if (error) throw error

  const keep = new Set(keepIds)
  const staleIds = (data ?? [])
    .map(row => row.id as string)
    .filter(id => !keep.has(id))

  if (!staleIds.length) return

  const { error: deleteError } = await supabase.from(table).delete().in("id", staleIds)
  if (deleteError) throw deleteError
}

async function upsertRows(table: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return
  const supabase = createClient()
  const { error } = await supabase.from(table).upsert(rows)
  if (error) throw error
}

export async function saveStructuredAppData(appData: AppData, ownerUserId?: string | null) {
  const profileUsers = ownerUserId
    ? appData.users.filter(user => user.id === ownerUserId)
    : appData.users

  const users = profileUsers.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar ?? null,
    cover_image: user.coverImage ?? null,
    cover_position_x: user.coverPositionX ?? null,
    cover_position_y: user.coverPositionY ?? null,
    farm_name: user.farmName ?? null,
    farm_location: user.farmLocation ?? null,
    saved_article_ids: user.savedArticleIds ?? null,
    role: user.role,
    status: user.status,
    provider: user.provider,
    password_hash: user.passwordHash,
    created_at: user.createdAt,
  }))

  const plots = appData.plots.map(plot => ({
    id: plot.id,
    user_id: ownerUserId ?? plot.userId ?? appData.users[0]?.id ?? null,
    name: plot.name,
    area: plot.area,
    notes: plot.notes,
  }))

  const trees = appData.plots.flatMap(plot => plot.trees.map(tree => ({
    id: tree.id,
    plot_id: plot.id,
    tree_number: tree.treeNumber,
    variety: tree.variety,
    age: tree.age,
    stage: tree.stage,
    health: tree.health,
    notes: tree.notes,
    last_updated: tree.lastUpdated,
  })))

  const batches = appData.plots.flatMap(plot => plot.trees.flatMap(tree => (tree.batches ?? []).map(batch => ({
    id: batch.id,
    tree_id: tree.id,
    name: batch.name,
    fruit_count: batch.fruitCount,
    bloom_date: batch.bloomDate ?? null,
  }))))

  const stages = appData.plots.flatMap(plot => plot.trees.flatMap(tree => (tree.batches ?? []).flatMap(batch => batch.stages.map(stage => ({
    id: stage.id,
    batch_id: batch.id,
    stage: stage.stage,
    date: stage.date,
    note: stage.note,
  })))))

  const activities = appData.activities.map(activity => ({
    id: activity.id,
    user_id: ownerUserId ?? activity.userId ?? appData.users[0]?.id ?? null,
    plot_id: activity.plotId || null,
    tree_id: activity.treeId ?? null,
    activity_type: activity.activityType,
    description: activity.description,
    cost: activity.cost,
    date: activity.date,
    created_at: activity.createdAt,
  }))

  const tasks = appData.tasks.map(task => ({
    id: task.id,
    user_id: ownerUserId ?? task.userId ?? appData.users[0]?.id ?? null,
    plot_id: task.plotId || null,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    date: task.date,
  }))

  const finance = appData.finance.map(record => ({
    id: record.id,
    user_id: ownerUserId ?? record.userId ?? appData.users[0]?.id ?? null,
    plot_id: record.plotId ?? null,
    type: record.type,
    category: record.category,
    amount: record.amount,
    description: record.description,
    date: record.date,
  }))

  const articles = appData.articles.map(article => ({
    id: article.id,
    title: article.title,
    category: article.category,
    image: article.image,
    image_alt: article.imageAlt ?? null,
    content: article.content,
    slug: article.slug ?? null,
    meta_title: article.metaTitle ?? null,
    meta_description: article.metaDescription ?? null,
    keywords: article.keywords ?? null,
    geo_summary: article.geoSummary ?? null,
    author_name: article.authorName ?? null,
    affiliate_title: article.affiliateTitle ?? null,
    affiliate_url: article.affiliateUrl ?? null,
    status: article.status,
    created_at: article.createdAt,
    updated_at: article.updatedAt,
  }))

  const products = appData.products.map(product => ({
    id: product.id,
    name: product.name,
    category: product.category,
    image: product.image,
    image_alt: product.imageAlt ?? null,
    price_label: product.priceLabel,
    description: product.description,
    affiliate_url: product.affiliateUrl,
    slug: product.slug ?? null,
    meta_title: product.metaTitle ?? null,
    meta_description: product.metaDescription ?? null,
    keywords: product.keywords ?? null,
    geo_summary: product.geoSummary ?? null,
    brand_name: product.brandName ?? null,
    sku: product.sku ?? null,
    status: product.status,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  }))

  await upsertRows("profiles", users)
  await upsertRows("plots", plots)
  await upsertRows("trees", trees)
  await upsertRows("batches", batches)
  await upsertRows("batch_stages", stages)
  await upsertRows("activities", activities)
  await upsertRows("tasks", tasks)
  await upsertRows("finance_records", finance)
  await upsertRows("articles", articles)
  await upsertRows("products", products)

  const supabase = createClient()
  const { error: settingsError } = await supabase.from("site_settings").upsert({
    id: APP_DATA_ID,
    site_name: appData.siteSettings.siteName,
    tagline: appData.siteSettings.tagline,
    logo_url: appData.siteSettings.logoUrl,
    google_verification: appData.siteSettings.googleVerification || null,
    google_analytics: appData.siteSettings.googleAnalytics || null,
    updated_at: new Date().toISOString(),
  })
  if (settingsError) throw settingsError

  if (ownerUserId) {
    await deleteMissingRowsByColumn("batch_stages", stages.map(row => row.id as string), "batch_id", batches.map(row => row.id as string))
    await deleteMissingRowsByColumn("batches", batches.map(row => row.id as string), "tree_id", trees.map(row => row.id as string))
    await deleteMissingRowsByColumn("trees", trees.map(row => row.id as string), "plot_id", plots.map(row => row.id as string))
    await deleteMissingRowsByOwner("activities", activities.map(row => row.id as string), ownerUserId)
    await deleteMissingRowsByOwner("tasks", tasks.map(row => row.id as string), ownerUserId)
    await deleteMissingRowsByOwner("finance_records", finance.map(row => row.id as string), ownerUserId)
    await deleteMissingRowsByOwner("plots", plots.map(row => row.id as string), ownerUserId)
    return
  }

  await deleteMissingRows("batch_stages", stages.map(row => row.id as string))
  await deleteMissingRows("batches", batches.map(row => row.id as string))
  await deleteMissingRows("trees", trees.map(row => row.id as string))
  await deleteMissingRows("activities", activities.map(row => row.id as string))
  await deleteMissingRows("tasks", tasks.map(row => row.id as string))
  await deleteMissingRows("finance_records", finance.map(row => row.id as string))
  await deleteMissingRows("plots", plots.map(row => row.id as string))
  await deleteMissingRows("profiles", users.map(row => row.id as string))
  await deleteMissingRows("articles", articles.map(row => row.id as string))
  await deleteMissingRows("products", products.map(row => row.id as string))
}
