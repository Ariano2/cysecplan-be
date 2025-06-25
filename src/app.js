const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const port = 3000;
const path = require('path');
require('dotenv').config();
const authRouter = require('./routers/authRouter');
const workshopRouter = require('./routers/workshop');
const participantRouter = require('./routers/participant');
const adminRouter = require('./routers/admin');
const productRouter = require('./routers/product');
const cartRouter = require('./routers/cart');
const commentRouter = require('./routers/comment');
const articleRouter = require('./routers/article');

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.json());
app.use(cookieParser());

app.use('/', authRouter);
app.use('/', workshopRouter);
app.use('/', participantRouter);
app.use('/', adminRouter);
app.use('/', productRouter);
app.use('/', cartRouter);
app.use('/', articleRouter);
app.use('/', commentRouter);

app.listen(port, async () => {
  try {
    console.log('Server Running on Port: ' + port);
    await mongoose.connect('mongodb://localhost:27017/cysecplanDB');
    console.log('Connected to DB');
  } catch (err) {
    console.log('Error Could not connect to Database');
  }
});
