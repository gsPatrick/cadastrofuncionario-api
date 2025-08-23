const express = require('express');
const AnnotationController = require('./annotation.controller');

// { mergeParams: true } permite que este router acesse parâmetros da rota pai
const router = express.Router({ mergeParams: true });

router.route('/')
  .post(AnnotationController.createAnnotation)
  .get(AnnotationController.getAnnotations);

router.route('/:annotationId')
  .put(AnnotationController.updateAnnotation)
  .delete(AnnotationController.deleteAnnotation);

module.exports = router;