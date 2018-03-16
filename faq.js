const Controller = require('./controller');
const Faq = require('../models/faq-model');

class FaqController extends Controller {
  constructor() {
    super('faq');
  }

  index() {
    return (req, res) => {
      Faq.find({})
        .then((results) => {
          this.render(res, 'faq', { results });
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      const faq = new Faq(req.body);
      faq.save()
        .then(() => this.redirect(res, '/faq'))
        .catch(err => this.error(res, err));
    };
  }

  edit() {
    return (req, res) => {
      Faq.findById(req.params.id)
        .then((result) => {
          this.render(res, 'detail', result);
        })
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      if (req.body.delete) {
        Faq.findByIdAndRemove(req.params.id)
          .then(() => this.redirect(res, '/faq'))
          .catch(err => this.error(res, err));
      } else {
        Faq.updateFields(req.params.id, req.body)
          .then(() => this.redirect(res, '/faq'))
          .catch(err => this.error(res, err));
      }
    };
  }
  order() {
    return (req, res) => {
      req.body.seq.forEach((item, index) => {
        Faq
          .findByIdAndUpdate(item, { $set: { seq: index } }, { new: true })
          .catch(err => this.error(res, err));
      });
      req.flash('success', 'Order Updated');
      this.redirect(res, '/faq');
    };
  }

}

module.exports = new FaqController();
