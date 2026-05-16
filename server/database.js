const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

function initDatabase() {
  db.serialize(() => {
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS portfolio_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        tag TEXT,
        shortDesc TEXT,
        fullDesc TEXT,
        img TEXT,
        images TEXT,
        videoUrl TEXT,
        type TEXT DEFAULT 'image',
        color TEXT,
        bgGlow TEXT,
        sortOrder INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if portfolio_items table has the images column, if not add it
    db.all('PRAGMA table_info(portfolio_items)', (err, columns) => {
      if (err) {
        console.error('Error checking portfolio_items columns:', err);
        return;
      }

      const columnNames = columns.map(col => col.name);
      
      if (!columnNames.includes('images')) {
        db.run('ALTER TABLE portfolio_items ADD COLUMN images TEXT', (err) => {
          if (err) {
            console.error('Error adding images column to portfolio_items:', err);
          } else {
            console.log('Added images column to portfolio_items');
          }
        });
      }
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        coverImage TEXT,
        icon TEXT,
        sortOrder INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS featured_works (
        id TEXT PRIMARY KEY,
        portfolioId INTEGER NOT NULL,
        sortOrder INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (portfolioId) REFERENCES portfolio_items(id) ON DELETE CASCADE
      )
    `);
// Create home_content table with all required columns
    db.run(`
      CREATE TABLE IF NOT EXISTS home_content (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        heroTitle TEXT,
        heroGradientTitle TEXT,
        heroSubtitle TEXT,
        heroSlides TEXT,
        heroImage TEXT,
        shareTitle TEXT,
        shareDescription TEXT,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Add missing columns if table already exists
      db.all('PRAGMA table_info(home_content)', (err, columns) => {
        if (err) {
          console.error('Error checking home_content columns:', err);
          return;
        }
        const columnNames = columns.map(col => col.name);
        
        const addColumnIfNotExists = (columnName, columnDef) => {
          if (!columnNames.includes(columnName)) {
            db.run(`ALTER TABLE home_content ADD COLUMN ${columnName} ${columnDef}`, (err) => {
              if (err) {
                console.error(`Error adding ${columnName} column:`, err);
              } else {
                console.log(`Added ${columnName} column to home_content`);
              }
            });
          }
        };
        
        addColumnIfNotExists('heroGradientTitle', 'TEXT');
        addColumnIfNotExists('heroImage', 'TEXT');
        addColumnIfNotExists('shareTitle', 'TEXT');
        addColumnIfNotExists('shareDescription', 'TEXT');
      });
    });
  
    db.run(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        avatar TEXT,
        bio TEXT,
        fullDesc TEXT,
        sortOrder INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categories_details (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        coverImage TEXT,
        icon TEXT,
        sortOrder INTEGER DEFAULT 0,
        tag TEXT,
        color TEXT,
        bgGlow TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert initial data with a small delay to ensure tables are ready
    setTimeout(insertInitialData, 500);
  });
}

function insertInitialData() {
  db.get('SELECT COUNT(*) as count FROM portfolio_items', (err, row) => {
    if (err) {
      console.error('Error checking portfolio_items:', err);
      return;
    }
    if (row.count === 0) {
      const initialPortfolio = [
        {
          title: "AI智能广告片",
          category: "AI影像创作",
          tag: "新品",
          shortDesc: "用AI一键生成专业广告视频",
          fullDesc: "探索AI驱动的创意影像生成",
          img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=800&auto=format&fit=crop",
          type: "image",
          color: "from-blue-500 to-cyan-600",
          bgGlow: "bg-blue-500/20",
          sortOrder: 0
        }
      ];

      const insertStmt = db.prepare('INSERT INTO portfolio_items (title, category, tag, shortDesc, fullDesc, img, type, color, bgGlow, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      initialPortfolio.forEach((item) => {
        insertStmt.run(item.title, item.category, item.tag, item.shortDesc, item.fullDesc, item.img, item.type, item.color, item.bgGlow, item.sortOrder);
      });
      insertStmt.finalize();
      console.log('Initial portfolio items inserted');
    }
  });

  db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
    if (err) {
      console.error('Error checking categories:', err);
      return;
    }
    if (row.count === 0) {
      const initialCategories = [
        { id: "all", name: "全部" },
        { id: "ai-video", name: "AI影像创作" },
        { id: "corporate", name: "视频定制" },
        { id: "brand", name: "品牌设计" },
        { id: "douyin", name: "短视频运营" }
      ];

      const insertStmt = db.prepare('INSERT INTO categories (id, name) VALUES (?, ?)');
      initialCategories.forEach((cat) => insertStmt.run(cat.id, cat.name));
      insertStmt.finalize();
      console.log('Initial categories inserted');
    }
  });

  db.get('SELECT COUNT(*) as count FROM home_content', (err, row) => {
    if (err) {
      console.error('Error checking home_content:', err);
      return;
    }
    if (row.count === 0) {
      const defaultSlides = [
        { id: 1, img: '/images/hero-video.png', label: 'Neural Stream', title: 'Ethereal Segment 01' },
        { id: 2, img: '/images/ai-digital-human.png', label: 'Digital Human', title: 'Avatar Segment 02' },
        { id: 3, img: '/images/ai-film-production.png', label: 'Film Production', title: 'Cinematic Segment 03' }
      ];

      db.run(
        'INSERT INTO home_content (id, heroTitle, heroGradientTitle, heroSubtitle, heroSlides, heroImage, shareTitle, shareDescription) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          1,
          '开启未来的',
          '视界 Matrix',
          '通过 AIGC 重新定义数字影像。我们将人类的情感与神经计算相结合，打造跨越维度的奇迹。',
          JSON.stringify(defaultSlides),
          '/images/hero-home.png',
          '大连柒子文化发展有限公司',
          '诚信立足 创新致远'
        ],
        (err) => {
          if (err) console.error('Error inserting home content:', err);
          else console.log('Initial home content inserted');
        }
      );
    } else {
      const defaultSlides = [
        { id: 1, img: '/images/hero-video.png', label: 'Neural Stream', title: 'Ethereal Segment 01' },
        { id: 2, img: '/images/ai-digital-human.png', label: 'Digital Human', title: 'Avatar Segment 02' },
        { id: 3, img: '/images/ai-film-production.png', label: 'Film Production', title: 'Cinematic Segment 03' }
      ];

      db.run(
        'UPDATE home_content SET heroTitle = ?, heroGradientTitle = ?, heroSubtitle = ?, heroSlides = ?, heroImage = ?, shareTitle = ?, shareDescription = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = 1',
        [
          '开启未来的',
          '视界 Matrix',
          '通过 AIGC 重新定义数字影像。我们将人类的情感与神经计算相结合，打造跨越维度的奇迹。',
          JSON.stringify(defaultSlides),
          '/images/hero-home.png',
          '大连柒子文化发展有限公司',
          '诚信立足 创新致远'
        ],
        (err) => {
          if (err) console.error('Error updating home_content:', err);
          else console.log('Home content updated to match online site');
        }
      );
    }
  });

  db.get('SELECT COUNT(*) as count FROM team_members', (err, row) => {
    if (err) {
      console.error('Error checking team_members:', err);
      return;
    }
    if (row.count === 0) {
      const initialTeam = [
        {
          name: "Aris Vane",
          role: "Chief Architect",
          avatar: "/images/neon-avatar.png",
          bio: "Neural network optimization and ethereal render engine lead.",
          fullDesc: "Aris Vane is the visionary behind the Septem Ethereal Engine.",
          sortOrder: 0
        }
      ];

      const insertStmt = db.prepare('INSERT INTO team_members (name, role, avatar, bio, fullDesc, sortOrder) VALUES (?, ?, ?, ?, ?, ?)');
      initialTeam.forEach((member) => {
        insertStmt.run(member.name, member.role, member.avatar, member.bio, member.fullDesc, member.sortOrder);
      });
      insertStmt.finalize();
      console.log('Initial team members inserted');
    }
  });

  db.get('SELECT COUNT(*) as count FROM categories_details', (err, row) => {
    if (err) {
      console.error('Error checking categories_details:', err);
      return;
    }
    if (row.count === 0) {
      const initialCategoriesDetails = [
        {
          id: "cb1",
          name: "AI 数字人定制",
          description: "基于最前沿的神经网络渲染技术",
          coverImage: "/images/ai-digital-human.png",
          icon: "🤖",
          sortOrder: 0,
          tag: "数字人",
          color: "text-secondary",
          bgGlow: "bg-secondary/20"
        },
        {
          id: "cb2",
          name: "电影级 AI 制作",
          description: "重塑视频工业流程",
          coverImage: "/images/ai-film-production.png",
          icon: "🎬",
          sortOrder: 1,
          tag: "影视制作",
          color: "text-primary",
          bgGlow: "bg-primary/20"
        },
        {
          id: "cb3",
          name: "社交平台短视频 AI",
          description: "深度理解社交媒体流量密码",
          coverImage: "/images/ai-short-video.png",
          icon: "📱",
          sortOrder: 2,
          tag: "短视频",
          color: "text-tertiary",
          bgGlow: "bg-tertiary/20"
        },
        {
          id: "cb4",
          name: "神经网络技术栈",
          description: "自主研发的底层引擎",
          coverImage: "/images/ai-tech-stack.png",
          icon: "🧠",
          sortOrder: 3,
          tag: "技术栈",
          color: "text-secondary-fixed-dim",
          bgGlow: "bg-secondary/20"
        }
      ];

      const insertStmt = db.prepare('INSERT INTO categories_details (id, name, description, coverImage, icon, sortOrder, tag, color, bgGlow) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      initialCategoriesDetails.forEach((cat) => {
        insertStmt.run(cat.id, cat.name, cat.description, cat.coverImage, cat.icon, cat.sortOrder, cat.tag, cat.color, cat.bgGlow);
      });
      insertStmt.finalize();
      console.log('Initial categories details inserted');
    }
  });
}

const dbAsync = {
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

const portfolioItems = {
  getAll: async () => {
    const rows = await dbAsync.all('SELECT * FROM portfolio_items ORDER BY sortOrder ASC, id ASC');
    return rows.map(row => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : undefined
    }));
  },
  create: async (item) => {
    const result = await dbAsync.run(
      'INSERT INTO portfolio_items (title, category, tag, shortDesc, fullDesc, img, images, videoUrl, type, color, bgGlow, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        item.title, item.category, item.tag, item.shortDesc, item.fullDesc,
        item.img, item.images ? JSON.stringify(item.images) : null, 
        item.videoUrl, item.type, item.color, item.bgGlow, item.sortOrder
      ]
    );
    return { id: result.lastID, ...item };
  },
  update: async (id, item) => {
    await dbAsync.run(
      'UPDATE portfolio_items SET title=?, category=?, tag=?, shortDesc=?, fullDesc=?, img=?, images=?, videoUrl=?, type=?, color=?, bgGlow=?, sortOrder=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
      [
        item.title, item.category, item.tag, item.shortDesc, item.fullDesc,
        item.img, item.images ? JSON.stringify(item.images) : null,
        item.videoUrl, item.type, item.color, item.bgGlow, item.sortOrder, id
      ]
    );
    return { id, ...item };
  },
  delete: async (id) => {
    await dbAsync.run('DELETE FROM portfolio_items WHERE id=?', [id]);
    return true;
  }
};

const categories = {
  getAll: async () => {
    const rows = await dbAsync.all('SELECT * FROM categories ORDER BY sortOrder ASC, id ASC');
    return rows;
  },
  create: async (category) => {
    await dbAsync.run(
      'INSERT INTO categories (id, name, description, coverImage, icon, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
      [category.id, category.name, category.description, category.coverImage, category.icon, category.sortOrder]
    );
    return category;
  },
  update: async (id, category) => {
    await dbAsync.run(
      'UPDATE categories SET name=?, description=?, coverImage=?, icon=?, sortOrder=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
      [category.name, category.description, category.coverImage, category.icon, category.sortOrder, id]
    );
    return { id, ...category };
  },
  delete: async (id) => {
    await dbAsync.run('DELETE FROM categories WHERE id=?', [id]);
    return true;
  }
};

const featuredWorks = {
  getAll: async () => {
    const rows = await dbAsync.all('SELECT * FROM featured_works ORDER BY sortOrder ASC');
    return rows;
  },
  create: async (work) => {
    await dbAsync.run(
      'INSERT INTO featured_works (id, portfolioId, sortOrder) VALUES (?, ?, ?)',
      [work.id, work.portfolioId, work.sortOrder]
    );
    return work;
  },
  delete: async (id) => {
    await dbAsync.run('DELETE FROM featured_works WHERE id=?', [id]);
    return true;
  },
  updateSort: async (works) => {
    await dbAsync.run('DELETE FROM featured_works');
    for (const work of works) {
      await dbAsync.run(
        'INSERT INTO featured_works (id, portfolioId, sortOrder) VALUES (?, ?, ?)',
        [work.id, work.portfolioId, work.sortOrder]
      );
    }
    return works;
  }
};

const homeContent = {
  get: async () => {
    const row = await dbAsync.get('SELECT * FROM home_content WHERE id=1');
    return row ? {
      heroTitle: row.heroTitle,
      heroGradientTitle: row.heroGradientTitle,
      heroSubtitle: row.heroSubtitle,
      heroSlides: row.heroSlides ? JSON.parse(row.heroSlides) : [],
      heroImage: row.heroImage || '/images/hero-home.png',
      shareTitle: row.shareTitle || '大连柒子文化发展有限公司',
      shareDescription: row.shareDescription || '诚信立足 创新致远'
    } : {
      heroTitle: "开启未来的",
      heroGradientTitle: "视界 Matrix",
      heroSubtitle: "通过 AIGC 重新定义数字影像。我们将人类的情感与神经计算相结合，打造跨越维度的奇迹。",
      heroSlides: [
        { id: 1, img: '/images/hero-video.png', label: 'Neural Stream', title: 'Ethereal Segment 01' },
        { id: 2, img: '/images/ai-digital-human.png', label: 'Digital Human', title: 'Avatar Segment 02' },
        { id: 3, img: '/images/ai-film-production.png', label: 'Film Production', title: 'Cinematic Segment 03' }
      ],
      heroImage: '/images/hero-home.png',
      shareTitle: '大连柒子文化发展有限公司',
      shareDescription: '诚信立足 创新致远'
    };
  },
  update: async (content) => {
    await dbAsync.run(
      'INSERT OR REPLACE INTO home_content (id, heroTitle, heroGradientTitle, heroSubtitle, heroSlides, heroImage, shareTitle, shareDescription, updatedAt) VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [
        content.heroTitle,
        content.heroGradientTitle,
        content.heroSubtitle,
        content.heroSlides ? JSON.stringify(content.heroSlides) : null,
        content.heroImage || '/images/hero-home.png',
        content.shareTitle || '大连柒子文化发展有限公司',
        content.shareDescription || '诚信立足 创新致远'
      ]
    );
    return content;
  }
};

const teamMembers = {
  getAll: async () => {
    const rows = await dbAsync.all('SELECT * FROM team_members ORDER BY sortOrder ASC, id ASC');
    return rows;
  },
  create: async (member) => {
    const result = await dbAsync.run(
      'INSERT INTO team_members (name, role, avatar, bio, fullDesc, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
      [member.name, member.role, member.avatar, member.bio, member.fullDesc, member.sortOrder]
    );
    return { id: result.lastID, ...member };
  },
  update: async (id, member) => {
    await dbAsync.run(
      'UPDATE team_members SET name=?, role=?, avatar=?, bio=?, fullDesc=?, sortOrder=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
      [member.name, member.role, member.avatar, member.bio, member.fullDesc, member.sortOrder, id]
    );
    return { id, ...member };
  },
  delete: async (id) => {
    await dbAsync.run('DELETE FROM team_members WHERE id=?', [id]);
    return true;
  }
};

const categoriesDetails = {
  getAll: async () => {
    const rows = await dbAsync.all('SELECT * FROM categories_details ORDER BY sortOrder ASC');
    return rows;
  },
  create: async (category) => {
    await dbAsync.run(
      'INSERT INTO categories_details (id, name, description, coverImage, icon, sortOrder, tag, color, bgGlow) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        category.id, category.name, category.description, category.coverImage,
        category.icon, category.sortOrder, category.tag, category.color, category.bgGlow
      ]
    );
    return category;
  },
  update: async (id, category) => {
    await dbAsync.run(
      'UPDATE categories_details SET name=?, description=?, coverImage=?, icon=?, sortOrder=?, tag=?, color=?, bgGlow=?, updatedAt=CURRENT_TIMESTAMP WHERE id=?',
      [
        category.name, category.description, category.coverImage, category.icon,
        category.sortOrder, category.tag, category.color, category.bgGlow, id
      ]
    );
    return { id, ...category };
  },
  delete: async (id) => {
    await dbAsync.run('DELETE FROM categories_details WHERE id=?', [id]);
    return true;
  }
};

module.exports = {
  portfolioItems,
  categories,
  featuredWorks,
  homeContent,
  teamMembers,
  categoriesDetails,
  db
};
