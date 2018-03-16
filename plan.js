const Controller = require('./controller');
const Plan = require('../models/plan-model');
const Module = require('../models/module-model');
const Medium = require('../models/medium-model');
const User = require('../models/user-model');

class PlanController extends Controller {
  constructor() {
    super('plans');
  }

  index() {
    return (req, res) => {
      Plan.find({})
        .sort({ title: 1 })
        .exec()
        .then((results) => {
          this.render(res, 'index', { results });
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      const plan = new Plan(req.body);
      plan.save()
        .then(() => this.redirect(res, '/plans'))
        .catch(err => this.error(res, err));
    };
  }

  edit() {
    return (req, res) => {
      Promise.all([
        Plan.findById(req.params.id).exec(),
        Module.find({}).sort({ title: 1 }).exec(),
      ])
        .then((result) => {
          const plan = result[0];
          const modules = result[1];

          if (!plan) {
            plan.moduleSelections = modules.map(module => ({
              id: module.id,
              title: module.title,
              selected: false,
            }));
          } else {
            plan.moduleSelections = modules.map(module => ({
              id: module.id,
              title: module.title,
              selected: (module.packages.includes(plan.planId)),
            }));
            plan.optionSelections = Plan.schema.path('options').caster.enumValues.map(option => ({
              option,
              selected: plan.options.includes(option)
            }));
          }
          this.render(res, 'plan', plan);
        })
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      if (req.body.delete) {
        Plan.findByIdAndRemove(req.params.id)
          .then(() => this.redirect(res, '/plans'))
          .catch(err => this.error(res, err));
      } else {
        const planId = req.body.planId;
        const moduleSelections = req.body.moduleSelections;
        if (req.body.options) {
          req.body.options = (Array.isArray(req.body.options)) ? req.body.options : [req.body.options];
        } else {
          req.body.options = '';
        }
        Module.find({}).exec().then((modules) => {
          modules.forEach((module) => {
            if (moduleSelections.includes(module.id) && !module.packages.includes(planId)) {
              module.updatePackage({
                packageName: planId,
              }, 'add');
            }

            if (!moduleSelections.includes(module.id) && module.packages.includes(planId)) {
              module.updatePackage({
                packageName: planId,
              }, 'remove');
            }
          });
        });

        Plan.updateFields(req.params.id, req.body)
          .then(() => {
            if (req.body.updateExisting) {
              User
                .update(
                  { 'subscriptions.planSlug': req.body.planId },
                  { $set: { 'subscriptions.$.options': req.body.options } },
                  { multi: true })
                .then(() => this.redirect(res, `/plans/${req.params.id}`))
                .catch(err => this.error(res, err));
            } else {
              this.redirect(res, `/plans/${req.params.id}`);
            }
          })
          .catch(err => this.error(res, err));
      }
    };
  }

  addToAll() {
    return (req, res) => {
      Plan.findById(req.params.id).exec()
        .then((plan) => {
          Medium.update(
            { access: 'subscription' },
            {
              $addToSet: { packages: plan.planId },
            },
            { multi: true }
          )
            .then(() => {
              req.flash('success', 'Added to all subscription videos!');
              this.redirect(res, `/plans/${plan.id}`);
            })
            .catch(err => this.error(res, err));
        })
        .catch(err => this.error(res, err));
    };
  }

}

module.exports = new PlanController();
