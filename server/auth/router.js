import bodyParser from 'body-parser'
import express from 'express';
import * as api from './api.js';

const jsonParser = bodyParser.json();
const router = express.Router();

router.post('/login', jsonParser, (req, res) => {
    api.login(req, res);
});

export default router;