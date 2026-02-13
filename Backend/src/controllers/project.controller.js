const prisma = require('../config/db');
const logger = require('../utils/logger');

// Get all projects
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
};

// Get single project
exports.getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } }
    });
    
    if (!project) {
      const error = new Error('Project not found');
      error.statusCode = 404;
      throw error;
    }
    
    res.json(project);
  } catch (error) {
    next(error);
  }
};

// Create project
exports.createProject = async (req, res, next) => {
  try {
    const { name, content, thumbnail } = req.body;
    // content is expected to be a JSON string
    
    const project = await prisma.project.create({
      data: {
        name,
        content,
        thumbnail,
        userId: req.user ? req.user.id : null // Optional: link to user if auth'd
      }
    });
    
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
};

// Delete project
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({
      where: { id }
    });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};
