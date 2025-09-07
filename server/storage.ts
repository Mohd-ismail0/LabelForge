import { type User, type InsertUser, type LabelProject, type InsertLabelProject, type DataFile, type InsertDataFile } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getLabelProject(id: string): Promise<LabelProject | undefined>;
  getLabelProjectsByUser(userId: string): Promise<LabelProject[]>;
  createLabelProject(project: InsertLabelProject): Promise<LabelProject>;
  updateLabelProject(id: string, project: Partial<LabelProject>): Promise<LabelProject | undefined>;
  deleteLabelProject(id: string): Promise<boolean>;
  
  getDataFile(id: string): Promise<DataFile | undefined>;
  getDataFilesByProject(projectId: string): Promise<DataFile[]>;
  createDataFile(file: InsertDataFile): Promise<DataFile>;
  deleteDataFile(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private labelProjects: Map<string, LabelProject>;
  private dataFiles: Map<string, DataFile>;

  constructor() {
    this.users = new Map();
    this.labelProjects = new Map();
    this.dataFiles = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLabelProject(id: string): Promise<LabelProject | undefined> {
    return this.labelProjects.get(id);
  }

  async getLabelProjectsByUser(userId: string): Promise<LabelProject[]> {
    return Array.from(this.labelProjects.values()).filter(
      (project) => project.userId === userId,
    );
  }

  async createLabelProject(insertProject: InsertLabelProject): Promise<LabelProject> {
    const id = randomUUID();
    const project: LabelProject = { 
      ...insertProject,
      userId: insertProject.userId || null,
      id, 
      createdAt: new Date().toISOString() 
    };
    this.labelProjects.set(id, project);
    return project;
  }

  async updateLabelProject(id: string, updates: Partial<LabelProject>): Promise<LabelProject | undefined> {
    const existing = this.labelProjects.get(id);
    if (!existing) return undefined;
    
    const updated: LabelProject = { ...existing, ...updates };
    this.labelProjects.set(id, updated);
    return updated;
  }

  async deleteLabelProject(id: string): Promise<boolean> {
    return this.labelProjects.delete(id);
  }

  async getDataFile(id: string): Promise<DataFile | undefined> {
    return this.dataFiles.get(id);
  }

  async getDataFilesByProject(projectId: string): Promise<DataFile[]> {
    return Array.from(this.dataFiles.values()).filter(
      (file) => file.projectId === projectId,
    );
  }

  async createDataFile(insertFile: InsertDataFile): Promise<DataFile> {
    const id = randomUUID();
    const file: DataFile = { 
      ...insertFile,
      projectId: insertFile.projectId || null,
      id, 
      uploadedAt: new Date().toISOString() 
    };
    this.dataFiles.set(id, file);
    return file;
  }

  async deleteDataFile(id: string): Promise<boolean> {
    return this.dataFiles.delete(id);
  }
}

export const storage = new MemStorage();
