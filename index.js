const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const { randomUUID } = require('crypto')
const cors = require('cors')
require('dotenv').config()

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.json())

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const users = [];
const exercises = [];
const logs = [];

function findUserById(id) {
  return users.find(user => user._id === id);
}

app.post("/api/users", function (req, res) {
  const newId = randomUUID();
  users.push({ username: req.body.username, _id: newId });
  res.json({ username: req.body.username, _id: newId })
});

app.get("/api/users", function (req, res) {
  res.json(users);
});

function getUsername(number) {
  let user = users.find(u => u._id === number);
  return user ? user.username : undefined;
};

function dateFormat(date) {
  if (date) return new Date(date);
  return new Date();
}

app.post("/api/users/:_id/exercises", function (req, res) {
  const user = findUserById(req.params._id);
  if (!user) return res.json({ error: 'User not found' });

  const exerciseDate = req.body.date ? new Date(req.body.date) : new Date();
  const newExercise = {
    username: user.username,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: exerciseDate.toISOString(),
    _id: req.params._id
  };
  exercises.push(newExercise);

  let userLog = logs.find(l => l._id === req.params._id);
  if (!userLog) {
    logs.push({
      username: user.username,
      count: 1,
      _id: req.params._id,
      log: [newExercise]
    });
  } else {
    userLog.log.push(newExercise);
    userLog.count = userLog.log.length;
  }

  res.json({
    username: user.username,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: exerciseDate.toDateString(),
    _id: req.params._id
  });
});

app.get("/api/users/:_id/logs", function (req, res) {
  const { from, to, limit } = req.query;
  const userLog = logs.find(l => l._id === req.params._id);
  if (!userLog) return res.json({ error: 'User log not found' });

  let filteredLogs = [...userLog.log];
  if (from) {
    const fromDate = new Date(from);
    filteredLogs = filteredLogs.filter(e => new Date(e.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    filteredLogs = filteredLogs.filter(e => new Date(e.date) <= toDate);
  }
  if (limit) filteredLogs = filteredLogs.slice(0, Number(limit));

  res.json({
    username: userLog.username,
    count: userLog.count,
    _id: userLog._id,
    log: filteredLogs.map(e => ({
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString()
    }))
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
