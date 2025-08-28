const AnnotationService = require('./annotation.service');

class AnnotationController {
  static async createAnnotation(req, res, next) {
    try {
      const { employeeId } = req.params;
      const responsibleId = req.user.id; // ID do usuário logado (correto)

      // ==========================================================
      // CORREÇÃO APLICADA AQUI
      // Mapeando os campos do frontend para os campos do backend.
      // ==========================================================
      const { titulo, conteudo, categoria } = req.body;

      // Validação para garantir que os dados esperados foram recebidos
      if (!titulo || !conteudo || !categoria) {
        // Envia um erro claro se algum campo estiver faltando
        return res.status(400).json({
          status: 'fail',
          message: 'Os campos "titulo", "conteudo" e "categoria" são obrigatórios.'
        });
      }

      // Cria um novo objeto com os nomes corretos dos campos do modelo
      const annotationData = {
        title: titulo,
        content: conteudo,
        category: categoria
      };

      // Passa o objeto de dados mapeado para o serviço
      const newAnnotation = await AnnotationService.createAnnotation(employeeId, responsibleId, annotationData);
      
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
      
      // Mapeamento semelhante para a atualização, caso o frontend também use "titulo", etc.
      const { titulo, conteudo, categoria } = req.body;
      const updateData = {};
      if (titulo) updateData.title = titulo;
      if (conteudo) updateData.content = conteudo;
      if (categoria) updateData.category = categoria;

      const updatedAnnotation = await AnnotationService.updateAnnotation(annotationId, editedById, updateData);
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