const Controller = require('./controller');
const reportsModel = require('../models/reports-model');


class ReportController extends Controller {
  constructor() {
    super('reports');
  }

  index() {
    return (req, res) => {
      reportsModel.getVideoEngagementReport(true)
        .then((report) => {
          const checked = 'checked';
          this.render(res, 'reports', { report, checked });
        })
        .catch((err) => {
          this.error(res, err);
        });
    };
  }

  getVideoEngagementReportInRange() {
    return (req, res) => {
      let fromDate = req.body.from;
      let toDate = req.body.to;
      const uniqueMinutes = (!!req.body.uniqueMinutes);
      if (fromDate === '') {
        fromDate = '2000-01-01';
      }
      if (toDate === '') {
        toDate = '3000-01-01';
      }
      fromDate = new Date(`${fromDate}Z`).toISOString();
      toDate = new Date(`${toDate}Z`).toISOString();
      reportsModel.getVideoEngagementReport(uniqueMinutes, fromDate, toDate)
        .then((report) => {
          fromDate = ReportController.formatedDateString(fromDate);
          toDate = ReportController.formatedDateString(toDate);
          fromDate = (fromDate === '1/1/2000' ? '' : fromDate);
          toDate = (toDate === '1/1/3000' ? '' : toDate);
          const checked = (uniqueMinutes ? 'checked' : '');
          const noDataMsg = (report.length === 0);
          this.render(res, 'reports', { report, fromDate, toDate, noDataMsg, checked });
        })
        .catch((err) => {
          this.error(res, err);
        });
    };
  }

  static formatedDateString(strDate) {
    const givenDate = new Date(strDate);
    const day = givenDate.getDate();
    const month = givenDate.getMonth() + 1;
    const year = givenDate.getFullYear();
    const formattedDate = `${month}/${day}/${year}`;
    return formattedDate;
  }

}

module.exports = new ReportController();