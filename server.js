const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Підключення до MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Схема для осіб у розшуку
const WantedSchema = new mongoose.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true },
    evidence: { type: String, required: true },
    date: { type: String, required: true },
});

const Wanted = mongoose.model('Wanted', WantedSchema);

// Схема для останніх дій
const ActionSchema = new mongoose.Schema({
    status: { type: String, required: true },
    message: { type: String, required: true },
});

const Action = mongoose.model('Action', ActionSchema);

// API для додавання в розшук
app.post('/api/wanted', async (req, res) => {
    try {
        const { name, id, evidence, date } = req.body;
        const newWanted = new Wanted({ name, id, evidence, date });
        await newWanted.save();

        const newAction = new Action({
            status: 'green',
            message: `Додано в розшук: ${name} ${date}, ${new Date().toLocaleTimeString('uk-UA')}`,
        });
        await newAction.save();

        res.status(201).json(newWanted);
    } catch (err) {
        res.status(500).json({ error: 'Помилка при додаванні в розшук' });
    }
});

// API для отримання списку розшуку
app.get('/api/wanted', async (req, res) => {
    try {
        const wantedList = await Wanted.find();
        res.status(200).json(wantedList);
    } catch (err) {
        res.status(500).json({ error: 'Помилка при отриманні списку розшуку' });
    }
});

// API для отримання останніх дій
app.get('/api/actions', async (req, res) => {
    try {
        const actionsList = await Action.find();
        res.status(200).json(actionsList);
    } catch (err) {
        res.status(500).json({ error: 'Помилка при отриманні останніх дій' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});