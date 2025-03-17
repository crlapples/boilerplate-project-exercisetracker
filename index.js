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
  res.send(users);
});

function getUsername(number) {
  let user = users.find(u => u._id === number);
  return user ? user.username : undefined;
};

function dateFormat(date) {
  if (date) {
    return new Date(date).toDateString();
  } else {
    return new Date().toDateString();
  }
};

app.post("/api/users/:_id/exercises", function (req, res) {
  const username = getUsername(req.params._id);
  if (!username) {
    return res.status(400).json({ error: "User not found" });
  }
  const addition = ({ username: getUsername(req.params._id), description: req.body.description, duration: Number(req.body.duration), date: dateFormat(req.body.date), _id: req.params._id });
  exercises.push(addition);
  let log = logs.find(l => l._id === req.params._id);
  if (!log) {
    logs.push({ username: getUsername(req.params._id), count: 1, _id: req.params._id, log: [{ description: req.body.description, duration: Number(req.body.duration), date: dateFormat(req.body.date) }] });
  } else {
    log.log.push({ description: req.body.description, duration: Number(req.body.duration), date: dateFormat(req.body.date) });
    log.count = log.log.length;
  }
  res.json(addition);
});

app.get("/api/users/:_id/logs", function (req, res) {
  const { from, to, limit } = req.query;
  let log = logs.find(l => l._id === req.params._id);
  if (!log) {
    return res.status(400).json({ error: "Log not found for this user" }); // return error if log not found
  }
  let filteredLogs = log.log;
  if (from) {
    let fromDate = new Date(from);
    filteredLogs = filteredLogs.filter(l => new Date(l.date) >= fromDate);
  } 
  
  if (to) {
    let toDate = new Date(to);
    filteredLogs = filteredLogs.filter(l => new Date(l.date) <= toDate);
  }
 
  if (limit) {
    filteredLogs = filteredLogs.slice(0, Number(limit));
  }
  
  res.json({ username: log.username, count: filteredLogs.length, _id: log._id, log: filteredLogs });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
