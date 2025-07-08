const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 5217;

app.use(bodyParser.json());

const db = {
  tokens: [],
  users: [{ id: 'admin', password: '1234' }],
  libraries: [],
  containers: [],
  jobs: [],
  systems: [{ SystemId: 'abc123', SystemName: 'MockSystem', SystemDescription: null }],
  picklists: [],
  userroles: [
    { RoleId: 'System Administrator', RoleName: 'System Administrator' },
    { RoleId: 'Standard User', RoleName: 'Standard User' }
  ],
  results: []
};

function requireToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token || !db.tokens.includes(token)) return res.status(401).json({ error: 'Unauthorized' });
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
