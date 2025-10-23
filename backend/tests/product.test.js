const request = require("supertest");
const app = require("../server");

describe("Product Sorting Tests", () => {
  describe("GET /api/products", () => {
    it("should return products sorted by price in descending order by default", async () => {
      const response = await request(app).get("/api/products").expect(200);

      expect(response.body).toHaveProperty("products");
      expect(response.body).toHaveProperty("pagination");

      // Verify descending order
      if (response.body.products.length > 1) {
        for (let i = 1; i < response.body.products.length; i++) {
          expect(response.body.products[i - 1].price).toBeGreaterThanOrEqual(
            response.body.products[i].price
          );
        }
      }
    });

    it("should return products sorted by price in ascending order with header", async () => {
      const response = await request(app)
        .get("/api/products")
        .set("x-sort-direction", "asc")
        .expect(200);

      expect(response.body).toHaveProperty("products");

      // Verify ascending order
      if (response.body.products.length > 1) {
        for (let i = 1; i < response.body.products.length; i++) {
          expect(response.body.products[i - 1].price).toBeLessThanOrEqual(
            response.body.products[i].price
          );
        }
      }
    });

    it("should filter products by category", async () => {
      const response = await request(app)
        .get("/api/products")
        .query({ category: "Electronics" })
        .expect(200);

      expect(response.body).toHaveProperty("products");
      if (response.body.products.length > 0) {
        response.body.products.forEach((product) => {
          expect(product.category).toBe("Electronics");
        });
      }
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/products")
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.pagination).toHaveProperty("page");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it("should support search", async () => {
      const response = await request(app)
        .get("/api/products")
        .query({ search: "headphone" })
        .expect(200);

      expect(response.body).toHaveProperty("products");
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return a single product", async () => {
      const response = await request(app).get("/api/products").expect(200);

      if (response.body.products.length > 0) {
        const productId = response.body.products[0]._id;
        const singleResponse = await request(app)
          .get(`/api/products/${productId}`)
          .expect(200);

        expect(singleResponse.body).toHaveProperty("_id");
        expect(singleResponse.body).toHaveProperty("name");
      }
    });

    it("should return 404 for non-existent product", async () => {
      await request(app)
        .get("/api/products/507f1f77bcf86cd799439011")
        .expect(404);
    });
  });

  describe("GET /api/products/categories", () => {
    it("should return list of categories", async () => {
      const response = await request(app)
        .get("/api/products/categories")
        .expect(200);

      expect(response.body).toHaveProperty("categories");
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });
});

describe("Authentication Tests", () => {
  describe("POST /api/auth/register", () => {
    it("should reject invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "invalid-email",
          password: "password123",
          confirmPassword: "password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });

    it("should reject short passwords", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test User",
          email: "test@example.com",
          password: "123",
          confirmPassword: "123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should reject invalid email format", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        })
        .expect(400);

      expect(response.body).toHaveProperty("errors");
    });
  });

  describe("GET /api/health", () => {
    it("should return server status", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toHaveProperty("status");
    });
  });
});
