var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const dotenv = require('dotenv');

dotenv.config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // log the error server-side
  console.error(err.stack);

  // set status
  res.status(err.status || 500);

  // decide JSON vs HTML response
  const wantsJson = req.accepts('json') || req.xhr || (req.headers && req.headers.accept && req.headers.accept.indexOf('application/json') !== -1);

  if (wantsJson) {
    const payload = { message: err.message };
    if (req.app.get('env') === 'development') payload.stack = err.stack;
    return res.json(payload);
  }
});

module.exports = app;
