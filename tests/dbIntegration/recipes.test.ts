import request from "supertest";
import { app } from "../../src/index";

describe("Recipe API Integration Tests", () => {
  let adminToken: string;
  let editorToken: string;
  let userToken: string;
  let recipeId: string;
  let commentId: string;

  const validRecipe = {
    title: "Banana Cake",
    ingredients: ["banana", "flour"],
    instructions: "Mix and bake",
    difficulty: "medium",
  };

  const updatedRecipe = {
    title: "Updated Recipe",
    instructions: "Updated instructions",
    difficulty: "easy",
  };

  const validComment = {
    user: "John Doe",
    text: "Great recipe!",
  };

  const updatedComment = {
    user: "Sam Doe",
    text: "Updated comment text",
  };

  beforeAll(async () => {
    // register and login admin
    await request(app).post("/api/v1/auth/register").send({
      name: "admin user",
      email: "admin@example.com",
      password: "password",
      role: "admin",
    });
    const adminRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "password",
    });
    adminToken = adminRes.body.token;

    // register and login editor
    await request(app).post("/api/v1/auth/register").send({
      name: "editor user",
      email: "editor@example.com",
      password: "password",
      role: "editor",
    });
    const editorRes = await request(app).post("/api/v1/auth/login").send({
      email: "editor@example.com",
      password: "password",
    });
    editorToken = editorRes.body.token;

    // register and login normal user
    await request(app).post("/api/v1/auth/register").send({
      name: "normal user",
      email: "user@example.com",
      password: "password",
      role: "user",
    });
    const userRes = await request(app).post("/api/v1/auth/login").send({
      email: "user@example.com",
      password: "password",
    });
    userToken = userRes.body.token;
  });

  // ---- recipe tests ----
  test("admin should create a recipe", async () => {
    const res = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validRecipe)
      .expect(201);

    recipeId = res.header["location"];
    expect(recipeId).toBeDefined();
  });

  test("editor should create a recipe", async () => {
    const res = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${editorToken}`)
      .send(validRecipe)
      .expect(201);
  });

  test("user should NOT create a recipe", async () => {
    await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${userToken}`)
      .send(validRecipe)
      .expect(403);
  });

  test("should get all recipes", async () => {
    const res = await request(app)
      .get("/api/v1/recipes")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should get recipe by id", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.title).toBe(validRecipe.title);
  });

  test("editor should update recipe", async () => {
    const res = await request(app)
      .put(`/api/v1/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send(updatedRecipe)
      .expect(200);
    expect(res.body.title).toBe(updatedRecipe.title);
  });

  // ---- comment tests ----
  test("admin should add comment", async () => {
    const res = await request(app)
      .post(`/api/v1/recipes/${recipeId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validComment)
      .expect(201);

    commentId = res.header["location"];
    expect(commentId).toBeDefined();
  });

  test("editor should add comment", async () => {
    await request(app)
      .post(`/api/v1/recipes/${recipeId}/comments`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send(validComment)
      .expect(201);
  });

  test("should get all comments", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/${recipeId}/comments`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // remove update comment test because API does not support it

  test("should delete comment", async () => {
    const res = await request(app)
      .delete(`/api/v1/recipes/${recipeId}/comments/${commentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.message).toBe("Comment deleted");
  });

  // ---- advanced queries ----
  test("should search recipes by title", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?search=banana`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should filter recipes by ingredient", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?ingredient=flour`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should sort recipes asc", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?sort=dateCreated&order=asc`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should sort recipes desc", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?sort=dateCreated&order=desc`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should paginate recipes", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?page=1&limit=10`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.page).toBe(1);
  });

  test("should get random recipe", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/random`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });

  test("should get total recipe count", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/count`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.totalRecipes).toBeGreaterThanOrEqual(1);
  });

  // ---- failure cases ----
  test("should fail to create recipe with empty title", async () => {
    await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ ...validRecipe, title: "" })
      .expect(400);
  });

  test("should fail to add comment with empty text", async () => {
    await request(app)
      .post(`/api/v1/recipes/${recipeId}/comments`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ ...validComment, text: "" })
      .expect(400);
  });

  test("should fail to update non-existent recipe", async () => {
    await request(app)
      .put("/api/v1/recipes/64b64c4f0000000000000000")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ title: "does not exist" })
      .expect(404);
  });

  test("should fail to delete non-existent recipe as editor", async () => {
    await request(app)
      .delete("/api/v1/recipes/64b64c4f0000000000000000")
      .set("Authorization", `Bearer ${editorToken}`)
      .expect(403); // editors cannot delete
  });
});
