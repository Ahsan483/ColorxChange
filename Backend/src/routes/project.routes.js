const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
// const { authenticate } = require('../middleware/auth.middleware');

router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.post('/', projectController.createProject); // Add auth middleware later
router.delete('/:id', projectController.deleteProject); // Add auth middleware later

module.exports = router;
