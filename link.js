const Controller = require('./controller');
const Link = require('../models/link-model');

class LinkController extends Controller {
  constructor() {
    super('links');
  }

  index() {
    return (req, res) => {
      Link.find({})
        .sort({ shortUrl: 1 })
        .exec()
        .then((results) => {
          this.render(res, 'links', { results });
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      const link = new Link(req.body);
      link.save()
        .then(() => this.redirect(res, '/links'))
        .catch(err => this.error(res, err));
    };
  }

  edit() {
    return (req, res) => {
      Link.findById(req.params.id)
        .then((result) => {
          this.render(res, 'link', result);
        })
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      if (req.body.delete) {
        Link.findByIdAndRemove(req.params.id)
          .then(() => this.redirect(res, '/links'))
          .catch(err => this.error(res, err));
      } else {
        Link.updateFields(req.params.id, req.body)
          .then(() => this.redirect(res, '/links'))
          .catch(err => this.error(res, err));
      }
    };
  }
}

module.exports = new LinkController();
