// features/annotation/annotation.routes.js
const express = require('express');
const AnnotationController = require('./annotation.controller');
const { authMiddleware, authorizeAdmin } = require('../../utils/auth'); // Import auth middleware
const router = express.Router({ mergeParams: true });
// Aplicar authMiddleware a todas as rotas neste router
// Isso garante que req.user.id esteja disponível no controller.
router.use(authMiddleware, authorizeAdmin);
router.route('/')
.post(AnnotationController.createAnnotation)
.get(AnnotationController.getAnnotations);
router.route('/:annotationId')
.put(AnnotationController.updateAnnotation)
.delete(AnnotationController.deleteAnnotation);
module.exports = router;