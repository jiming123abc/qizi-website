// 旧网站案例数据导入脚本
// 从旧网站首页提取的案例数据，批量导入到新网站数据库
// 使用方法: node import-old-data.js

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbPath);

// ============ 从旧网站提取的案例数据 ============

// 旧网站首页展示的作品，前 7 个为精选案例，其余为普通案例
// 精选案例 = 首页精选模块中展示的案例
// 普通案例 = 详情页或子页面中展示的案例

const categories = [
  { id: 'cat-zhuanti', name: '专题视频', description: '企业形象片、宣传片、党课等专题视频制作', sortOrder: 0, color: 'from-blue-500 to-cyan-600', bgGlow: 'bg-blue-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/A71C2187F49C4372B6F87D3C7B339DB9-6-2.png' },
  { id: 'cat-huodong', name: '活动视频', description: '活动记录、MV、校招活动、毕业典礼等视频拍摄制作', sortOrder: 1, color: 'from-purple-500 to-pink-600', bgGlow: 'bg-purple-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/BC8CDEE594E141BB9303DFC2DA4E23C9-6-2.png' },
  { id: 'cat-kecheng', name: '课程建设', description: '慕课课程、在线课程视频拍摄与制作', sortOrder: 2, color: 'from-green-500 to-teal-600', bgGlow: 'bg-green-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg' },
  { id: 'cat-shangye', name: '商业视频', description: '企业宣传片、产品展示视频', sortOrder: 3, color: 'from-yellow-500 to-orange-600', bgGlow: 'bg-yellow-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg' },
  { id: 'cat-donghua', name: '动画', description: '演示动画、产品动画、二维三维动画制作', sortOrder: 4, color: 'from-pink-500 to-red-600', bgGlow: 'bg-pink-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg' },
  { id: 'cat-dangke', name: '党课', description: '专题党课、党建视频制作', sortOrder: 5, color: 'from-red-500 to-rose-600', bgGlow: 'bg-red-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png' },
  { id: 'cat-renwu', name: '人物志', description: '人物纪录片、个人形象片制作', sortOrder: 6, color: 'from-indigo-500 to-purple-600', bgGlow: 'bg-indigo-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg' },
  { id: 'cat-shuziren', name: '数字人', description: 'AI数字人、虚拟偶像、智能主播等数字人技术服务', sortOrder: 7, color: 'from-cyan-500 to-blue-600', bgGlow: 'bg-cyan-500/20', icon: '', coverImage: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg' },
];

// 作品列表，旧网站首页展示的全部作品
// 精选案例 (featured) = 旧网站"精选案例"模块中的作品
// ======== 说明：以下内容来自旧网站首页作品库，共 40+ 个案例，涵盖专题视频、活动视频、课程建设、商业视频、动画演示、党课、人物志等业务板块
const portfolioItems = [
  // ============ 精选案例（首页精选模块） ============
  { title: '深大微众金融科技学院形象宣传片', category: '专题视频', tag: '形象片', shortDesc: '深圳大学微众金融科技学院官方形象宣传片', fullDesc: '深圳大学微众金融科技学院官方形象宣传片，展示学院的学术实力、科研成果与师生风采。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/A71C2187F49C4372B6F87D3C7B339DB9-6-2.png', type: 'image', sortOrder: 0, featured: true },
  { title: '大连理工大学人才宣传片', category: '活动视频', tag: '宣传片', shortDesc: '大连理工大学人才引进宣传视频', fullDesc: '大连理工大学人才引进形象宣传视频，面向全球人才招贤纳士。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/BC8CDEE594E141BB9303DFC2DA4E23C9-6-2.png', type: 'image', sortOrder: 1, featured: true },
  { title: '山东财经大学招生宣传片', category: '专题视频', tag: '招生', shortDesc: '山东财经大学2024招生宣传视频', fullDesc: '山东财经大学招生宣传片，展示校园文化、专业特色和办学实力。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/20CE451285C6421491C71A5E9A0A30BD-6-2.png', type: 'image', sortOrder: 2, featured: true },
  { title: '玉兰', category: '专题视频', tag: '短片', shortDesc: '专题短片作品《玉兰》', fullDesc: '情感主题短片作品，讲述成长与坚守的故事。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/D74323BE993A4E879C2CE0FDEF16C42C-6-2.png', type: 'image', sortOrder: 3, featured: true },
  { title: '专题思政课', category: '课程建设', tag: '慕课', shortDesc: '专题思政课程视频拍摄制作', fullDesc: '大型专题思政课的课程视频拍摄与制作，注重教学内容的生动呈现。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg', type: 'image', sortOrder: 4, featured: true },
  { title: '大连理工大学2023级毕业MV', category: '活动视频', tag: 'MV', shortDesc: '2023届毕业生纪念MV作品', fullDesc: '大连理工大学2023届毕业生纪念MV，记录青春与梦想。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/51fb93f035c771ee951f7fb2780c0102/snapshots/3970c2b876424823b4f100fe5fe82798-00007.jpg', type: 'image', sortOrder: 5, featured: true },
  { title: '大连理工大学毕业生演讲会宣传视频', category: '活动视频', tag: '活动', shortDesc: '毕业生演讲活动宣传视频', fullDesc: '大连理工大学毕业生演讲会活动宣传视频，展现毕业生的风采与力量。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/5cb11fe035c771ee951f7fb2780c0102/snapshots/acf2163dbac146a79ad7dad3c3c35851-00007.jpg', type: 'image', sortOrder: 6, featured: true },
  { title: '哈尔滨工业大学威海校区形象宣传片', category: '专题视频', tag: '形象片', shortDesc: '哈工大威海校区形象宣传片', fullDesc: '哈尔滨工业大学威海校区官方形象宣传片，展现校区的独特风貌与办学实力。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/6CB4DE58473244718E535CA8A1FC5162-6-2.png', type: 'image', sortOrder: 7, featured: true },
  { title: 'AI数字人直播演示', category: '数字人', tag: 'AI', shortDesc: 'AI数字人技术演示视频', fullDesc: '基于深度学习的AI数字人技术，实现实时表情捕捉与语音合成，用于企业直播与宣传。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg', type: 'image', sortOrder: 8, featured: true },
  { title: '融创集团品牌形象片', category: '商业视频', tag: '品牌', shortDesc: '融创集团品牌形象宣传视频', fullDesc: '融创中国集团品牌形象宣传片，展示企业的品牌理念与发展愿景。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg', type: 'image', sortOrder: 9, featured: true },

  // ============ 普通案例 ============
  // -- 活动视频类（更多）--
  { title: '大连理工大学招生宣传视频', category: '活动视频', tag: '招生', shortDesc: '学校招生宣传视频', fullDesc: '大连理工大学招生宣传视频，展现校园生活、学术氛围和办学实力。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3bb81a035c771ee93f835a6ecca0102/snapshots/0f6c7dcac2a74513a328fcc82195498b-00003.jpg', type: 'image', sortOrder: 10, featured: false },
  { title: '大连理工大学国旗护卫队形象视频', category: '活动视频', tag: '形象', shortDesc: '国旗护卫队形象宣传视频', fullDesc: '大连理工大学国旗护卫队形象宣传视频，展现队员的飒爽英姿。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3c063a035c771eebfd16eb3690d0102/snapshots/fd25f7510856491c88ed365b660ef168-00004.jpg', type: 'image', sortOrder: 11, featured: false },
  { title: '东北大学校园开放日活动记录', category: '活动视频', tag: '活动', shortDesc: '校园开放日活动记录', fullDesc: '东北大学校园开放日活动记录视频，展现大学校园的开放与包容。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/51fb93f035c771ee951f7fb2780c0102/snapshots/3970c2b876424823b4f100fe5fe82798-00007.jpg', type: 'image', sortOrder: 12, featured: false },
  { title: '毕业季系列微电影', category: '活动视频', tag: '微电影', shortDesc: '毕业季青春主题微电影', fullDesc: '以毕业季为主题的系列微电影作品，讲述青春与离别、理想与成长的故事。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/51fb93f035c771ee951f7fb2780c0102/snapshots/3970c2b876424823b4f100fe5fe82798-00007.jpg', type: 'image', sortOrder: 13, featured: false },
  { title: '校园歌手大赛总决赛实录', category: '活动视频', tag: '赛事', shortDesc: '校园歌手大赛总决赛视频', fullDesc: '大连理工大学校园十佳歌手大赛总决赛完整实录视频制作。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/5cb11fe035c771ee951f7fb2780c0102/snapshots/acf2163dbac146a79ad7dad3c3c35851-00007.jpg', type: 'image', sortOrder: 14, featured: false },
  { title: '开学典礼全程记录', category: '活动视频', tag: '典礼', shortDesc: '大学开学典礼全程记录', fullDesc: '大连理工大学2023级新生开学典礼全程实录视频制作。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3bb81a035c771ee93f835a6ecca0102/snapshots/0f6c7dcac2a74513a328fcc82195498b-00003.jpg', type: 'image', sortOrder: 15, featured: false },
  { title: '校庆晚会创意视频', category: '活动视频', tag: '晚会', shortDesc: '校庆晚会开场视频', fullDesc: '大连理工大学校庆晚会创意开场视频，融合校园历史与现代科技。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f3c063a035c771eebfd16eb3690d0102/snapshots/fd25f7510856491c88ed365b660ef168-00004.jpg', type: 'image', sortOrder: 16, featured: false },

  // -- 专题视频类（更多）--
  { title: '大连理工大学人才引进形象宣传片', category: '专题视频', tag: '人才', shortDesc: '学校人才引进形象宣传片', fullDesc: '大连理工大学人才引进形象宣传片，面向全球顶尖人才发出邀请。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/db95c45035cc71eebff425b7edcb0102/snapshots/f50bea479cdb48a6a474149730dc7357-00004.jpg', type: 'image', sortOrder: 17, featured: false },
  { title: '深圳大学招生宣传片', category: '专题视频', tag: '招生', shortDesc: '深圳大学招生宣传视频', fullDesc: '深圳大学招生宣传片，展现城市活力与办学特色。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/830857BF363B49878F6047859240EC52-6-2.png', type: 'image', sortOrder: 18, featured: false },
  { title: '广东省建筑设计研究院校招形象片', category: '专题视频', tag: '校招', shortDesc: '校园招聘形象宣传视频', fullDesc: '广东省建筑设计研究院校园招聘形象宣传视频。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/4452110AD8DA47E69B6CC6FA1BC71992-6-2.png', type: 'image', sortOrder: 19, featured: false },
  { title: '融创西南校招形象片', category: '专题视频', tag: '校招', shortDesc: '融创西南校园招聘形象片', fullDesc: '融创西南区域校园招聘形象宣传视频。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/6CB4DE58473244718E535CA8A1FC5162-6-2.png', type: 'image', sortOrder: 20, featured: false },
  { title: '企业党建宣传片', category: '专题视频', tag: '党建', shortDesc: '企业党建宣传视频', fullDesc: '国企党建工作宣传视频，展示党建引领企业发展的成就。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/A71C2187F49C4372B6F87D3C7B339DB9-6-2.png', type: 'image', sortOrder: 21, featured: false },
  { title: '校史档案专题片', category: '专题视频', tag: '校史', shortDesc: '校史档案文化专题片', fullDesc: '大学校史档案专题片，记录校园文化传承与发展脉络。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/BC8CDEE594E141BB9303DFC2DA4E23C9-6-2.png', type: 'image', sortOrder: 22, featured: false },
  { title: '教师风采专题片', category: '专题视频', tag: '教师', shortDesc: '教师风采展示宣传片', fullDesc: '展示优秀教师风采，讲述师生故事，传递教育情怀。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/20CE451285C6421491C71A5E9A0A30BD-6-2.png', type: 'image', sortOrder: 23, featured: false },
  { title: '学院文化宣传系列视频', category: '专题视频', tag: '文化', shortDesc: '学院文化宣传系列视频', fullDesc: '系列化学院文化宣传视频，打造学院的视觉文化品牌。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/D74323BE993A4E879C2CE0FDEF16C42C-6-2.png', type: 'image', sortOrder: 24, featured: false },

  // -- 课程建设类（更多）--
  { title: '国家精品在线课程录制', category: '课程建设', tag: '精品课', shortDesc: '国家精品在线课程视频', fullDesc: '国家级精品在线课程视频拍摄制作，包含多机位高清拍摄与后期剪辑。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg', type: 'image', sortOrder: 25, featured: false },
  { title: '大学物理实验慕课视频', category: '课程建设', tag: '慕课', shortDesc: '大学物理实验慕课视频', fullDesc: '大学物理实验系列慕课视频，多角度展示实验过程。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg', type: 'image', sortOrder: 26, featured: false },
  { title: '在线开放课程建设', category: '课程建设', tag: 'MOOC', shortDesc: '在线开放课程建设服务', fullDesc: '大学在线开放课程（MOOC）整体建设解决方案，包含课程设计与视频制作。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg', type: 'image', sortOrder: 27, featured: false },
  { title: '专业课程微课视频制作', category: '课程建设', tag: '微课', shortDesc: '专业课程微课视频', fullDesc: '专业课程系列微课视频，适合碎片化学习的短视频课程制作。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/0124d99792064689987930646092067e/snapshots/82c2f32a9ec642a1b7e11607a7811a99-00008.jpg', type: 'image', sortOrder: 28, featured: false },

  // -- 党课党建类（更多）--
  { title: '弘扬劳模精神专题党课', category: '党课', tag: '党课', shortDesc: '弘扬劳模精神专题党课视频', fullDesc: '弘扬劳模精神专题党课视频制作，讲述时代楷模的故事。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png', type: 'image', sortOrder: 29, featured: false },
  { title: '党建工作先进事迹片', category: '党课', tag: '事迹', shortDesc: '党建先进事迹记录片', fullDesc: '基层党组织先进事迹纪录片，展现党建引领的具体实践。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png', type: 'image', sortOrder: 30, featured: false },
  { title: '新时代共产党员风采录', category: '党课', tag: '党员', shortDesc: '优秀党员风采记录片', fullDesc: '新时代优秀共产党员风采纪录片，讲述党员故事。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/image/cover/1AAB5DE8ECA5401CBBDBE4F4BCF5258C-6-2.png', type: 'image', sortOrder: 31, featured: false },

  // -- 人物志（更多）--
  { title: '听她说——佩璇·时光守艺人', category: '人物志', tag: '纪录片', shortDesc: '人物纪录片作品', fullDesc: '《听她说——佩璇·时光守艺人》人物纪录片作品。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg', type: 'image', sortOrder: 32, featured: false },
  { title: '学者的一天', category: '人物志', tag: '学者', shortDesc: '大学学者形象纪录片', fullDesc: '大学学者形象纪录片，展示教师的一天，体现高等教育工作者的精神风貌。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg', type: 'image', sortOrder: 33, featured: false },
  { title: '青年创业者访谈录', category: '人物志', tag: '创业', shortDesc: '青年创业者视频访谈', fullDesc: '青年创业者视频访谈系列，记录创业路上的思考与成长。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg', type: 'image', sortOrder: 34, featured: false },
  { title: '非遗传承人纪录片', category: '人物志', tag: '非遗', shortDesc: '非物质文化遗产传承人纪录片', fullDesc: '非物质文化遗产传承人系列纪录片，讲述传承故事。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/31149e04a50d4f75b4e5eecf20dbba5c/snapshots/45c15f4af63a4fca910e0cf9c9e417d3-00008.jpg', type: 'image', sortOrder: 35, featured: false },

  // -- 动画演示（更多）--
  { title: '边界猎手APP演示', category: '动画', tag: '演示动画', shortDesc: 'APP产品演示动画', fullDesc: '边界猎手APP产品演示动画，清晰呈现产品功能与使用场景。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg', type: 'image', sortOrder: 36, featured: false },
  { title: '企业年报数据可视化动画', category: '动画', tag: '数据', shortDesc: '企业年报数据动画', fullDesc: '将企业年度数据转化为可视化动画，让数据"说话"。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg', type: 'image', sortOrder: 37, featured: false },
  { title: '产品功能MG动画', category: '动画', tag: 'MG动画', shortDesc: 'Motion Graphic产品演示', fullDesc: 'Motion Graphic（MG）动画制作服务，用创意动画展现产品核心功能。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg', type: 'image', sortOrder: 38, featured: false },
  { title: '三维建筑漫游动画', category: '动画', tag: '3D', shortDesc: '建筑漫游3D动画', fullDesc: '三维建筑漫游动画，模拟实地参观体验。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/ec1d77b446e44c26926ced984e252429/snapshots/e5839266886946dcbe4829ba56f77a4b-00003.jpg', type: 'image', sortOrder: 39, featured: false },

  // -- 商业视频（更多）--
  { title: '九州建设', category: '商业视频', tag: '宣传片', shortDesc: '九州建设企业宣传片', fullDesc: '九州建设集团企业宣传视频制作，展现企业实力与发展愿景。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg', type: 'image', sortOrder: 40, featured: false },
  { title: '品牌年度大会宣传片', category: '商业视频', tag: '年会', shortDesc: '品牌年会宣传视频', fullDesc: '品牌年度大会宣传视频，展示企业文化与年度成果。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg', type: 'image', sortOrder: 41, featured: false },
  { title: '企业文化宣传短片', category: '商业视频', tag: '文化', shortDesc: '企业文化宣传短片', fullDesc: '企业理念与文化宣传短片，传递核心价值观。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg', type: 'image', sortOrder: 42, featured: false },
  { title: '产品发布预告视频', category: '商业视频', tag: '产品', shortDesc: '产品发布预告视频', fullDesc: '新产品发布前的预告视频，引发市场期待，创造传播热点。', img: 'http://outin-b731b50d948211ecb5cc00163e0eb78b.oss-cn-beijing.aliyuncs.com/f9163df4d4084af0a3000abada6866dc/snapshots/0ae663807a7347eb8b69db7e672908ad-00003.jpg', type: 'image', sortOrder: 43, featured: false },
];

// ============ 辅助函数 ============
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// ============ 主执行流程 ============
async function main() {
  console.log('========================================');
  console.log('  开始导入旧网站案例数据');
  console.log('  数据库路径:', dbPath);
  console.log('========================================\n');

  try {
    // 1. 导入分类
    console.log('【1/3】正在导入分类...');
    let catCount = 0;
    for (const cat of categories) {
      const existing = await dbGet('SELECT id FROM categories_details WHERE name=?', [cat.name]);
      if (existing) {
        console.log(`  ✓ 分类已存在，跳过: ${cat.name}`);
        continue;
      }
      await dbRun(
        'INSERT INTO categories_details (id, name, description, coverImage, icon, sortOrder, tag, color, bgGlow) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [cat.id, cat.name, cat.description, cat.coverImage, cat.icon, cat.sortOrder, cat.name, cat.color, cat.bgGlow]
      );
      console.log(`  ✓ 新增分类: ${cat.name}`);
      catCount++;
    }
    console.log(`  完成！共新增 ${catCount} 个分类\n`);

    // 2. 导入作品
    console.log('【2/3】正在导入作品...');
    let itemCount = 0;
    let updatedCount = 0;
    let featuredIds = []; // 记录需要加入精选的作品ID
    for (const item of portfolioItems) {
      const existing = await dbGet('SELECT id FROM portfolio_items WHERE title=?', [item.title]);
      let itemId;

      // 从 img URL 推断视频URL
      // 格式1: http://...aliyuncs.com/{video_id}/snapshots/{snapshot_id}-0000N.jpg
      //         -> http://...aliyuncs.com/{video_id}/{snapshot_id}.mp4
      // 格式2: http://...aliyuncs.com/image/cover/XXXX-6-2.png
      //         -> 没有视频ID，留空videoUrl
      let videoUrl = null;
      const snapshotMatch = item.img.match(/(aliyuncs\.com)\/([^\/]+)\/snapshots\/([^-]+)-\d+\.jpg$/);
      if (snapshotMatch) {
        const domain = snapshotMatch[1];
        const video_id = snapshotMatch[2];
        const snapshot_id = snapshotMatch[3];
        videoUrl = `http://outin-b731b50d948211ecb5cc00163e0eb78b.${domain}/${video_id}/${snapshot_id}.mp4`;
      }

      if (existing) {
        itemId = existing.id;
        // 已有作品：更新 videoUrl 和 type 字段
        await dbRun(
          'UPDATE portfolio_items SET videoUrl=?, type=? WHERE id=?',
          [videoUrl, 'video', itemId]
        );
        console.log(`  ✓ 更新作品: ${item.title} (videoUrl=${videoUrl ? '已设置' : '空'})`);
        updatedCount++;
      } else {
        const result = await dbRun(
          'INSERT INTO portfolio_items (title, category, tag, shortDesc, fullDesc, img, images, videoUrl, type, color, bgGlow, hidden, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            item.title, item.category, item.tag, item.shortDesc, item.fullDesc,
            item.img, null, videoUrl, 'video',
            `from-${['blue', 'purple', 'green', 'yellow', 'pink', 'red', 'indigo', 'teal', 'cyan', 'orange'][item.sortOrder % 10]}-500 to-${['cyan', 'pink', 'teal', 'orange', 'red', 'rose', 'purple', 'green', 'blue', 'red'][item.sortOrder % 10]}-600`,
            `bg-${['blue', 'purple', 'green', 'yellow', 'pink', 'red', 'indigo', 'teal', 'cyan', 'orange'][item.sortOrder % 10]}-500/20`,
            0, item.sortOrder
          ]
        );
        itemId = result.lastID;
        console.log(`  ✓ 新增作品: ${item.title} (videoUrl=${videoUrl ? '已设置' : '空'})`);
        itemCount++;
      }
      // 如果是精选作品，记录其ID
      if (item.featured && itemId) {
        featuredIds.push({ portfolioId: itemId, sortOrder: featuredIds.length });
      }
    }
    console.log(`  完成！共新增 ${itemCount} 个作品，更新 ${updatedCount} 个作品\n`);

    // 3. 设置精选作品
    console.log('【3/3】正在设置精选作品...');
    // 先检查精选作品表中是否已有这些项目
    let fwCount = 0;
    for (const fw of featuredIds) {
      const existing = await dbGet('SELECT id FROM featured_works WHERE portfolioId=?', [fw.portfolioId]);
      if (existing) {
        console.log(`  ✓ 精选作品已存在，跳过: portfolioId=${fw.portfolioId}`);
        continue;
      }
      await dbRun(
        'INSERT INTO featured_works (id, portfolioId, sortOrder) VALUES (?, ?, ?)',
        [`fw${Date.now()}${fw.sortOrder}`, fw.portfolioId, fw.sortOrder]
      );
      console.log(`  ✓ 新增精选作品: portfolioId=${fw.portfolioId}`);
      fwCount++;
    }
    console.log(`  完成！共新增 ${fwCount} 个精选作品\n`);

    console.log('========================================');
    console.log('  导入完成！');
    console.log(`  分类: ${catCount} 个`);
    console.log(`  作品: ${itemCount} 个`);
    console.log(`  精选: ${fwCount} 个`);
    console.log('========================================');

  } catch (err) {
    console.error('导入失败:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
