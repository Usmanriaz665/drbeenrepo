const Controller = require('./controller');
const UserModel = require('../models/user-model');

class HomeController extends Controller {
  constructor() {
    super('home');
  }

  index() {
    return (req, res) => {
      Promise.all([
        UserModel.recentUsersCount(),
        UserModel.usersThisMonthCount(),
        UserModel.recentUsersChart(),
      ])
        .then((result) => {
          this.render(res, 'index', {
            recentUsersCount: result[0],
            usersThisMonthCount: result[1][0],
            recentUsersChart: result[2],
          });
        })
        .catch(err => this.error(res, err));
    };
  }
}

module.exports = new HomeController();
