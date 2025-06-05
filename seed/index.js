const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { Mood_Type, Reason, Quote, Task } = require('../models');

mongoose.connect('mongodb://localhost:27017/moodtracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function seedDatabase() {
  try {
    // 1. Mood Types
    const moodTypesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'Mood_Types.json'), 'utf-8'));
    await Mood_Type.deleteMany({});
    const insertedMoodTypes = await Mood_Type.insertMany(moodTypesData);

    // Map mood name -> ObjectId
    const moodMap = {};
    insertedMoodTypes.forEach(mood => {
      moodMap[mood.name] = mood._id;
    });

    // 2. Reasons
    const reasonsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'Reasons.json'), 'utf-8'));
    await Reason.deleteMany({});
    await Reason.insertMany(reasonsData);

    // 3. Quotes (transform mood string -> mood_type ObjectId)
    const quotesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'Quotes.json'), 'utf-8'));
    const transformedQuotes = quotesData.map(q => ({
      text: q.text,
      mood_type: moodMap[q.mood]
    }));
    await Quote.deleteMany({});
    await Quote.insertMany(transformedQuotes);

    // 4. Tasks (same transformation)
    const tasksData = JSON.parse(fs.readFileSync(path.join(__dirname, 'Tasks.json'), 'utf-8'));
    const transformedTasks = tasksData.map(t => ({
      text: t.text,
      mood_type: moodMap[t.mood]
    }));
    await Task.deleteMany({});
    await Task.insertMany(transformedTasks);

    console.log("Seed process finished successfully.");
  } catch (error) {
    console.error("Seed process failed: ", error);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();