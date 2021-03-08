import bodyParser from 'body-parser'
import express from 'express';
import * as api from './api.js';

const jsonParser = bodyParser.json()
const router = express.Router();

router.get('/fetchCaseConfig', (req, res) => {
    api.fetchCaseConfigs(req, res);
});

router.get('/fetchCase', (req, res) => {
    api.fetchCase(req, res);
});

router.get('/fetchTriplet', (req, res) => {
    api.fetchTriplet(req, res);
});

router.post('/updateLabel', jsonParser, (req, res) => {
    api.updateLabel(req, res);
});

export default router;