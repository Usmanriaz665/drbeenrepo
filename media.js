/* eslint-disable no-param-reassign */
const Controller = require('./controller');
const Medium = require('../models/medium-model');
const Plan = require('../models/plan-model');
const video23 = require('node-23video');
const config = require('../../config');

const v23 = video23('media.drbeen.com', config.v23.consumerKey, config.v23.consumerSecret);

class MediaController extends Controller {
  constructor() {
    super('media');
  }

  index() {
    return (req, res) => {

      Medium.getMediaList(req)
        .then((medium) => {
          this.render(res, 'index', medium);
        })
        .catch(err => this.error(res, err));
    };
  }

  search() {
    return (req, res) => {
      const pattern = req.body.searchCode;
      Medium.find({ title: { $regex: pattern, $options: 'i' } })
        .then((medium) => {
          const query = {
            code: req.body.searchCode,
          };
          const searchFocus = 'autofocus';
          this.render(res, 'index', {
            medium,
            query,
            searchFocus,
          });
        })
        .catch(err => this.error(res, err));
    };
  }

  detail() {
    return (req, res) => {
      Promise.all([
        Plan.find({}).sort({ title: -1 }).exec(),
        Medium.findById(req.params.id).populate('instructors.user').exec(),
        Medium.getModules(req.params.id),
      ])
        .then(([packageOptions, medium, modules]) => {
          medium.packageSelections = packageOptions.map((plan) => {
            let selected = false;
            if (medium.packages.includes(plan.planId)) {
              selected = true;
            }
            return { package: plan.planId, selected };
          });
          medium.statusOptions = Medium.schema.path('status').enumValues;


          medium.instructorsList = medium.instructors.map(instructor => ({
            id: instructor.id,
            role: instructor.role,
            user: instructor.user && {
              name: instructor.user.name,
              id: instructor.user.id,
            },
          }));
          medium.instructorRoles = Medium.schema.path('instructors').schema.path('role').enumValues;

          medium.infoTags = Medium.schema.path('tags.info').caster.enumValues
            .map(info => ({
              info: info,
              checked: medium.tags.info.includes(info),
            }));

          medium.accessOptions = Medium.schema.path('access').enumValues.map(tag => ({ tag, selected: (medium.access === tag) }));

          medium.moduleList = modules;

          this.render(res, 'detail', medium);
        })
        .catch(err => this.error(res, err));
    };
  }

  createMedium() {
    return (req, res) => {
      Plan.find({}).sort({ title: -1 }).exec()
        .then((packageOptions) => {
          const context = {
            title: 'New Medium',
          };
          context.packageSelections = packageOptions.map((plan) => {
            return { package: plan.planId, selected: false };
          });
          context.infoTags = Medium.schema.path('tags.info').caster.enumValues.map((tag) => {
            return { infoTag: tag, selected: false };
          });

          this.render(res, 'detail', context);
        })
        .catch(err => this.error(res, err));
    };
  }

  addLocale() {
    return (req, res) => {
      const newMedium = {
        title: req.query.title,
        description: req.query.description || '',
        publish: 0,
      };

      v23.photo.getUploadToken(newMedium, config.v23.accessToken, config.v23.accessTokenSecret)
        .then((body) => {
          const context = {
            layout: false,
            uploadToken: body.uploadtoken.upload_token,
          };
          this.render(res, 'add-locale', context);
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      const videoIdOn23 = req.body.videoId ? parseInt(req.body.videoId, 10) : null;
      if (!videoIdOn23) {
        this.error(res, new Error('No videoId submitted!'));
      } else {
        v23.photo.list({
          photo_id: videoIdOn23,
          include_unpublished_p: 1,
        }, config.v23.accessToken, config.v23.accessTokenSecret)
          .then((data) => {
            if (!data.hasOwnProperty('total_count') || !data.hasOwnProperty('photos') || (data.total_count <= 0)) {
              this.error(new Error('No video with id', videoIdOn23, 'found on 23video!'));
            } else {
              const medium = new Medium(req.body);
              const video = data.photos[0];
              v23.protection.protect({
                object_id: video.photo_id,
                protection_method: 'custom',
                endpoint: config.v23.protectionEndpoint,
              }, config.v23.accessToken, config.v23.accessTokenSecret)
                .then((protectedVideo) => {
                  medium.locales = [{
                    languageCode: 'en-US',
                    referenceId: video.photo_id,
                    referenceToken: video.token,
                    referenceLocationId: video.tree_id,
                    authToken: protectedVideo.protection.protected_token,
                  }];
                  medium.instructors = [{
                    name: req.body.instructor,
                    role: 'lead',
                  }];

                  medium.duration = parseInt(video.video_length, 10);

                  medium.save()
                    .then(() => this.redirect(res, '/media/'))
                    .catch(err => this.error(res, err));
                })
                .catch(err => this.error(res, err));
            }
          })
          .catch(err => this.error(res, err));
      }
    };
  }

  update() {
    return (req, res) => {
      if (req.body.delete) {
        Medium.findByIdAndRemove(req.params.id)
          .exec()
          .then(() => this.redirect(res, '/media'))
          .catch(err => this.error(res, err));
      } else {
        Medium.updateFields(req.params.id, req.body)
          .then(() => {
            req.flash('success', 'Media Updated!');
            this.redirect(res, `/media/${req.params.id}`);
          })
          .catch(err => this.error(res, err));
      }
    };
  }

  order() {
    return (req, res) => {
      req.body.sequence.forEach((medium, index) => {
        Medium
          .findByIdAndUpdate(medium, { $set: { seq: index } }, { new: true })
          .catch(err => this.error(res, err));
      });
      req.flash('success', 'Media Order Updated');
      this.redirect(res, '/media');
    };
  }

  bulkEdit() {
    return (req, res) => {
      Medium.bulkUpdate(req.body)
        .then((medium) => {
          this.redirect(res, `/media?${req.body.queryString}`);
        })
        .catch(err => this.error(res, err));
    };
  }

  reorderMedia() {
    return (req, res) => {
      const temp = req.body.orderedMedia.split(',');
      temp.forEach((element, index) => {
        if (index !== 0) {
          Medium
            .findByIdAndUpdate(element, { $set: { seq: index } })
            .catch((err) => {
              this.error(res, err);
            });
        }
      }, this);
      req.flash('success', 'Media Order Updated');
      this.redirect(res, `/media?${req.body.queryString2}`);
    };
  }
}

module.exports = new MediaController();
