const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt-nodejs");
const cors = require('cors');
const knex = require('knex');

const database = knex({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: 'nstseek',
		password: 'light',
		database: 'smartbrain'
	}
});

const server = express();
const port = 3001;

database.select('*').from('users').where({
	id: 1
}).then(data => console.log(data.length));

server.use(bodyParser.json());

server.use(cors());

server.listen(port, () => console.log(`listening on port ${port}`));

server.post('/signin', (req, res) => {
	let found = 0;
	
	database.select('*').from('login')
	.where({
		email: req.body.email
	})
	.then(queryResponse => {
		if (!queryResponse.length){
			res.status(400).json(`${req.body.email} does not exist`);
			return;
		}
		if (bcrypt.compareSync(req.body.password, queryResponse[0].hash)){
			res.json({
				message: `logged in`,
				id: queryResponse[0].id
			});
		}
		else {
			res.status(400).json(`Incorrect password`);
		}
	})
	
	
	// database.login.forEach(login => {
	// 	if (login.email === req.body.email && (bcrypt.compareSync(req.body.password, login.hash))){
	// 		res.json({
	// 			message: `logged in`,
	// 			id: login.id
	// 		});
	// 		found = 1;
	// 	}
	// });
	// if (!found) {
	// 	res.status(400).json(`user ${req.body.email} could not be logged in`);
	// }
});

server.get("/", (req, res) => {
	let temp = [];
	const run = async () => {
		await database.select('*').from('users').then(data => temp.push(data));
		await database.select('*').from('login').then(data => temp.push(data));
		res.json(temp);
	}

	run();
})

server.get('/profile/:id', (req, res) => {
	let found = 0;
	req.params.id = Number(req.params.id);
	
	database('users').where({
		id: req.params.id
	}).select('entries').then(result => {
		if (result.length){
			res.json(result[0].entries);
		}
		else {
			res.status(400).json(`id=${req.params.id} not found`);
		}
		
	});
	
});

server.put("/image", (req, res) => {
	let found = 0;
	req.body.id = Number(req.body.id);
	
	database('users').where({
		id: req.body.id
	}).select('entries').then(result => {
		if (result.length){
			database('users').where({
				id: req.body.id
			}).increment('entries', 1).then(shit => res.json(`user id=${req.body.id} entries increased by 1`));
		}
		else {
			res.status(400).json(`id=${req.body.id} not found`);
		}
	});
});

server.post('/register', (req, res) => {
	const hash = bcrypt.hashSync(req.body.password);

	database.transaction(trx => {
		trx.insert({
			hash: hash,
			email: req.body.email
		})
		.into('login')
		.returning('*')
		.then(login => {
			return trx('users')
			.returning('*')
			.insert({
				id: login[0].id,
				email: login[0].email,
				name: req.body.name,
				joined: new Date()
			})
			.then(user => {
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback)
	})
	.catch(err => res.json(`unable to register - ${err}`));
	
	// database('users').insert({
	// 	name: req.body.name,
	// 	email: req.body.email,
	// 	joined: new Date()
	// }).then(console.log);

	// database('login').insert({
	// 	email: req.body.email,
	//  	hash: hash
	// }).then(console.log);
});


