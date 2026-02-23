# Change: Checkout Shipping 1.1

- **نام تغییر**: `checkout-shipping-1-1`
- **PRD مرجع**: [AI/prod/checkout-shipping.prod.1.1.md](mdc:AI/prod/checkout-shipping.prod.1.1.md)
- **هدف**: پیاده‌سازی کامل فاز **Shipping & Checkout** شامل:
  - سیستم آدرس‌دهی کاربر و ادمین
  - سیستم کوپن و تخفیف
  - چرخه حیات سفارش‌ها (Orders) و آیتم‌های سفارش
  - سیستم کیف پول (Wallet + Transaction Log)
  - مدیریت استان‌ها و شهرها با هزینه ارسال سلسله‌مراتبی
  - صفحه کلاینت‌ساید `/checkout/shipping` با معماری Widget/Model و Endpoint ولیدیشن قبل از درگاه

---

## نواحی تحت تأثیر

- **Backend / Database**
  - ایجاد/به‌روزرسانی جداول (در MySQL):
    - `addresses`
    - `coupons`
    - `orders`
    - `order_items`
    - `wallets`
    - `wallet_transactions`
    - `provinces`
    - `cities`
  - رعایت فیلدهای استاندارد مثل `id`, `created_at`, `updated_at` (و در صورت نیاز `deleted_at`).
- **Backend / API**
  - ایجاد CRUD کامل برای:
    - `GET/POST/PATCH/DELETE /api/addresses`
    - `GET/POST/PATCH/DELETE /api/coupons`
    - `GET/POST/PATCH/DELETE /api/orders`
    - `GET/POST/PATCH/DELETE /api/wallet` (یا تفکیک به `/wallets` و `/wallet/transactions` بر اساس الگوی پروژه)
    - `GET/POST/PATCH/DELETE /api/regions/provinces` و `/api/regions/cities` (یا نام‌گذاری معادل که در پروژه استفاده می‌شود)
  - ایجاد Endpointهای خاص:
    - `POST /api/orders/validate-before-payment`
    - `POST /api/wallet/manual-transaction` (Admin Only)
- **Frontend / Pages**
  - ایجاد/تکمیل صفحه:
    - `app/pages/checkout/shipping.vue` به صورت کاملاً Client-side (بدون SSR)
  - در صورت نیاز، هماهنگ‌سازی با مرحله قبلی Checkout (`/checkout/cart`) برای انتقال سبد و محاسبات.
- **Frontend / Model & Widgets**
  - ایجاد مدل:
    - `app/components/model/checkout/shipping/index.vue` برای:
      - مدیریت آدرس‌ها (CRUD و انتخاب آدرس فعال)
      - نمایش فاکتور (جمع قیمت کالا، هزینه ارسال، مبلغ نهایی)
      - مدیریت اتصال به Endpoint ولیدیشن قبل از پرداخت
  - ایجاد/استفاده از ویجت‌ها:
    - ویجت انتخاب آدرس، فرم آدرس، لیست آدرس‌ها
    - استفاده از `USkeleton` برای لودرها طبق قوانین پروژه
- **Admin Panel**
  - صفحات مدیریت:
    - مدیریت آدرس‌ها (در صورت نیاز در پنل)
    - مدیریت کوپن‌ها
    - مدیریت سفارش‌ها
    - مدیریت کیف پول و تراکنش‌های دستی
    - مدیریت استان‌ها و شهرها + Seeder

---

## نیازمندی‌های عملکردی (Functional)

### 1. مدیریت آدرس‌ها (Addresses)

- **FR-A1 – جدول آدرس‌ها**
  - ایجاد جدول `addresses` با فیلدهای اصلی:
    - `id`
    - `user_id` (مالک آدرس)
    - `province_id` (ارجاع به `provinces`)
    - `city_id` (ارجاع به `cities`)
    - `full_address`
    - `plate` (پلاک)
    - `unit` (واحد)
    - `postal_code`
    - `geo_point` (اختیاری، برای طول/عرض جغرافیایی)
    - `is_default` (آدرس پیش‌فرض کاربر)
    - `created_at`, `updated_at`
- **FR-A2 – API CRUD آدرس‌ها**
  - `GET /api/addresses`:
    - برگرداندن لیست آدرس‌های کاربر لاگین‌شده (با رعایت Ownership).
  - `POST /api/addresses`:
    - ایجاد آدرس جدید با ولیدیشن کامل فیلدها.
  - `PATCH /api/addresses/:id`:
    - امکان ویرایش آدرس فقط توسط مالک.
  - `DELETE /api/addresses/:id`:
    - حذف منطقی/فیزیکی آدرس (بر اساس الگوی پروژه).
- **FR-A3 – مدیریت آدرس در پنل ادمین**
  - صفحه لیست آدرس‌ها با امکان:
    - جستجو بر اساس `user_id`, `province`, `city`, `postal_code`.
    - مشاهده و در صورت نیاز ویرایش/حذف توسط ادمین.

### 2. مدیریت کوپن‌ها (Coupons)

- **FR-C1 – جدول کوپن‌ها**
  - ایجاد جدول `coupons` با فیلدهای پیشنهادی:
    - `id`
    - `code` (کد کوپن، یونیک)
    - `type` (مانند: `percent` / `fixed_amount`)
    - `value` (درصد یا مبلغ)
    - `max_discount_amount` (در صورت نوع درصدی)
    - `min_order_amount`
    - `usage_limit` (تعداد دفعات مجاز کلی)
    - `usage_limit_per_user`
    - `valid_from`, `valid_to`
    - `is_active`
    - سایر فیلدهای بیزنسی در صورت نیاز (مثلاً محدود به کاربر خاص، دسته خاص، ...)
- **FR-C2 – API CRUD کوپن‌ها**
  - Endpointهای مدیریت کوپن‌ها برای ادمین (CRUD کامل).
  - Endpoint/منطق اعتبارسنجی کوپن در فرآیند سفارش (ترجیحاً در Endpoint ولیدیشن سفارش).
- **FR-C3 – مدیریت کوپن در پنل ادمین**
  - صفحه‌ای برای:
    - ایجاد/ویرایش/حذف کوپن
    - مشاهده تعداد استفاده، وضعیت فعال/غیرفعال

### 3. مدیریت سفارش‌ها (Orders)

- **FR-O1 – جدول سفارش‌ها**
  - ایجاد جدول `orders` با فیلدهای پیشنهادی:
    - `id`
    - `user_id`
    - `address_id`
    - `status` با مقادیر مجاز:
      - `pending_payment`, `paid`, `processing`, `shipped`, `delivered`, `canceled`, `failed`
    - `subtotal_amount` (جمع مبلغ کالاها بدون تخفیف)
    - `discount_amount` (مجموع تخفیف)
    - `shipping_amount`
    - `payable_amount` (مبلغ قابل پرداخت نهایی)
    - `coupon_id` (nullable)
    - `coupon_snapshot` (جزییات کوپن در لحظه ثبت)
    - `wallet_amount_used` (مبلغ استفاده‌شده از کیف پول)
    - `payment_method` (درگاه/ولت و ...)
    - `created_at`, `updated_at`
- **FR-O2 – جدول آیتم‌های سفارش (OrderItems)**
  - جدول `order_items` با فیلدها:
    - `id`
    - `order_id`
    - `variant_id` (ارجاع به ورینت محصول)
    - `quantity`
    - `price_at_order` (قیمت واحد در لحظه ثبت سفارش)
    - `total_price_at_order`
    - هر فیلد snapshot لازم از محصول/ورینت (عنوان، تصویر و ...)
- **FR-O3 – API CRUD سفارش‌ها**
  - CRUD با رعایت:
    - کاربر فقط سفارش‌های خود را ببیند.
    - ادمین دسترسی کامل برای مدیریت.
- **FR-O4 – محدودیت کنسلی (طبق PRD)**
  - مکانیزم کنسلی:
    - امکان کنسل کردن توسط کاربر فقط در وضعیت‌های قبل از `shipped`.
    - در صورت کنسلی، بروزرسانی موجودی انبار و کیف پول (در صورت استفاده از ولت) طبق منطق بیزنسی.
- **FR-O5 – بخش مدیریت سفارش در پنل ادمین**
  - لیست سفارش‌ها با فیلترهای متداول (وضعیت، کاربر، تاریخ و ...).
  - امکان تغییر وضعیت سفارش (مثلاً `processing` → `shipped` → `delivered`).

### 4. مدیریت کیف پول (Wallet)

- **FR-W1 – جدول کیف پول و تراکنش‌ها**
  - جدول `wallets`:
    - `id`
    - `user_id` (یونیک)
    - `balance` (موجودی فعلی)
  - جدول `wallet_transactions`:
    - `id`
    - `wallet_id`
    - `type` (`credit` / `debit`)
    - `amount`
    - `reason` (متن/کد دلیل تراکنش)
    - `balance_before`
    - `balance_after`
    - `meta` (JSON اختیاری برای جزییات مرتبط با سفارش یا ادمین)
    - `created_at`
- **FR-W2 – API مدیریت ولت**
  - Endpoint‌هایی برای:
    - دریافت موجودی ولت کاربر.
    - لیست تراکنش‌های کاربر.
    - ثبت تراکنش‌های ناشی از سفارش.
- **FR-W3 – Endpoint تراکنش دستی (Admin)**
  - `POST /api/wallet/manual-transaction`:
    - فقط برای ادمین (بر اساس سیستم احراز هویت پروژه).
    - ورودی شامل: `user_id`, `type`, `amount`, `reason`.
    - ثبت دقیق `balance_before` و `balance_after`.

### 5. مدیریت استان‌ها و شهرها + هزینه ارسال

- **FR-R1 – جداول استان و شهر**
  - جدول `provinces`:
    - `id`
    - `name`
    - `shipping_cost` (هزینه ارسال پیش‌فرض برای کل استان)
  - جدول `cities`:
    - `id`
    - `province_id`
    - `name`
    - `shipping_cost` (nullable، در صورت null از استان خوانده می‌شود)
- **FR-R2 – Seeder استان‌ها و شهرها**
  - ایجاد Seeder معتبر برای لیست استان‌ها و شهرهای ایران به همراه مقادیر پیش‌فرض `shipping_cost` (قابل ویرایش بعداً توسط ادمین).
- **FR-R3 – اولویت هزینه ارسال**
  - در محاسبه هزینه ارسال سفارش:
    - اگر `city.shipping_cost` مقدار داشت → استفاده از همان.
    - در غیر این صورت از `province.shipping_cost` استفاده می‌شود.

### 6. Endpoint ولیدیشن قبل از پرداخت

- **FR-V1 – `POST /api/orders/validate-before-payment`**
  - ورودی شامل:
    - شناسه کاربر (از توکن/سشن)
    - سبد فعلی / شناسه سبد / آیتم‌های سفارش
    - آدرس انتخاب‌شده، کوپن انتخاب‌شده، روش پرداخت
  - وظایف:
    - چک موجودی انبار برای تمام `variant_id` ها (عدم اجازه ثبت برای موجودی صفر).
    - تطابق قیمت فعلی ورینت‌ها با `price_at_order` و مجموع فاکتور.
    - محاسبه و تایید هزینه ارسال بر اساس استان/شهر.
    - تایید اعتبار کوپن (تاریخ، تعداد استفاده، مبلغ حداقل، و ...).
  - در صورت مغایرت:
    - بازگرداندن خطا + داده‌های اصلاح‌شده (قیمت جدید، موجودی جدید، وضعیت کوپن).

---

## طراحی فنی / معماری

- **الگوی API**
  - رعایت ساختار پوشه‌ای موجود در `server/api` (مثال: `server/api/orders/index.get.ts`, `[id].patch.ts`, ...).
  - استفاده از `getDB()` از `server/db/index.ts` برای کوئری‌های MySQL.
  - استفاده از `shared/validation` و `validateBody` برای ولیدیشن ورودی طبق مثال موجود در `AI/architecture.md`.
- **مالکیت داده (Ownership & Security)**
  - تمامی APIهای فرانت‌کاربر (آدرس‌ها، سفارش‌ها، ولت) باید:
    - `user_id` را از کانتکست احراز هویت بخوانند (نه از body).
    - کوئری‌ها را با شرط `user_id = currentUser.id` محدود کنند.
  - Endpointهای Admin با middleware/چک سطح دسترسی محافظت شوند (مطابق الگوی فعلی پروژه).
- **ساختار صفحه `/checkout/shipping`**
  - صفحه:
    - `app/pages/checkout/shipping.vue`
    - بدون منطق پیچیده، فقط:
      - استفاده از مدل `app/components/model/checkout/shipping/index.vue`
      - تنظیم `definePageMeta` در صورت نیاز (مثلاً title، layout).
  - مدل:
    - وظایف:
      - لود آدرس‌های کاربر.
      - مدیریت انتخاب/تغییر آدرس.
      - در صورت نیاز، ایجاد آدرس جدید با فرم داخل مدال/اسلاید اور.
      - دریافت خلاصه سفارش (از استور/Endpoint) و محاسبه مبلغ نهایی + هزینه ارسال.
      - فراخوانی `POST /api/orders/validate-before-payment` هنگام کلیک ادامه پرداخت.
      - هدایت کاربر به مرحله بعد (مثلاً `/checkout/payment` یا درگاه) بعد از ولیدیشن موفق.
- **State Management**
  - استفاده از استور موجود سبد خرید (مثبتاً `useCartStore`) برای:
    - خواندن آیتم‌های سبد و مجموع‌ها.
  - در صورت نیاز، ساخت استور جدید برای:
    - وضعیت آدرس‌ها و انتخاب آدرس فعال.
    - وضعیت سفارش در حال ثبت (Draft Order).

---

## Non-Functional & UX

- **Security**
  - رعایت اصل Least Privilege در APIهای Admin.
  - عدم افشای داده‌های سایر کاربران در هیچ Endpoint.
- **Performance**
  - بهینه‌سازی کوئری‌ها (استفاده از index روی فیلدهای پرکاربرد مثل `user_id`, `status`, `province_id`, `city_id`).
  - جلوگیری از N+1 Query در لود سفارش‌ها و آدرس‌ها.
- **UX & Loading States**
  - استفاده از `USkeleton` در:
    - لود اولیه آدرس‌ها.
    - لود خلاصه فاکتور.
  - نمایش خطاهای ولیدیشن (کوپن نامعتبر، موجودی ناکافی، تغییر قیمت، ...) به شکل User-friendly.
- **Responsiveness**
  - در دسکتاپ:
    - دو ستون: سمت راست آدرس‌ها و سبد، سمت چپ Summary + دکمه ادامه پرداخت.
  - در موبایل:
    - چیدمان ستونی + دکمه ادامه پرداخت به صورت Sticky در پایین صفحه.

---

## لیست تسک‌ها

- **T-1**: طراحی و مستندسازی دقیق جداول `addresses`, `coupons`, `orders`, `order_items`, `wallets`, `wallet_transactions`, `provinces`, `cities` (شامل فیلدها و ایندکس‌ها).
- **T-2**: پیاده‌سازی جداول فوق در دیتابیس (Migration/Query) مطابق ساختار MySQL پروژه.
- **T-3**: پیاده‌سازی CRUD کامل API برای آدرس‌ها (`/api/addresses/*`) با رعایت Ownership و ولیدیشن.
- **T-4**: پیاده‌سازی CRUD کامل API برای کوپن‌ها (`/api/coupons/*`) و منطق اعتبارسنجی کوپن در فرآیند سفارش.
- **T-5**: پیاده‌سازی CRUD کامل API برای سفارش‌ها (`/api/orders/*`) به همراه جدول `order_items` و محدودیت کنسلی قبل از `shipped`.
- **T-6**: پیاده‌سازی سیستم کیف پول (جداول + API) و Endpoint ادمین `POST /api/wallet/manual-transaction`.
- **T-7**: پیاده‌سازی جداول استان و شهر، Seeder ایران و Endpointهای مدیریت آن‌ها، به همراه منطق اولویت هزینه ارسال (شهر ← استان).
- **T-8**: پیاده‌سازی Endpoint `POST /api/orders/validate-before-payment` برای چک نهایی موجودی، قیمت و هزینه ارسال.
- **T-9**: ایجاد مدل `app/components/model/checkout/shipping/index.vue` برای مدیریت آدرس‌ها، Summary و اتصال به Endpoint ولیدیشن.
- **T-10**: پیاده‌سازی صفحه `app/pages/checkout/shipping.vue` به صورت Client-side و اتصال آن به مدل.
- **T-11**: پیاده‌سازی UI/UX کامل صفحه (آدرس‌ها، فاکتور، دکمه ادامه پرداخت) با استفاده از Nuxt UI و USkeleton مطابق قوانین پروژه.
- **T-12**: افزودن صفحات/بخش‌های لازم در پنل ادمین برای مدیریت کوپن‌ها، سفارش‌ها، کیف پول و استان/شهر (در صورت عدم وجود).
- **T-13**: تست دستی سناریوهای اصلی: ایجاد آدرس، اعمال کوپن، ثبت سفارش با/بدون ولت، کنسلی قبل/بعد از `shipped`, خطای موجودی/قیمت در ولیدیشن قبل از پرداخت.


