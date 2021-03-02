import express from 'express'
import dbApiRouter from './db/router.js'

const app = express();

app.use('/dbApi', dbApiRouter);

app.listen(3000);
console.log('success listen at port:3000......');