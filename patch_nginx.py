import sys, os

CONF = "/etc/nginx/sites-available/qizi-website"

rules = """
    # =====================================================
    # Cache optimization
    # =====================================================

    location ~* \.(css|js|woff2?|ttf|eot|otf)$ {
        root /root/website/dist;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location ~* \.(png|jpg|jpeg|gif|webp|svg|ico)$ {
        root /root/website/dist;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, max-age=2592000" always;
        try_files $uri =404;
    }

    location ~* \.html$ {
        root /root/website/dist;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate, max-age=0" always;
    }
"""

# 备份原配置
os.system(f"cp {CONF} {CONF}.bak.$(date +%s)")

# 读取原配置
with open(CONF, "r") as f:
    original = f.read()

marker = "    # 1. 网页前端静态文件"
if marker not in original:
    print("ERROR: marker not found in", CONF)
    sys.exit(1)

# 在 marker 行之前插入 rules
new_content = original.replace(marker, rules.strip() + "\n\n" + marker, 1)

with open(CONF + ".new", "w") as f:
    f.write(new_content)

print("OK: orig lines =", len(original.splitlines()), "new lines =", len(new_content.splitlines()))

# 替换
os.system(f"mv {CONF}.new {CONF}")
print("replaced", CONF)

# 测试语法
os.system("nginx -t 2>&1")

# 重载
os.system("nginx -s reload 2>&1")
print("RELOAD_OK")

# 验证
os.system("grep -nE 'Cache optimization|immutable|no-cache|Cache-Control' /etc/nginx/sites-available/qizi-website")
