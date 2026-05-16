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

export async function getPortfolioItems(): Promise<PortfolioItem[]> {
  const res = await fetch(`${API_BASE}/portfolio-items`);
  if (!res.ok) throw new Error('Failed to fetch portfolio items');
  return res.json();
}

export async function savePortfolioItems(items: PortfolioItem[]): Promise<void> {
  for (const item of items) {
    await fetch(`${API_BASE}/portfolio-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  }
}

export async function addPortfolioItem(item: Omit<PortfolioItem, 'id'>): Promise<PortfolioItem> {
  const res = await fetch(`${API_BASE}/portfolio-items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to add portfolio item');
  return res.json();
}

export async function updatePortfolioItemsSortOrder(items: PortfolioItem[]): Promise<void> {
  await savePortfolioItems(items);
}

export async function updatePortfolioItem(item: PortfolioItem): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio-items/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  if (!res.ok) throw new Error('Failed to update portfolio item');
}

export async function deletePortfolioItem(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/portfolio-items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete portfolio item');
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function saveCategories(categories: Category[]): Promise<void> {
  for (const cat of categories) {
    await fetch(`${API_BASE}/categories/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
  }
}

export async function addCategory(name: string): Promise<Category> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to add category');
  return res.json();
}

export async function updateCategory(id: string, name: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to update category');
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
}

export async function getFeaturedWorks(): Promise<FeaturedWork[]> {
  const res = await fetch(`${API_BASE}/featured-works`);
  if (!res.ok) throw new Error('Failed to fetch featured works');
  return res.json();
}

export async function saveFeaturedWorks(works: FeaturedWork[]): Promise<void> {
  const res = await fetch(`${API_BASE}/featured-works/sort`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(works)
  });
  if (!res.ok) throw new Error('Failed to update featured works');
}

export async function addFeaturedWork(portfolioId: number): Promise<FeaturedWork[]> {
  const res = await fetch(`${API_BASE}/featured-works`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolioId })
  });
  if (!res.ok) throw new Error('Failed to add featured work');
  return res.json();
}

export async function removeFeaturedWork(id: string): Promise<FeaturedWork[]> {
  const res = await fetch(`${API_BASE}/featured-works/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove featured work');
  return res.json();
}

export async function updateFeaturedWorkSortOrder(works: FeaturedWork[]): Promise<void> {
  await saveFeaturedWorks(works);
}

export async function getHomeContent(): Promise<HomeContent> {
  const res = await fetch(`${API_BASE}/home-content`);
  if (!res.ok) throw new Error('Failed to fetch home content');
  const data = await res.json();
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
  const res = await fetch(`${API_BASE}/home-content`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content)
  });
  if (!res.ok) throw new Error('Failed to update home content');
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${API_BASE}/team-members`);
  if (!res.ok) throw new Error('Failed to fetch team members');
  return res.json();
}

export async function saveTeamMembers(members: TeamMember[]): Promise<void> {
  for (const member of members) {
    await fetch(`${API_BASE}/team-members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
  }
}

export async function addTeamMember(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
  const res = await fetch(`${API_BASE}/team-members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  });
  if (!res.ok) throw new Error('Failed to add team member');
  return res.json();
}

export async function updateTeamMember(member: TeamMember): Promise<void> {
  const res = await fetch(`${API_BASE}/team-members/${member.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  });
  if (!res.ok) throw new Error('Failed to update team member');
}

export async function deleteTeamMember(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/team-members/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete team member');
}

export async function updateTeamMembersSortOrder(members: TeamMember[]): Promise<void> {
  await saveTeamMembers(members);
}

export async function getCategoriesWithDetails(): Promise<CategoryWithDetails[]> {
  const res = await fetch(`${API_BASE}/categories-details`);
  if (!res.ok) throw new Error('Failed to fetch categories details');
  return res.json();
}

export async function saveCategoriesWithDetails(categories: CategoryWithDetails[]): Promise<void> {
  for (const cat of categories) {
    await fetch(`${API_BASE}/categories-details/${cat.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
  }
}

export async function updateCategoryDetails(id: string, details: Partial<CategoryWithDetails>): Promise<void> {
  const res = await fetch(`${API_BASE}/categories-details/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(details)
  });
  if (!res.ok) throw new Error('Failed to update category details');
}

export async function addCategoryWithDetails(name: string, description: string = '', coverImage: string = '', icon: string = ''): Promise<CategoryWithDetails> {
  const res = await fetch(`${API_BASE}/categories-details`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, coverImage, icon })
  });
  if (!res.ok) throw new Error('Failed to add category with details');
  return res.json();
}

export async function deleteCategoryWithDetails(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories-details/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category details');
}

export async function updateCategoriesSortOrder(categories: CategoryWithDetails[]): Promise<void> {
  await saveCategoriesWithDetails(categories);
}
