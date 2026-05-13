/**
 * Strapi 5 response tipleri (basitlestirilmis).
 */

export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
  size: number;
  mime: string;
}

export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
  formats?: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  };
}

export interface Project {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  technologies?: string[] | null;
  liveUrl?: string;
  repoUrl?: string;
  featured?: boolean;
  order?: number;
  cover?: StrapiMedia | null;
  gallery?: StrapiMedia[];
  publishedAt?: string;
}

export interface Skill {
  id: number;
  documentId: string;
  name: string;
  category: "Frontend" | "Backend" | "Database" | "DevOps" | "Tooling" | "Other";
  level: number;
  order?: number;
  icon?: StrapiMedia | null;
}

export interface About {
  id: number;
  documentId: string;
  fullName: string;
  headline?: string;
  bio?: string;
  email?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  avatar?: StrapiMedia | null;
  resume?: StrapiMedia | null;
}
