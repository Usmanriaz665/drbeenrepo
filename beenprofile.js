const Controller = require('./controller');
const BeenProfile = require('../models/beenprofile-model');

class BeenProfileController extends Controller {
  constructor() {
    super('beenprofiles');
  }

  index() {
    return (req, res) => {
      BeenProfile.find({})
        .then((profiles) => {
          this.render(res, 'index', { profiles });
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      const profile = new BeenProfile(req.body);
      profile.save()
        .then(() => this.redirect(res, '/beenprofiles'))
        .catch(err => this.error(res, err));
    };
  }

  edit() {
    return (req, res) => {
      BeenProfile.findById(req.params.id)
        .then((profile) => {
          this.render(res, 'profile', profile);
        })
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      if (req.body.delete) {
        BeenProfile.findByIdAndRemove(req.params.id)
          .then(() => this.redirect(res, '/beenprofiles'))
          .catch(err => this.error(res, err));
      } else {
        BeenProfile.updateFields(req.params.id, req.body)
          .then(() => this.redirect(res, '/beenprofiles'))
          .catch(err => this.error(res, err));
      }
    };
  }
}

module.exports = new BeenProfileController();
