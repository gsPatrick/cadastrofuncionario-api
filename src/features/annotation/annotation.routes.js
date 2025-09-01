// features/annotation/annotation.routes.js
const express = require('express');
const AnnotationController = require('./annotation.controller');
const { authMiddleware, authorize } = require('../../utils/auth');

const router = express.Router({ mergeParams: true });

// Aplica autenticação a todas as rotas de anotações
router.use(authMiddleware);

// ==========================================================
// APLICAÇÃO DAS PERMISSÕES GRANULARES
// ==========================================================

router.route('/')
  // Para ver anotações, precisa da permissão de 'edição'
  .get(authorize('annotation:edit'), AnnotationController.getAnnotations)
  // Para criar anotações, precisa da permissão de 'criação'
  .post(authorize('annotation:create'), AnnotationController.createAnnotation);

router.route('/:annotationId')
  // Para atualizar, precisa da permissão de 'edição'
  .put(authorize('annotation:edit'), AnnotationController.updateAnnotation)
  // Para deletar, precisa da permissão de 'exclusão'
  .delete(authorize('annotation:delete'), AnnotationController.deleteAnnotation);

module.exports = router;