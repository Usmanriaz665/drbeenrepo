/* eslint-disable no-param-reassign */
const Controller = require('./controller');
const CME = require('../models/cme-model');
const Question = require('../models/question-model');
const Medium = require('../models/medium-model');

function updateQuestion(questionObj) {
  return new Promise((rsv, rej) => {
    const updates = {};
    if (questionObj.cme) {
      updates.$set = { cmeId: questionObj.cme.id };
    } else {
      updates.$unset = { cmeId: '', module_id: '' };
    }
    Question.findByIdAndUpdate(questionObj.id, updates)
      .then(rsv)
      .catch(rej);
  });
}

class CmeController extends Controller {
  constructor() {
    super('cmes');
  }

  index() {
    return (req, res) => {
      CME.find({})
        .sort({ topic: 1 })
        .populate('mediumId')
        .exec()
        .then((cmes) => {
          this.render(res, 'index', {
            cmes,
          });
        })
        .catch(err => this.error(res, err));
    };
  }

  detail() {
    return (req, res) => {
      Promise.all([
        CME.findById(req.params.id).populate('mediumId').exec(),
        Question.find({}).exec(),
        Medium.find({}).exec(),
      ])
        .then(([cme, allQuestions, media]) => {
          Question.find({ $or: [{ module_id: cme.topic_uri }, { cmeId: cme.id }] }).exec()
            .then((questions) => {
              const context = cme.toObject();
              context.id = cme.id;
              context.questions = questions;
              context.allQuestions = allQuestions;
              context.allQuestionsJson = encodeURIComponent(JSON.stringify(allQuestions));
              context.allMedia = media;
              this.render(res, 'detail', context);
            })
            .catch(err => this.error(res, err));
        })
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      const updateObj = { $set: {} };
      Object.keys(CME.schema.paths).forEach((key) => {
        if (req.body.hasOwnProperty(key)) {
          updateObj.$set[key] = req.body[key];
        }
      });
      if (!req.body.mediumId) {
        updateObj.$unset = { mediumId: '' };
        // Update Medium to not be tagged a CME
        CME.findOne({ _id: req.params.id }).exec()
          .then((originalCme) => {
            Medium.findOne({ _id: originalCme.mediumId }).exec()
              .then((medium) => {
                medium.tags.info.splice(medium.tags.info.indexOf('cme'), 1);
                medium.save()
                  .catch(err => console.error('Unable to update medium:', err));
              })
              .catch(err => console.error('Unable to update medium:', err));
          })
          .catch(err => console.error('Unable to get CME:', err));
      } else {
        Medium.findOne({ _id: req.body.mediumId }).exec()
          .then((medium) => {
            medium.tags.info.push('cme');
            medium.save()
              .catch(err => console.error('Unable to update medium:', err));
          })
          .catch(err => console.error('Unable to update medium:', err));
      }

      Promise
        .all([
          CME.findByIdAndUpdate(req.params.id, updateObj, { new: true }),
          Question.find({ $or: [{ module_id: req.body.topic_uri }, { cmeId: req.params.id }] }).exec(),
        ])
        .then(([updatedCme, currentQuestions]) => {
          const removedQuestions = currentQuestions.filter(curQuest => !(req.body.questions.includes(curQuest.id)));
          let questions = req.body.questions.map(qId => ({ id: qId, cme: updatedCme }));
          questions = questions.concat(removedQuestions);

          Promise
            .all(questions.map(updateQuestion))
            .then(() => {
              req.flash('success', 'CME Updated!');
              this.redirect(res, `/cmes/${req.params.id}`);
            })
            .catch(err => this.error(res, err));
        })
        .catch(err => this.error(res, err));
    };
  }
}

module.exports = new CmeController();
