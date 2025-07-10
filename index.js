
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
  const job = { ...req.body, JobId: newjobid};
  db.jobs.push(job);
  result = {
    "ItemId": newjobid, 
    "ItemUri": "https://biosapitest.onrender.com/api/v11/jobs/"+newjobid, 
    "ItemType": "JobDetailData" 
    } 
  console.log(`JOB CREATED :`,db);
  res.status(201).json(result);
});

app.listen(port, () => {
  console.log(`Mock Hamilton API running at http://localhost:${port}`);
});
