/**
 * Every other controller in the app could extend this class.
 * We can have all the common methods for a controller here is this class.
 */
module.exports = class Controller {
  constructor(pathPrefix) {
    this.pathPrefix = pathPrefix;
  }

  render(res, path, context) {
    res.render(`${this.pathPrefix}/${path}`, context || {});
  }

  error(res, err) {
    console.log('ERROR', err);
    res.render('error/500', err);
  }

  redirect(res, path) {
    res.redirect(path);
  }
};
