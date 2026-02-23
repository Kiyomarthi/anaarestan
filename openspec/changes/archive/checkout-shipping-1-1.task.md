# Tasks: Checkout Shipping 1.1

- **نام تغییر**: `checkout-shipping-1-1`
- **PRD مرجع**: [AI/prod/checkout-shipping.prod.1.1.md](mdc:AI/prod/checkout-shipping.prod.1.1.md)
- **Change مرجع**: [openspec/changes/archive/checkout-shipping-1-1.md](mdc:openspec/changes/archive/checkout-shipping-1-1.md)

این فایل صرفاً برای مدیریت تسک‌هاست و قبل از شروع پیاده‌سازی باید توسط Product Owner/Architect تأیید شود.

---

## وضعیت تسک‌ها

- [ ] **T-1** – طراحی و مستندسازی دقیق جداول `addresses`, `coupons`, `orders`, `order_items`, `wallets`, `wallet_transactions`, `provinces`, `cities` (فیلدها، ایندکس‌ها، ارتباط‌ها).
- [ ] **T-2** – پیاده‌سازی جداول فوق در دیتابیس (Migration/Query) مطابق ساختار MySQL پروژه.
- [ ] **T-3** – پیاده‌سازی CRUD کامل API برای آدرس‌ها (`/api/addresses/*`) با رعایت Ownership و ولیدیشن.
- [ ] **T-4** – پیاده‌سازی CRUD کامل API برای کوپن‌ها (`/api/coupons/*`) و منطق اعتبارسنجی کوپن در فرآیند سفارش.
- [ ] **T-5** – پیاده‌سازی CRUD کامل API برای سفارش‌ها (`/api/orders/*`) به همراه جدول `order_items` و محدودیت کنسلی قبل از `shipped`.
- [ ] **T-6** – پیاده‌سازی سیستم کیف پول (جداول + API) و Endpoint ادمین `POST /api/wallet/manual-transaction`.
- [ ] **T-7** – پیاده‌سازی جداول استان و شهر، Seeder ایران و Endpointهای مدیریت آن‌ها، به همراه منطق اولویت هزینه ارسال (شهر ← استان).
- [ ] **T-8** – پیاده‌سازی Endpoint `POST /api/orders/validate-before-payment` برای چک نهایی موجودی، قیمت و هزینه ارسال.
- [ ] **T-9** – ایجاد مدل `app/components/model/checkout/shipping/index.vue` برای مدیریت آدرس‌ها، Summary و اتصال به Endpoint ولیدیشن.
- [ ] **T-10** – پیاده‌سازی صفحه `app/pages/checkout/shipping.vue` به صورت Client-side و اتصال آن به مدل.
- [ ] **T-11** – پیاده‌سازی UI/UX کامل صفحه (آدرس‌ها، فاکتور، دکمه ادامه پرداخت) با استفاده از Nuxt UI و USkeleton مطابق قوانین پروژه.
- [ ] **T-12** – افزودن صفحات/بخش‌های لازم در پنل ادمین برای مدیریت کوپن‌ها، سفارش‌ها، کیف پول و استان/شهر (در صورت عدم وجود).
- [ ] **T-13** – تست دستی سناریوهای اصلی: ایجاد آدرس، اعمال کوپن، ثبت سفارش با/بدون ولت، کنسلی قبل/بعد از `shipped`, خطای موجودی/قیمت در ولیدیشن قبل از پرداخت.


