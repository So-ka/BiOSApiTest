const express = require('express');
const app = express();
const PORT = 5217;

app.use(express.json());

let jobs = {};
let jobResults = {};
let picklists = {};
let jobDetailData = {};

function generateId() {
  return Math.random().toString(36).substring(2, 34);
}

function now() {
  return new Date().toISOString();
}

// --------------------- JOBS ---------------------

app.post('/api/v11/jobs', (req, res) => {
  const jobId = generateId();
  const { JobName, JobType, JobPriority = 100 } = req.body;

  const job = {
    JobId: jobId,
    JobName,
    JobType,
    JobPriority,
    JobState: 'Complete',
    CreatedBy: 'mockUser',
    CreatedAt: now(),
    StartDate: now(),
    EndDate: now(),
    JobProperties: req.body.JobProperties || [],
    PredecessorJobIds: [],
    SuccessorJobIds: [],
    ProcessLogs: [
      {
        ID: generateId(),
        Start: now(),
        End: now(),
        FinishReason: 'Completed',
        ErrorItem: null
      }
    ],
    JobValidationResults: [
      {
        Id: generateId(),
        RuleId: 'JME-ValidationRule-0001',
        ActionType: 'Pre',
        Pass: true,
        RuleDescription: 'Mock Rule',
        Description: 'Passed Mock Rule'
      }
    ],
    UserRights: []
  };

  jobs[jobId] = job;

  // store result
  jobResults[jobId] = {
    Items: [
      {
        ResultId: generateId(),
        ResultClassifiers: JobType,
        IsAbnormal: false,
        CreatedAt: now(),
        ContainerId: generateId(),
        Identifiers: [
          {
            BarcodeTyp: 'ECC 200',
            BarcodeValue: `BAR-${jobId.slice(0, 6)}`,
            LabwareDefinitionId: 'LabwareDef_MOCK'
          }
        ],
        ContainerCustomAttribute: [],
        ParentPositionIndex: null,
        ParentPositionLabel: null,
        LocationDescription: 'Freezer Mock Location',
        LocationSequence: '1',
        LocationId: 'LOC123',
        LabwareDefinitionId: 'LabwareDef_RACK_HAM_MOCK',
        LabwareType: 'TubeRack',
        Children: []
      }
    ],
    SkippedItems: 0,
    TakenItems: 1,
    CountedItems: 1
  };

  res.json(job);
});

app.get('/api/v11/jobs/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/api/v11/jobs/:jobId/results', (req, res) => {
  const results = jobResults[req.params.jobId];
  if (!results) return res.status(404).json({ error: 'Results not found' });
  res.json(results);
});

// --------------------- PICKLISTS ---------------------

app.get('/api/v11/picklists/:picklistId', (req, res) => {
  const id = req.params.picklistId;
  const result = picklists[id] || {
    ResultId: id,
    ResultClassifiers: 'PicklistGenerated',
    ContainerId: generateId(),
    Identifiers: [
      {
        BarcodeTyp: 'Code 128',
        BarcodeValue: 'PKL-' + id.slice(0, 6),
        LabwareDefinitionId: 'LabwareDef_TUBE_HAM_2p0mL'
      }
    ],
    Children: []
  };
  res.json(result);
});

// --------------------- JOB DETAIL DATA ---------------------

app.get('/api/v11/jobs/:jobId/detail', (req, res) => {
  const id = req.params.jobId;
  const detail = jobDetailData[id] || {
    ItemId: id,
    ItemUri: `http://localhost:${PORT}/api/v11/jobs/${id}`,
    ItemType: 'JobDetailData'
  };
  res.json(detail);
});

// --------------------- HEALTH ---------------------

app.get('/api/v11/health', (req, res) => {
  res.json({ status: 'ok', timestamp: now() });
});

app.listen(PORT, () => {
  console.log(`✅ Mock Hamilton API running at http://localhost:${PORT}`);
});
