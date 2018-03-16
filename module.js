const Controller = require('./controller');
const Module = require('../models/module-model');
const Plan = require('../models/plan-model');
const Media = require('../models/medium-model');

class ModuleController extends Controller {
  constructor() {
    super('modules');
  }

  index() {
    return (req, res) => {
      const query = {};
      Object.assign(query, req.query);

      Module.find(query)
        .sort({ date: -1 })
        .exec()
        .then((medium) => {
          this.render(res, 'index', {
            medium,
          });
        })
        .catch(err => this.error(res, err));
    };
  }

  search() {
    return (req, res) => {
      const pattern = req.body.searchCode;
      Module.find({ title: { $regex: pattern, $options: 'i' } })
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
        Module.findOneAndPopulate({ _id: req.params.id }),
        Plan.find({}).sort({ title: -1 }).exec(),
        Media.find({}).sort({ title: 1 }).exec(),
      ])
        .then((result) => {
          let module = result[0];
          const packageOptions = result[1];
          const media = result[2];

          if (!module) {
            module = {
              title: 'New Module',
              tags: [],
              packages: [],
              system: {
                subjects: [{
                  sections: [{
                    topics: [{
                      title: 'New Topic',
                      media: [],
                    }],
                  }],
                }],
              },
            };
          } else {
            // set up instructors
            module.instructorsList = module.instructors.map(instructor => ({
              id: instructor.id,
              role: instructor.role,
              user: instructor.user && {
                name: instructor.user.name,
                id: instructor.user.id,
              },
            }));
          }

          module.tagSelections = Module.schema.path('tags').caster.enumValues.map(tag => ({
            tag,
            selected: module.tags.includes(tag),
          }));

          module.packageSelections = packageOptions.map(plan => ({
            package: plan.planId,
            selected: module.packages.includes(plan.planId),
          }));

          module.accessOptions = Module.schema.path('access').enumValues.map(tag => ({
            tag,
            selected: (module.access === tag),
          }));

          module.instructorRoles = Module.schema.path('instructors').schema.path('role').enumValues;

          module.statusOptions = Module.schema.path('status').enumValues;

          this.render(res, 'detail', { module, media });
        })
        .catch(err => this.error(res, err));
    };
  }

  create() {
    return (req, res) => {
      const module = new Module(req.body);
      module.save()
        .then(mod => this.redirect(res, `/modules/${mod.id}`))
        .catch(err => this.error(res, err));
    };
  }

  update() {
    return (req, res) => {
      // Build the system -> subject etc structure
      const system = {
        title: req.body.system,
        subjects: [{
          sections: [{
            topics: [],
          }],
        }],
      };
      const mediaUpdates = {};
      const mediaPromises = [];

      let mediaCount = 0;

      mediaUpdates.access = (req.body.access) ? req.body.access : '';
      req.body.curated = (req.body.curated === 'on');

      if (req.body.subjects) {
        req.body.subjects.forEach((subject, subjectIndex) => {
          system.subjects[subjectIndex] = { title: subject, sections: [] };

          req.body.sections[subjectIndex].forEach((section, sectionIndex) => {
            system.subjects[subjectIndex].sections[sectionIndex] = { title: section, topics: [] };

            req.body.topics[subjectIndex][sectionIndex].forEach((topic, topicIndex) => {
              system.subjects[subjectIndex].sections[sectionIndex].topics[topicIndex] = {
                title: topic,
                media: [],
              };

              req.body.media[subjectIndex][sectionIndex][topicIndex].forEach((medium, mediaIndex) => {
                system.subjects[subjectIndex].sections[sectionIndex].topics[topicIndex].media[mediaIndex] = medium;
                mediaCount += 1;
                const updateQuery = {
                  $set: {
                    seq: mediaIndex,
                  },
                  $addToSet: {
                    'tags.topic': topic,
                  },
                };

                mediaPromises.push(Media.findByIdAndUpdate(medium, updateQuery));
              });
            });
          });
        });

        req.body.mediaCount = mediaCount;
        req.body.system = system;
      }

      Promise
        .all(mediaPromises)
        .then((result) => {
          return new Promise((rsv) => {
            const updates = {
              moduleDuration: 0,
              cmeAvailable: 0,
            };

            result.forEach((medium) => {
              let cmeAward = 0;
              updates.moduleDuration += medium.duration;
              if (medium.tags && medium.tags.info && (medium.tags.info.indexOf('cme') > -1) && (medium.duration > 0)) {
                cmeAward = Math.ceil(((medium.duration + (15 * 60)) / 60 / 60) * 4) / 4;
              }
              updates.cmeAvailable += cmeAward;
            });
            rsv(updates);
          });
        })
        .then((updatesFromMedia) => {
          req.body.duration = updatesFromMedia.moduleDuration;
          req.body.cmeAvailable = updatesFromMedia.cmeAvailable;
          return Module.updateFields(req.params.id, req.body);
        })
        .then(() => this.redirect(res, `/modules/${req.params.id}`))
        .catch(err => this.error(res, err));
    };
  }

  remove() {
    return (req, res) => {
      Module.findByIdAndRemove(req.params.id)
        .exec()
        .then(() => this.redirect(res, '/modules'))
        .catch(err => this.error(res, err));
    };
  }
}

module.exports = new ModuleController();
