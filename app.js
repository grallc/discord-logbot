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

//  Express port
const port = process.env.PORT || 3000;

// Stock the current log filename
var fileName = '';


// Get launch arguments, mainly token ("node [file].js -t [token]")
const argv = yargs.options({
	t: {
		alias: 'token',
		describe: 'Bot private token',
		string: true
	}
}).argv;

// Stop the application if no token is specified
if(!argv.token && !process.env.DISCORD_TOKEN){
   console.log('Please specify a Token!');
   process.exit();
}

//  Define the Template system
app.use(bodyParser.json());

//  Home page (index.ejs): search message, go to API
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');    
    res.status(200).render('index.ejs');
	res.end();
});

// API PAGE
app.get('/messages', (req, res) => {
    // IGNORE CASE QUERY PARAMS
    for(let param in req.query){
        req.query[param.toLowerCase()] = req.query[param];        
    }

    // GET ALL MESSAGES CORRESPONDING TO REQUEST
	Message.find({
		// Find by guild
		guildID: (req.query.guild) ? req.query.guild : {$ne:null},
		channelName:(req.query.channelname) ? req.query.guild : {$ne:null},
		channelID:(req.query.channelname) ? req.query.guild : {$ne:null},

		// Find by author
		'modifications.creation.authorID': (req.query.author) ? req.query.author : {$ne:null},
		//  Find with REGEX
		'modifications.creation.newContent': new RegExp((req.query.originalcontent) ? req.query.originalcontent : {$ne:null}, 'ig'),
		currentContent: new RegExp((req.query.content) ? req.query.content : {$ne:null}, 'ig')

		// DEPRECATED
		// authorID: (req.query.author) ? req.query.author : {$ne:null},
        //'informations.currentContent': new RegExp((req.query.content) ? req.query.content : {$ne:null}, 'ig')
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

//  Start express
app.listen(port, () => {
	console.log(`Express server started on port ${port}`);
});


// Start functions
client.on('ready', async () => {
	console.log(`LogBot is now connected on ${client.guilds.size} server(s)!`);

	client.user.setActivity("ce que vous dites", {type: "WATCHING"});

	 // Create the log txt on date of connection
	  client.guilds.forEach((guild) => {
	    mkdirp(`${__dirname}/logs/${guild.id}`,function(err){
		  if(err) throw err;
		// Create new file and write some informations
		  fs.writeFile(`${__dirname}/logs/${guild.id}/${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}.txt`,   `--------------------------------------------------------------\n` +
		  																													`Guild ID = ${guild.id} - File = ${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}.txt` +
																													`\n--------------------------------------------------------------\n`,(err) => {
			if(err){
		 		 throw err;
		 	 }
		  });
		});
		fileName = `${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}.txt`
	 })



});

// Send to the database each message
client.on('message', (msg) => {
	var message = new Message({
		messageID: msg.id,
		guildID: msg.guild.id,
		currentContent: msg.content.toString(),
		channelName: msg.channel.name,
		channelID: msg.channel.id,

		modifications: {
			creation: {
				authorID: msg.author.id,
				authorUsername: msg.author.tag,
				newContent: msg.content.toString(),
				date: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')	
			}
		}

		// DEPRECATED
		// authorID: msg.author.id,
		// authorUsername: msg.author.tag,
		// creationDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
		// originalContent: msg.content.toString(),
		// informations: {
		// 	currentContent: msg.content.toString(),
		// 	lastEventDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
		// }
	});

	message.save().then(() => {

		// DEPRECATED
		// let latestFile;
		//
	  	// fs.readdir(`${__dirname}/logs/${message.guild.id}/`, function(err, files) {
		// let beforeFileDate;
		// files.forEach(file => {
		//   if(file.statSync(file)['mtime'] < beforeFileDate){
		//
		//   }
		// });

		 //Write new log in latest log file
		 fs.appendFile(`${__dirname}/logs/${msg.guild.id}/${fileName}`, `\n${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') } - Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) in channel "${msg.channel.name}" (${msg.channel.id}) has been saved into the Database`,(err) => {
		 	if(err){
		 		throw err;
		 	}
		 });
		 console.log(`Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) in Guild "${msg.guild.name}" (${msg.guild.id.toString()}) in channel "${msg.channel.name}" (${msg.channel.id}) has been saved into the Database`);
		}, (e) => {
		  console.log(`An error ('${e}) has occured while saving the Message ${msg.id}`);
		});

}); 

// Called when a message is edited
client.on('messageDelete', (msg) => {

	 Message.findOneAndUpdate({
         messageID: msg.id
     }, {
         $set: {

			currentContent: 'EMPTY',
			'modifications.deletion.newContent': 'EMPTY',
			'modifications.deletion.date': new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
			'modifications.deletion.authorName': msg.author.tag,
			'modifications.deletion.authorID': msg.author.id


			// DEPRECATED
			// 'informations.status': 'DELETED',
			// 'informations.lastEventDate': new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),

			//  Not working (for now)
			// 'informations.removedBy': msg.author.tag
         }
     }, {
         returnOriginal: false
     }).then((result) => {
		 console.log(`Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) in Guild "${msg.guild.name}" (${msg.guild.id.toString()}) in channel "${msg.channel.name}" (${msg.channel.id}) has been deleted by ${msg.author.tag} (${msg.author.id})`);
		 
		 fs.appendFile(`${__dirname}/logs/${msg.guild.id}/${fileName}`, `\n${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') } - Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) in channel "${msg.channel.name}" (${msg.channel.id}) has been deleted by ${msg.author.tag} (${msg.author.id})`,(err) => {
			if(err){
				throw err;
			}
		});
     });
});


// Called when a message is edited
client.on('messageUpdate', (oldMessage, newMessage) => {
	console.log(`${oldMessage.content.toString()} => ${newMessage.content.toString()}`);

	var size = 0;

	// Find the last edit number (edit-x)
	Message.findOne({
		messageID: oldMessage.id
	}).then((doc) => {
		size = Object.keys(doc.modifications).length - 1;
	}, (err) => {
		console.log(err);
	});



	Message.findOneAndUpdate({
		messageID: oldMessage.id
	}).then((doc) => {
		$set: {
			currentContent: newMessage.content.toString()
			//'modifications.deletion.newContent': 'EMPTY'
		}
	}).then(() => doc);
});

//  Log the bot using the token provided
client.login(argv.token || process.env.DISCORD_TOKEN);
