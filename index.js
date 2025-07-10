
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 5217;

app.use(bodyParser.json());

function requireToken(req, res, next) {
  next();
}

const db = {
  jobs: [],
}
// Auth
app.post('/api/v11/users/:userId/sessions', (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;
  const token = `${userId}-token`;
  res.json({ SessionToken: token });
});

//jobs
app.post('/api/v11/jobs', requireToken, (req, res) => {
  //controle how jobs are stored
  const newjobid = `job-${Date.now()}`;
  const job = {
              "JobId": newjobid, 
              "JobPriority": req.body.JobPriority || 0, 
              "JobName": req.body.JobName, 
              "JobType": req.body.JobType, 
              "JobState": "Complete", 
              "CreatedBy": "admin", 
              "CreatedAt": "2015-01-19T07:21:09+01:00", 
              "StartDate": "2015-01-19T07:21:09.33+01:00", 
              "EndDate": "2015-01-19T07:21:10.087+01:00", 
              "JobProperties": req.body.JobProperties || [], 
              "PredecessorJobIds": [ 
                "7ad5ebe1c3d44429960c9254591cb42a" 
              ], 
              "SuccessorJobIds": [], 
              "ProcessLogs": [ 
                { 
                  "End": "2015-01-19T07:21:10.087+01:00", 
                  "FinishReason": "Completed", 
                  "ID": "41a151de56fd4e6098286b02c57d15d5", 
                  "Start": "2015-01-19T07:21:09.33+01:00", 
                  "ErrorItem": null 
                } 
              ], 
              "UserRights": [] 
  }
  db.jobs.push(job);
  result = {
    "ItemId": newjobid, 
    "ItemUri": "https://biosapitest.onrender.com/api/v11/jobs/"+newjobid, 
    "ItemType": "JobDetailData" 
    } 
  console.log(`JOB CREATED :`,db);
  res.status(201).json(result);
});

app.get('/api/v11/jobs/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = jobs.find(j => j.JobId === jobId);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ message: 'Job not found' });
  }
});


//api
app.listen(port, () => {
  console.log(`Mock Hamilton API running at http://localhost:${port}`);
});
