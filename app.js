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

app.use(
    //  Define the Template system
    bodyParser.json(),
    // SET STATIC FILES -> css/js
    express.static('public'),
    //express.directory('public/logs')
);


//  Home page (index.ejs): search message, go to API
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');    
    res.status(200).render('index.ejs');
	res.end();
});

// List a guilld logs files'
app.get('/logs/:guild', (req, res) => {

	fs.readdir(`${__dirname}/public/logs/${req.params.guild}`, (err, files) => {
		if(err){
            return res.status(400).send(JSON.stringify({
                code: 400,
				message: `An error has occured while listing files. May be caused by an incorrect Guild ID`		
			}));
		}


		res.status(200).render('logs.ejs', {files, guild: req.params.guild});
		res.end();
	});
});

// Redirect to 404 when guild isn't specified
app.get('/logs/:guild(\\d{0,})', (req, res) => {
	return res.status(404).send(JSON.stringify({
		code: 404,
		message: 'Please specify a valid Guild ID'
	}));
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
		'modifications.creation.newContent': (req.query.originalcontent) ? new RegExp(req.query.originalcontent, 'ig') : {$ne:null},
		currentContent: (req.query.content) ? new RegExp(req.query.content, 'ig') : {$ne:null}

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
	    mkdirp(`${__dirname}/public/logs/${guild.id}`,function(err){
		  if(err) throw err;
		// Create new file and write some informations
		  fs.writeFile(`${__dirname}/public/logs/${guild.id}/${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}.txt`,   `--------------------------------------------------------------\n` +
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
		 fs.appendFile(`${__dirname}/public/logs/${msg.guild.id}/${fileName}`, `\n${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') } - Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) in channel "${msg.channel.name}" (${msg.channel.id}) has been saved into the Database`,(err) => {
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
		 
		 fs.appendFile(`${__dirname}/public/logs/${msg.guild.id}/${fileName}`, `\n${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') } - Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) in channel "${msg.channel.name}" (${msg.channel.id}) has been deleted by ${msg.author.tag} (${msg.author.id})`,(err) => {
			if(err){
				throw err;
			}
		});
     });
});



client.on('messageUpdate', (oldMessage, newMessage) => {

 	Message.findOne({
 		messageID: oldMessage.id
 	}).then((doc) => {

		var newEdition = {
			newContent: newMessage.content.toString(),
			date: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
		}
		
 	   Message.findOneAndUpdate({
 		   messageID: oldMessage.id
 	   }, {
 		   $set: {
				currentContent: newMessage.content.toString(),
			},
			$push: {
				'modifications.editions': newEdition
			
			}
 	   }, {
 	   returnOriginal: false  
    }).then((result) => {
		fs.appendFile(`${__dirname}/public/logs/${msg.guild.id}/${fileName}`, `\n${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') } - Message #${msg.id} ("${msg.content.toString()}") posted by ${msg.author.tag} (${msg.author.id}) in channel "${msg.channel.name}" (${msg.channel.id}) has been edited : "${newMessage.content.toString()}`,(err) => {
			if(err){
				throw err;
			}
		});

		console.log(`Message #${oldMessage.id} ("${oldMessage.content.toString()}") posted by ${oldMessage.author.tag} (${oldMessage.author.id}) in Guild "${oldMessage.guild.name}" (${oldMessage.guild.id.toString()}) in channel "${oldMessage.channel.name}" (${newMessage.channel.id}) has been edited : "${newMessage.content.toString()}"`);
	})}, (err) => {
 		console.log(err);
 	});
});

// PAGE NOT FOUND REDIRECTS TO HOME
// app.use((req, res, next) => {	// A CERTAIN FORM OF FUNCTION
// 	res.redirect('/');
// });


//  Log the bot using the token provided
client.login(argv.token || process.env.DISCORD_TOKEN);
