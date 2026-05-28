export interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  tag: string;
  shortDesc: string;
  fullDesc: string;
  img: string;
  images?: string[];
  videoUrl?: string;
  type: 'video' | 'image';
  color: string;
  bgGlow: string;
  sortOrder: number;
  hidden?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  icon?: string;
  sortOrder?: number;
}

export interface FeaturedWork {
  id: string;
  portfolioId: number;
  sortOrder: number;
}

export interface HomeContent {
  heroTitle: string;
  heroGradientTitle: string;
  heroSubtitle: string;
  heroSlides: {
    id: number;
    img: string;
    label: string;
    title: string;
  }[];
  heroImage: string;
  shareTitle: string;
  shareDescription: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  fullDesc?: string;
  sortOrder: number;
}

export interface CategoryWithDetails extends Category {
  description: string;
  coverImage: string;
  sortOrder: number;
  tag?: string;
  color?: string;
  bgGlow?: string;
  icon?: string;
}

const API_BASE = '/api';

// ================= 通用 API 工具函数 =================

// 通用 GET 请求
async function apiGet<T>(endpoint: string, errorMessage: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${endpoint}`);
  if (!res.ok) throw new Error(errorMessage);
  return res.json();
}

// 通用 POST 请求
async function apiPost<T, Body = unknown>(endpoint: string, body: Body, errorMessage: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(errorMessage);
  return res.json();
}

// 通用 PUT 请求
async function apiPut<T = void, Body = unknown>(endpoint: string, body: Body, errorMessage: string): Promise<T> {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(errorMessage);
  if (res.headers.get('content-length') !== '0' && res.headers.get('content-type')?.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

// 通用 DELETE 请求
async function apiDelete(endpoint: string, errorMessage: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${endpoint}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(errorMessage);
}

// 通用批量更新函数
async function saveItems<T extends { id: any }>(endpoint: string, items: T[]): Promise<void> {
  for (const item of items) {
    await apiPut(`${endpoint}/${item.id}`, item, `Failed to update ${endpoint} item`);
  }
}

// ================= Portfolio Items API =================

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  return apiGet<PortfolioItem[]>('portfolio-items', 'Failed to fetch portfolio items');
}

export async function getPublicPortfolioItems(): Promise<PortfolioItem[]> {
  const items = await getPortfolioItems();
  return items.filter(item => !item.hidden);
}

export async function savePortfolioItems(items: PortfolioItem[]): Promise<void> {
  return saveItems('portfolio-items', items);
}

export async function addPortfolioItem(item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
  return apiPost<PortfolioItem, typeof item>('portfolio-items', item, 'Failed to add portfolio item');
}

export async function updatePortfolioItemsSortOrder(items: PortfolioItem[]): Promise<void> {
  const sortData = items.map(item => ({ id: item.id, sortOrder: item.sortOrder }));
  return apiPut('portfolio-items/sort', sortData, 'Failed to update portfolio items sort order');
}

export async function updatePortfolioItem(item: PortfolioItem): Promise<void> {
  return apiPut(`portfolio-items/${item.id}`, item, 'Failed to update portfolio item');
}

export async function deletePortfolioItem(id: number): Promise<void> {
  return apiDelete(`portfolio-items/${id}`, 'Failed to delete portfolio item');
}

// ================= Featured Works API =================

export async function getFeaturedWorks(): Promise<FeaturedWork[]> {
  return apiGet<FeaturedWork[]>('featured-works', 'Failed to fetch featured works');
}

export async function saveFeaturedWorks(works: FeaturedWork[]): Promise<void> {
  return apiPut('featured-works/sort', works, 'Failed to update featured works');
}

export async function addFeaturedWork(portfolioId: number): Promise<FeaturedWork[]> {
  return apiPost<FeaturedWork[], { portfolioId: number }>('featured-works', { portfolioId }, 'Failed to add featured work');
}

export async function removeFeaturedWork(id: string): Promise<FeaturedWork[]> {
  const res = await fetch(`${API_BASE}/featured-works/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove featured work');
  return res.json();
}

export async function updateFeaturedWorkSortOrder(works: FeaturedWork[]): Promise<void> {
  return saveFeaturedWorks(works);
}

// ================= Home Content API =================

export async function getHomeContent(): Promise<HomeContent> {
  const data = await apiGet<any>('home-content', 'Failed to fetch home content');
  // 兼容旧数据格式
  return {
    heroTitle: data.heroTitle || '',
    heroGradientTitle: data.heroGradientTitle || '',
    heroSubtitle: data.heroSubtitle || '',
    heroSlides: data.heroSlides || [],
    heroImage: data.heroImage || '/images/hero-home.png',
    shareTitle: data.shareTitle || '大连柒子文化发展有限公司',
    shareDescription: data.shareDescription || '诚信立足 创新致远'
  };
}

export async function saveHomeContent(content: HomeContent): Promise<void> {
  return apiPut('home-content', content, 'Failed to update home content');
}

// ================= Team Members API =================

export async function getTeamMembers(): Promise<TeamMember[]> {
  return apiGet<TeamMember[]>('team-members', 'Failed to fetch team members');
}

export async function saveTeamMembers(members: TeamMember[]): Promise<void> {
  return saveItems('team-members', members);
}

export async function addTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  return apiPost<TeamMember, typeof member>('team-members', member, 'Failed to add team member');
}

export async function updateTeamMember(member: TeamMember): Promise<void> {
  return apiPut(`team-members/${member.id}`, member, 'Failed to update team member');
}

export async function deleteTeamMember(id: number): Promise<void> {
  return apiDelete(`team-members/${id}`, 'Failed to delete team member');
}

export async function updateTeamMembersSortOrder(members: TeamMember[]): Promise<void> {
  return saveTeamMembers(members);
}

// ================= Categories With Details API =================

export async function getCategoriesWithDetails(): Promise<CategoryWithDetails[]> {
  return apiGet<CategoryWithDetails[]>('categories-details', 'Failed to fetch categories details');
}

export async function saveCategoriesWithDetails(categories: CategoryWithDetails[]): Promise<void> {
  return saveItems('categories-details', categories);
}

export async function updateCategoryDetails(id: string, details: Partial<CategoryWithDetails>): Promise<void> {
  return apiPut(`categories-details/${id}`, details, 'Failed to update category details');
}

export async function addCategoryWithDetails(name: string, description: string = '', coverImage: string = '', icon: string = ''): Promise<CategoryWithDetails> {
  return apiPost<CategoryWithDetails, { name: string; description: string; coverImage: string; icon: string }>(
    'categories-details',
    { name, description, coverImage, icon },
    'Failed to add category with details'
  );
}

export async function deleteCategoryWithDetails(id: string): Promise<void> {
  return apiDelete(`categories-details/${id}`, 'Failed to delete category details');
}

export async function updateCategoriesSortOrder(categories: CategoryWithDetails[]): Promise<void> {
  const sortData = categories.map(cat => ({ id: cat.id, sortOrder: cat.sortOrder }));
  return apiPut('categories-details/sort', sortData, 'Failed to update categories sort order');
}
