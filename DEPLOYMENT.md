# راهنمای دیپلوی پروژه انارستان

این راهنما برای دیپلوی پروژه Nuxt.js روی هاست با cPanel، Node.js و MySQL است.

## پیش‌نیازها

- Node.js (نسخه 18 یا بالاتر)
- MySQL
- Redis (اختیاری اما توصیه می‌شود)
- دسترسی SSH به سرور
- دسترسی به cPanel

## ⚠️ نکته مهم: انتقال فایل‌ها

**باید کل پروژه را به سرور انتقال دهید** و در سرور build کنید. دلایل:

1. فایل‌های `public/` (فونت‌ها، CSS، آپلودها) در `.output` قرار نمی‌گیرند
2. Nuxt در runtime به فایل‌های `server/` و `shared/` نیاز دارد
3. برای به‌روزرسانی‌های بعدی نیاز به کد منبع دارید
4. فایل‌های استاتیک باید در مسیر درست باشند

**راه حل**: کل پروژه را با Git یا FTP به سرور انتقال دهید و در سرور build کنید.

## مراحل دیپلوی

### 1. آماده‌سازی فایل‌های محیطی

#### در محیط Development (محلی):

فایل `.env.development` را با مقادیر محلی خود تنظیم کنید.

#### در محیط Production (سرور):

فایل `.env.production` را با مقادیر سرور خود تنظیم کنید.

**نکته**: فایل `.env.production` را در سرور ایجاد کنید و مقادیر را از cPanel یا اطلاعات هاست خود وارد کنید.

### 2. تنظیمات cPanel

#### 2.1. ایجاد دیتابیس MySQL

1. وارد cPanel شوید
2. به بخش "MySQL Databases" بروید
3. یک دیتابیس جدید ایجاد کنید (مثلاً: `anaarest_anar_db`)
4. یک کاربر MySQL ایجاد کنید (مثلاً: `anaarest_kiumarsi`)
5. کاربر را به دیتابیس اضافه کنید و تمام دسترسی‌ها را بدهید
6. اطلاعات را در `.env.production` وارد کنید

#### 2.2. نصب Node.js

1. در cPanel به بخش "Setup Node.js App" بروید
2. روی "Create Application" کلیک کنید
3. تنظیمات را به این صورت وارد کنید:
   - **Node.js Version**: آخرین نسخه LTS (مثلاً 18.x یا 20.x)
   - **Application Mode**: Production
   - **Application Root**: مسیر پروژه شما (مثلاً: `public_html/anarstan` یا `anarstan`)
   - **Application URL**: دامنه یا subdomain شما (مثلاً: `anarestan.ir`)
   - **Application Startup File**: `.output/server/index.mjs` (بعد از build)
   - **Passenger Log File**: `logs/passenger.log`

### 3. آپلود فایل‌ها به سرور

#### روش 1: استفاده از Git (توصیه می‌شود)

```bash
# در سرور
cd ~/public_html/anarstan  # یا مسیر مورد نظر
git clone https://github.com/yourusername/anarstan.git .
```

#### روش 2: استفاده از FTP/SFTP

1. تمام فایل‌های پروژه را به سرور آپلود کنید
2. مطمئن شوید که فایل‌های زیر آپلود شده‌اند:
   - تمام فایل‌های `app/`
   - تمام فایل‌های `server/`
   - تمام فایل‌های `public/`
   - تمام فایل‌های `shared/`
   - `package.json`, `nuxt.config.ts`, `tsconfig.json`
   - `.env.production` (اما نه `.env.development`)

### 4. نصب Dependencies

```bash
# وارد دایرکتوری پروژه شوید
cd ~/public_html/anarstan  # یا مسیر مورد نظر

# نصب pnpm (اگر نصب نیست)
npm install -g pnpm

# نصب dependencies
pnpm install --production=false
```

### 5. تنظیم متغیرهای محیطی

#### روش 1: استفاده از فایل .env.production (توصیه می‌شود)

فایل `.env.production` را در ریشه پروژه ایجاد کنید و مقادیر را وارد کنید.

#### روش 2: تنظیم در cPanel Node.js App

1. به بخش "Setup Node.js App" بروید
2. روی "Edit" کنار اپلیکیشن خود کلیک کنید
3. در بخش "Environment Variables" متغیرهای زیر را اضافه کنید:

```
NODE_ENV=production
NUXT_PUBLIC_SITE_URL=https://anarestan.ir
NUXT_PUBLIC_SITE_NAME_FA=انارستان
NUXT_PUBLIC_SITE_NAME_EN=anarestan
NUXT_PUBLIC_MASHHAD_PHONE=05138484545
DB_HOST=localhost
DB_USER=anaarest_kiumarsi
DB_PASSWORD=Haf.7483mys
DB_NAME=anaarest_anar_db
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=G9f!7dKp@3qLm#XvZ8rT2yB6uW1eH0
PORT=8140
```

**نکته مهم**: اگر از فایل `.env.production` استفاده می‌کنید، مطمئن شوید که Nuxt آن را می‌خواند. در برخی هاست‌ها باید متغیرها را در cPanel هم تنظیم کنید.

### 6. Build پروژه

```bash
# Build برای production
NODE_ENV=production pnpm build

# یا استفاده از اسکریپت
pnpm run build:prod
```

یا:

```bash
# استفاده از فایل .env.production
export $(cat .env.production | grep -v '^#' | xargs) && pnpm build
```

**نکته**: بعد از build، فولدر `.output` ایجاد می‌شود که شامل فایل‌های build شده است.

### 7. تنظیم Startup File در cPanel

بعد از build، فایل startup در مسیر `.output/server/index.mjs` قرار می‌گیرد.

در cPanel Node.js App:

- **Application Startup File**: `.output/server/index.mjs`

### 8. تنظیم Port

در فایل `.env.production` شما `PORT=8140` تنظیم شده است. اگر cPanel از Passenger استفاده می‌کند، نیازی به تنظیم port نیست (Passenger خودش مدیریت می‌کند). اما اگر از PM2 یا روش دیگری استفاده می‌کنید، باید port را تنظیم کنید.

### 9. راه‌اندازی اپلیکیشن

در cPanel:

1. به "Setup Node.js App" بروید
2. روی "Restart App" کلیک کنید

یا از طریق SSH:

```bash
# اگر از PM2 استفاده می‌کنید
pm2 start .output/server/index.mjs --name anarstan

# یا مستقیماً (برای تست)
NODE_ENV=production node .output/server/index.mjs
```

### 10. بررسی لاگ‌ها

برای بررسی مشکلات:

```bash
# لاگ‌های Passenger
tail -f logs/passenger.log

# لاگ‌های Nuxt (اگر وجود دارد)
tail -f .output/logs/*.log
```

### 11. تنظیمات اضافی

#### 11.1. تنظیم Cron Job (اگر نیاز دارید)

در cPanel به بخش "Cron Jobs" بروید و jobهای مورد نیاز را اضافه کنید.

#### 11.2. تنظیم SSL

در cPanel به بخش "SSL/TLS Status" بروید و SSL را فعال کنید.

#### 11.3. تنظیمات امنیتی

- مطمئن شوید فایل `.env.production` در `.gitignore` است
- فایل‌های حساس را از دسترسی عمومی خارج کنید
- از رمزهای قوی استفاده کنید
- فایل `.env.development` را در سرور آپلود نکنید

## ساختار فایل‌ها در Production

```
~/public_html/anarstan/
├── .output/              # فایل‌های build شده (بعد از build)
├── .env.production       # متغیرهای محیطی production
├── node_modules/         # Dependencies
├── public/               # فایل‌های استاتیک (فونت‌ها، CSS، آپلودها)
│   ├── css/
│   ├── fonts/
│   └── uploads/
├── server/               # کدهای سرور
├── app/                  # کدهای frontend
├── shared/               # کدهای مشترک
├── package.json
├── nuxt.config.ts
└── ...
```

## عیب‌یابی

### مشکل: اپلیکیشن شروع نمی‌شود

1. لاگ‌ها را بررسی کنید: `logs/passenger.log`
2. مطمئن شوید Node.js version درست است
3. بررسی کنید که build انجام شده است (فولدر `.output` وجود دارد)
4. متغیرهای محیطی را بررسی کنید
5. بررسی کنید که فایل `.output/server/index.mjs` وجود دارد

### مشکل: خطای اتصال به دیتابیس

1. اطلاعات دیتابیس در `.env.production` را بررسی کنید
2. مطمئن شوید کاربر MySQL دسترسی دارد
3. بررسی کنید که دیتابیس ایجاد شده است
4. از cPanel بررسی کنید که کاربر به دیتابیس متصل است

### مشکل: خطای Redis

1. اگر Redis ندارید، می‌توانید آن را غیرفعال کنید (اما نیاز به تغییر کد دارید)
2. یا از یک سرویس Redis خارجی استفاده کنید
3. یا Redis را در هاست خود نصب کنید

### مشکل: فایل‌های استاتیک لود نمی‌شوند

1. مطمئن شوید فولدر `public/` در سرور وجود دارد
2. بررسی کنید که فایل‌های فونت در `public/fonts/` هستند
3. بررسی کنید که CSS در `public/css/` است

## به‌روزرسانی پروژه

```bash
# Pull آخرین تغییرات
git pull origin main

# نصب dependencies جدید
pnpm install

# Build مجدد
NODE_ENV=production pnpm build

# Restart اپلیکیشن در cPanel
```

## نکات امنیتی

1. **هرگز** فایل `.env.production` را در Git commit نکنید
2. از رمزهای قوی برای JWT_SECRET استفاده کنید
3. اطلاعات دیتابیس را محرمانه نگه دارید
4. SSL را فعال کنید
5. به‌روزرسانی‌های امنیتی را انجام دهید
6. فایل `.env.development` را در سرور آپلود نکنید

## پشتیبانی

در صورت بروز مشکل، لاگ‌های زیر را بررسی کنید:

- `logs/passenger.log` - لاگ‌های Passenger
- `.output/logs/` - لاگ‌های Nuxt (اگر وجود دارد)
- لاگ‌های cPanel
- لاگ‌های MySQL در cPanel
