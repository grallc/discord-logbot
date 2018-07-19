const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const yargs = require('yargs');
const bodyParser = require('body-parser');
const express = require('express');

const {mongoose} = require('./db/mongoose');
const Message = require('./models/message');

const app = express();


// Get launch arguments, mainly token ("node [file].js -t [token]")
const argv = yargs.options({
    t: {
        demand: true,
        alias: 'token',
        describe: 'Bot private token',
        string: true

    }
}).argv;



app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("<h3>Bienvenue sur l'API de LogBot</h3>");
});

app.get('/guilds/:id', (req, res) => {
    var id = req.params.id;

    Message.find({guildID: id}).then((messages) => {
        if(messages.length > 0){
           return res.send(JSON.stringify({         
                code: 200,
                message: `Successfully retrieved ${messages.length} message(s)`,
                messages
            }));
        }

        res.send(JSON.stringify({
            code: 404,
            message: `No messages found, may be caused by an incorrect guild ID`
        }));
    }, (e) => {
        res.status(400).send(e);
    });

});

const port = 3000;

app.listen(port, () => {
    console.log(`Express server started on port ${port}`);
});


// Start functions
client.on('ready', async () => {
    console.log(`LogBot is now connected on ${client.guilds.size} server(s)!`);

    client.user.setActivity("ce que vous dites", {type: "WATCHING"});

    // Work in progress...
    // client.guilds.forEach((guild) => {
    //     fs.writeFile(`./logs/${guild.id}/1.txt`, "Hey there!",{ flag: 'wx' }, (err) => {
    //         if(err){
    //             return console.log(err);
    //         }
    //         console.log('The file was saved');
    //     });
    // })
});

// Send to the database each message
client.on('message', (msg) => {
    var message = new Message({
        _id: msg.id,
        guildID: msg.guild.id,
        originalContent: msg.content.toString(),
        authorID: msg.author.id,
        authorUsername: msg.author.tag,
        creationDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        informations: [{
            status: "OK",
            currentContent: msg.content.toString(),
            lastEventDate: new Date()
        }]
    });

    message.save().then(() => {
        console.log(`Message #${msg.id} ("${msg.content.toString()}") has been saved into the Database`);
    }, (e) => {
        console.log(`An error ('${e}) has occured while saving the Message ${msg.id}`);
    });
});

//  Log the bot using the token provided
client.login(argv.token);