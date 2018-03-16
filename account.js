const pathPrefix = 'account';
const passport = require('passport');

function render(res, path, context) {
  res.render(`${pathPrefix}/${path}`, context);
}

module.exports = {
  login: (req, res) => render(res, 'login', { layout: 'account' }),

  authenticate: (req, res, next) => {
    return passport.authenticate('login', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true,
    })(req, res, next);
  },
};
