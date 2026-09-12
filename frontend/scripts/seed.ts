import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamodb } from "../lib/dynamodb";
import { Category, Product } from "../types";

const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE_NAME || "Categories";
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME || "Products";

const sampleCategories: Category[] = [
    {
        id: "cat-1",
        name: "Electronics",
        slug: "electronics",
        description: "Gadgets and tech accessories",
      },
      {
        id: "cat-2",
        name: "Clothing",
        slug: "clothing",
        description: "Everyday apparel",
      },
];

const sampleProducts: Product[] = [
    {
        id: "prod-1",
        name: "Wireless Headphones",
        description: "Noise-cancelling over-ear headphones",
        price: 99.99,
        categoryId: "cat-1",
        imageUrl: "https://placehold.co/400x400/png?text=Headphones",
        stock: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "prod-2",
        name: "Mechanical Keyboard",
        description: "RGB compact mechanical keyboard",
        price: 79.99,
        categoryId: "cat-1",
        imageUrl: "https://placehold.co/400x400/png?text=Keyboard",
        stock: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
];

async function seed() {
    console.log("Seeding categories...");
    for (const category of sampleCategories) {
      await dynamodb.send(
        new PutCommand({
          TableName: CATEGORIES_TABLE,
          Item: category,
        })
      );
      console.log(`Inserted category: ${category.name}`);
    }
    console.log("Seeding products...");
    for (const product of sampleProducts) {
      await dynamodb.send(
        new PutCommand({
          TableName: PRODUCTS_TABLE,
          Item: product,
        })
      );
      console.log(`Inserted product: ${product.name}`);
    }
    console.log("All sample data seeded successfully!");
}

seed().catch(console.error);