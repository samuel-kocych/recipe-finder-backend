import {
  createRecipeSchema,
  updateRecipeSchema,
  createCommentSchema,
  updateCommentSchema,
} from "../../src/models/recipe";

const validRecipe = {
  title: "Pancakes",
  ingredients: ["egg", "milk", "flour"],
  instructions: "Mix ingredients and cook on pan.",
  difficulty: "easy",
};

const validComment = {
  user: "John Doe",
  text: "Great recipe!",
};

describe("Recipe Validation", () => {
  it("should pass createRecipeSchema with valid data", () => {
    expect(() => createRecipeSchema.parse(validRecipe)).not.toThrow();
  });

  it("should fail createRecipeSchema with empty title", () => {
    expect(() =>
      createRecipeSchema.parse({ ...validRecipe, title: "" })
    ).toThrow();
  });

  it("should fail createRecipeSchema with invalid difficulty", () => {
    expect(() =>
      createRecipeSchema.parse({ ...validRecipe, difficulty: "super-hard" })
    ).toThrow();
  });

  it("should pass updateRecipeSchema with partial data", () => {
    const updateData = { title: "Updated Title" };
    expect(() => updateRecipeSchema.parse(updateData)).not.toThrow();
  });
});

describe("Comment Validation", () => {
  it("should pass createCommentSchema with valid data", () => {
    expect(() => createCommentSchema.parse(validComment)).not.toThrow();
  });

  it("should fail createCommentSchema with missing text", () => {
    expect(() =>
      createCommentSchema.parse({ ...validComment, text: "" })
    ).toThrow();
  });

  it("should fail createCommentSchema with missing user", () => {
    expect(() =>
      createCommentSchema.parse({ ...validComment, user: "" })
    ).toThrow();
  });

  it("should pass updateCommentSchema with partial data", () => {
    const updateData = { text: "Updated comment" };
    expect(() => updateCommentSchema.parse(updateData)).not.toThrow();
  });
});
