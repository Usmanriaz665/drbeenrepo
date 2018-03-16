const Controller = require('./controller');
const Webinar = require('../models/webinar-model');
const constants = require('../../config/constants');

class WebinarController extends Controller {
  constructor() {
    super('webinars');
  }

  index() {
    return (req, res) => {
      Webinar.find({})
        .sort({ date: -1 })
        .exec()
        .then((webinars) => {
          this.render(res, 'index', {
            webinars,
            statuses: constants.WEBINAR_STATUS,
          });
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      const webinar = new Webinar(req.body);
      webinar.save()
        .then(() => this.redirect(res, '/webinars'))
        .catch(err => this.error(res, err));
    };
  }

  edit() {
    return (req, res) => {
      Webinar.findById(req.params.id)
        .exec()
        .then((webinar) => {
          this.render(res, 'webinar', webinar);
        })
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      if (req.body.delete) {
        Webinar.findByIdAndRemove(req.params.id)
          .exec()
          .then(() => this.redirect(res, '/webinars'))
          .catch(err => this.error(res, err));
      } else {
        Webinar.updateFields(req.params.id, req.body)
          .then(() => this.redirect(res, `/webinars/${req.params.id}`))
          .catch(err => this.error(res, err));
      }
    };
  }
}

module.exports = new WebinarController();
