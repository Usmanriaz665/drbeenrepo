const Controller = require('./controller');
const UserModel = require('../models/user-model');
const constants = require('../../config/constants');
const Plan = require('../models/plan-model');

class UserController extends Controller {
  constructor() {
    super('users');
  }

  index() {
    return (req, res) => {
      UserModel.getAllUsers(req.query)
        .then(result => this.render(res, 'users', Object.assign(result, {
          statuses: constants.USER_STATUS,
        })))
        .catch(err => this.error(res, err));
    };
  }

  search() {
    return (req, res) => {
      UserModel.getAllUsers(req.body)
        .then(result => this.render(res, 'users', Object.assign(result, {
          query: req.body,
          statuses: constants.USER_STATUS,
        })))
        .catch(err => this.error(res, err));
    };
  }

  detail() {
    return (req, res) => {
      UserModel.getDetails({ _id: req.params.userId })
        .then(result => this.render(res, 'user-detail', result))
        .catch(err => this.error(res, err));
    };
  }

  suspend() {
    return (req, res) => {
      UserModel.updateStatus(req.params.userId, constants.USER_STATUS.SUSPENDED)
        .then(() => this.redirect(res, '/users'))
        .catch(err => this.error(res, err));
    };
  }

  activate() {
    return (req, res) => {
      UserModel.updateStatus(req.params.userId, constants.USER_STATUS.ACTIVE)
        .then(() => this.redirect(res, '/users'))
        .catch(err => this.error(res, err));
    };
  }

  remove() {
    return (req, res) => {
      UserModel.removeUser(req.params.userId)
        .then(() => this.redirect(res, '/users'))
        .catch(err => this.error(res, err));
    };
  }

  modules() {
    return (req, res) => {
      UserModel.setModules(req.params.userId, req.body.modules)
        .then(() => this.redirect(res, `/users/${req.params.userId}`))
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      Promise.all([
        UserModel.fetchOne({ _id: req.params.userId }),
        Plan.find({}).sort({ title: -1 }).exec(),
      ])
        .then(([user, plans]) => {
          user.rolesInfo = UserModel.schema.path('roles').caster.enumValues
            .map(role => ({
              role,
              checked: (user.roles ? user.roles.includes(role) : false),
            }));

          this.render(res, 'user-update', { user, plans });
        })
        .catch(err => this.error(res, err));
    };
  }

  removePlan() {
    return (req, res) => {
      UserModel.disablePlan(req.params.userId, req.params.planId)
        .then(() => this.redirect(res, `/users/${req.params.userId}/update`))
        .catch(err => this.error(res, err));
    };
  }

  updatePassword() {
    return (req, res) => {
      this.render(res, 'update-password');
    };
  }

  updateUserPassword() {
    return (req, res) => {
      if (req.body.password === req.body.confirmPassword) {
        UserModel.adminChangePassword(req.params.userId, req.body.password)
          .then(() => this.redirect(res, '/users'))
          .catch(err => this.error(res, err));
      } else {
        this.render(res, 'update-password', {
          error: 'passwords do not match',
        });
      }
    };
  }

  updateUserDetails() {
    return (req, res) => {
      UserModel.updateUserDetails(req.body, req.params.userId)
        .then((user) => {
          if (req.body.addPackage) {
            user.addPlan(req.body.addPackage)
              .then(() => this.redirect(res, `/users/${req.params.userId}/update`))
              .catch(err => this.error(res, err));
          } else {
            return this.redirect(res, `/users/${req.params.userId}/update`);
          }
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      this.render(res, 'create-user');
    };
  }

  createUser() {
    return (req, res) => {
      if (req.body.password === req.body.confirmPassword) {
        UserModel.createUser(req.body, res)
          .then(() => this.redirect(res, '/users'))
          .catch(err => this.error(res, err));
      } else {
        this.render(res, 'create-user', {
          error: 'passwords do not match',
        });
      }
    };
  }

}

module.exports = new UserController();
