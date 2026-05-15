export interface PortfolioItem {
  id: number;
  title: string;
  category: string;
  tag: string;
  shortDesc: string;
  fullDesc: string;
  img: string;
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

const PORTFOLIO_KEY = 'portfolio_items';
const CATEGORY_KEY = 'categories';
const FEATURED_KEY = 'featured_items';

export interface FeaturedWork {
  id: string;
  portfolioId: number;
  sortOrder: number;
}

const defaultCategories: Category[] = [
  { 
    id: '1', 
    name: 'AI 数字人定制',
    description: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp92O6UL9Vz2Y49V1pDeEaHSG60rc7Qo0WxFOSNdnZ73WECUQxvok_Ljw0_eu88WCkDV-V1ps4GTjXG3logkuhu09jLkfHqQYGHg_vJ-SMzQadM4e6BMeBUvEgw3PaYreuk82SU0Pnt_2khipWe-DYxJSnoAW4XnjO_zJ1nBef9ytJKr67OXcOAbe8AKYp-a0zRYLKCa7MU-6dPBgSKa0CJYiegBYWzWBjzaP3PuzL-jhC1Qx9GmekBCcE_EuCfPOtX8FQ2V6DND8',
    icon: 'User',
    sortOrder: 1
  },
  { 
    id: '2', 
    name: '电影级 AI 制作',
    description: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色。',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2oewJ15NnSn9V-GoIKkwxoY1AqBw8HA3aIRrU1pYtGc8y3NfJ8-M-8d_91Wg61pvV2YhhYcKqm8PixFHN_mu4njCl-PlSTzF5MHmTZ7yJ9-sl0HWcg-r81YTI_k6Oe9Q5R1jnOSu2-O7qRmCPFDeBqaf1AShYZgafO4NECgueKISBQ-Ame6ElhnbLFXZFwZ1hovklirx2Tu_DNHMivQzGQ1O4yB9HW3fEHychiTl2rxn7jCE4RpLCoiiOVV4FllQ55626gruZFaM',
    icon: 'Film',
    sortOrder: 2
  },
  { 
    id: '3', 
    name: '社交平台短视频 AI',
    description: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入。',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQW5T_kIPPyvA0MArzCohp-Lvna6zFt2XVq_gvZQ9jAyCvDOHGl99kNivu9epZvRpRWEXnN7TDAcQvv0NMC9QlFNvKpjyjJVILsEgBhiLoltlUxxpxSIXTNl6mpd0z5J2Xww-y-tk1nAtx3PAAR9WZ82tRv3Pv4mTUCy56Oj-EbcPF4Iy7CNrZaDQJBOBZrrJ4agMu0RAI16RW8axFEwxgMZuI8t6czAeuzsQYFKbLW0JBNus9PBl2Lvq3KzxuHRvBFWhA-q9VsOo',
    icon: 'Video',
    sortOrder: 3
  },
  { 
    id: '4', 
    name: '神经网络技术栈',
    description: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化。',
    coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9sPNFE9R6ql6lY5e9KZaO0PSDxjlAiPj22W0-bUUEdp1ZXEe1W-nUX_AXm14HSH01mDUjtaM2h3V8cGxjuy1v7NtABWUVxbcM-TvHE3RJOjFpLdBH3KeCPSF-sNZTVo-p6F2aNpcO7hVsASMZBr6exfJgyMZ2bKSzJZMQzBNXoPUJ3pY5XntB39SEtQX_CHKDEWJjQvqOLe-Ph24m71ztA8xOpu0a_pZvV4aknL7du7cSZ9V2UWqp1N4uhlmS86JZxPVYdn-ijE4',
    icon: 'Brain',
    sortOrder: 4
  }
];

const defaultPortfolioItems: PortfolioItem[] = [
  {
    id: 1,
    title: 'Neon Avatar：实时数字孪生',
    category: 'AI 数字人定制',
    tag: '实时渲染',
    shortDesc: '打造毫秒级延迟的虚拟代言人，重塑直播与交互体验。',
    fullDesc: '通过最先进的神经渲染技术，我们为品牌定制了专属的数字孪生。该系统支持实时面部捕捉与动作过滤，确保在任何直播环境下都能保持稳定、自然的视觉还原。目前已成功应用于多个头部品牌的元宇宙营销方案。',
    img: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2074&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-in-a-futuristic-setting-34533-large.mp4',
    type: 'video',
    color: 'text-secondary',
    bgGlow: 'bg-secondary/20',
    sortOrder: 1
  },
  {
    id: 2,
    title: '矩阵回响：电影视觉革命',
    category: '电影级 AI 制作',
    tag: '4K UHD',
    shortDesc: '利用 AI 赋能影视工业，实现传统流程无法企及的震撼叙事。',
    fullDesc: '该项目深度整合了 AI 预可视化与智能特效合成。通过自研的视觉引擎，我们能够在几小时内生成以往需要数周完成的复杂特效场景。全片采用 4K 解析度，展现了 AI 在高动态范围下的极致色彩表现力。',
    img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-city-with-neon-lights-and-flying-cars-34535-large.mp4',
    type: 'video',
    color: 'text-primary',
    bgGlow: 'bg-primary/20',
    sortOrder: 2
  },
  {
    id: 3,
    title: '流量密码：短视频爆发矩阵',
    category: '社交平台短视频 AI',
    tag: '内容爆发',
    shortDesc: '智能捕捉社媒热点，自动化生成高点击率的爆款短视频。',
    fullDesc: '针对 TikTok、快手、抖音等平台优化的一站式内容引擎。系统会自动分析当日热搜词条，并基于此生成匹配的视觉素材、脚本与配音。在为期一个月的测试中，该项目助力客户账号实现了 300% 的粉丝增长率。',
    img: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1974&auto=format&fit=crop',
    type: 'image',
    color: 'text-tertiary',
    bgGlow: 'bg-tertiary/20',
    sortOrder: 3
  },
  {
    id: 4,
    title: '多维张量：神经技术引擎',
    category: '神经网络技术栈',
    tag: '底层逻辑',
    shortDesc: '可视化神经网络的运行逻辑，展示 AI 底层的算力美学。',
    fullDesc: '这是一个将神经网络层级结构转化为艺术视觉的科普性项目。通过实时渲染 Transformer 架构中的注意力机制转移，我们让原本晦涩的数学逻辑通过流动的粒子与光线变得直观可感。',
    img: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2032&auto=format&fit=crop',
    type: 'image',
    color: 'text-secondary-fixed-dim',
    bgGlow: 'bg-secondary/20',
    sortOrder: 4
  }
];

export function getPortfolioItems(): PortfolioItem[] {
  const stored = localStorage.getItem(PORTFOLIO_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(defaultPortfolioItems));
  return defaultPortfolioItems;
}

export function savePortfolioItems(items: PortfolioItem[]): void {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(items));
}

export function addPortfolioItem(item: Omit<PortfolioItem, 'id'>): PortfolioItem {
  const items = getPortfolioItems();
  const newId = Math.max(...items.map(i => i.id), 0) + 1;
  const maxSortOrder = Math.max(...items.map(i => i.sortOrder || 0), 0);
  const newItem: PortfolioItem = { ...item, id: newId, sortOrder: maxSortOrder + 1 };
  items.push(newItem);
  savePortfolioItems(items);
  return newItem;
}

export function updatePortfolioItemsSortOrder(items: PortfolioItem[]): void {
  savePortfolioItems(items);
}

export function updatePortfolioItem(item: PortfolioItem): void {
  const items = getPortfolioItems();
  const index = items.findIndex(i => i.id === item.id);
  if (index !== -1) {
    items[index] = item;
    savePortfolioItems(items);
  }
}

export function deletePortfolioItem(id: number): void {
  const items = getPortfolioItems();
  const filtered = items.filter(i => i.id !== id);
  savePortfolioItems(filtered);
}

export function getCategories(): Category[] {
  const stored = localStorage.getItem(CATEGORY_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(defaultCategories));
  return defaultCategories;
}

export function saveCategories(categories: Category[]): void {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
}

export function addCategory(name: string): Category {
  const categories = getCategories();
  const newId = Math.max(...categories.map(c => parseInt(c.id)), 0) + 1 + '';
  const newCategory: Category = { id: newId, name };
  categories.push(newCategory);
  saveCategories(categories);
  return newCategory;
}

export function updateCategory(id: string, name: string): void {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index !== -1) {
    categories[index].name = name;
    saveCategories(categories);
  }
}

export function deleteCategory(id: string): void {
  const categories = getCategories();
  const filtered = categories.filter(c => c.id !== id);
  saveCategories(filtered);
}

export function getFeaturedWorks(): FeaturedWork[] {
  const stored = localStorage.getItem(FEATURED_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const defaultFeatured: FeaturedWork[] = [
    { id: 'fw1', portfolioId: 1, sortOrder: 1 },
    { id: 'fw2', portfolioId: 3, sortOrder: 2 }
  ];
  localStorage.setItem(FEATURED_KEY, JSON.stringify(defaultFeatured));
  return defaultFeatured;
}

export function saveFeaturedWorks(items: FeaturedWork[]): void {
  localStorage.setItem(FEATURED_KEY, JSON.stringify(items));
}

export function addFeaturedWork(portfolioId: number): FeaturedWork {
  const items = getFeaturedWorks();
  const newId = `fw${Date.now()}`;
  const maxOrder = Math.max(...items.map(i => i.sortOrder), 0);
  const newItem: FeaturedWork = { id: newId, portfolioId, sortOrder: maxOrder + 1 };
  items.push(newItem);
  saveFeaturedWorks(items);
  return newItem;
}

export function removeFeaturedWork(id: string): void {
  const items = getFeaturedWorks();
  const filtered = items.filter(i => i.id !== id);
  saveFeaturedWorks(filtered);
}

export function updateFeaturedWorkSortOrder(id: string, sortOrder: number): void {
  const items = getFeaturedWorks();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index].sortOrder = sortOrder;
    saveFeaturedWorks(items);
  }
}

export interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
  bio: string;
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

const HOME_CONTENT_KEY = 'home_content';
const TEAM_MEMBERS_KEY = 'team_members';
const CATEGORIES_DETAILS_KEY = 'categories_details';

const defaultHomeContent: HomeContent = {
  heroTitle: '开启未来的<br /><span className="text-gradient">视界 Matrix</span>',
  heroSubtitle: '通过 AIGC 重新定义数字影像。我们将人类的情感与神经计算相结合，打造跨越维度的奇迹。',
  heroImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVnsilofkLdu_UD0gMLpFa3FNesRCTduuMzvnsGe_-j8w0_DokWrqAjjcXqBefYFRO7iOHZGs8glunqVrLuxr28k0_pGIDT54wDOoVF0bhUNVukujHNiqIJlbtqhTm-DqbVvqONvOhaKqsEscnFkcLWfH_SMHF-59Bh6jBqGaczV0boqSCmytchNdYPthBVQ53rS_86d8YTvrnxY3bDsDUYJX7OI3eXu9nv8niQv3H8hGyz_0VTKpABpHUHv7ZDuQO-B302O_0K44'
};

const defaultTeamMembers: TeamMember[] = [
  {
    id: 1,
    name: '张伟',
    role: '首席执行官',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop',
    bio: '前谷歌AI研究员，拥有10年人工智能领域经验',
    sortOrder: 1
  },
  {
    id: 2,
    name: '李娜',
    role: '创意总监',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1934&auto=format&fit=crop',
    bio: '曾任职于顶尖设计公司，专注品牌视觉设计',
    sortOrder: 2
  },
  {
    id: 3,
    name: '王强',
    role: '技术总监',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1934&auto=format&fit=crop',
    bio: '深度学习专家，发表多篇顶会论文',
    sortOrder: 3
  },
  {
    id: 4,
    name: '陈静',
    role: '产品经理',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1887&auto=format&fit=crop',
    bio: '前字节跳动产品专家，专注用户体验',
    sortOrder: 4
  }
];

export function getHomeContent(): HomeContent {
  const stored = localStorage.getItem(HOME_CONTENT_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem(HOME_CONTENT_KEY, JSON.stringify(defaultHomeContent));
  return defaultHomeContent;
}

export function saveHomeContent(content: HomeContent): void {
  localStorage.setItem(HOME_CONTENT_KEY, JSON.stringify(content));
}

export function getTeamMembers(): TeamMember[] {
  const stored = localStorage.getItem(TEAM_MEMBERS_KEY);
  if (stored) {
    const members = JSON.parse(stored);
    return members.sort((a: TeamMember, b: TeamMember) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(defaultTeamMembers));
  return defaultTeamMembers;
}

export function saveTeamMembers(members: TeamMember[]): void {
  localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(members));
}

export function addTeamMember(member: Omit<TeamMember, 'id'>): TeamMember {
  const members = getTeamMembers();
  const newId = Math.max(...members.map(m => m.id), 0) + 1;
  const maxSortOrder = Math.max(...members.map(m => m.sortOrder || 0), 0);
  const newMember: TeamMember = { ...member, id: newId, sortOrder: maxSortOrder + 1 };
  members.push(newMember);
  saveTeamMembers(members);
  return newMember;
}

export function updateTeamMember(member: TeamMember): void {
  const members = getTeamMembers();
  const index = members.findIndex(m => m.id === member.id);
  if (index !== -1) {
    members[index] = member;
    saveTeamMembers(members);
  }
}

export function deleteTeamMember(id: number): void {
  const members = getTeamMembers();
  const filtered = members.filter(m => m.id !== id);
  saveTeamMembers(filtered);
}

export function updateTeamMembersSortOrder(members: TeamMember[]): void {
  saveTeamMembers(members);
}

export function getCategoriesWithDetails(): CategoryWithDetails[] {
  const stored = localStorage.getItem(CATEGORIES_DETAILS_KEY);
  if (stored) {
    const categories = JSON.parse(stored);
    return categories.sort((a: CategoryWithDetails, b: CategoryWithDetails) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  const defaultCategoriesWithDetails: CategoryWithDetails[] = [
    { id: '1', name: 'AI 数字人定制', description: '基于最前沿的神经网络渲染技术，打造极致逼真的数字孪生与虚拟偶像。支持毫秒级低延迟实时交互，为品牌代言与元宇宙直播提供全链路解决方案。', coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp92O6UL9Vz2Y49V1pDeEaHSG60rc7Qo0WxFOSNdnZ73WECUQxvok_Ljw0_eu88WCkDV-V1ps4GTjXG3logkuhu09jLkfHqQYGHg_vJ-SMzQadM4e6BMeBUvEgw3PaYreuk82SU0Pnt_2khipWe-DYxJSnoAW4XnjO_zJ1nBef9ytJKr67OXcOAbe8AKYp-a0zRYLKCa7MU-6dPBgSKa0CJYiegBYWzWBjzaP3PuzL-jhC1Qx9GmekBCcE_EuCfPOtX8FQ2V6DND8', tag: '数字人', color: 'text-primary', bgGlow: 'bg-primary/20', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11.79A7 7 0 1 1 8 11.79"/></svg>', sortOrder: 1 },
    { id: '2', name: '电影级 AI 制作', description: '重塑视频工业流程。利用 AI 赋能预可视化、特效合成与智能调色，将传统昂贵的影视工业水准带入全行业，实现高效、震撼的视觉叙事。', coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2oewJ15NnSn9V-GoIKkwxoY1AqBw8HA3aIRrU1pYtGc8y3NfJ8-M-8d_91Wg61pvV2YhhYcKqm8PixFHN_mu4njCl-PlSTzF5MHmTZ7yJ9-sl0HWcg-r81YTI_k6Oe9Q5R1jnOSu2-O7qRmCPFDeBqaf1AShYZgafO4NECgueKISBQ-Ame6ElhnbLFXZFwZ1hovklirx2Tu_DNHMivQzGQ1O4yB9HW3fEHychiTl2rxn7jCE4RpLCoiiOVV4FllQ55626gruZFaM', tag: '影视制作', color: 'text-secondary', bgGlow: 'bg-secondary/20', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="m9 8 3 2-3 2"/><path d="m16 12 2 3-2 3"/></svg>', sortOrder: 2 },
    { id: '3', name: '社交平台短视频 AI', description: '深度理解社交媒体流量密码。智能脚本生成、自动剪辑与爆款元素植入，助您在碎片化时代快速构建高粘性的短视频生态。', coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQW5T_kIPPyvA0MArzCohp-Lvna6zFt2XVq_gvZQ9jAyCvDOHGl99kNivu9epZvRpRWEXnN7TDAcQvv0NMC9QlFNvKpjyjJVILsEgBhiLoltlUxxpxSIXTNl6mpd0z5J2Xww-y-tk1nAtx3PAAR9WZ82tRv3Pv4mTUCy56Oj-EbcPF4Iy7CNrZaDQJBOBZrrJ4agMu0RAI16RW8axFEwxgMZuI8t6czAeuzsQYFKbLW0JBNus9PBl2Lvq3KzxuHRvBFWhA-q9VsOo', tag: '短视频', color: 'text-tertiary', bgGlow: 'bg-tertiary/20', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>', sortOrder: 3 },
    { id: '4', name: '神经网络技术栈', description: '自主研发的底层引擎。涵盖 GANs, Diffusion Models 与 Transformer 架构的深度优化，为各类复杂商业场景提供最稳健的底层算力与算法支持。', coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9sPNFE9R6ql6lY5e9KZaO0PSDxjlAiPj22W0-bUUEdp1ZXEe1W-nUX_AXm14HSH01mDUjtaM2h3V8cGxjuy1v7NtABWUVxbcM-TvHE3RJOjFpLdBH3KeCPSF-sNZTVo-p6F2aNpcO7hVsASMZBr6exfJgyMZ2bKSzJZMQzBNXoPUJ3pY5XntB39SEtQX_CHKDEWJjQvqOLe-Ph24m71ztA8xOpu0a_pZvV4aknL7du7cSZ9V2UWqp1N4uhlmS86JZxPVYdn-ijE4', tag: '技术栈', color: 'text-secondary-fixed-dim', bgGlow: 'bg-secondary/20', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="6" r="1.5"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></svg>', sortOrder: 4 }
  ];
  localStorage.setItem(CATEGORIES_DETAILS_KEY, JSON.stringify(defaultCategoriesWithDetails));
  return defaultCategoriesWithDetails;
}

export function saveCategoriesWithDetails(categories: CategoryWithDetails[]): void {
  localStorage.setItem(CATEGORIES_DETAILS_KEY, JSON.stringify(categories));
}

export function updateCategoryDetails(id: string, details: Partial<CategoryWithDetails>): void {
  const categories = getCategoriesWithDetails();
  const index = categories.findIndex(c => c.id === id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...details };
    saveCategoriesWithDetails(categories);
  }
}

export function addCategoryWithDetails(name: string, description: string = '', coverImage: string = '', icon: string = ''): CategoryWithDetails {
  const categories = getCategoriesWithDetails();
  const newId = Math.max(...categories.map(c => parseInt(c.id)), 0) + 1 + '';
  const maxSortOrder = Math.max(...categories.map(c => c.sortOrder || 0), 0);
  const newCategory: CategoryWithDetails = { id: newId, name, description, coverImage, icon, sortOrder: maxSortOrder + 1 };
  categories.push(newCategory);
  saveCategoriesWithDetails(categories);
  return newCategory;
}

export function deleteCategoryWithDetails(id: string): void {
  const categories = getCategoriesWithDetails();
  const filtered = categories.filter(c => c.id !== id);
  saveCategoriesWithDetails(filtered);
}

export function updateCategoriesSortOrder(categories: CategoryWithDetails[]): void {
  saveCategoriesWithDetails(categories);
}