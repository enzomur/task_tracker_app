const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all tasks
router.get('/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows.map(row => ({
      ...row,
      done: !!row.done,
      history: JSON.parse(row.history || '[]'),
      completed_date: row.completed_date
    })));
  });
});

// Add task
router.post('/tasks', (req, res) => {
  const { text, bucket, date } = req.body;
  db.run(`INSERT INTO tasks (text, bucket, date, done, history, completed_date) VALUES (?, ?, ?, ?, ?, ?)`,
    [text, bucket, date, 0, '[]', null],
    function (err) {
      if (err) return res.status(500).json({ error: err });
      res.json({ id: this.lastID });
    });
});

// Toggle complete
// Toggle complete
router.post('/tasks/:id/toggle', (req, res) => {
    const id = req.params.id;
    db.get('SELECT done, history FROM tasks WHERE id = ?', [id], (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Task not found' });
  
      const newDone = row.done ? 0 : 1;
      const history = JSON.parse(row.history || '[]');
  
      let completedDate = null;
  
      if (newDone) {
        const now = new Date().toISOString().slice(0, 10);
        history.push(now);
        completedDate = now;
      } else {
        history.pop(); // remove last if undone
      }
  
      db.run(
        'UPDATE tasks SET done = ?, history = ?, completed_date = ? WHERE id = ?',
        [newDone, JSON.stringify(history), completedDate, id],
        err => {
          if (err) return res.status(500).json({ error: err });
          res.json({ success: true });
        }
      );
    });
  });
  

// Update date
router.post('/tasks/:id/reschedule', (req, res) => {
  const { date } = req.body;
  db.run('UPDATE tasks SET date = ? WHERE id = ?', [date, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

// Delete task
router.delete('/tasks/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM tasks WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ success: true });
  });
});

module.exports = router;
