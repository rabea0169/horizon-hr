#!/bin/bash
# ══════════════════════════════════════════════════════════════
# Horizon HR - Portable Server Launcher (Linux/macOS)
# ══════════════════════════════════════════════════════════════

cd "$(dirname "$0")"
PORTABLE_DIR="$(pwd)"

# ألوان
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Horizon HR - النسخة المحمولة                       ║${NC}"
echo -e "${BLUE}║          يعمل مباشرة من USB بدون تثبيت                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# التحقق من Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[⚠️] Node.js غير مثبت!${NC}"
    echo "[ℹ️]  تثبيت Node.js 20..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt install -y nodejs
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install node@20
    fi
fi

echo -e "${GREEN}[✓] Node.js: $(node -v)${NC}"
echo -e "${GREEN}[✓] المجلد: $PORTABLE_DIR${NC}"
echo -e "${GREEN}[✓] المنفذ: 3000${NC}"
echo -e "${GREEN}[✓] قاعدة البيانات: SQLite (محلية)${NC}"
echo ""

# إنشاء إعدادات افتراضية
if [ ! -f "$PORTABLE_DIR/server.json" ]; then
    echo '{"port":3000,"dbType":"sqlite","autoOpen":true}' > "$PORTABLE_DIR/server.json"
fi

# الحصول على IP للشبكة المحلية
IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ifconfig 2>/dev/null | grep "inet " | head -1 | awk '{print $2}' || echo "localhost")

echo -e "${BLUE}[🚀] تشغيل الخادم...${NC}"
echo -e "${YELLOW}[ℹ️]  افتح المتصفح على:${NC} http://localhost:3000"
echo -e "${YELLOW}[ℹ️]  أو على الهاتف بنفس WiFi:${NC} http://$IP:3000"
echo ""
echo -e "${RED}[⚡] اضغط Ctrl+C لإيقاف الخادم${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════════${NC}"
echo ""

# تشغيل الخادم
export PORTABLE_DIR="$PORTABLE_DIR"
export NODE_ENV="production"
export PORT="3000"

node "$PORTABLE_DIR/server.js"

echo ""
echo -e "${GREEN}[👋] تم إيقاف الخادم. شكراً لاستخدام Horizon HR!${NC}"
