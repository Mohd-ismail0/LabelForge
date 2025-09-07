import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const labelProjects = pgTable("label_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  width: numeric("width", { precision: 10, scale: 4 }).notNull(),
  height: numeric("height", { precision: 10, scale: 4 }).notNull(),
  elements: jsonb("elements").default([]),
  dataMapping: jsonb("data_mapping").default({}),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const dataFiles = pgTable("data_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => labelProjects.id),
  filename: text("filename").notNull(),
  data: jsonb("data").notNull(),
  rowCount: integer("row_count").notNull(),
  uploadedAt: text("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLabelProjectSchema = createInsertSchema(labelProjects).omit({
  id: true,
  createdAt: true,
});

export const insertDataFileSchema = createInsertSchema(dataFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertLabelProject = z.infer<typeof insertLabelProjectSchema>;
export type LabelProject = typeof labelProjects.$inferSelect;
export type InsertDataFile = z.infer<typeof insertDataFileSchema>;
export type DataFile = typeof dataFiles.$inferSelect;

export interface LabelElement {
  id: string;
  type: 'text' | 'barcode' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  properties: {
    text?: string;
    dataField?: string;
    fontSize?: number;
    fontWeight?: string;
    barcodeType?: string;
    imageUrl?: string;
    shapeType?: string;
    color?: string;
    backgroundColor?: string;
  };
}

export interface DataMapping {
  [elementId: string]: string; // maps element ID to data column name
}
