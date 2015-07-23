var models = require('../models/models.js');

// Autoload - factoriza el código si la ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
  models.Quiz.find({
      where: { id: Number(quizId) },
      include: [{ model: models.Comment }]
    }).then(
    function(quiz) {
      if (quiz) {
        req.quiz = quiz;
        next();
      }
      else {
        next(new Error('No existe quizId='+quizId));
      }
    }
  ).catch (function(error) {next(error);})
}

// GET /quizes
exports.index = function(req, res, next) {
  var filtro;
  if(req.query.search){
    var search='%'+req.query.search.replace(/ /g, '%')+'%';
    filtro={where: ["pregunta like ?", search], order: 'tema ASC, pregunta ASC'}
  } else {
    filtro={order: 'tema ASC, pregunta ASC'};
  }
  models.Quiz.findAll(filtro).then(
    function(quizes) {
    res.render('quizes/index.ejs', { quizes: quizes, errors: [] });
    }
  ).catch (function(error) {next(error);})
};

// GET /quizes/:id
exports.show = function(req, res) {
  res.render('quizes/show', { quiz: req.quiz, errors: [] });
};

// GET /quizes/:id/answer
exports.answer = function(req, res) {
  var resultado = 'Incorrecto';
  if (req.query.respuesta === req.quiz.respuesta) {
    resultado = 'Correcto';
  }
  res.render('quizes/answer', { quiz: req.quiz, respuesta: resultado, errors: [] });
};

// GET /quizes/new
exports.new = function(req, res) {
  var quiz = models.Quiz.build( // crea el objeto quiz
    {pregunta: "Pregunta", respuesta: "Respuesta", tema: "Otros"}
  );
  res.render('quizes/new', {quiz: quiz, errors: [] });
};

// POST /quizes/create
exports.create = function(req, res, next) {
  var quiz = models.Quiz.build(req.body.quiz);
  //validar la coherencia del quiz
  quiz.validate().then(
    function(err) {
      if (err) {
        res.render('quizes/new', {quiz: quiz, errors: err.errors});
      } else {
        //guardar en DB los campos pregunta y respuesta de quiz
        quiz.save({fields: ["pregunta", "respuesta", "tema"]}).then(
          //Redireccion HTTP (URL relativo) lista de preguntas
          function() {res.redirect('/quizes');}
        ).catch (function(error) {next(error);});
      }
    }
  ).catch (function(error) {next(error);});
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
  // Autoload de la instancia de quiz en req
  res.render('quizes/edit', {quiz: req.quiz, errors: [] });
};

// PUT /quizes/:id
exports.update = function(req, res, next) {
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.tema = req.body.quiz.tema;

  //validar la coherencia del quiz
  req.quiz.validate().then(
    function(err) {
      if (err) {
        res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      } else {
        //guardar en DB los campos pregunta y respuesta de quiz
        req.quiz.save({fields: ["pregunta", "respuesta", "tema"]}).then(
          //Redireccion HTTP (URL relativo) lista de preguntas
          function() {res.redirect('/quizes');}
        ).catch (function(error) {next(error);});
      }
    }
  ).catch (function(error) {next(error);});
};

// DELETE /quizes/:id
exports.destroy = function(req, res, next) {
  req.quiz.destroy().then(
    function() {
      res.redirect('/quizes');
    }
  ).catch(function(error){next(error)});
}

// GET /quizes/statistics
exports.statistics = function(req, res, next) {
  var statistics = {};
  var errors = [];
  models.Quiz.count().then(
    function(count) {
      statistics.quizes = count;
      models.Comment.count().then(
        function(count) {
          statistics.comments = count;
          statistics.commentsByQuiz = count/statistics.quizes;
          models.Comment.aggregate('QuizId', 'count', {'distinct': true }).then(
            function(count) {
              statistics.commented = count;
              statistics.uncommented = statistics.quizes-count;
              res.render('quizes/statistics.ejs', { statistics: statistics, errors: errors });
            }
          ).catch (function(error) {next(error);})
        }
      ).catch (function(error) {next(error);})
    }
  ).catch (function(error) {next(error);})
};
