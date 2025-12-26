import { getDB } from "~~/server/db";
import { requireRole } from "~~/server/utils/permissions";

export default defineEventHandler(async (event) => {
  const user = requireRole(event, "admin");

  const db = (await getDB()) as any;

  try {
    // Get counts for all main entities
    const [usersCount] = await db.execute(
      "SELECT COUNT(*) as total FROM users"
    );
    const totalUsers = (usersCount as { total: number }[])[0]?.total || 0;

    const [productsCount] = await db.execute(
      "SELECT COUNT(*) as total FROM products"
    );
    const totalProducts = (productsCount as { total: number }[])[0]?.total || 0;

    const [categoriesCount] = await db.execute(
      "SELECT COUNT(*) as total FROM categories"
    );
    const totalCategories =
      (categoriesCount as { total: number }[])[0]?.total || 0;

    const [attributesCount] = await db.execute(
      "SELECT COUNT(*) as total FROM attributes"
    );
    const totalAttributes =
      (attributesCount as { total: number }[])[0]?.total || 0;

    const [pagesCount] = await db.execute(
      "SELECT COUNT(*) as total FROM pages"
    );
    const totalPages = (pagesCount as { total: number }[])[0]?.total || 0;

    // Get products with stock status
    const [productsInStock] = await db.execute(
      "SELECT COUNT(*) as total FROM products WHERE stock > 0"
    );
    const productsAvailable =
      (productsInStock as { total: number }[])[0]?.total || 0;

    const [productsOutOfStock] = await db.execute(
      "SELECT COUNT(*) as total FROM products WHERE stock = 0"
    );
    const productsUnavailable =
      (productsOutOfStock as { total: number }[])[0]?.total || 0;

    // Get active products
    const [activeProducts] = await db.execute(
      "SELECT COUNT(*) as total FROM products WHERE status = 1"
    );
    const activeProductsCount =
      (activeProducts as { total: number }[])[0]?.total || 0;

    // Get active categories
    const [activeCategories] = await db.execute(
      "SELECT COUNT(*) as total FROM categories WHERE status = 1"
    );
    const activeCategoriesCount =
      (activeCategories as { total: number }[])[0]?.total || 0;

    // Get active pages
    const [activePages] = await db.execute(
      "SELECT COUNT(*) as total FROM pages WHERE is_active = 1"
    );
    const activePagesCount =
      (activePages as { total: number }[])[0]?.total || 0;

    // Get admin users count
    const [adminUsers] = await db.execute(
      "SELECT COUNT(*) as total FROM users WHERE role = 'admin'"
    );
    const adminUsersCount = (adminUsers as { total: number }[])[0]?.total || 0;

    // Get regular users count
    const [regularUsers] = await db.execute(
      "SELECT COUNT(*) as total FROM users WHERE role = 'user'"
    );
    const regularUsersCount =
      (regularUsers as { total: number }[])[0]?.total || 0;

    // Get recent products (last 7 days)
    const [recentProducts] = await db.execute(
      "SELECT COUNT(*) as total FROM products WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const recentProductsCount =
      (recentProducts as { total: number }[])[0]?.total || 0;

    // Get recent users (last 7 days)
    const [recentUsers] = await db.execute(
      "SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const recentUsersCount =
      (recentUsers as { total: number }[])[0]?.total || 0;

    // Get recent pages (last 7 days)
    const [recentPages] = await db.execute(
      "SELECT COUNT(*) as total FROM pages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    );
    const recentPagesCount =
      (recentPages as { total: number }[])[0]?.total || 0;

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          admins: adminUsersCount,
          regular: regularUsersCount,
          recent: recentUsersCount,
        },
        products: {
          total: totalProducts,
          available: productsAvailable,
          unavailable: productsUnavailable,
          active: activeProductsCount,
          recent: recentProductsCount,
        },
        categories: {
          total: totalCategories,
          active: activeCategoriesCount,
        },
        attributes: {
          total: totalAttributes,
        },
        pages: {
          total: totalPages,
          active: activePagesCount,
          recent: recentPagesCount,
        },
      },
    };
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: "خطا در دریافت آمار",
      message: error.message,
    });
  }
});

