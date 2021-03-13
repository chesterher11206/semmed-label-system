import express from 'express'
import authApiRouter from './auth/router.js'
import dbApiRouter from './db/router.js'

const app = express();

app.use('/dbApi', dbApiRouter);
app.use('/authApi', authApiRouter);

app.listen(3000);
console.log('success listen at port:3000......');