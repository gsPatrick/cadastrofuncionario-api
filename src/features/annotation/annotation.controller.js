const AnnotationService = require('./annotation.service');

class AnnotationController {
  static async createAnnotation(req, res, next) {
    try {
      const { employeeId } = req.params;
      const responsibleId = req.user.id;
      const newAnnotation = await AnnotationService.createAnnotation(employeeId, responsibleId, req.body);
      res.status(201).json({ status: 'success', data: { annotation: newAnnotation } });
    } catch (error) {
      next(error);
    }
  }

  static async getAnnotations(req, res, next) {
    try {
      const query = { ...req.query, ...req.params };
      const annotations = await AnnotationService.getAnnotations(query);
      res.status(200).json({ status: 'success', results: annotations.length, data: { annotations } });
    } catch (error) {
      next(error);
    }
  }

  static async updateAnnotation(req, res, next) {
    try {
      const { annotationId } = req.params;
      const editedById = req.user.id;
      const updatedAnnotation = await AnnotationService.updateAnnotation(annotationId, editedById, req.body);
      res.status(200).json({ status: 'success', data: { annotation: updatedAnnotation } });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAnnotation(req, res, next) {
    try {
      await AnnotationService.deleteAnnotation(req.params.annotationId);
      res.status(204).json({ status: 'success', data: null });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AnnotationController;