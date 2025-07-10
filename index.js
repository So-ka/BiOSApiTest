
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();
const port = 5217;

app.use(bodyParser.json());

function requireToken(req, res, next) {
  next();
}

//BUSINESS LOGIC
function generateId() {
  return crypto.randomUUID(); // Node >= 14.17
}

//Simulate Job LifeCycle : PENDING -> RUNNING -> COMPLETE
//Each 15 sec new state
//Final complete State it add result to db
function simulateJobLifecycle(job) {
  let stateIndex = 0;
  job.JobState = jobStates[stateIndex];

  const interval = setInterval(() => {
    stateIndex++;

    if (stateIndex < jobStates.length) {
      job.JobState = jobStates[stateIndex];
      console.log(`Job ${job.JobId} moved to ${job.JobState}`);
    } else {
      clearInterval(interval);
      job.EndDate = new Date().toISOString();
      console.log(`Job ${job.JobId} completed`);

      //Create result now that job is complete
      const result = {
        ResultId: generateId(),
        ParentResultId: null,
        PredecessorJobId: job.JobId,
        ResultClassifiers: "Identified",
        IsAbnormal: false,
        CreatedAt: new Date().toISOString(),
        Message: `Result for completed job ${job.JobId}`,
        ContainerId: generateId(),
        Identifiers: [
          {
            BarcodeTyp: "2 of 5 Interleaved",
            BarcodeValue: generateId(),
            LabwareDefinitionId: "LabwareDef-VialTransparentCap---"
          }
        ],
        PositionIndex: null,
        PositionLabel: null,
        LocationDescription: "Star Picker Jaw Location",
        LocationSequence: 3,
        LocationId: 2020202003,
        LabwareDefinitionId: "LabwareDef-VialTransparentCap---",
        LabwareType: "Vial",
        Children: []
      };
      db.results.push(result);
      
      // Create 2 child results
      for (let i = 0; i < 1; i++) {
        const childResult = {
          ...result,
          ResultId: generateId(),
          ParentResultId: result.ResultId,
          ContainerId: generateId(),
          BarcodeValue: generateId(),
          PositionLabel: `${i + 1}`,
          PositionIndex: i + 1,
          ResultClassifiers: "Identified",
          Children: [],
          Identifiers: [ 
                { 
                    "BarcodeTyp": "2 of 5 Interleaved", 
                    "BarcodeValue": "ZI3456789012", 
                    "LabwareDefinitionId": "LabwareDef-VialWhiteCap---------" 
                },                { 
                    "BarcodeTyp": "2 of 5 Interleaved", 
                    "BarcodeValue": "ZI7654321098", 
                    "LabwareDefinitionId": "LabwareDef-VialWhiteCap---------" 
                },
                                { 
                    "BarcodeTyp": "2 of 5 Interleaved", 
                    "BarcodeValue": "ZI8765432190", 
                    "LabwareDefinitionId": "LabwareDef-VialWhiteCap---------" 
                },                { 
                    "BarcodeTyp": "2 of 5 Interleaved", 
                    "BarcodeValue": "ZI0987654321", 
                    "LabwareDefinitionId": "LabwareDef-VialWhiteCap---------" 
                }
            ],
        }
        db.results.push(childResult);
    };
        
      
    }
  }, 15000);
}

// Recursive child resolver
function attachChildren(result, allResults) {
  const children = allResults.filter(r => r.ParentResultId === result.ResultId);
  result.Children = children.map(child => attachChildren(child, allResults));
  return result;
}

const db = {
  jobs: [],
  results: [],
  picklists: [],
  picklistContainers: {} 
}

const jobStates = ['Pending', 'Running', 'Complete'];

// Auth
app.post('/api/v11/users/:userId/sessions', (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;
  const token = `${userId}-token`;
  res.json({ SessionToken: token });
});

//CreateNewjob
app.post('/api/v11/jobs', requireToken, (req, res) => {
  //controle how jobs are stored
  const newjobid = `job-${Date.now()}`;
  const job = {
              "JobId": newjobid, 
              "JobPriority": req.body.JobPriority || 0, 
              "JobName": req.body.JobName, 
              "JobType": req.body.JobType, 
              "JobState": jobStates[0], 
              "CreatedBy": "admin", 
              "CreatedAt": "2015-01-19T07:21:09+01:00", 
              "StartDate": "2015-01-19T07:21:09.33+01:00", 
              "EndDate": "2015-01-19T07:21:10.087+01:00", 
              "JobProperties": req.body.JobProperties || [], 
              "PredecessorJobIds": [], 
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
  simulateJobLifecycle(job);
  result = {
    "ItemId": newjobid, 
    "ItemUri": "https://biosapitest.onrender.com/api/v11/jobs/"+newjobid, 
    "ItemType": "JobDetailData" 
    }
  console.log(`JOB CREATED :`,db);
  res.status(201).json(result);
});

//GetSpecificJob
app.get('/api/v11/jobs/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const job = db.jobs.find(j => j.JobId === jobId);
  if (job) {
    res.json(job);
  } else {
    res.status(404).json({ message: 'Job not found' });
    console.log('Job not found:', jobId);
  }
});

//GetSpecificJobResults
app.get('/api/v11/jobs/:jobId/results', requireToken, (req, res) => {
  const { jobId } = req.params;
  const take = parseInt(req.query.take) || 100;
  const skip = parseInt(req.query.skip) || 0;

  const results = db.results.filter(r => r.PredecessorJobId === jobId && !r.ParentResultId);
  const sliced = results.slice(skip, skip + take);
  res.json({
    Items: sliced,
    SkippedItems: skip,
    TakenItems: sliced.length,
    CountedItems: results.length
  });
});

// Get one result by ID with all its children
app.get('/api/v11/jobs/:jobId/results/:resultId', requireToken, (req, res) => {
  const { jobId, resultId } = req.params;

  const allResults = db.results;
  const result = allResults.find(r => r.ResultId === resultId);

  if (!result) {
    return res.status(404).json({ message: 'Result not found' });
  }

  // Optional: check if result belongs to job
  if (result.PredecessorJobId !== jobId && result.PredecessorJobId !== null) {
    return res.status(404).json({ message: 'Result does not belong to job' });
  }

  const fullResult = attachChildren({ ...result }, allResults);
  res.status(200).json(fullResult);
});

//Picklist
app.post('/api/v11/picklists', requireToken, (req, res) => {
  const { PicklistName } = req.body;

  if (!PicklistName) {
    return res.status(400).json({ message: 'PicklistName is required' });
  }

  const newPicklistId = crypto.randomUUID();
  const picklist = {
    PicklistId: newPicklistId,
    PicklistName,
    CreatedAt: new Date().toISOString()
  };

  db.picklists.push(picklist);

  res.status(201).json({
    ItemId: newPicklistId,
    ItemUri: `https://biosapitest.onrender.com/api/v11/picklists/${newPicklistId}`,
    ItemType: "PicklistDetailData"
  });
  console.log(`Picklist created:`, db.picklists);
});

app.post('/api/v11/picklists/:picklistId/containers', requireToken, (req, res) => {
  const { picklistId } = req.params;
  const { Items = [], TargetPositions = [] } = req.body;

  // Check if picklist exists
  const picklist = db.picklists.find(p => p.PicklistId === picklistId);
  if (!picklist) {
    return res.status(404).json({ message: 'Picklist not found' });
  }

  if (!Array.isArray(Items)) {
    return res.status(400).json({ message: 'Items array required' });
  }

  // Initialize picklist container map if not already
  if (!db.picklistContainers[picklistId]) {
    db.picklistContainers[picklistId] = [];
  }

  const rejected = [];

  for (const item of Items) {
    // Basic validation: must have IdentifierValue (minimal valid format)
    if (!item.IdentifierValue) {
      rejected.push({
        Identifier: item,
        Reason: 'Missing IdentifierValue'
      });
      continue;
    }

    // Avoid duplicates
    const alreadyAssigned = db.picklistContainers[picklistId].some(c => c.IdentifierValue === item.IdentifierValue);
    if (alreadyAssigned) {
      rejected.push({
        Identifier: item,
        Reason: 'Already assigned'
      });
      continue;
    }

    // Add to picklist container list
    db.picklistContainers[picklistId].push({
      ...item,
      TargetPositions: TargetPositions || []
    });
  }

  res.status(200).json({
    RejectedIdentifiers: rejected
  });
});


//APILOGIC
app.listen(port, () => {
  console.log(`Mock Hamilton API running at http://localhost:${port}`);
});