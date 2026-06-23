const { execSync } = require('child_process');

function run(cmd) {
    console.log('\n>>>', cmd.substring(0, 120));
    try {
        const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        process.stdout.write(out);
        return out;
    } catch (e) {
        console.log('[exit non-zero]');
        if (e.stdout) process.stdout.write(e.stdout);
        if (e.stderr) process.stderr.write(e.stderr);
        return null;
    }
}

// 关键：用单引号包裹远程命令；远程命令中的单引号用 '\'' 转义
function ssh(cmd) {
    const escaped = cmd.replace(/'/g, "'\\''");
    return run(`ssh root@45.77.46.164 '${escaped}'`);
}

// ========== 1. 清理 sites-enabled 里的备份 ==========
ssh("rm -f /etc/nginx/sites-enabled/qizi-website.bak*");
ssh("ls -la /etc/nginx/sites-enabled/");

// ========== 2. 用 Python 在服务器上插入缓存规则 ==========
// 写 Python 脚本内容（注意：Python 的 triple-quote 里不需要转义 $）
const pyScript = [
    'CONF = "/etc/nginx/sites-available/qizi-website"',
    'RULES_FILE = "/tmp/cache_rules.txt"',
    '',
    '# 规则内容（nginx location 块）',
    'rules = """',
    '    # =====================================================',
    '    # Cache optimization',
    '    # =====================================================',
    '',
    '    location ~* \\.(css|js|woff2?|ttf|eot|otf)$ {',
    '        root /root/website/dist;',
    '        access_log off;',
    '        expires 1y;',
    '        add_header Cache-Control "public, max-age=31536000, immutable" always;',
    '        try_files $uri =404;',
    '    }',
    '',
    '    location ~* \\.(png|jpg|jpeg|gif|webp|svg|ico)$ {',
    '        root /root/website/dist;',
    '        access_log off;',
    '        expires 30d;',
    '        add_header Cache-Control "public, max-age=2592000" always;',
    '        try_files $uri =404;',
    '    }',
    '',
    '    location ~* \\.html$ {',
    '        root /root/website/dist;',
    '        expires -1;',
    '        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0" always;',
    '    }',
    '"""',
    '',
    'with open(RULES_FILE, "w") as f:',
    '    f.write(rules)',
    'print("rules written")',
    '',
    '# 读取原配置',
    'with open(CONF, "r") as f:',
    '    original = f.read()',
    '',
    'marker = "    # 1. 网页前端静态文件"',
    'if marker not in original:',
    '    print("ERROR: marker not found in", CONF)',
    '    import sys; sys.exit(1)',
    '',
    '# 在 marker 行之前插入 rules（去掉前后空白，加两个换行）',
    'new_content = original.replace(marker, rules.strip() + "\\n\\n" + marker, 1)',
    '',
    'with open(CONF + ".new", "w") as f:',
    '    f.write(new_content)',
    '',
    'print("OK: orig lines =", len(original.splitlines()), "new lines =", len(new_content.splitlines()))',
].join('\n');

const b64 = Buffer.from(pyScript).toString('base64');
console.log('python script b64 length:', b64.length);

// 通过 base64 把脚本传到服务器并执行
ssh(`echo '${b64}' | base64 -d > /tmp/patch.py && python3 /tmp/patch.py`);

// 预览插入的内容
ssh("echo '--- preview ---' && grep -n -B 2 -A 5 'Cache optimization' /etc/nginx/sites-available/qizi-website.new");

// 替换原文件
ssh("cp /etc/nginx/sites-available/qizi-website /tmp/qizi-website.lastok && mv /etc/nginx/sites-available/qizi-website.new /etc/nginx/sites-available/qizi-website && echo 'replaced'");

// 验证 nginx 语法
ssh("echo '=== nginx -t ===' && nginx -t 2>&1");
ssh("echo '=== nginx reload ===' && nginx -s reload 2>&1 && echo RELOAD_OK");

// 确认新增 location 块
ssh("echo '=== grep new locations ===' && grep -n -E 'Cache optimization|immutable|no-cache|Cache-Control' /etc/nginx/sites-available/qizi-website");

// curl 检测线上响应头
ssh("echo '=== curl CSS headers ===' && curl -s -I https://qiziwenhua.top/assets/index-BBGZcTfU.css | grep -iE 'cache-control|cf-cache-status|age|last-modified'");
ssh("echo '=== curl HTML headers ===' && curl -s -I https://qiziwenhua.top/video2 | grep -iE 'cache-control|cf-cache-status|age|last-modified'");

console.log('\n=== ALL DONE ===');
