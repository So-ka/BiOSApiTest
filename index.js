
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 5217;

app.use(bodyParser.json());

const db = {
  tokens: [],
  users: [{ id: 'admin', password: '1234' }],
  libraries: [{ 
  "LibraryId": "Quarantine", 
  "LibraryDescription": "Used to store potentially contaminated samples", 
  "LibraryType": "Quarantine", 
  "AreaIndexPref": 0, 
  "Orientation": "Static" 
} ],
  containers: [{ 
  "ContainerId": "4d283790bfa449acb7bc418a0eae4d3f", 
  "ParentId": null, 
  "Parent": null, 
  "LabwareDefinitionId": "LabwareDef-StorageTray-Vials----", 
  "LabwareType": "StorageTray", 
  "LabwareStatus": "OK", 
  "LabwareId": 1, 
  "Inactive": false, 
  "RegistrationState": "Unregistered", 
  "ContainerLocation": "Device", 
  "Identifiers": [{ 
   "BarcodeTyp": "ECC 200", 
   "BarcodeValue": "0c3c0877-74ba-4f5a-8ad9-f9b174d386e3", 
   "LabwareDefinitionId": "LabwareDef-StorageTray-Vials----" 
  }], 
  "PositionIndex": null, 
  "PositionLabel": null, 
  "PositionDescription": null, 
  "LocationDescription": "Tray Storage A5.2, Column 1, Shelf 1", 
  "LocationSequence": 1, 
  "Attributes": [] 
 }],
  jobs: [ { 
            "JobId": "118baec590c2468ab19e7e9528214073", 
            "JobName": "Introduce Storage Trays", 
            "JobPriority": 100, 
            "JobType": "Introduce", 
            "JobState": "Complete", 
            "CreatedBy": "Adminsys", 
            "CreatedAt": "2014-09-05T08:40:08.6581522+02:00", 
            "StartDate": "2014-09-05T08:40:09.4413088+02:00", 
            "EndDate": "2014-09-05T08:40:15.0154234+02:00" 
        }, 
        { 
            "JobId": "250278c705a14ff79cf6ebc8d0d8d3ac", 
            "JobName": "Store for 'Introduce Transport Trays'", 
            "JobPriority": 50, 
            "JobType": "Store", 
            "JobState": "Running", 
            "CreatedBy": "Adminsys", 
            "CreatedAt": "2014-09-05T08:40:24.8983996+02:00", 
            "StartDate": "2014-09-05T08:40:25.0784356+02:00", 
            "EndDate": null 
        }, 
        { 
            "JobId": "2fde25a664164a6aa03cb86f3c2d2ddb", 
            "JobName": "Introduce Transport Trays", 
            "JobPriority": 100, 
            "JobType": "Introduce", 
            "JobState": "Complete", 
            "CreatedBy": "Adminsys", 
            "CreatedAt": "2014-09-05T08:40:18.004021+02:00", 
            "StartDate": "2014-09-05T08:40:18.104041+02:00", 
            "EndDate": "2014-09-05T08:40:24.8223844+02:00" 
        }, 
        { 
            "JobId": "af4193a98b4749778639f4b41448be05", 
            "JobName": "Store for 'Introduce Storage Trays'", 
            "JobPriority": 50, 
            "JobType": "Store", 
            "JobState": "Complete", 
            "CreatedBy": "Adminsys", 
            "CreatedAt": "2014-09-05T08:40:15.1794562+02:00", 
            "StartDate": "2014-09-05T08:40:15.3714946+02:00", 
            "EndDate": "2014-09-05T08:40:15.7825768+02:00" 
        } ],
  results: [],
  systems: [{ SystemId: 'abc123', SystemName: 'MockSystem', SystemDescription: null }],
  picklists:[ 
        { 
            "PicklistId": "087730e82d834af8baecc1c46fa854b2", 
            "PicklistName": "Picklist 2 Items" 
        }, 
        { 
            "PicklistId": "94acb4daffa54979b91d6564d4e5b03f", 
            "PicklistName": "New Picklist 1" 
        } 
    ],
  userroles: [
    { RoleId: 'System Administrator', RoleName: 'System Administrator' },
    { RoleId: 'Standard User', RoleName: 'Standard User' }
  ],
  alarms: [],
  automations: []
};

function requireToken(req, res, next) {
  const token = req.query.token;
  if (!token || !db.tokens.includes(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Auth
app.post('/api/v11/users/:userId/sessions', (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;
  const user = db.users.find(u => u.id === userId && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = `${userId}-token`;
  db.tokens.push(token);
  res.json({ SessionToken: token });
});

// Alarms
app.get('/api/v11/alarms', requireToken, (req, res) => {
  res.json({ Items: db.alarms, CountedItems: db.alarms.length });
});

// Automations
app.get('/api/v11/automations', requireToken, (req, res) => {
  res.json({ Items: db.automations, CountedItems: db.automations.length });
});

// Systems
app.get('/api/v11/systems', (req, res) => {
  res.json({ Items: db.systems, CountedItems: db.systems.length });
});

// Libraries
app.get('/api/v11/libraries', requireToken, (req, res) => {
  res.json({ Items: db.libraries, CountedItems: db.libraries.length });
});

app.post('/api/v11/libraries', requireToken, (req, res) => {
  const lib = { ...req.body, LibraryId: `lib-${Date.now()}` };
  db.libraries.push(lib);
  res.status(201).json(lib);
});

app.delete('/api/v11/libraries/:libraryId', requireToken, (req, res) => {
  const index = db.libraries.findIndex(lib => lib.LibraryId === req.params.libraryId);
  if (index === -1) return res.status(404).send();
  db.libraries.splice(index, 1);
  res.status(204).send();
});

app.put('/api/v11/libraries/:libraryId', requireToken, (req, res) => {
  const lib = db.libraries.find(lib => lib.LibraryId === req.params.libraryId);
  if (!lib) return res.status(404).send();
  Object.assign(lib, req.body);
  res.json(lib);
});

app.post('/api/v11/libraries/:libraryId/containers', requireToken, (req, res) => {
  const { libraryId } = req.params;
  const lib = db.libraries.find(l => l.LibraryId === libraryId);
  if (!lib) return res.status(404).json({ error: 'Library not found' });
  lib.containers = lib.containers || [];
  lib.containers.push(...req.body.Items);
  res.status(200).json({ added: req.body.Items.length });
});

// Containers
app.get('/api/v11/containers', requireToken, (req, res) => {
  res.json({ Items: db.containers, CountedItems: db.containers.length });
});

app.post('/api/v11/containers', requireToken, (req, res) => {
  const { Items } = req.body;
  Items.forEach(container => {
    container.ContainerId = `container-${Date.now()}-${Math.random()}`;
    db.containers.push(container);
  });
  res.status(201).json({ Items });
});

// Jobs
app.get('/api/v11/jobs', requireToken, (req, res) => {
  res.json({ Items: db.jobs, CountedItems: db.jobs.length });
});

app.post('/api/v11/jobs', requireToken, (req, res) => {
  console.log(`JOB CREATED :`,req);
  const job = { ...req.body, JobId: `job-${Date.now()}` };
  db.jobs.push(job);
  res.status(201).json(job);
});

app.put('/api/v11/jobs/:jobId', requireToken, (req, res) => {
  const job = db.jobs.find(j => j.JobId === req.params.jobId);
  if (!job) return res.status(404).send();
  Object.assign(job, req.body);
  res.json(job);
});

app.delete('/api/v11/jobs/:jobId', requireToken, (req, res) => {
  const index = db.jobs.findIndex(j => j.JobId === req.params.jobId);
  if (index === -1) return res.status(404).send();
  db.jobs.splice(index, 1);
  res.status(204).send();
});

// Results
app.get('/api/v11/results', requireToken, (req, res) => {
  res.json({ Items: db.results, CountedItems: db.results.length });
});

// GET /jobs/:jobId/results
app.get('/api/v11/jobs/:jobId/results', requireToken, (req, res) => {
  const { jobId } = req.params;
  const take = parseInt(req.query.take) || 100;
  const skip = parseInt(req.query.skip) || 0;

  const results = db.results.filter(r => r.JobId === jobId && !r.ParentResultId);
  const sliced = results.slice(skip, skip + take);
  res.json({
    Items: sliced,
    SkippedItems: skip,
    TakenItems: sliced.length,
    CountedItems: results.length
  });
});

// GET /jobs/:jobId/results/:resultId
app.get('/api/v11/jobs/:jobId/results/:resultId', requireToken, (req, res) => {
  const { jobId, resultId } = req.params;
  const result = db.results.find(r => r.JobId === jobId && r.ResultId === resultId);
  if (!result) return res.status(404).json({ error: 'Result not found' });

  const children = db.results.filter(r => r.ParentResultId === resultId);
  res.json({ ...result, Children: children });
});

// Picklists
app.post('/api/v11/picklists', requireToken, (req, res) => {
  const picklist = { ...req.body, PicklistId: `pick-${Date.now()}` };
  db.picklists.push(picklist);
  res.status(201).json(picklist);
});

app.post('/api/v11/picklists/:picklistId/containers', requireToken, (req, res) => {
  const { picklistId } = req.params;
  const picklist = db.picklists.find(p => p.PicklistId === picklistId);
  if (!picklist) return res.status(404).json({ error: 'Picklist not found' });
  picklist.containers = picklist.containers || [];
  picklist.containers.push(...req.body.Items);
  res.status(200).json({ added: req.body.Items.length });
});

app.get('/api/v11/picklists', requireToken, (req, res) => {
  res.json({ Items: db.picklists, CountedItems: db.picklists.length });
});

app.get('/api/v11/picklists/:picklistId', requireToken, (req, res) => {
  const picklist = db.picklists.find(p => p.PicklistId === req.params.picklistId);
  if (!picklist) return res.status(404).send();
  res.json(picklist);
});

app.put('/api/v11/picklists/:picklistId', requireToken, (req, res) => {
  const picklist = db.picklists.find(p => p.PicklistId === req.params.picklistId);
  if (!picklist) return res.status(404).send();
  Object.assign(picklist, req.body);
  res.json(picklist);
});

app.delete('/api/v11/picklists/:picklistId', requireToken, (req, res) => {
  const index = db.picklists.findIndex(p => p.PicklistId === req.params.picklistId);
  if (index === -1) return res.status(404).send();
  db.picklists.splice(index, 1);
  res.status(204).send();
});

// UserRoles
app.get('/api/v11/userroles', requireToken, (req, res) => {
  res.json({ Items: db.userroles, CountedItems: db.userroles.length });
});

app.listen(port, () => {
  console.log(`Mock Hamilton API running at http://localhost:${port}`);
});
