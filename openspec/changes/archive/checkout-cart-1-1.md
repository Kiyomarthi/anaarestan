# Change: Checkout Cart 1.1

- **نام تغییر**: `checkout-cart-1-1`
- **PRD مرجع**: [AI/prod/checkout-cart.1.1.md](mdc:AI/prod/checkout-cart.1.1.md)
- **هدف**: پیاده‌سازی صفحه سبد خرید و مرحله بازبینی نهایی (Checkout/Cart) با:
  - مدیریت اقلام سبد با کامپوننت `app/components/widget/counter/index.vue`
  - نمایش فاکتور خلاصه سفارش (Summary)
  - نمایش محصولات پیشنهادی مرتبط
  - رعایت حالت‌های Loading و Empty State و ریسپانسیو

---

## نواحی تحت تأثیر

- **Frontend / Pages**
  - `app/pages/cart/index.vue` (الان placeholder است → هماهنگ‌سازی با تجربه جدید Checkout/Cart، مثلاً ریدایرکت یا استفاده از همان مدل)
  - `app/pages/checkout/cart.vue` (ایجاد/تکمیل صفحه اصلی Checkout/Cart طبق PRD)
- **Frontend / Model & Widgets**
  - ایجاد مدل جدید در `app/components/model/checkout/cart/index.vue` برای:
    - لود سبد از استور
    - مدیریت حالات loading/empty/error
    - رندر لیست آیتم‌ها + Summary + محصولات مشابه
  - استفاده از:
    - `app/components/widget/counter/index.vue`
    - ویجت‌های محصول مثل `app/components/widget/product-card/*` و `app/components/widget/product/*` برای لیست آیتم‌ها و محصولات مشابه
    - `USkeleton` برای لودرها
- **State Management**
  - استفاده و در صورت نیاز توسعه `app/stores/cart.ts` برای:
    - لود سبد جاری (`initializeCart`, `loadCart`)
    - محاسبه جمع کل، تخفیف، سود کاربر از خرید، مبلغ قابل پرداخت (در صورت نیاز با computed یا util جدید)
- **Backend / API**
  - استفاده از API های موجود:
    - `GET /api/carts/:id` برای دریافت سبد فعال کاربر
    - `POST /api/cart-items`, `PATCH /api/cart-items/:id`, `DELETE /api/cart-items/:id` برای تغییر تعداد/حذف آیتم
    - `GET /api/products/related` یا استفاده از منطق `WidgetProductSimilarProducts` برای محصولات مشابه
  - فقط در صورت نیاز، اصلاح کوچک در APIها (بدون تغییر رفتار کلی موجود)

---

## نیازمندی‌های عملکردی (Functional)

- **FR-1 – لیست محصولات سبد**
  - نمایش لیست آیتم‌های سبد (از `useCartStore.cart.items`) با:
    - نام محصول، تصویر، ویژگی‌های انتخابی (رنگ/سایز)، قیمت واحد
    - استفاده از ویجت‌ها/کارت‌های موجود برای هماهنگی UI
  - هر آیتم:
    - `WidgetCounter` برای تغییر تعداد (min=0 → صفر یعنی حذف)
    - حذف آیتم با رسیدن به صفر یا با اکشن جداگانه (طبق UX نهایی)

- **FR-2 – مدیریت تعداد با counter و Pinia**
  - اتصال `WidgetCounter` به استور `useCartStore`:
    - افزایش/کاهش تعداد → فراخوانی `addItem` یا `updateItemQuantity` / `removeItem`
    - هنگام درخواست به API:
      - دکمه‌ها disable شوند
      - state لودینگ مناسب روی آیتم/اکشن اعمال شود
  - رعایت NFR: تغییر تعداد بدون refresh کامل صفحه، با reactivity Pinia.

- **FR-3 – فاکتور (Summary Sidebar)**
  - در دسکتاپ: سایدبار سمت چپ با:
    - مجموع قیمت اصلی (بدون تخفیف)
    - مجموع تخفیف / «سود شما از خرید»
    - مالیات (اگر در منطق فعلی وجود دارد) یا placeholder ساده
    - مبلغ قابل پرداخت
  - در موبایل:
    - نمایش Summary زیر لیست آیتم‌ها یا در یک Bottom Sheet
    - دکمه «ادامه فرآیند خرید» به صورت **Sticky** در پایین صفحه

- **FR-4 – محصولات مشابه**
  - در انتهای صفحه Checkout/Cart، نمایش بخش محصولات مشابه:
    - دریافت دیتا از API مرتبط (مانند `WidgetProductSimilarProducts` در صفحه محصول)
    - استفاده از همان استایل و رفتار صفحه محصول (`products/[code]/[slug].vue`)
    - استفاده از ویجت‌های موجود (`WidgetProductCard` و غیره)

- **FR-5 – Empty State**
  - اگر سبد خالی بود:
    - نمایش Empty State با پیام مناسب
    - دکمه «بازگشت به فروشگاه» (مثلاً `/` یا `/products/list`)
    - عدم نمایش Summary و محصولات مشابه در این حالت

- **FR-6 – Loading & Skeleton**
  - هنگام بارگذاری اولیه سبد:
    - نمایش `USkeleton` برای لیست آیتم‌ها و Summary (الهام از صفحات لیست/محصول)
  - هنگام تغییر تعداد/حذف:
    - دکمه‌ها و counter آیتم مربوطه disable
    - نمایش لودر مناسب روی اکشن

---

## طراحی فنی / معماری

- **ساختار صفحه و مدل**
  - منطق اصلی داده‌ها در مدل:
    - `app/components/model/checkout/cart/index.vue`
      - استفاده از `useCartStore` برای `loadCart` و دسترسی به `cart.items`
      - استفاده از `useCacheFetch` / `useApiRequest` فقط در صورت نیاز به API اضافی (مثلاً محصولات مشابه) طبق قانون پروژه
  - صفحه:
    - `app/pages/checkout/cart.vue`
      - فقط استفاده از مدل بالا و تنظیم `definePageMeta`، بدون منطق پیچیده

- **State و محاسبات قیمتی**
  - در صورت نیاز، افزودن computedها در `useCartStore` یا helper مشترک:
    - `totalOriginalPrice`
    - `totalDiscount`
    - `payableAmount`
  - استفاده از utilهای موجود مثل `calculatePrice` از `shared/utils/format` تا از تکرار منطق تخفیف جلوگیری شود.

- **Navigation**
  - در Summary:
    - دکمه «ادامه فرآیند خرید» → هدایت به مرحله بعد (مثلاً `/checkout/shipping`).
  - در Empty State:
    - لینک مناسب برای بازگشت به فروشگاه.

---

## Non-Functional & UX

- **Performance**
  - استفاده از Pinia (`useCartStore`) برای نگهداری state سبد.
  - جلوگیری از درخواست‌های تکراری غیرضروری (استفاده از state موجود به جای fetch مجدد بی‌مورد).

- **UX & Responsiveness**
  - چیدمان دوستونه در دسکتاپ (لیست آیتم‌ها + Summary در سایدبار چپ).
  - چیدمان ستونی در موبایل (لیست آیتم‌ها، سپس Summary، دکمه sticky).
  - استفاده از Nuxt UI برای تمام دکمه‌ها، کارت‌ها، badgeها و skeletonها؛ عدم ساخت کامپوننت base تکراری.

- **Analytics (آماده‌سازی)**
  - آماده‌سازی محل مناسب برای رویدادهای آینده:
    - ترک سبد (Cart Abandonment).
    - تاثیر محصولات مشابه (کلیک و افزودن از این بخش).

---

## لیست تسک‌ها

- **T-1**: ایجاد مدل `app/components/model/checkout/cart/index.vue` برای:
  - لود سبد با `useCartStore`
  - مدیریت loading / empty / error
  - رندر لیست آیتم‌ها + Summary + محصولات مشابه
- **T-2**: تکمیل `app/pages/checkout/cart.vue` برای استفاده از مدل و تنظیم `definePageMeta`.
- **T-3**: طراحی UI لیست آیتم‌های سبد با استفاده از ویجت‌ها و `WidgetCounter` و اتصال به `useCartStore` (`addItem`, `updateItemQuantity`, `removeItem`).
- **T-4**: پیاده‌سازی بخش Summary (محاسبات قیمتی، نمایش سود، مبلغ قابل پرداخت، دکمه ادامه خرید) با رعایت ریسپانسیو.
- **T-5**: پیاده‌سازی بخش محصولات مشابه با استفاده از API و ویجت‌های موجود، هماهنگ با صفحه محصول.
- **T-6**: پیاده‌سازی حالت‌های Loading و Empty State (USkeleton + Empty).
- **T-7**: در صورت نیاز، تکمیل/بهبود computedها در `useCartStore` یا ساخت util مشترک برای محاسبات.
- **T-8**: هماهنگ‌سازی `app/pages/cart/index.vue` (مثلاً ریدایرکت به `/checkout/cart` یا استفاده از همان مدل).
- **T-9**: تست دستی سناریوهای اصلی (تغییر تعداد، حذف، سبد خالی، موبایل/دسکتاپ).


