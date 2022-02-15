
// modules in use
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

// prompt to use specific features
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(session({
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'));

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
	username: String,
	password: String,
	googleId: String,
	secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/', function (req, res) {
	res.render('home');
})

app.get('/register', function (req, res) {
	res.render('register');
})

app.get('/login', function (req, res) {
	res.render('login');
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
});

app.get('/secrets', function (req, res) {
	if (req.isAuthenticated()) {

		const secrets = [];
		User.find({secret: {$ne: null}}, function (err, docs) {
			docs.forEach(user => secrets.push(user.secret));
			res.render('secrets', {secrets: secrets});
		})

	} else {
		res.redirect('/register');
	}
})

app.get('/submit', function (req, res) {
	res.render('submit')
})

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.post('/register', function (req, res ){

	const username = req.body.username;
	const password = req.body.password;

	User.register({username: username}, password, function (err, user) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate('local')(req, res, function () {
				res.redirect('/secrets');
			})
		}
	})

})

app.post('/login', function (req, res) {

	const user = new User ({
		username: req.body.username,
		password: req.body.password
	})

	req.login(user, function (err) {
		if (err) {
			console.log(err);
		} else {
			passport.authenticate('local')(req, res, function () {
				res.redirect('/secrets');
			})
		}
	})

})

app.post('/submit', function (req, res) {
	const newSecret = req.body.secret;
	User.findById(req.user.id, function (err, user) {
		if (err){
			console.log(err)
		} else {
			user.secret = newSecret;
			user.save(function () {	
				res.redirect('/secrets');
			})
		}
	})

})


app.listen('3000', () => console.log('port 3000 is open ...'))