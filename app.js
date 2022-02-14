
// modules in use
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const path = require('path');
const bcrypt = require('bcrypt');


const app = express();

// prompt to use specific features
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/views'));

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
	email: String,
	password: String
})

const User = new mongoose.model('User', userSchema);

app.get('/', function (req, res) {
	res.render('home');
})

app.get('/register', function (req, res) {
	res.render('register');
})

app.get('/login', function (req, res) {
	res.render('login');
})

app.post('/register', function (req, res ){

	bcrypt.hash(req.body.password, function (err, hash) {
		const user = new User({
			email: req.body.username,
			password: hash
		})

		user.save(function (err) {
			if (err) {
				console.log(err);
			} else {
				res.render('secrets');
			}
		})
	})
})

app.post('/login', function (req, res) {
	User.findOne({email: req.body.username}, function (err, doc) {
		if (err) {
			console.log(err)
		} else {
			bcrypt.compare(req.body.password, doc.password, function (error, response) {
				console.log(response);
				if (res) {
					res.render('secrets');
				}
			})
		}
	})
})


app.listen('3000', () => console.log('port 3000 is open ...'))