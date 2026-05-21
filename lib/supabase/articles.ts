import type { Article, Product } from "@/lib/store"
import { createClient } from "@/lib/supabase/client"

// ---- helpers ----

function rowToArticle(row: Record<string, unknown>): Article {
    return {
        id: row.id as string,
        title: row.title as string,
        category: row.category as string,
        image: row.image as string,
        imageAlt: (row.image_alt as string) ?? undefined,
        content: row.content as string,
        slug: (row.slug as string) ?? undefined,
        metaTitle: (row.meta_title as string) ?? undefined,
        metaDescription: (row.meta_description as string) ?? undefined,
        keywords: (row.keywords as string) ?? undefined,
        geoSummary: (row.geo_summary as string) ?? undefined,
        authorName: (row.author_name as string) ?? undefined,
        affiliateTitle: (row.affiliate_title as string) ?? undefined,
        affiliateUrl: (row.affiliate_url as string) ?? undefined,
        status: (row.status as Article["status"]) ?? "published",
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
        imageAlt: (row.image_alt as string) ?? undefined,
        priceLabel: row.price_label as string,
        description: row.description as string,
        affiliateUrl: row.affiliate_url as string,
        slug: (row.slug as string) ?? undefined,
        metaTitle: (row.meta_title as string) ?? undefined,
        metaDescription: (row.meta_description as string) ?? undefined,
        keywords: (row.keywords as string) ?? undefined,
        geoSummary: (row.geo_summary as string) ?? undefined,
        brandName: (row.brand_name as string) ?? undefined,
        sku: (row.sku as string) ?? undefined,
        status: (row.status as Product["status"]) ?? "active",
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    }
}

// ---- Articles ----

export async function fetchArticles(): Promise<Article[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToArticle)
}

export async function upsertArticle(article: Article): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("articles").upsert({
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
    })
    if (error) throw error
}

export async function removeArticle(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("articles").delete().eq("id", id)
    if (error) throw error
}

// ---- Products ----

export async function fetchProducts(): Promise<Product[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToProduct)
}

export async function upsertProduct(product: Product): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("products").upsert({
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
    })
    if (error) throw error
}

export async function removeProduct(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) throw error
}
