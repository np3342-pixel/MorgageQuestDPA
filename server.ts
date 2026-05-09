import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";

const DB_FILE = path.join(process.cwd(), "database.json");

interface Database {
  users: any[];
  leads: any[];
  properties: any[];
}

async function readDb(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return { users: [], leads: [], properties: [], ...parsed };
  } catch (error) {
    return { users: [], leads: [], properties: [] };
  }
}

async function writeDb(data: Database) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB file if it doesn't exist
  try {
    await fs.access(DB_FILE);
  } catch {
    await writeDb({ users: [], leads: [], properties: [] });
  }

  // Seed Admin User
  const db = await readDb();
  if (!db.users.find(u => u.role === 'admin')) {
    db.users.push({
      id: "admin-id-123",
      name: "System Admin",
      email: "admin@mortgagequest.com",
      role: "admin",
      created_at: new Date().toISOString()
    });
    await writeDb(db);
  }

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Auth / User routes
  app.post("/api/register", async (req, res) => {
    const { name, email, role, password } = req.body;
    try {
      const db = await readDb();
      let user = db.users.find(u => u.email === email);
      
      if (user) {
        return res.status(400).json({ error: "Email already registered" });
      }

      user = {
        id: uuidv4(),
        name,
        email,
        password, // Storing plain text for prototype purposes
        role,
        phone: "",
        company: "",
        licenseNumber: "",
        created_at: new Date().toISOString()
      };
      db.users.push(user);
      await writeDb(db);
      
      res.json(user);
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const db = await readDb();
      const user = db.users.find(u => u.email === email);
      
      if (!user) {
        return res.status(404).json({ error: "User not found. Please sign up." });
      }
      
      if (user.password && user.password !== password) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    const db = await readDb();
    const user = db.users.find(u => u.id === req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    const { name, phone, company, licenseNumber } = req.body;
    try {
      const db = await readDb();
      const userIndex = db.users.findIndex(u => u.id === req.params.id);
      
      if (userIndex > -1) {
        db.users[userIndex] = { 
          ...db.users[userIndex], 
          name, 
          phone, 
          company, 
          licenseNumber 
        };
        await writeDb(db);
        res.json(db.users[userIndex]);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    const db = await readDb();
    const users = db.users.filter(u => u.role !== 'admin');
    
    // Attach lead counts to users for the admin dashboard
    const usersWithStats = users.map(u => {
      const userLeads = db.leads.filter(l => l.agentId === u.id);
      return {
        ...u,
        totalLeads: userLeads.length
      };
    });
    
    res.json(usersWithStats);
  });

  // Leads routes
  app.post("/api/leads", async (req, res) => {
    const { agentId, name, email, phone, income, householdSize, zipCode, isFthb, creditBand, purchasePrice } = req.body;
    
    // Evaluate eligibility based on simplified DPA rules
    const eligibility = evaluateDPA(req.body);
    const id = uuidv4();

    const newLead = {
      id,
      agentId,
      name,
      email,
      phone,
      income: Number(income),
      householdSize: Number(householdSize),
      zipCode,
      isFthb: Boolean(isFthb),
      creditBand,
      purchasePrice: Number(purchasePrice),
      eligibility,
      createdAt: new Date().toISOString()
    };

    const db = await readDb();
    db.leads.push(newLead);
    await writeDb(db);

    res.json(newLead);
  });

  app.get("/api/agents/:agentId/leads", async (req, res) => {
    const db = await readDb();
    const leads = db.leads
      .filter(l => l.agentId === req.params.agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(leads);
  });

  app.get("/api/leads", async (req, res) => {
    const db = await readDb();
    const leads = [...db.leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(leads);
  });

  app.get("/api/leads/:id", async (req, res) => {
    const db = await readDb();
    const lead = db.leads.find(l => l.id === req.params.id);
    if (lead) {
      res.json(lead);
    } else {
      res.status(404).json({ error: "Lead not found" });
    }
  });

  // Properties routes
  app.post("/api/properties", async (req, res) => {
    const { agentId, title, description, price, address, zipCode, propertyType } = req.body;
    
    const newProperty = {
      id: uuidv4(),
      agentId,
      title,
      description,
      price: Number(price),
      address,
      zipCode,
      propertyType,
      createdAt: new Date().toISOString()
    };

    const db = await readDb();
    if (!db.properties) db.properties = [];
    db.properties.push(newProperty);
    await writeDb(db);

    res.json(newProperty);
  });

  app.get("/api/agents/:agentId/properties", async (req, res) => {
    const db = await readDb();
    const properties = (db.properties || [])
      .filter(p => p.agentId === req.params.agentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(properties);
  });

  app.get("/api/properties", async (req, res) => {
    const db = await readDb();
    const properties = [...(db.properties || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(properties);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Simplified DPA Rules Engine
function evaluateDPA(data: any) {
  const { income, isFthb, creditBand, zipCode } = data;
  const numIncome = Number(income);
  
  const programs = [];

  // NY-001 SONYMA DPAL
  // Forgivable loan, FTHB required, Min Credit 620
  let ny001Status = "FAIL";
  if (isFthb && (creditBand === "620-679" || creditBand === "680+")) {
    ny001Status = "PASS";
  } else if (creditBand === "<620") {
    ny001Status = "FAIL";
  }
  programs.push({ 
    id: "NY-001", 
    name: "SONYMA DPAL", 
    status: ny001Status,
    criteria: [
      { name: "First-Time Homebuyer", value: "Required", met: isFthb },
      { name: "Minimum Credit Score", value: "620", met: creditBand !== "<620" }
    ]
  });

  // NY-002 SONYMA DPAL Plus
  // <=60% AMI (approx $80k for NYC), FTHB, Min Credit 620
  let ny002Status = "FAIL";
  if (isFthb && (creditBand === "620-679" || creditBand === "680+")) {
    if (numIncome <= 80000) {
      ny002Status = "PASS";
    } else {
      ny002Status = "FAIL";
    }
  }
  programs.push({ 
    id: "NY-002", 
    name: "SONYMA DPAL Plus", 
    status: ny002Status,
    criteria: [
      { name: "First-Time Homebuyer", value: "Required", met: isFthb },
      { name: "Minimum Credit Score", value: "620", met: creditBand !== "<620" },
      { name: "Income Limit", value: "<= 60% AMI (approx $80k)", met: numIncome <= 80000 }
    ]
  });

  // NY-009 FHLBNY Homebuyer Dream Program
  // <=80% AMI (approx $100k), Credit per lender
  let ny009Status = "FAIL";
  if (numIncome <= 100000) {
    if (creditBand === "<620") {
      ny009Status = "VERIFY"; // Per lender
    } else {
      ny009Status = "PASS";
    }
  }
  programs.push({ 
    id: "NY-009", 
    name: "FHLBNY Homebuyer Dream", 
    status: ny009Status,
    criteria: [
      { name: "Income Limit", value: "<= 80% AMI (approx $100k)", met: numIncome <= 100000 },
      { name: "Minimum Credit Score", value: "Per Lender", met: creditBand !== "<620" ? true : "VERIFY" }
    ]
  });

  // NY-012 NYC HomeFirst
  // <=80% AMI, NYC 5 boroughs (simplified to zip starting with 10 or 11)
  let ny012Status = "FAIL";
  const isNYC = zipCode && (zipCode.startsWith("10") || zipCode.startsWith("11"));
  if (isNYC && numIncome <= 100000) {
    ny012Status = "PASS";
  }
  programs.push({ 
    id: "NY-012", 
    name: "NYC HomeFirst", 
    status: ny012Status,
    criteria: [
      { name: "Income Limit", value: "<= 80% AMI (approx $100k)", met: numIncome <= 100000 },
      { name: "Geography", value: "NYC 5 Boroughs", met: isNYC }
    ]
  });

  // NY-003 SONYMA RemodelNY
  let ny003Status = "FAIL";
  if (isFthb && (creditBand === "620-679" || creditBand === "680+")) {
    ny003Status = "PASS";
  }
  programs.push({
    id: "NY-003",
    name: "SONYMA RemodelNY",
    status: ny003Status,
    criteria: [
      { name: "First-Time Homebuyer", value: "Required", met: isFthb },
      { name: "Minimum Credit Score", value: "620", met: creditBand !== "<620" }
    ]
  });

  // NY-004 SONYMA Achieving the Dream
  let ny004Status = "FAIL";
  if (isFthb && numIncome <= 90000 && (creditBand === "620-679" || creditBand === "680+")) {
    ny004Status = "PASS";
  }
  programs.push({
    id: "NY-004",
    name: "SONYMA Achieving the Dream",
    status: ny004Status,
    criteria: [
      { name: "First-Time Homebuyer", value: "Required", met: isFthb },
      { name: "Income Limit", value: "<= 80% AMI (approx $90k)", met: numIncome <= 90000 },
      { name: "Minimum Credit Score", value: "620", met: creditBand !== "<620" }
    ]
  });

  // NY-005 SONYMA Neighborhood Revitalization
  let ny005Status = "PASS";
  if (creditBand === "<620") {
    ny005Status = "FAIL";
  }
  programs.push({
    id: "NY-005",
    name: "SONYMA Neighborhood Revitalization",
    status: ny005Status,
    criteria: [
      { name: "First-Time Homebuyer", value: "Not Required", met: true },
      { name: "Minimum Credit Score", value: "620", met: creditBand !== "<620" }
    ]
  });

  // NY-006 SONYMA Homes for Veterans
  let ny006Status = "VERIFY";
  if (creditBand === "<620") {
    ny006Status = "FAIL";
  }
  programs.push({
    id: "NY-006",
    name: "SONYMA Homes for Veterans",
    status: ny006Status,
    criteria: [
      { name: "Veteran Status", value: "Required", met: "VERIFY" },
      { name: "Minimum Credit Score", value: "620", met: creditBand !== "<620" }
    ]
  });

  // NY-007 HCR First Home Club
  let ny007Status = "FAIL";
  if (isFthb && numIncome <= 100000) {
    ny007Status = "PASS";
  }
  programs.push({
    id: "NY-007",
    name: "HCR First Home Club",
    status: ny007Status,
    criteria: [
      { name: "First-Time Homebuyer", value: "Required", met: isFthb },
      { name: "Income Limit", value: "<= 80% AMI (approx $100k)", met: numIncome <= 100000 }
    ]
  });

  // NY-008 AHC Homeownership Grant
  let ny008Status = "FAIL";
  if (numIncome <= 140000) {
    ny008Status = "PASS";
  }
  programs.push({
    id: "NY-008",
    name: "AHC Homeownership Grant",
    status: ny008Status,
    criteria: [
      { name: "Income Limit", value: "<= 112% AMI (approx $140k)", met: numIncome <= 140000 }
    ]
  });

  // NY-010 FHA Down Payment Assistance
  let ny010Status = "PASS";
  if (creditBand === "<620") {
    ny010Status = "VERIFY"; // FHA can go down to 580
  }
  programs.push({
    id: "NY-010",
    name: "FHA Down Payment Assistance",
    status: ny010Status,
    criteria: [
      { name: "Minimum Credit Score", value: "580", met: true }
    ]
  });

  // NY-011 Conventional 97 DPA
  let ny011Status = "FAIL";
  if (isFthb && (creditBand === "620-679" || creditBand === "680+")) {
    ny011Status = "PASS";
  }
  programs.push({
    id: "NY-011",
    name: "Conventional 97 DPA",
    status: ny011Status,
    criteria: [
      { name: "First-Time Homebuyer", value: "Required", met: isFthb },
      { name: "Minimum Credit Score", value: "620", met: creditBand !== "<620" }
    ]
  });

  return programs;
}

startServer();
