// Backend/server.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Middleware: Verify Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, tier: user.tier } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECT ROUTES ---

// Get User Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, thumbnail: true, updatedAt: true } // Don't fetch huge data blob list
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Project
app.post('/api/projects', authenticateToken, async (req, res) => {
  const { name, data, thumbnail } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        data: data || {},
        thumbnail,
        userId: req.user.id
      }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Project
app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const project = await prisma.project.findFirst({
      where: { id, userId: req.user.id }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Project (Autosave)
app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { data, thumbnail, name } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id }, // In real app, ensure userId matches too or catch error
      data: {
        ...(data && { data }),
        ...(thumbnail && { thumbnail }),
        ...(name && { name })
      }
    });
    
    // Optional: Create Version every X updates or manually?
    // For now, simple update.
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Project
app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.project.delete({
       where: { id } // Prisma throws if record not found
    });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
