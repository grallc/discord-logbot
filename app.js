const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const yargs = require('yargs');
const bodyParser = require('body-parser');
const express = require('express');
const mkdirp = require('mkdirp');

const {mongoose} = require('./db/mongoose');
const Message = require('./models/message');

const app = express();

const port = process.env.PORT || 3000;


// Get launch arguments, mainly token ("node [file].js -t [token]")
const argv = yargs.options({
	t: {
		alias: 'token',
		describe: 'Bot private token',
		string: true

	}
}).argv;

if(!argv.token && !process.env.DISCORD_TOKEN){
   console.log('Please specify a Token!');
   process.exit();
}

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index.ejs')
	res.end("<h3>Bienvenue sur l'API de LogBot</h3>");
});

app.get('/messages', (req, res) => {
    // IGNORE CASE QUERY PARAMS
    for(let param in req.query){
        req.query[param.toLowerCase()] = req.query[param];        
    }

    // GET ALL MESSAGES CORRESPONDING TO REQUEST
	Message.find({
		guildID: (req.query.guild) ? req.query.guild : {$ne:null},
        authorID: (req.query.author) ? req.query.author : {$ne:null},
        originalContent: (req.query.originalcontent) ? req.query.originalcontent : {$ne:null},
        'informations.currentContent': /(req.query.content) ? req.query.content : {$ne:null}/
	}).then((messages) => {
        // IF MESSAGE(S) FOUND
        if(messages.length > 0){
		   return res.send(JSON.stringify({
				code: 200,
				message: `Successfully retrieved ${messages.length} message(s)`,
				messages
			}));
		}
        // IF NOTHING
		res.status(404).send(JSON.stringify({
			code: 404,
			message: `No messages found, it may be caused by an incorrect parameter`
		}));
	}, (e) => {
		res.status(400).send(e);
	});

});

app.listen(port, () => {
	console.log(`Express server started on port ${port}`);
});


// Start functions
client.on('ready', async () => {
	console.log(`LogBot is now connected on ${client.guilds.size} server(s)!`);

	client.user.setActivity("ce que vous dites", {type: "WATCHING"});

	// Create the log txt on date of connection
	 // client.guilds.forEach((guild) => {
	 //   mkdirp(`${__dirname}/logs/${guild.id}`,function(err){
		//  if(err) throw err;
		//  fs.writeFile(`${__dirname}/logs/${guild.id}/${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}.txt`, `Guild ID = ${guild.id} - File = ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}.txt`,(err) => {
		// 	 if(err){
		// 		 throw err;
		// 	 }
		//  });
	 //   });
	 //})



});

// Send to the database each message
client.on('message', (msg) => {
	var message = new Message({
		messageIS: msg.id,
		guildID: msg.guild.id,
		originalContent: msg.content.toString(),
		authorID: msg.author.id,
		authorUsername: msg.author.tag,
		informations: {
			currentContent: msg.content.toString()
		}
	});

	message.save().then(() => {
		// To do: log in the latest log file
	  // let latestFile;
		//
	  // fs.readdir(`${__dirname}/logs/${message.guild.id}/`, function(err, files) {
		// let beforeFileDate;
		// files.forEach(file => {
		//   if(file.statSync(file)['mtime'] < beforeFileDate){
		//
		//   }
		// });

		// Write new log in latest log file
		// fs.writeFile(`${__dirname}/logs/${message.guild.id}/${latestFile}.txt`, `Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) has been saved into the Database`,(err) => {
		// 	if(err){
		// 		throw err;
		// 	}
		// });
		  console.log(`Message #${msg.id} ("${msg.content.toString()}") has been saved into the Database`);
		}, (e) => {
		  console.log(`An error ('${e}) has occured while saving the Message ${msg.id}`);
		});
	  //});

}); 

client.on('messageDelete', (msg) => {

	console.log(`0 - Message #${msg.id} ("${msg.content.toString()}") has been deleted by ${msg.author.tag} (${msg.author.id})`);


	// Message.findOneAndUpdate({
    //     messageID: msg.id
    // }, {
    //     $set: {
    //         informations: {
	// 			status: 'DELETED',
	// 			lastEventDate: new Date()			}
    //     }
    // }, {
    //     returnOriginal: false
    // }).then((result) => {
	// 	console.log(`1 - Message #${msg.id} ("${msg.content.toString()}") has been deleted by ${msg.author.tag} (${msg.author.id}) => ${result}`);
    // });
});

//  Log the bot using the token provided
client.login(argv.token || process.env.DISCORD_TOKEN);
