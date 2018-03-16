
const Controller = require('./controller');
const PromoModel = require('../models/promo-model');
const ModuleModel = require('../models/module-model');
const constants = require('../../config/constants');

class PromoController extends Controller {
  constructor() {
    super('promos');
  }

  index() {
    return (req, res) => {
      PromoModel.getAllPromos()
      .then(promo => this.render(res, 'index', {
        promo,
        statuses: constants.PROMO_STATUS,
      }))
      .catch(err => this.error(res, err));
    };
  }
  create() {
    return (req, res) => {
      ModuleModel.find().exec()
      .then(modules => this.render(res, 'create-promo', { modules, promo: {} }))
      .catch(err => this.error(res, err));
    };
  }
  createPromo() {
    return (req, res) => {
      PromoModel.createPromo(req.body, res)
      .then(() => this.redirect(res, '/promos'))
      .catch(err => this.error(res, err));
    };
  }
  update() {
    return (req, res) => {
      Promise.all([
        PromoModel.fetchOne(req.params.promoId).exec(),
        ModuleModel.find().exec(),
      ])
      .then(result => this.render(res, 'create-promo', { promo: result[0],
        modules: result[1] }))
      .catch(err => this.error(res, err));
    };
  }
  updatePromo() {
    return (req, res) => {
      PromoModel.updatePromo(req.body, req.params.promoId)
      .then(() => this.redirect(res, '/promos'))
      .catch(err => this.error(res, err));
    };
  }
  remove() {
    return (req, res) => {
      PromoModel.removePromo(req.params.promoId)
      .then(() => this.redirect(res, '/promos'))
      .catch(err => this.error(req, err));
    };
  }
  search() {
    return (req, res) => {
      PromoModel.getAllPromos(req.body)
      .then(promo => this.render(res, 'index', {
        promo,
        statuses: constants.PROMO_STATUS,
      }))
      .catch(err => this.error(res, err));
    };
  }
  details() {
    return (req, res) => {
      PromoModel.fetchOne(req.params.promoId)
      .then(result => this.render(res, 'promo-details', { promo: result }))
      .catch(err => this.error(res, err));
    };
  }

}

module.exports = new PromoController();
