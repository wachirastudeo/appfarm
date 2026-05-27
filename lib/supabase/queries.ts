import { createClient } from "./client"
import type { Plot, Tree, Activity, Task, FinanceRecord, AppUser, Article, Product, SiteSettings, FlowerBatch, BatchStage } from "@/lib/store"

// ---- Plots ----
export async function insertPlot(plot: Omit<Plot, "trees">, userId: string = "u-admin") {
  const supabase = createClient()
  const { error } = await supabase
    .from("plots")
    .insert({
      id: plot.id,
      name: plot.name,
      area: plot.area,
      notes: plot.notes,
      user_id: userId,
    })
  if (error) throw error
}

export async function updatePlot(plotId: string, changes: Partial<Plot>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.name !== undefined) dbChanges.name = changes.name
  if (changes.area !== undefined) dbChanges.area = changes.area
  if (changes.notes !== undefined) dbChanges.notes = changes.notes

  const { error } = await supabase
    .from("plots")
    .update(dbChanges)
    .eq("id", plotId)
  if (error) throw error
}

export async function deletePlot(plotId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("plots")
    .delete()
    .eq("id", plotId)
  if (error) throw error
}

// ---- Trees ----
export async function insertTree(plotId: string, tree: Omit<Tree, "batches">) {
  const supabase = createClient()
  const { error } = await supabase
    .from("trees")
    .insert({
      id: tree.id,
      plot_id: plotId,
      tree_number: tree.treeNumber,
      variety: tree.variety,
      age: tree.age,
      stage: tree.stage,
      health: tree.health,
      notes: tree.notes,
      last_updated: tree.lastUpdated,
    })
  if (error) throw error
}

export async function updateTree(treeId: string, changes: Partial<Tree>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.treeNumber !== undefined) dbChanges.tree_number = changes.treeNumber
  if (changes.variety !== undefined) dbChanges.variety = changes.variety
  if (changes.age !== undefined) dbChanges.age = changes.age
  if (changes.stage !== undefined) dbChanges.stage = changes.stage
  if (changes.health !== undefined) dbChanges.health = changes.health
  if (changes.notes !== undefined) dbChanges.notes = changes.notes
  if (changes.lastUpdated !== undefined) dbChanges.last_updated = changes.lastUpdated

  const { error } = await supabase
    .from("trees")
    .update(dbChanges)
    .eq("id", treeId)
  if (error) throw error
}

export async function deleteTree(treeId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("trees")
    .delete()
    .eq("id", treeId)
  if (error) throw error
}

export async function bulkUpdateTrees(plotId: string, stage: string, lastUpdated: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("trees")
    .update({ stage, last_updated: lastUpdated })
    .eq("plot_id", plotId)
  if (error) throw error
}

// ---- Batches ----
export async function insertBatch(treeId: string, batch: Omit<FlowerBatch, "stages">) {
  const supabase = createClient()
  const { error } = await supabase
    .from("batches")
    .insert({
      id: batch.id,
      tree_id: treeId,
      name: batch.name,
      fruit_count: batch.fruitCount,
      bloom_date: batch.bloomDate || null,
    })
  if (error) throw error
}

export async function updateBatch(batchId: string, changes: Partial<FlowerBatch>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.name !== undefined) dbChanges.name = changes.name
  if (changes.fruitCount !== undefined) dbChanges.fruit_count = changes.fruitCount
  if (changes.bloomDate !== undefined) dbChanges.bloom_date = changes.bloomDate || null

  const { error } = await supabase
    .from("batches")
    .update(dbChanges)
    .eq("id", batchId)
  if (error) throw error
}

export async function deleteBatch(batchId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("batches")
    .delete()
    .eq("id", batchId)
  if (error) throw error
}

// ---- Batch Stages ----
export async function insertBatchStage(batchId: string, stage: BatchStage) {
  const supabase = createClient()
  const { error } = await supabase
    .from("batch_stages")
    .insert({
      id: stage.id,
      batch_id: batchId,
      stage: stage.stage,
      date: stage.date,
      note: stage.note,
    })
  if (error) throw error
}

// ---- Activities ----
export async function insertActivity(activity: Activity, userId: string = "u-admin") {
  const supabase = createClient()
  const { error } = await supabase
    .from("activities")
    .insert({
      id: activity.id,
      user_id: userId,
      plot_id: activity.plotId || null,
      tree_id: activity.treeId || null,
      activity_type: activity.activityType,
      description: activity.description,
      cost: activity.cost,
      date: activity.date,
      created_at: activity.createdAt,
    })
  if (error) throw error
}

export async function updateActivity(activityId: string, changes: Partial<Activity>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.plotId !== undefined) dbChanges.plot_id = changes.plotId || null
  if (changes.treeId !== undefined) dbChanges.tree_id = changes.treeId || null
  if (changes.activityType !== undefined) dbChanges.activity_type = changes.activityType
  if (changes.description !== undefined) dbChanges.description = changes.description
  if (changes.cost !== undefined) dbChanges.cost = changes.cost
  if (changes.date !== undefined) dbChanges.date = changes.date

  const { error } = await supabase
    .from("activities")
    .update(dbChanges)
    .eq("id", activityId)
  if (error) throw error
}

export async function deleteActivity(activityId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", activityId)
  if (error) throw error
}

// ---- Tasks ----
export async function insertTask(task: Task, userId: string = "u-admin") {
  const supabase = createClient()
  const { error } = await supabase
    .from("tasks")
    .insert({
      id: task.id,
      user_id: userId,
      plot_id: task.plotId || null,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      date: task.date,
    })
  if (error) throw error
}

export async function updateTask(taskId: string, changes: Partial<Task>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.plotId !== undefined) dbChanges.plot_id = changes.plotId || null
  if (changes.title !== undefined) dbChanges.title = changes.title
  if (changes.description !== undefined) dbChanges.description = changes.description
  if (changes.status !== undefined) dbChanges.status = changes.status
  if (changes.priority !== undefined) dbChanges.priority = changes.priority
  if (changes.date !== undefined) dbChanges.date = changes.date

  const { error } = await supabase
    .from("tasks")
    .update(dbChanges)
    .eq("id", taskId)
  if (error) throw error
}

export async function deleteTask(taskId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
  if (error) throw error
}

// ---- Finance Records ----
export async function insertFinanceRecord(record: FinanceRecord, userId: string = "u-admin") {
  const supabase = createClient()
  const { error } = await supabase
    .from("finance_records")
    .insert({
      id: record.id,
      user_id: userId,
      plot_id: record.plotId || null,
      type: record.type,
      category: record.category,
      amount: record.amount,
      description: record.description,
      date: record.date,
    })
  if (error) throw error
}

export async function deleteFinanceRecord(recordId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("finance_records")
    .delete()
    .eq("id", recordId)
  if (error) throw error
}

// ---- Users ----
function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeProvider(provider: string) {
  const normalized = provider.replace(/^custom:/, "").toLowerCase()
  if (normalized === "line" || normalized.includes("line")) return "line"
  return normalized || "oauth"
}

function rowToUser(data: Record<string, unknown>): AppUser {
  return {
    id: data.id as string,
    email: data.email as string,
    name: data.name as string,
    role: data.role as AppUser["role"],
    status: data.status as AppUser["status"],
    provider: (data.provider as string) || "email",
    passwordHash: (data.password_hash as string) || "",
    avatar: (data.avatar_url as string) || undefined,
    coverImage: (data.cover_image as string) || undefined,
    coverPositionX: data.cover_position_x === null || data.cover_position_x === undefined ? undefined : Number(data.cover_position_x),
    coverPositionY: data.cover_position_y === null || data.cover_position_y === undefined ? undefined : Number(data.cover_position_y),
    farmName: (data.farm_name as string) || undefined,
    farmLocation: data.farm_location as AppUser["farmLocation"],
    savedArticleIds: Array.isArray(data.saved_article_ids) ? data.saved_article_ids.filter((id: unknown) => typeof id === "string") : undefined,
    createdAt: data.created_at as string,
  }
}

export async function findUserByEmail(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return rowToUser(data) satisfies AppUser
}

export async function insertUser(user: AppUser) {
  const supabase = createClient()
  const { error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: normalizeEmail(user.email),
      name: user.name,
      role: user.role,
      status: user.status,
      provider: user.provider,
      password_hash: user.passwordHash,
      avatar_url: user.avatar || null,
      cover_image: user.coverImage || null,
      cover_position_x: user.coverPositionX ?? null,
      cover_position_y: user.coverPositionY ?? null,
      farm_name: user.farmName || null,
      farm_location: user.farmLocation || null,
      saved_article_ids: user.savedArticleIds || null,
      created_at: user.createdAt,
    })
  if (error) throw error
}

export async function updateUser(userId: string, changes: Partial<AppUser>) {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  const authEmail = authUser?.email ? normalizeEmail(authUser.email) : null

  // Check if the profile exists first
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", userId)
    .maybeSingle()

  if (selectError) throw selectError

  const dbChanges: any = {}
  if (changes.name !== undefined) dbChanges.name = changes.name
  if (changes.email !== undefined) dbChanges.email = normalizeEmail(changes.email)
  if (changes.role !== undefined) dbChanges.role = changes.role
  if (changes.status !== undefined) dbChanges.status = changes.status
  if (changes.avatar !== undefined) dbChanges.avatar_url = changes.avatar || null
  if ("coverImage" in changes) dbChanges.cover_image = changes.coverImage || null
  if ("coverPositionX" in changes) dbChanges.cover_position_x = changes.coverPositionX ?? null
  if ("coverPositionY" in changes) dbChanges.cover_position_y = changes.coverPositionY ?? null
  if ("farmName" in changes) dbChanges.farm_name = changes.farmName || null
  if ("farmLocation" in changes) dbChanges.farm_location = changes.farmLocation ?? null
  if ("savedArticleIds" in changes) dbChanges.saved_article_ids = changes.savedArticleIds ?? null
  if (changes.passwordHash !== undefined) dbChanges.password_hash = changes.passwordHash

  if (existingProfile) {
    const { data, error } = await supabase
      .from("profiles")
      .update(dbChanges)
      .eq("id", userId)
      .select("*")
      .single()
    if (error) throw error
    return rowToUser(data) satisfies AppUser
  }

  if (authEmail) {
    const { data, error } = await supabase
      .from("profiles")
      .update(dbChanges)
      .eq("email", authEmail)
      .select("*")
      .maybeSingle()

    if (error) throw error
    if (data) return rowToUser(data) satisfies AppUser
  }

  if (!authUser) {
    throw new Error("User is not authenticated in Supabase.")
  }

  const metadata = authUser.user_metadata as Record<string, unknown> | undefined
  const provider = normalizeProvider(changes.provider
    || (typeof authUser.app_metadata?.provider === "string" ? authUser.app_metadata.provider : undefined)
    || "oauth")
  const email = authEmail || (provider === "line" ? `line-${authUser.id}@oauth.local` : changes.email ? normalizeEmail(changes.email) : `${provider}-${authUser.id}@oauth.local`)
  const metadataName = typeof metadata?.name === "string"
    ? metadata.name
    : typeof metadata?.full_name === "string"
      ? metadata.full_name
      : undefined
  const metadataAvatar = typeof metadata?.avatar_url === "string"
    ? metadata.avatar_url
    : typeof metadata?.picture === "string"
      ? metadata.picture
      : undefined

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      name: changes.name || metadataName || email.split("@")[0],
      role: changes.role || "user",
      status: changes.status || "active",
      provider,
      password_hash: changes.passwordHash || null,
      avatar_url: changes.avatar || metadataAvatar || null,
      cover_image: dbChanges.cover_image || null,
      cover_position_x: dbChanges.cover_position_x ?? null,
      cover_position_y: dbChanges.cover_position_y ?? null,
      farm_name: dbChanges.farm_name || null,
      farm_location: dbChanges.farm_location ?? null,
      saved_article_ids: dbChanges.saved_article_ids ?? null,
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (error) throw error
  return rowToUser(data) satisfies AppUser
}

export async function deleteUser(userId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)
  if (error) throw error
}

// ---- Articles ----
export async function insertArticle(article: Article) {
  const supabase = createClient()
  const { error } = await supabase
    .from("articles")
    .insert({
      id: article.id,
      title: article.title,
      category: article.category,
      image: article.image,
      image_alt: article.imageAlt || null,
      content: article.content,
      slug: article.slug || null,
      meta_title: article.metaTitle || null,
      meta_description: article.metaDescription || null,
      keywords: article.keywords || null,
      geo_summary: article.geoSummary || null,
      author_name: article.authorName || null,
      affiliate_title: article.affiliateTitle || null,
      affiliate_url: article.affiliateUrl || null,
      status: article.status,
      created_at: article.createdAt,
      updated_at: article.updatedAt,
    })
  if (error) throw error
}

export async function updateArticle(articleId: string, changes: Partial<Article>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.title !== undefined) dbChanges.title = changes.title
  if (changes.category !== undefined) dbChanges.category = changes.category
  if (changes.image !== undefined) dbChanges.image = changes.image
  if (changes.imageAlt !== undefined) dbChanges.image_alt = changes.imageAlt || null
  if (changes.content !== undefined) dbChanges.content = changes.content
  if (changes.slug !== undefined) dbChanges.slug = changes.slug || null
  if (changes.metaTitle !== undefined) dbChanges.meta_title = changes.metaTitle || null
  if (changes.metaDescription !== undefined) dbChanges.meta_description = changes.metaDescription || null
  if (changes.keywords !== undefined) dbChanges.keywords = changes.keywords || null
  if (changes.geoSummary !== undefined) dbChanges.geo_summary = changes.geoSummary || null
  if (changes.authorName !== undefined) dbChanges.author_name = changes.authorName || null
  if (changes.affiliateTitle !== undefined) dbChanges.affiliate_title = changes.affiliateTitle || null
  if (changes.affiliateUrl !== undefined) dbChanges.affiliate_url = changes.affiliateUrl || null
  if (changes.status !== undefined) dbChanges.status = changes.status
  if (changes.updatedAt !== undefined) dbChanges.updated_at = changes.updatedAt

  const { error } = await supabase
    .from("articles")
    .update(dbChanges)
    .eq("id", articleId)
  if (error) throw error
}

export async function deleteArticle(articleId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", articleId)
  if (error) throw error
}

// ---- Products ----
export async function insertProduct(product: Product) {
  const supabase = createClient()
  const { error } = await supabase
    .from("products")
    .insert({
      id: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      image_alt: product.imageAlt || null,
      price_label: product.priceLabel,
      description: product.description,
      affiliate_url: product.affiliateUrl,
      slug: product.slug || null,
      meta_title: product.metaTitle || null,
      meta_description: product.metaDescription || null,
      keywords: product.keywords || null,
      geo_summary: product.geoSummary || null,
      brand_name: product.brandName || null,
      sku: product.sku || null,
      status: product.status,
      created_at: product.createdAt,
      updated_at: product.updatedAt,
    })
  if (error) throw error
}

export async function updateProduct(productId: string, changes: Partial<Product>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.name !== undefined) dbChanges.name = changes.name
  if (changes.category !== undefined) dbChanges.category = changes.category
  if (changes.image !== undefined) dbChanges.image = changes.image
  if (changes.imageAlt !== undefined) dbChanges.image_alt = changes.imageAlt || null
  if (changes.priceLabel !== undefined) dbChanges.price_label = changes.priceLabel
  if (changes.description !== undefined) dbChanges.description = changes.description
  if (changes.affiliateUrl !== undefined) dbChanges.affiliate_url = changes.affiliateUrl
  if (changes.slug !== undefined) dbChanges.slug = changes.slug || null
  if (changes.metaTitle !== undefined) dbChanges.meta_title = changes.metaTitle || null
  if (changes.metaDescription !== undefined) dbChanges.meta_description = changes.metaDescription || null
  if (changes.keywords !== undefined) dbChanges.keywords = changes.keywords || null
  if (changes.geoSummary !== undefined) dbChanges.geo_summary = changes.geoSummary || null
  if (changes.brandName !== undefined) dbChanges.brand_name = changes.brandName || null
  if (changes.sku !== undefined) dbChanges.sku = changes.sku || null
  if (changes.status !== undefined) dbChanges.status = changes.status
  if (changes.updatedAt !== undefined) dbChanges.updated_at = changes.updatedAt

  const { error } = await supabase
    .from("products")
    .update(dbChanges)
    .eq("id", productId)
  if (error) throw error
}

export async function deleteProduct(productId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
  if (error) throw error
}

// ---- Site Settings ----
export async function updateSiteSettings(changes: Partial<SiteSettings>) {
  const supabase = createClient()
  const dbChanges: any = {}
  if (changes.siteName !== undefined) dbChanges.site_name = changes.siteName
  if (changes.tagline !== undefined) dbChanges.tagline = changes.tagline
  if (changes.logoUrl !== undefined) dbChanges.logo_url = changes.logoUrl
  dbChanges.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from("site_settings")
    .upsert({
      id: "default",
      ...dbChanges,
    })
  if (error) throw error
}
