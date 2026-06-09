/**
 * 60+ 种预设线条风格 SVG 图标
 * 按类别分组，便于智能匹配和扩展
 * 所有图标遵循统一设计规范：
 * - 尺寸: 24x24
 * - 风格: 线条 (stroke) 而非填充 (fill)
 * - 颜色: currentColor (跟随父元素颜色)
 * - 线宽: stroke-width="2"
 * - 圆角: stroke-linecap="round", stroke-linejoin="round"
 */

export interface IconPreset {
  name: string;        // 中文名称
  keywords: string[];  // 匹配关键词（中文+英文）
  svg: string;         // SVG 内容
  category: string;    // 所属类别
}

/**
 * 线条风格 SVG 图标库
 * 基于 Feather Icons / Lucide Icons 等开源项目的设计风格
 */
export const iconPresets: IconPreset[] = [
  // ==================== 1. 核心业务类 ====================
  {
    name: '数字人',
    keywords: ['数字人', 'ai数字人', '虚拟人', 'avatar', '数字主播', '虚拟偶像'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z'></path>
      <circle cx='7' cy='13' r='1'></circle>
      <circle cx='17' cy='13' r='1'></circle>
    </svg>`
  },
  {
    name: '电影/影视',
    keywords: ['电影', '影视', '院线', 'cinema', 'movie', 'film'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='5 3 19 12 5 21 5 3'></polygon>
    </svg>`
  },
  {
    name: '视频制作',
    keywords: ['视频', '短片', 'video', 'video production', '视频制作'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='2' y='2' width='20' height='20' rx='2.18' ry='2.18'></rect>
      <line x1='7' y1='2' x2='7' y2='22'></line>
      <line x1='17' y1='2' x2='17' y2='22'></line>
      <line x1='2' y1='12' x2='22' y2='12'></line>
      <line x1='2' y1='7' x2='7' y2='7'></line>
      <line x1='2' y1='17' x2='7' y2='17'></line>
      <line x1='17' y1='17' x2='22' y2='17'></line>
      <line x1='17' y1='7' x2='22' y2='7'></line>
    </svg>`
  },
  {
    name: '短视频',
    keywords: ['短视频', '短视', 'short video', 'tiktok', '抖音', '竖屏'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='5' y='2' width='14' height='20' rx='2' ry='2'></rect>
      <path d='M12 18h.01'></path>
      <line x1='7' y1='6' x2='17' y2='6'></line>
    </svg>`
  },
  {
    name: '宣传片',
    keywords: ['宣传片', '推广', '宣传', '品牌宣传片', 'promotional', 'corporate video'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M3 11l18-5v12L3 14v-3z'></path>
      <path d='M11.6 16.8a3 3 0 1 1-5.8-1.6'></path>
    </svg>`
  },
  {
    name: '课程实录',
    keywords: ['课程', '微课', '课程实录', '在线课程', 'course', 'lecture', '网课', '教育视频'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'></path>
      <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'></path>
    </svg>`
  },
  {
    name: '活动视频',
    keywords: ['活动', '活动视频', 'event', '演出', '庆典', '年会', '晚会'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M9 18V5l12-2v13'></path>
      <circle cx='6' cy='18' r='3'></circle>
      <circle cx='18' cy='16' r='3'></circle>
    </svg>`
  },
  {
    name: '技术/网络',
    keywords: ['技术', '科技', '网络', '智能', 'tech', 'technology', 'code', '程序', '软件', '神经网络', 'ai', '人工智能'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='10'></circle>
      <circle cx='12' cy='12' r='6'></circle>
      <circle cx='12' cy='12' r='2'></circle>
    </svg>`
  },
  {
    name: '航拍',
    keywords: ['航拍', '无人机', 'aerial', 'drone', '空中拍摄'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='5' cy='5' r='2'></circle>
      <circle cx='19' cy='5' r='2'></circle>
      <circle cx='5' cy='19' r='2'></circle>
      <circle cx='19' cy='19' r='2'></circle>
      <line x1='5' y1='5' x2='19' y2='19'></line>
      <line x1='19' y1='5' x2='5' y2='19'></line>
      <rect x='10' y='10' width='4' height='4' rx='1'></rect>
    </svg>`
  },
  {
    name: '动画/MG',
    keywords: ['动画', '动漫', 'animation', 'cartoon', '二维动画', '三维动画', 'mg', 'motion graphic', '3d'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='3' width='18' height='18' rx='2'></rect>
      <circle cx='8' cy='9' r='1'></circle>
      <circle cx='16' cy='9' r='1'></circle>
      <path d='M8 15h8c0 2-2 3-4 3s-4-1-4-3z'></path>
    </svg>`
  },
  {
    name: '课程实录/线上课堂',
    keywords: ['课程实录', '课堂录制', '在线课程', '课堂实录', '线上课堂', '微课', '网课'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'></path>
      <path d='M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'></path>
      <line x1='6' y1='8' x2='6' y2='10'></line>
      <line x1='10' y1='8' x2='10' y2='10'></line>
      <line x1='14' y1='8' x2='14' y2='10'></line>
      <line x1='18' y1='8' x2='18' y2='10'></line>
    </svg>`
  },
  {
    name: '专题片',
    keywords: ['专题片', '专题', '专题视频', '专题报道'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='2' y='3' width='20' height='18' rx='2'></rect>
      <line x1='7' y1='8' x2='17' y2='8'></line>
      <line x1='7' y1='12' x2='17' y2='12'></line>
      <line x1='7' y1='16' x2='13' y2='16'></line>
    </svg>`
  },
  {
    name: '宣传片3D',
    keywords: ['宣传片3d', '三维宣传片', '3d展示', '3d产品'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 2L2 7l10 5 10-5-10-5z'></path>
      <path d='M2 17l10 5 10-5'></path>
      <path d='M2 12l10 5 10-5'></path>
    </svg>`
  },
  {
    name: '活动庆典',
    keywords: ['活动', '庆典', '开业', '周年庆', '庆典活动'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'></path>
      <circle cx='12' cy='12' r='2'></circle>
    </svg>`
  },
  {
    name: '短视频内容',
    keywords: ['短视频内容', '竖屏视频', '短内容', '短视'],
    category: '核心业务',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='5' y='2' width='14' height='20' rx='2' ry='2'></rect>
      <circle cx='12' cy='12' r='3'></circle>
    </svg>`
  },

  // ==================== 2. 制作流程类 ====================
  {
    name: '摄影',
    keywords: ['摄影', 'photography', '摄像', '摄影摄像', '拍摄'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'></path>
      <circle cx='12' cy='13' r='4'></circle>
    </svg>`
  },
  {
    name: '剪辑',
    keywords: ['剪辑', '后期剪辑', 'edit', 'editing', '后期'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='6' cy='6' r='3'></circle>
      <circle cx='18' cy='18' r='3'></circle>
      <line x1='8.12' y1='8.12' x2='19.88' y2='19.88'></line>
      <line x1='4.12' y1='4.12' x2='15.88' y2='15.88'></line>
    </svg>`
  },
  {
    name: '特效',
    keywords: ['特效', '后期', '特效制作', 'vfx', 'special effect', '视觉特效'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2'></polygon>
    </svg>`
  },
  {
    name: '调色',
    keywords: ['调色', 'color', 'color grading', '校色', '色彩'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='13.5' cy='6.5' r='.8'></circle>
      <circle cx='17.5' cy='10.5' r='.8'></circle>
      <circle cx='8.5' cy='7.5' r='.8'></circle>
      <circle cx='6.5' cy='12.5' r='.8'></circle>
      <path d='M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1 0-1 .8-1.7 1.7-1.7h1.9c3 0 5.5-2.5 5.5-5.5C21.9 6 17.5 2 12 2z'></path>
    </svg>`
  },
  {
    name: '字幕',
    keywords: ['字幕', 'subtitle', 'caption', '翻译', '文字'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='2' y='5' width='20' height='14' rx='2'></rect>
      <line x1='6' y1='10' x2='10' y2='10'></line>
      <line x1='12' y1='10' x2='18' y2='10'></line>
      <line x1='6' y1='14' x2='14' y2='14'></line>
      <line x1='16' y1='14' x2='18' y2='14'></line>
    </svg>`
  },
  {
    name: '灯光/照明',
    keywords: ['灯光', '照明', 'lighting', '灯光师', '打光'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M9 18h6'></path>
      <line x1='10' y1='22' x2='14' y2='22'></line>
      <path d='M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z'></path>
    </svg>`
  },
  {
    name: '配音/音频',
    keywords: ['声音', '配音', '音频', 'sound', '配音演员', 'audio', '音乐'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='11 5 6 9 2 9 2 15 6 15 11 19 11 5'></polygon>
      <path d='M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07'></path>
    </svg>`
  },
  {
    name: '脚本/策划',
    keywords: ['脚本', '策划', 'script', '文案', '剧本'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'></path>
      <polyline points='14 2 14 8 20 8'></polyline>
      <line x1='9' y1='13' x2='15' y2='13'></line>
      <line x1='9' y1='17' x2='15' y2='17'></line>
    </svg>`
  },
  {
    name: '分镜脚本',
    keywords: ['分镜', '分镜头', 'storyboard', '镜头脚本'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='2' y='4' width='8' height='6' rx='1'></rect>
      <rect x='14' y='4' width='8' height='6' rx='1'></rect>
      <rect x='2' y='14' width='8' height='6' rx='1'></rect>
      <rect x='14' y='14' width='8' height='6' rx='1'></rect>
    </svg>`
  },
  {
    name: '故事板',
    keywords: ['故事板', 'story board', '故事版'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='3' width='18' height='18' rx='2'></rect>
      <line x1='3' y1='9' x2='21' y2='9'></line>
      <line x1='3' y1='15' x2='21' y2='15'></line>
      <line x1='9' y1='3' x2='9' y2='21'></line>
      <line x1='15' y1='3' x2='15' y2='21'></line>
    </svg>`
  },
  {
    name: '后期合成',
    keywords: ['合成', '后期合成', 'compositing', '视觉合成'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='3' width='8' height='8' rx='1'></rect>
      <rect x='13' y='3' width='8' height='8' rx='1'></rect>
      <rect x='8' y='13' width='8' height='8' rx='1'></rect>
    </svg>`
  },
  {
    name: '绿幕抠像',
    keywords: ['绿幕', '抠像', 'chroma key', '抠图', '蓝幕'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='3' width='18' height='18' rx='2'></rect>
      <circle cx='8' cy='10' r='3'></circle>
      <path d='M14 7v10'></path>
      <path d='M17 7v10'></path>
      <path d='M14 7l3 10'></path>
    </svg>`
  },
  {
    name: '降噪处理',
    keywords: ['降噪', 'denoise', '视频降噪', '去噪'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='9'></circle>
      <path d='M8 12c0-2 2-4 4-4s4 2 4 4-2 4-4 4'></path>
      <line x1='4' y1='4' x2='20' y2='20'></line>
    </svg>`
  },
  {
    name: '防抖稳定',
    keywords: ['防抖', '稳定', 'stabilization', '视频稳定'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='9'></circle>
      <path d='M12 3c0 6 0 12 0 18'></path>
      <path d='M3 12c6 0 12 0 18 0'></path>
    </svg>`
  },
  {
    name: '视频渲染',
    keywords: ['渲染', 'render', '视频渲染', '导出渲染'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='9'></circle>
      <path d='M12 12l6-4'></path>
      <path d='M12 12v8'></path>
      <path d='M12 12l-6 4'></path>
      <path d='M12 12l-6-4'></path>
    </svg>`
  },
  {
    name: '视频包装',
    keywords: ['包装', '视频包装', 'video packaging', '片头', '片尾'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='4' width='18' height='16' rx='2'></rect>
      <line x1='3' y1='10' x2='21' y2='10'></line>
      <path d='M12 4v6'></path>
      <circle cx='12' cy='15' r='2'></circle>
    </svg>`
  },
  {
    name: '场记板',
    keywords: ['场记', '场记板', 'clapperboard', '电影场记'],
    category: '制作流程',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M6 3h12l2 4H4l2-4z'></path>
      <rect x='3' y='7' width='18' height='14' rx='1'></rect>
      <line x1='8' y1='3' x2='12' y2='7'></line>
      <line x1='12' y1='3' x2='16' y2='7'></line>
    </svg>`
  },

  // ==================== 3. 内容类型类 ====================
  {
    name: '纪录片/专题片',
    keywords: ['纪录片', '专题片', 'documentary', '记录'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M4 19.5A2.5 2.5 0 0 1 6.5 17H20'></path>
      <path d='M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'></path>
    </svg>`
  },
  {
    name: '广告片',
    keywords: ['广告片', '广告', 'commercial', 'ad', '广告投放'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M3 11l18-5v12L3 14v-3z'></path>
      <path d='M11.6 16.8a3 3 0 1 1-5.8-1.6'></path>
    </svg>`
  },
  {
    name: 'MV/音乐电视',
    keywords: ['mv', 'mtv', '音乐电视', '音乐视频'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M9 18V5l12-2v13'></path>
      <circle cx='6' cy='18' r='3'></circle>
      <circle cx='18' cy='16' r='3'></circle>
      <path d='M9 14c1.5 0 3-.5 3-2s-1.5-2-3-2'></path>
    </svg>`
  },
  {
    name: 'Vlog/生活记录',
    keywords: ['vlog', '生活记录', 'video blog', '日常'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='23 7 16 12 23 17 23 7'></polygon>
      <rect x='1' y='5' width='15' height='14' rx='2' ry='2'></rect>
      <circle cx='6' cy='10' r='1.5'></circle>
    </svg>`
  },
  {
    name: '直播/流媒体',
    keywords: ['直播', 'live', '在线直播', 'streaming', 'live streaming'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='3'></circle>
      <path d='M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14'></path>
      <circle cx='12' cy='12' r='10'></circle>
    </svg>`
  },
  {
    name: '综艺/真人秀',
    keywords: ['综艺', '真人秀', 'variety', '综艺节目'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'></polygon>
    </svg>`
  },
  {
    name: '教学/培训',
    keywords: ['教学', '课堂', '培训', '教学视频', '教室', 'class'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M22 10v6M2 10l10-5 10 5-10 5z'></path>
      <path d='M6 12v5c3 3 9 3 12 0v-5'></path>
    </svg>`
  },
  {
    name: '带货直播',
    keywords: ['带货', '直播带货', '主播', '电商直播', '卖货'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='8' r='4'></circle>
      <path d='M5 22v-4a7 7 0 0 1 14 0v4'></path>
      <circle cx='18' cy='5' r='2'></circle>
      <path d='M20 7l2 2'></path>
    </svg>`
  },
  {
    name: '种草视频',
    keywords: ['种草', '推荐', '好物推荐', 'product recommendation'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 2l3 7h7l-5.5 4.5L19 21l-7-4.5L5 21l2.5-7.5L2 9h7z'></path>
    </svg>`
  },
  {
    name: '探店测评',
    keywords: ['探店', '测评', '店铺测评', '美食探店', '评测'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M3 9l1-5h16l1 5'></path>
      <path d='M3 9v11h18V9'></path>
      <path d='M3 9h18'></path>
      <circle cx='9' cy='14' r='1.5'></circle>
      <circle cx='15' cy='14' r='1.5'></circle>
      <path d='M9 18h6'></path>
    </svg>`
  },
  {
    name: '开箱视频',
    keywords: ['开箱', 'unboxing', '拆箱', '开箱测评'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M3 8l9-5 9 5v11H3z'></path>
      <path d='M3 8l9 5 9-5'></path>
      <path d='M12 13v10'></path>
    </svg>`
  },
  {
    name: '美食探店',
    keywords: ['美食探店', '美食', '餐厅推荐', '吃播', 'food'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M8 2v13'></path>
      <path d='M8 2c-2 0-4 2-4 5s2 5 4 5'></path>
      <path d='M8 2c2 0 4 2 4 5s-2 5-4 5'></path>
      <path d='M16 2v20'></path>
      <path d='M12 22h8'></path>
    </svg>`
  },
  {
    name: '健身教程',
    keywords: ['健身', '健身教程', 'fitness', '运动教程', '塑形'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M6 4v16'></path>
      <path d='M18 4v16'></path>
      <path d='M3 9v6'></path>
      <path d='M21 9v6'></path>
      <path d='M6 12h12'></path>
    </svg>`
  },
  {
    name: '美妆教程',
    keywords: ['美妆', '美妆教程', 'makeup', '化妆', '美容'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='9'></circle>
      <circle cx='9' cy='10' r='1'></circle>
      <circle cx='15' cy='10' r='1'></circle>
      <path d='M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5'></path>
      <path d='M7 6l2-1'></path>
      <path d='M15 5l2 1'></path>
    </svg>`
  },
  {
    name: '穿搭分享',
    keywords: ['穿搭', '搭配', '服装搭配', '穿搭分享', 'outfit'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 2l4 4-2 2v14h-4V8L8 6z'></path>
      <circle cx='12' cy='4' r='1'></circle>
    </svg>`
  },
  {
    name: '科普动画',
    keywords: ['科普', '科普动画', '知识科普', 'science animation'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='3'></circle>
      <ellipse cx='12' cy='12' rx='10' ry='4'></ellipse>
      <ellipse cx='12' cy='12' rx='4' ry='10'></ellipse>
    </svg>`
  },
  {
    name: '儿童动画',
    keywords: ['儿童', '儿童动画', '幼教', '少儿节目', 'kids animation'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='10' r='6'></circle>
      <circle cx='10' cy='9' r='1'></circle>
      <circle cx='14' cy='9' r='1'></circle>
      <path d='M9 13c1 1 2 1.5 3 1.5s2-.5 3-1.5'></path>
      <path d='M5 22v-2a7 7 0 0 1 14 0v2'></path>
    </svg>`
  },
  {
    name: '纪录片',
    keywords: ['纪录片', '纪录', 'documentary', '真实记录'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='4' width='18' height='16' rx='2'></rect>
      <line x1='3' y1='8' x2='21' y2='8'></line>
      <circle cx='7' cy='14' r='1'></circle>
      <line x1='10' y1='14' x2='21' y2='14'></line>
      <line x1='10' y1='17' x2='17' y2='17'></line>
    </svg>`
  },
  {
    name: 'MV音乐视频',
    keywords: ['mv', '音乐视频', '音乐电视', 'music video'],
    category: '内容类型',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M9 18V6l10-2v12'></path>
      <circle cx='7' cy='18' r='2'></circle>
      <circle cx='17' cy='16' r='2'></circle>
    </svg>`
  },

  // ==================== 4. 企业/商业类 ====================
  {
    name: '企业',
    keywords: ['企业', '公司', '企业宣传片', 'corporate', 'enterprise', 'business'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M3 21h18'></path>
      <path d='M5 21V7l8-4v18'></path>
      <path d='M19 21V11l-6-4'></path>
      <line x1='9' y1='9' x2='9' y2='9'></line>
      <line x1='9' y1='12' x2='9' y2='12'></line>
      <line x1='9' y1='15' x2='9' y2='15'></line>
      <line x1='9' y1='18' x2='9' y2='18'></line>
    </svg>`
  },
  {
    name: '产品/商品',
    keywords: ['产品', '产品介绍', 'product', '产品视频', '商品', '电商产品'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'></path>
      <polyline points='3.27 6.96 12 12.01 20.73 6.96'></polyline>
      <line x1='12' y1='22.08' x2='12' y2='12'></line>
    </svg>`
  },
  {
    name: '品牌形象',
    keywords: ['品牌', '品牌片', 'brand', '品牌形象', 'branding'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='10'></circle>
      <path d='M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20'></path>
    </svg>`
  },
  {
    name: '招商/加盟',
    keywords: ['招商', '加盟', '投资', '招商片', '商业机会'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <line x1='12' y1='1' x2='12' y2='23'></line>
      <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path>
    </svg>`
  },
  {
    name: '金融/财经',
    keywords: ['金融', 'finance', '财经', '基金', '理财', '银行'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <line x1='12' y1='1' x2='12' y2='23'></line>
      <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path>
      <circle cx='12' cy='12' r='1.5'></circle>
    </svg>`
  },
  {
    name: '发布会',
    keywords: ['发布会', '新品发布', 'launch', '产品发布', '新品上市'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M4.93 4.93l14.14 14.14M12 3l9 9-9 9-9-9 9-9z'></path>
    </svg>`
  },
  {
    name: '电商/购物',
    keywords: ['电商', 'e-commerce', '淘宝', '京东', '购物', 'product video', '电商视频'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='9' cy='21' r='1'></circle>
      <circle cx='20' cy='21' r='1'></circle>
      <path d='M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'></path>
    </svg>`
  },
  {
    name: '企业文化',
    keywords: ['企业文化', '公司文化', 'company culture', '团队文化'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='9' cy='8' r='4'></circle>
      <circle cx='18' cy='10' r='3'></circle>
      <path d='M10 22v-4c0-2-2-4-4-4H2v8h8z'></path>
      <path d='M18 22v-4c0-2-1.5-3-3-3'></path>
    </svg>`
  },
  {
    name: '企业培训',
    keywords: ['企业培训', '员工培训', 'training', '培训视频'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M22 10v6M2 10l10-5 10 5-10 5z'></path>
      <path d='M6 12v5c3 3 9 3 12 0v-5'></path>
    </svg>`
  },
  {
    name: '招聘片',
    keywords: ['招聘', 'recruitment', '招聘视频', '招聘宣传片'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='7' width='18' height='14' rx='2'></rect>
      <path d='M8 7V4a4 4 0 0 1 8 0v3'></path>
      <line x1='8' y1='12' x2='16' y2='12'></line>
      <line x1='8' y1='16' x2='13' y2='16'></line>
    </svg>`
  },
  {
    name: '总裁寄语',
    keywords: ['总裁', 'ceo', '董事长', '领导寄语'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='7' r='4'></circle>
      <path d='M4 22v-2a8 8 0 0 1 16 0v2'></path>
      <path d='M9 3c-1 0-2 1-2 2'></path>
      <path d='M15 3c1 0 2 1 2 2'></path>
    </svg>`
  },
  {
    name: '招商加盟',
    keywords: ['招商', '加盟', '招商加盟', '招商片'],
    category: '企业/商业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 2v20'></path>
      <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path>
    </svg>`
  },

  // ==================== 5. 生活/时尚类 ====================
  {
    name: '生活/日常',
    keywords: ['生活', 'life', '日常', 'lifestyle'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'></path>
    </svg>`
  },
  {
    name: '时尚/穿搭',
    keywords: ['时尚', 'fashion', '潮流', '穿搭', '服装', 'clothing'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l1.92 13.46a2 2 0 0 0 2 1.74h11.56a2 2 0 0 0 2-1.74l1.92-13.46a2 2 0 0 0-1.34-2.23z'></path>
    </svg>`
  },
  {
    name: '美食',
    keywords: ['美食', '食品', 'food', '餐饮', '烹饪', '美食视频'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M18 8h1a4 4 0 0 1 0 8h-1'></path>
      <path d='M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z'></path>
      <line x1='6' y1='1' x2='6' y2='4'></line>
      <line x1='10' y1='1' x2='10' y2='4'></line>
      <line x1='14' y1='1' x2='14' y2='4'></line>
    </svg>`
  },
  {
    name: '旅行/风景',
    keywords: ['旅行', '旅游', 'travel', '风景', '旅行视频', '旅拍'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='10'></circle>
      <path d='M2 12h20'></path>
      <path d='M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z'></path>
    </svg>`
  },
  {
    name: '运动/体育',
    keywords: ['体育', '运动', 'sport', '健身', 'fitness', '运动视频'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='10'></circle>
      <circle cx='12' cy='12' r='1'></circle>
      <line x1='2.05' y1='10.94' x2='21.95' y2='13.06'></line>
      <line x1='10.94' y1='2.05' x2='13.06' y2='21.95'></line>
    </svg>`
  },
  {
    name: '宠物/动物',
    keywords: ['宠物', 'animal', 'pet', '萌宠', '动物'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 5a3 3 0 0 1 3 3c0 1.5-.5 2.5-1 3 1 1.5 2 2.5 2 4a3 3 0 0 1-6 0c0-1.5 1-2.5 2-4-.5-.5-1-1.5-1-3a3 3 0 0 1 3-3z'></path>
      <circle cx='11' cy='10' r='.5' fill='currentColor'></circle>
      <circle cx='13' cy='10' r='.5' fill='currentColor'></circle>
    </svg>`
  },
  {
    name: '儿童/亲子',
    keywords: ['儿童', '亲子', 'children', 'kids', '动画', '亲子教育'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='8' r='4'></circle>
      <path d='M4 22a8 8 0 0 1 16 0'></path>
    </svg>`
  },
  {
    name: '健康/养生',
    keywords: ['健康', '养生', 'health', '医疗', '医药', 'wellness'],
    category: '生活/时尚',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'></path>
      <path d='M12 8v8M8 12h8'></path>
    </svg>`
  },

  // ==================== 6. 创意/科技类 ====================
  {
    name: '创意/创新',
    keywords: ['创意', '创意视频', 'creative', 'idea', '创新'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M9 18h6'></path>
      <line x1='10' y1='22' x2='14' y2='22'></line>
      <path d='M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z'></path>
      <line x1='10' y1='12' x2='14' y2='12'></line>
    </svg>`
  },
  {
    name: '科技/未来',
    keywords: ['科技', 'technology', '未来', 'future', '科幻', 'sci-fi'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='4' y='4' width='16' height='16' rx='2'></rect>
      <rect x='9' y='9' width='6' height='6'></rect>
      <line x1='9' y1='1' x2='9' y2='4'></line>
      <line x1='15' y1='1' x2='15' y2='4'></line>
      <line x1='9' y1='20' x2='9' y2='23'></line>
      <line x1='15' y1='20' x2='15' y2='23'></line>
      <line x1='20' y1='9' x2='23' y2='9'></line>
      <line x1='20' y1='14' x2='23' y2='14'></line>
      <line x1='1' y1='9' x2='4' y2='9'></line>
      <line x1='1' y1='14' x2='4' y2='14'></line>
    </svg>`
  },
  {
    name: '科普/知识',
    keywords: ['科普', '科学', 'science', '科教', '知识', 'knowledge'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M10 2v7.31'></path>
      <path d='M14 9.3V1.99'></path>
      <path d='M8.5 2h7'></path>
      <path d='M14 9.3a6.5 6.5 0 1 1-4 0'></path>
      <path d='M5.52 16h12.96'></path>
    </svg>`
  },
  {
    name: '游戏/娱乐',
    keywords: ['游戏', 'game', 'gaming', '娱乐', 'gameplay'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <line x1='6' y1='12' x2='10' y2='12'></line>
      <line x1='8' y1='10' x2='8' y2='14'></line>
      <circle cx='15' cy='11' r='1'></circle>
      <circle cx='17.5' cy='13.5' r='1'></circle>
      <path d='M18 22a6 6 0 0 1-12 0H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3z'></path>
    </svg>`
  },
  {
    name: '延时摄影',
    keywords: ['延时', 'timelapse', '延时摄影', '时间流逝'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='9'></circle>
      <path d='M12 7v5l3 2'></path>
      <circle cx='12' cy='12' r='1'></circle>
    </svg>`
  },
  {
    name: '高速摄像',
    keywords: ['高速', '高速摄像', 'slow motion', '慢动作'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M13 2L3 14h8l-1 8 10-12h-8l1-8z'></path>
    </svg>`
  },
  {
    name: '微距摄影',
    keywords: ['微距', 'macro', '微距摄影', '微观'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='11' cy='11' r='7'></circle>
      <path d='M20 20l-4-4'></path>
      <circle cx='11' cy='11' r='3'></circle>
    </svg>`
  },
  {
    name: 'VR全景',
    keywords: ['vr', '虚拟现实', '全景', '360全景', '全景视频'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <circle cx='12' cy='12' r='10'></circle>
      <path d='M2 12c2 0 4 2 4 4s2 2 4 2 4-2 4-2 2-2 4-2 4 2 4 2'></path>
      <path d='M2 12c2 0 4-2 4-4s2-2 4-2 4 2 4 2 2 2 4 2 4-2 4-2'></path>
      <circle cx='8' cy='12' r='2'></circle>
      <circle cx='16' cy='12' r='2'></circle>
    </svg>`
  },
  {
    name: '全息投影',
    keywords: ['全息', 'hologram', '全息投影', '3d投影'],
    category: '创意/科技',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 2L2 20h20L12 2z'></path>
      <path d='M8 15c1 1 3 1 4 0s3 1 4 0'></path>
      <circle cx='12' cy='12' r='1'></circle>
    </svg>`
  },

  // ==================== 7. 行业/垂直类 ====================
  {
    name: '汽车',
    keywords: ['汽车', '汽车视频', 'car', 'auto', 'vehicle', 'automotive'],
    category: '垂直行业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M14 16H9m10 0h3v-3.15L19.6 6H4.4L3 12.85V16h3'></path>
      <circle cx='7' cy='16' r='2'></circle>
      <circle cx='17' cy='16' r='2'></circle>
    </svg>`
  },
  {
    name: '房产/地产',
    keywords: ['房产', '房地产', '楼盘', 'house', 'real estate', '建筑'],
    category: '垂直行业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'></path>
      <polyline points='9 22 9 12 15 12 15 22'></polyline>
    </svg>`
  },
  {
    name: '媒体/传媒',
    keywords: ['媒体', 'media', '传媒', '自媒体', '新媒体', '公众号'],
    category: '垂直行业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'></path>
    </svg>`
  },
  {
    name: '政务/公益',
    keywords: ['政务', '政府', 'government', '公益', '公共服务'],
    category: '垂直行业',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M3 21h18'></path>
      <path d='M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3'></path>
    </svg>`
  },

  // ==================== 8. 媒体/元素类 ====================
  {
    name: '图片/图像',
    keywords: ['图片', 'photo', 'image', '照片', '图片素材', '图像'],
    category: '媒体/元素',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='3' y='3' width='18' height='18' rx='2' ry='2'></rect>
      <circle cx='8.5' cy='8.5' r='1.5'></circle>
      <polyline points='21 15 16 10 5 21'></polyline>
    </svg>`
  },
  {
    name: '音乐/音频',
    keywords: ['音乐', 'music', '音频', 'audio', '配乐'],
    category: '媒体/元素',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M9 18V5l12-2v13'></path>
      <circle cx='6' cy='18' r='3'></circle>
      <circle cx='18' cy='16' r='3'></circle>
    </svg>`
  },
  {
    name: '社交/社区',
    keywords: ['社交', '朋友', 'social', 'friends', '社区', '社群'],
    category: '媒体/元素',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'></path>
      <circle cx='9' cy='7' r='4'></circle>
      <path d='M23 21v-2a4 4 0 0 0-3-3.87'></path>
      <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
    </svg>`
  },

  // ==================== 9. 展示/播放类 ====================
  {
    name: '播放/视频',
    keywords: ['播放', 'play', '播放按钮', 'video play'],
    category: '展示/播放',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='5 3 19 12 5 21 5 3'></polygon>
    </svg>`
  },
  {
    name: '电视/屏幕',
    keywords: ['电视', 'tv', '屏幕', 'screen', 'display'],
    category: '展示/播放',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <rect x='2' y='3' width='20' height='14' rx='2' ry='2'></rect>
      <line x1='8' y1='21' x2='16' y2='21'></line>
      <line x1='12' y1='17' x2='12' y2='21'></line>
    </svg>`
  },
  {
    name: '演播室/舞台',
    keywords: ['演播室', '舞台', 'studio', 'stage', '直播间'],
    category: '展示/播放',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z'></path>
      <rect x='4' y='17' width='16' height='4' rx='1'></rect>
      <line x1='8' y1='22' x2='8' y2='22'></line>
      <line x1='16' y1='22' x2='16' y2='22'></line>
    </svg>`
  },
  {
    name: '麦克风',
    keywords: ['麦克风', '话筒', 'microphone', '录音', '主播'],
    category: '展示/播放',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z'></path>
      <path d='M19 10v2a7 7 0 0 1-14 0v-2'></path>
      <line x1='12' y1='19' x2='12' y2='23'></line>
      <line x1='8' y1='23' x2='16' y2='23'></line>
    </svg>`
  },

  // ==================== 10. 默认/通用 ====================
  {
    name: '星星/通用',
    keywords: ['默认', '通用', '其他', 'other', 'default'],
    category: '默认',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'></polygon>
    </svg>`
  },
  {
    name: '视频播放器',
    keywords: ['播放器', 'player', '视频播放', 'media player'],
    category: '默认',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <polygon points='23 7 16 12 23 17 23 7'></polygon>
      <rect x='1' y='5' width='15' height='14' rx='2' ry='2'></rect>
    </svg>`
  },
  {
    name: '拍摄/相机',
    keywords: ['相机', '拍摄', 'camera', '摄影器材'],
    category: '默认',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
      <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'></path>
      <circle cx='12' cy='13' r='4'></circle>
    </svg>`
  },
];

/**
 * 根据分类名称和描述智能匹配图标
 * @param categoryName 分类名称
 * @param description 分类描述（可选）
 * @returns 匹配到的 SVG 图标字符串
 */
export function matchIconByKeywords(categoryName: string, description: string = ''): string {
  const text = `${categoryName} ${description}`.toLowerCase();
  
  // 1. 完全匹配 - 关键词在文本中出现
  for (const preset of iconPresets) {
    for (const keyword of preset.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        console.log(`[IconMatch] 精确匹配: "${categoryName}" -> ${preset.name} (关键词: ${keyword})`);
        return preset.svg;
      }
    }
  }

  // 2. 部分匹配 - 检查每个关键词是否包含文本中的部分词
  for (const preset of iconPresets) {
    for (const keyword of preset.keywords) {
      const cleanKeyword = keyword.toLowerCase().replace(/\s+/g, '');
      const cleanText = text.replace(/\s+/g, '');
      if (cleanText.includes(cleanKeyword) || cleanKeyword.includes(cleanText)) {
        console.log(`[IconMatch] 部分匹配: "${categoryName}" -> ${preset.name} (关键词: ${keyword})`);
        return preset.svg;
      }
    }
  }

  // 3. 根据分类名称字符特征进行模糊匹配
  const nameChars = categoryName.replace(/\s+/g, '');
  
  // 按字符特征匹配（例如含有"视"→视频类、含有"电"→电商/电器、含有"教"→教育类）
  const featureMap: { feature: string; preset: string }[] = [
    { feature: '视', preset: '视频制作' },
    { feature: '短', preset: '短视频内容' },
    { feature: '影', preset: '电影/影视' },
    { feature: '电', preset: '电商/购物' },
    { feature: '商', preset: '企业' },
    { feature: '教', preset: '教学/培训' },
    { feature: '课', preset: '课程实录/线上课堂' },
    { feature: '学', preset: '教学/培训' },
    { feature: '活动', preset: '活动庆典' },
    { feature: '宣', preset: '宣传片' },
    { feature: '广', preset: '广告片' },
    { feature: '品牌', preset: '品牌形象' },
    { feature: '产品', preset: '产品/商品' },
    { feature: '直播', preset: '带货直播' },
    { feature: '动画', preset: '动画/MG' },
    { feature: '美食', preset: '美食探店' },
    { feature: '旅', preset: '旅行/风景' },
    { feature: '时', preset: '时尚/穿搭' },
    { feature: '美', preset: '美妆教程' },
    { feature: 'ai', preset: '数字人' },
    { feature: '数字', preset: '数字人' },
    { feature: '虚拟', preset: '数字人' },
    { feature: '科', preset: '科技/未来' },
    { feature: '技', preset: '技术/网络' },
    { feature: '航', preset: '航拍' },
    { feature: '运动', preset: '健身教程' },
    { feature: '健', preset: '健身教程' },
    { feature: '金融', preset: '金融/财经' },
    { feature: '财', preset: '金融/财经' },
    { feature: '汽', preset: '汽车' },
    { feature: '车', preset: '汽车' },
    { feature: '房', preset: '房产/地产' },
    { feature: '地', preset: '房产/地产' },
    { feature: 'mv', preset: 'MV音乐视频' },
    { feature: '音乐', preset: 'MV音乐视频' },
    { feature: '纪录', preset: '纪录片' },
    { feature: '专题', preset: '专题片' },
    { feature: '带货', preset: '带货直播' },
    { feature: '种草', preset: '种草视频' },
    { feature: '探店', preset: '探店测评' },
    { feature: '开箱', preset: '开箱视频' },
    { feature: '穿搭', preset: '穿搭分享' },
    { feature: '健身', preset: '健身教程' },
    { feature: '美妆', preset: '美妆教程' },
    { feature: '科普', preset: '科普动画' },
    { feature: '儿童', preset: '儿童动画' },
    { feature: '幼教', preset: '儿童动画' },
    { feature: 'vr', preset: 'VR全景' },
    { feature: '全景', preset: 'VR全景' },
    { feature: '全息', preset: '全息投影' },
    { feature: '延时', preset: '延时摄影' },
    { feature: '微距', preset: '微距摄影' },
    { feature: '高速', preset: '高速摄像' },
    { feature: '企业', preset: '企业文化' },
    { feature: '文化', preset: '企业文化' },
    { feature: '培训', preset: '企业培训' },
    { feature: '招聘', preset: '招聘片' },
    { feature: '招商', preset: '招商加盟' },
    { feature: '加盟', preset: '招商加盟' },
    { feature: '总裁', preset: '总裁寄语' },
    { feature: 'ceo', preset: '总裁寄语' },
    { feature: '绿幕', preset: '绿幕抠像' },
    { feature: '抠像', preset: '绿幕抠像' },
    { feature: '降噪', preset: '降噪处理' },
    { feature: '防抖', preset: '防抖稳定' },
    { feature: '稳定', preset: '防抖稳定' },
    { feature: '渲染', preset: '视频渲染' },
    { feature: '包装', preset: '视频包装' },
    { feature: '分镜', preset: '分镜脚本' },
    { feature: '故事板', preset: '故事板' },
    { feature: '合成', preset: '后期合成' },
    { feature: '场记', preset: '场记板' },
  ];

  for (const { feature, preset } of featureMap) {
    if (nameChars.includes(feature)) {
      const match = iconPresets.find(p => p.name === preset);
      if (match) {
        console.log(`[IconMatch] 特征匹配: "${categoryName}" (特征: ${feature}) -> ${preset}`);
        return match.svg;
      }
    }
  }

  // 4. 默认返回星星图标
  const defaultIcon = iconPresets.find(p => p.name === '星星/通用');
  console.log(`[IconMatch] 无匹配: "${categoryName}" -> 使用默认图标 (星星)`);
  return defaultIcon?.svg || iconPresets[iconPresets.length - 1].svg;
}

/**
 * 获取所有可用图标类别
 */
export function getIconCategories(): string[] {
  const categories = new Set(iconPresets.map(p => p.category));
  return Array.from(categories);
}

/**
 * 获取指定类别的所有图标
 */
export function getIconsByCategory(category: string): IconPreset[] {
  return iconPresets.filter(p => p.category === category);
}

/**
 * 获取单个图标的 SVG（按名称）
 */
export function getIconByName(name: string): string | null {
  const match = iconPresets.find(p => p.name === name);
  return match?.svg || null;
}

export default {
  iconPresets,
  matchIconByKeywords,
  getIconCategories,
  getIconsByCategory,
  getIconByName,
};
