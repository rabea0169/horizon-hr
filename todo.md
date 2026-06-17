
# تقرير التدقيق الشامل - Horizon HR ERP

---

## الملخص التنفيذي

مشروع **Horizon HR** هو نظام ERP متكامل لإدارة مصانع الملابس، يغطي 14 فئة و~75 وحدة تشغيلية. يتميز ببنية متينة للمجال الوظيفي (104 جدول، علاقات Drizzle كاملة، استخدام صحيح لـ DECIMAL للأموال). **ومع ذلك، هناك مشاكل جوهرية تمنع إطلاقه للإنتاج دون معالجة عاجلة.**

### نقاط القوة
- تغطية وظيفية ممتازة (من الموارد البشرية إلى المحاسبة الكاملة والمخازن والإنتاج)
- فصل واضح للطبقات (React Frontend ← tRPC API ← Drizzle ORM ← MySQL)
- جميع القيم المالية مكتوبة بنوع `DECIMAL` وليس `FLOAT`
- Lazy loading لجميع الصفحات (~80 صفحة) مع Code Splitting
- دعم كامل لـ PWA و Electron و Android عبر Capacitor
- قوائم تحقق `Zod` على معظم مدخلات API

### المشاكل الحرجة

| المجموع | خطير | عالي | متوسط | منخفض |
|---------|------|------|-------|-------|
| 38 | 10 | 14 | 10 | 4 |

---

## أولاً: القضايا الأمنية (Security Audit)

### 🔴 خطير

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| S1 | `api/auth-router.ts:10-13` + `src/hooks/useRoles.ts:63-68` | **كلمات مرور بنص واضح** - 4 مستخدمين hardcoded مع مقارنة مباشرة | أي شخص يطلع على الكود المصدر يستطيع تسجيل الدخول بالمعلومات المخزنة | استخدم `bcryptjs` (موجود فعلاً في package.json) لتخزين `hashed` passwords؛ انتقل إلى جدول `users` في قاعدة البيانات |
| S2 | `api/horizon-auth.ts:8` | **مفتاح JWT ثابت** - القيمة الاحتياطية `horizon-hr-secret-key-change-in-production` | تزوير أي توكن JWT والوصول للنظام بأي صلاحية | حدد `HORIZON_JWT_SECRET` قوياً (≥32 حرفاً) في `.env.production` وأزِل القيمة الاحتياطية |
| S3 | `api/lib/cookies.ts:14` + `src/providers/trpc.tsx:24` | **لا توجد حماية CSRF** - الكوكيز `SameSite=None` في الإنتاج مع إرسال التوثيقات `credentials: include` | هجوم CSRF عبر أي موقع خارجي يرسل طلباً إلى الـ API بعد تسجيل الدخول | أضف توكن CSRF؛ استخدم `SameSite=Lax` دائماً؛ أو استخدم Header مخصص (`X-CSRF-Token`) |
| S4 | `src/pages/BarcodeGenerator.tsx:311` | **ثغرة XSS في طباعة الباركود** - استخدام `document.write(html)` مع بيانات قد تكون قابلة للتلاعب | تنفيذ سكربتات ضارة عند فتح نافذة الطباعة | استخدم `document.createElement` و `appendChild` بدلاً من `document.write` |
| S5 | `src/components/ErrorBoundary.tsx:57-60` | **تسريب معلومات عبر الخطأ** - عرض `error.message` كامل للمستخدم | كشف تفاصيل داخلية عن النظام للمهاجمين | عرض رسالة خطأ عامة ("حدث خطأ غير متوقع") وتسجيل التفاصيل في الكونسول فقط |
| S6 | `capacitor.config.ts:11-17` | **تطبيق Android يسمح بـ HTTP** - `cleartext: true` + `allowNavigation: ['*']` + `androidScheme: 'http'` + `allowMixedContent: true` | هجمات MITM، سرقة بيانات الجلسة، التنقل لمواقع ضارة | استخدم `androidScheme: 'https'`، عطّل `cleartext`، حدد `allowNavigation` بالنطاقات المسموحة فقط |

### 🟡 عالي

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| S7 | `api/invoice-router.ts`, `voucher-router.ts`, `grn-router.ts`, `quotation-router.ts`, `settings-router.ts`, `audit-router.ts`, `sam-router.ts`, `linebalance-router.ts`, `maintenance-router.ts`, `leave-router.ts` | **نقاط API عامة بدون توثيق** - جميع الـ endpoints تستخدم `publicQuery` | أي شخص (حتى بدون تسجيل دخول) يستطيع إنشاء/قراءة/تعديل/حذف فواتير، سندات، إشعارات استلام بضاعة، عروض أسعار | حول جميع النقاط إلى `authedQuery` وأضف `requireRole` حسب الحاجة |
| S8 | `api/portable/server.js:148-150` | **CORS عام في الخادم المحمول** - `Access-Control-Allow-Origin: *` | أي موقع على الشبكة يستطيع استدعاء API الخادم المحمول | حدد أصولاً مسموحة أو استخدم `req.headers.origin` مع قائمة بيضاء |
| S9 | `.env`, `.env.development` | **ملفات env تحتوي على بيانات حقيقية** - `DATABASE_URL` مع باسورد `password` | تسريب بيانات قاعدة البيانات وكلمة سر التطبيق | أزل ملفات `.env.*` من التتبع (`git rm --cached`)؛ استخدم `git-crypt` أو `sops` للإدارة |
| S10 | `api/auth-router.ts:23-25` | **مقارنة كلمات المرور بدون Hashing** - مقارنة نصية مباشرة `u.password === input.password` | كشف كلمات المرور في حالة اختراق قاعدة البيانات | استخدم `bcrypt.compare()` بدلاً من المقارنة المباشرة |
| S11 | نظام المصادقة بالكامل | **لا يوجد Rate Limiting** على نقاط تسجيل الدخول | إمكانية هجوم تخمين كلمة المرور (Brute Force) | أضف `@hono/rate-limiter` أو تنفيذ مخصص مع تخزين مؤقت |
| S12 | `src/providers/trpc.tsx:18` | **JWT Token مخزن في `sessionStorage` + `localStorage`** | أي ثغرة XSS تسمح بسرقة التوكن | استخدم `httpOnly` cookies بدلاً من تخزين التوكن في JavaScript |
| S13 | `api/kimi/session.ts:14` | **صلاحية التوكن سنة كاملة** - `setExpirationTime("1 year")` | نافذة هجوم طويلة جداً عند تسريب التوكن | قلل الصلاحية إلى 24 ساعة كحد أقصى وأضف Refresh Token |
| S14 | **`/api/trpc/*`** | **لا يوجد HTTPS** - الخادم يعمل على HTTP فقط | جميع البيانات (كلمات مرور، توكنات) تنتقل بنص واضح | استخدم reverse proxy (Nginx/Caddy) مع Let's Encrypt في الإنتاج |

---

## ثانياً: قواعد البيانات (Database Quality)

### 🔴 خطير

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| D1 | `db/create-tables.ts` | **ملف إنشاء الجداول ناقص** - ينشئ فقط ~60 جدول من أصل 104 | الجداول 61-104 (الفواتير، السندات، المحاسبة، الشحن، إلخ) لن يتم إنشاؤها أبداً بهذا الملف | استخدم Drizzle Migrations (`drizzle-kit generate` + `drizzle-kit migrate`) بدلاً من الملف اليدوي |
| D2 | `db/create-tables.ts` + `db/schema.ts` | **مصدرا حقيقة منفصلان** - `schema.ts` (Drizzle DSL) و `create-tables.ts` (SQL يدوي) قد يختلفان | إمكانية وجود جداول في الكود غير موجودة في قاعدة البيانات والعكس | احذف `create-tables.ts` واعتمد كلياً على Drizzle Migrations |
| D3 | `db/schema.ts:1823-1825` | **قيم مالية مخزنة كـ VARCHAR** - `unitPrice: varchar(50)` و `total: varchar(50)` في `purchase_order_items` | أخطاء في الفرز، المقارنة، والعمليات الحسابية | استخدم `decimal("unitPrice", { precision: 10, scale: 2 })` |

### 🟡 عالي

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| D4 | جميع جداول `create-tables.ts` | **لا يوجد Foreign Keys على مستوى قاعدة البيانات** | فقدان التكامل المرجعي؛ بيانات يتيمة محتملة | أضف `REFERENCES` إلى جمل `CREATE TABLE` |
| D5 | جميع الجداول | **لا يوجد Indexes على أعمدة Foreign Keys** (مثل `employeeId`, `departmentId`, `modelId`) | استعلامات JOIN بطيئة جداً مع نمو البيانات | أضف `index()` على كل أعمدة FK في Drizzle schema |
| D6 | `style_color_size_matrix` | **لا يوجد Unique Constraint على المجموعة المنطقية** `(modelId, styleCode, color, size)` | إمكانية تكرار نفس التركيبة عدة مرات | أضف `unique("uq_color_size", ["modelId", "styleCode", "color", "size"])` |
| D7 | أي جدول به `TEXT` (صور base64) | **حقول TEXT لتخزين الصور** - مثل `users.avatar`, `employees.avatar`, `productionModels.baseImage` | زيادة حجم قاعدة البيانات بسرعة، بطء في النسخ الاحتياطي، بطء الاستعلامات | استخدم تخزين ملفات (S3/CDN) وخزن الـ URL فقط في قاعدة البيانات |
| D8 | جداول `salesRepVisits`, `salesRepOrders` | **تطبيع ضعيف (Denormalization)** - تكرار بيانات العميل (`customerName`, `customerPhone`, `customerAddress`) | عدم اتساق البيانات، مشاكل في التحديث | استخدم مفاتيح خارجية لجدول `crm_customers` |
| D9 | `attendance`, `leaves`, `modelStages`, `pieceRateRecords` وغيرها | **حقل `updatedAt` مفقود** في ~40 جدول | لا يمكن تتبع آخر تعديل | أضف `updatedAt: timestamp("updatedAt").onUpdateNow().notNull()` |

### 🟢 متوسط

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| D10 | `generalLedger`, `treasuryTransactions`, `auditLog`, `activities` | **لا يوجد استراتيجية لـ Partitioning** - جداول سريعة النمو بدون تقسيم | تدهور الأداء مع تراكم البيانات | استخدم MySQL `RANGE PARTITIONING` حسب الشهر/السنة |

---

## ثالثاً: المعاملات والتزامن (Transactions & Concurrency)

### 🔴 خطير

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| T1 | **جميع الـ Routers** | **لا توجد معاملات (Transactions) في أي عملية متعددة الخطوات** - صفر استخدام `db.transaction()` | فقدان التناسق الكامل للبيانات عند الفشل في منتصف العملية (مرتبات، مخازن، محاسبة، مقاصة) | لف كل عملية متعددة الخطوات بـ `db.transaction()` مع `rollback` عند الخطأ |
| T2 | `sales-router.ts:54-76` | **قراءة-ثم-كتابة في المخزون بدون قفل** - خصم من المخزون | بيع نفس القطعة مرتين (Overselling) في حالة الطلبات المتزامنة | استخدم `db.transaction()` مع استعلام تحديث ذري (`UPDATE ... SET quantity = quantity - X`) |
| T3 | `goods-receipt-router.ts:88-111` | **حلقة قراءة-ثم-كتابة في المخزون** - إضافة مخزون صنف بصنف في loop | عدم تناسق المخزون إذا فشلت العملية في منتصف الحلقة | استخدم `db.transaction()` حول الحلقة الكاملة |
| T4 | `payroll-router.ts:141-171` | **إدراج كشوف المرتبات بدون معاملة** - عدة عمليات إدراج متتالية | كشوف مرتبات غير مكتملة عند فشل العملية في منتصفها | استخدم `db.transaction()` |
| T5 | `phase6-router.ts:304-341` | **تحديث حساب الخزينة بدون معاملة** - معاملة خزينة + تحديث رصيد + قيد محاسبي في 3 استعلامات منفصلة | رصيد خزينة غير متطابق مع القيود المحاسبية | لف الثلاث عمليات في `db.transaction()` |
| T6 | `purchase-request-router.ts:57-132` | **تحويل طلب شراء لأمر شراء بدون معاملة** - 5+ عمليات متتالية | أمر شراء مقطوع بدون بنود أو طلب شراء عالق في حالة وسيطة | استخدم `db.transaction()` |

---

## رابعاً: جودة الكود والهيكلة (Code Quality & Architecture)

### 🟡 عالي

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| C1 | جميع `*-router.ts` | **استخدام `throw new Error()` بدلاً من `TRPCError`** في جميع الـ Routers (41 ملف) | جميع الأخطاء تظهر كـ 500 Internal Server Error مع رسائل عامة | استخدم `TRPCError` مع `code` مناسب (`NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`) |
| C2 | جميع الملفات | **104 استخداماً لـ `as any`** - كسر كامل لنظام الأنواع في TypeScript | فقدان كل فوائد TypeScript؛ أخطاء وقت التشغيل غير مكتشفة | استخدم الأنواع الصحيحة لكل insert/update (متوفرة عبر `$inferInsert`) |
| C3 | `api/lib/env.ts` + `api/lib/vite.ts` + `api/context.ts` | **الاستثناءات تُبتلع بصمت** - `try/catch` بدون logs في `context.ts` | أعطال المصادقة الصامتة التي يصعب تتبعها | سجل (`console.error`) كل استثناء حتى لو كان متوقعاً |
| C4 | `api/payroll-router.ts`, `finance-router.ts`, `phase6-router.ts` | **عدم تناسق أنواع القيم المالية** - بعضها `string`، بعضها `number`، بعضها `parseFloat` | أخطاء تقريب وتجميع (Rounding errors) | استخدم `number` أو `Decimal` class لكل القيم المالية في TypeScript |
| C5 | `api/boot.ts:28-35` | **سكربت بدء التشغيل معطل** - `npm run start` يشير إلى `dist/boot.js` لكن `npm run build` لا ينتج هذا الملف | تعطل كامل لعملية الإطلاق production | أضف خطوة compile لـ TypeScript في `build` script (`tsc -p tsconfig.server.json`) |
| C6 | جميع `*.bat` | **5 ملفات Batch عربية بأسماء Unicode** - `1-تثبيت-المتطلبات.bat` إلخ | قد لا تعمل في بعض الأنظمة/الطرفيات | استخدم أسماء إنجليزية مع أسماء عربية كملفات منفصلة (shortcuts) |
| C7 | `src/hooks/useLocalData.ts` (750 سطر) | **ملف كامل غير مستخدم** - كل الدوال تعيد تصدير من `useApiData.ts` مع تعليق "Server is now source of truth" | 750 سطراً من الـ dead code تصعّب الصيانة | احذف الملف وأعد توجيه الاستيرادات |
| C8 | `src/pages/Home.tsx` | **صفحة Home قديمة غير مستخدمة** - من القالب الافتراضي لـ Vite | تشويش وتضليل للمطورين | احذف الملف |
| C9 | `api/queries/users.ts` (36 سطر) | **ملف queries/users.ts غير مستخدم** - لم يتم استيراده في أي مكان | Dead code | احذف الملف |
| C10 | 37 Router مستوردة في `router.ts` ولكن منها **13 تستخدم `publicQuery`** لجميع الـ endpoints | **انتهاك مبدأ Least Privilege** - صلاحيات أوسع من اللازم | وصول غير مصرح به لبيانات حساسة | طبق `authedQuery` كافتراضي و `publicQuery` فقط للحالات التي تتطلب وصولاً عاماً |

### 🟢 متوسط

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| C11 | `api/router.ts:23` | **notification مسجل مرتين** - `notification: notificationApiRouter` (سطر 72) و `notifications: notificationApiRouter` (سطر 136) | تكرار غير ضروري | احذف النسخة المكررة |
| C12 | جميع صفحات React (~80 ملف) | **نماذج `useState` يدوية بدلاً من `react-hook-form` + Zod** - معظم الصفحات لا تستخدم `react-hook-form` رغم وجوده | عدم اتساق في التحقق من المدخلات، تطويل الكود | انتقل تدريجياً إلى `react-hook-form` + `zod` لكل النماذج |
| C13 | `src/index.css` | **نمط CSS مكرر عبر المكونات** - أنماط theme مكتوبة في CSS بدلاً من Tailwind classes | انتهاك مبدأ DRY؛ صعوبة الصيانة | استخدم `tailwind.config.js` لتعريف أنماط الثيم |
| C14 | `src/providers/trpc.tsx` | **لا يوجد `getBaseUrl()` مناسب للإنتاج** - يستخدم `window.location.origin` مما يحد من النشر في بيئات معقدة | مشاكل في الاتصال عند النشر خلف reverse proxy | استخدم متغير بيئة `VITE_API_URL` كقاعدة URL |

---

## خامساً: الاختبارات و CI/CD (Testing & Deployment)

### 🔴 خطير

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| E1 | المشروع كاملاً | **لا يوجد أي اختبار** (Unit/Integration) - Vitest مهيأ لكن صفر ملفات اختبار | لا توجد أي شبكة أمان للتغييرات؛ أي تغيير قد يكسر النظام دون اكتشاف | اكتب اختبارات للـ API Routers (vitest)، على الأقل لـ auth والحسابات المالية |
| E2 | المشروع كاملاً | **لا يوجد CI/CD pipeline** - لا GitHub Actions ولا GitLab CI ولا Docker | لا يمكن نشر التحديثات بشكل آلي وموثوق | أنشئ GitHub Actions workflow للـ lint + test + build |
| E3 | `vitest.config.ts` | **Vitest مهيأ لاختبارات API فقط** (`api/**/*.test.ts`) لكن بدون أي اختبارات | وهم وجود اختبارات (الـ test pass = 0 tests) | أضف اختبارات فعلية أو أزل التهيئة إن لم تكن جاهزاً |
| E4 | المشروع كاملاً | **لا يوجد Docker/docker-compose** - لا توجد بيئة إنتاج محددة | صعوبة ضمان بيئة متطابقة بين Dev/Staging/Production | أنشئ `Dockerfile` و `docker-compose.yml` مع MySQL |

### 🟡 عالي

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| E5 | `package.json:11` | **سكربت `start` معطل** - `node dist/boot.js` لا يتم إنتاجه | لا يمكن تشغيل النظام في الإنتاج | أضف `tsc -p tsconfig.server.json` إلى سكربت `build` |
| E6 | المشروع كاملاً | **لا يوجد Monitoring/Alerting** (لا Sentry ولا نظام مراقبة) | لا يمكن اكتشاف الأعطال أو مشاكل الأداء في الإنتاج | أضف Sentry للـ frontend والـ backend |
| E7 | `public/index.html:7-9` | **لا يوجد `<link rel="manifest">`** في index.html رغم وجود `manifest.json` | PWA لا تعمل كـ standalone app على أندرويد/iOS | أضف `<link rel="manifest" href="/manifest.json">` في `<head>` |

### 🟢 متوسط

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| E8 | `README.md` | **README قالب Vite الافتراضي** - لا يصف المشروع أو كيفية تشغيله | يصعب على المطورين الجدد فهم المشروع | اكتب README حقيقي يشرح المتطلبات، التثبيت، البنية، والنشر |
| E9 | المشروع كاملاً | **لا يوجد توثيق API** (Swagger/OpenAPI) - tRPC يولد الأنواع لكن لا يوجد وصف بشري | صعوبة التكامل مع أنظمة خارجية | استخدم `trpc-openapi` لتوليد توثيق Swagger |
| E10 | `api/boot.ts` | **لا يوجد `/health` endpoint** لفحص صحة الخادم | لا يمكن استخدام Load Balancer أو مراقبة الصحة | أضف `app.get("/api/health", (c) => c.json({ status: "ok" }))` |

---

## سادساً: الأداء (Performance)

### 🟡 عالي

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| P1 | جميع `*-router.ts` | **N+1 Queries محتملة** - استخدام `findFirst` داخل loops في `goods-receipt-router.ts:88-111`, `sales-router.ts:54-76` | بطء شديد مع زيادة عدد العناصر في العملية الواحدة | استخدم `db.batch` أو `Promise.all` بدلاً من الحلقات المتسلسلة |
| P2 | جميع القوائم | **لا يوجد Pagination موحد** - بعض الحالات تستخدم `limit(200)` بشكل ثابت | تحميل 200 سجل في كل استعلام حتى لو يحتاج المستخدم 10 فقط | استخدم `cursor`-based pagination أو `offset/limit` مع معلمات من العميل |
| P3 | `db/queries/connection.ts` | **اتصال قاعدة بيانات واحد (Singleton)** - اتصال واحد لكل التطبيق | لا يمكن التوسع الأفقي (Horizontal scaling)؛ نقطة فشل واحدة | استخدم Pool Connections |
| P4 | جميع الـ Lists | **لا يوجد Caching** - كل طلب يعيد الاستعلام من قاعدة البيانات | ضغط غير ضروري على قاعدة البيانات | أضف `cache-control` headers واستخدم React Query's `staleTime` بشكل أفضل |

### 🟢 متوسط

| # | الموقع | المشكلة | التأثير | الحل المقترح |
|---|--------|---------|---------|--------------|
| P5 | `api/lib/vite.ts` | **استخدام bodyLimit(50MB)** - حد 50MB للـ body | استهلاك ذاكرة عالي للطلبات الكبيرة | قلص الحد إلى 5-10MB للحالات العادية |
| P6 | جميع الجداول الكبيرة (GeneralLedger, TreasuryTransactions) | **لا يوجد Archiving Strategy** - البيانات تتراكم بدون حل | تدهور الأداء مع مرور الوقت | أضف سياسة أرشفة للبيانات التي مضى عليها أكثر من سنة |

---

## قائمة الأولويات للإصلاحات قبل الإطلاق

### المرحلة الأولى - حرجة فوراً (Pre-Launch Blockers)

| الأولوية | المشكلة | التصنيف |
|----------|---------|---------|
| 1 | 🔴 **إصلاح سكربت البناء** - `npm run build` يجب أن ينتج `dist/boot.js` | E5, C5 |
| 2 | 🔴 **إزالة كلمات المرور الثابتة من الكود** - استخدام `bcryptjs` + جدول `users` في DB | S1 |
| 3 | 🔴 **إزالة مفتاح JWT الاحتياطي الثابت** - تعيين `HORIZON_JWT_SECRET` قوي | S2 |
| 4 | 🔴 **إضافة Transaction لجميع العمليات المالية** - خاصة Payroll، المخزون، الخزينة، القيود المحاسبية | T1-T6 |
| 5 | 🔴 **تصحيح `purchaseOrderItems.unitPrice` من VARCHAR إلى DECIMAL** | D3 |
| 6 | 🔴 **تأمين الـ endpoints العامة** - تحويل `publicQuery` إلى `authedQuery` للفواتير، السندات، GRNs | S7 |
| 7 | 🔴 **إضافة Foreign Keys و Indexes لقاعدة البيانات** | D4, D5 |
| 8 | 🔴 **إضافة HTTPS/SSL** في الإنتاج (Nginx/Caddy reverse proxy) | S14 |

### المرحلة الثانية - عالية الأهمية (Before Production)

| الأولوية | المشكلة | التصنيف |
|----------|---------|---------|
| 9 | 🔴 **إضافة Rate Limiting على نقاط تسجيل الدخول** | S11 |
| 10 | 🔴 **استخدام httpOnly cookies بدلاً من sessionStorage للـ JWT** | S12 |
| 11 | 🔴 **إضافة CSRF Protection** | S3 |
| 12 | 🔴 **تأمين Capacitor config** - `cleartext: false`, `allowNavigation` محدد | S6 |
| 13 | 🟡 **إصلاح خلق الجداول** - التخلص من `create-tables.ts` واستخدام Drizzle Migrations | D1, D2 |
| 14 | 🟡 **إضافة `<link rel="manifest">` في index.html** | E7 |
| 15 | 🟡 **استبدال `throw new Error` بـ `TRPCError`** في كل الـ Routers | C1 |
| 16 | 🟡 **تقليل استخدام `as any`** - البدء بالعمليات الحرجة (المالية) | C2 |

### المرحلة الثالثة - متوسطة (Within First Month)

| الأولوية | المشكلة | التصنيف |
|----------|---------|---------|
| 17 | 🟡 **إضافة اختبارات للـ API** (على الأقل للـ Auth و Payroll و Inventory) | E1 |
| 18 | 🟡 **إعداد GitHub Actions CI/CD** | E2 |
| 19 | 🟡 **إعداد Sentry للمراقبة** | E6 |
| 20 | 🟡 **إضافة CORS مخصص لخادم Hono** (قائمة بيضاء) | S8 |
| 21 | 🟡 **حذف Dead Code** - `useLocalData.ts`, `Home.tsx`, `queries/users.ts` | C7, C8, C9 |
| 22 | 🟡 **إزالة ملفات `.env.*` من تتبع Git** | S9 |
| 23 | 🟡 **ضبط صلاحية توكن Kimi من 1 سنة إلى 24 ساعة** | S13 |
| 24 | 🟢 **إضافة `/api/health` endpoint** | E10 |
| 25 | 🟢 **إعادة كتابة README.md** | E8 |
| 26 | 🟢 **إضافة Pagination متسق لكل القوائم** | P2 |

### المرحلة الرابعة - تحسينية (Post-Launch)

| الأولوية | المشكلة | التصنيف |
|----------|---------|---------|
| 27 | 🟢 **إضافة Docker/docker-compose** | E4 |
| 28 | 🟢 **توثيق API بـ tRPC-OpenAPI** | E9 |
| 29 | 🟢 **إضافة Indexes على جميع FKs** | D5 |
| 30 | 🟢 **تغيير `public/index.html:manifest`** | E7 |
| 31 | 🟢 **استراتيجية أرشفة للبيانات القديمة** | P6 |
| 32 | 🟢 **تطبيع جداول المبيعات (Sales Rep)** | D8 |
| 33 | 🟢 **تحويل تخزين الصور من base64 إلى S3/CDN** | D7 |
| 34 | 🟢 **إضافة Database Connection Pool** | P3 |
| 35 | 🟢 **إضافة Caching Layer (Redis)** | P4 |

---

*تم إعداد التقرير في 13 يونيو 2026*
