const express = require('express');
const app = express();
const path = require('path');

const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig');
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const db = new JsonDB(new Config("Calendare", true, false, '/'));
let users = db.getData('/users');
let regCode = db.getData('/reg_code');

const nodemailer = require('nodemailer');
const { createCipher } = require('crypto');

let transporter = nodemailer.createTransport({ //Создание почтового бота
    service: 'gmail',
    pool: true,
    auth: {
        user: 'noreplymafiaonline@gmail.com',
        pass: 'gMsutG632l'
    }
})

app.post('/code',function(req,res){ //код подтверждения
    console.log(req.body, 'code')
    if (users[req.body.email] == undefined){
        let code = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000
        console.log(code)
        let now = new Date()
        db.push("/reg_code/" + req.body.email, {email: req.body.email, code: code, date: now.getDate(), hours: now.getHours(), minutes: now.getMinutes()})
        transporter.sendMail({
            from: '"no-reply_MafiaOnline" <noreplymafiaonline@gmail.com>',
            to: req.body.email,
            subject: "Код подтверждения",
            text: "Ваш код подтверждения: " + code + '. Он действителен один час' + "\n\n\nЕсли это были не Вы, то просто проигнорируйте данное письмо",
        })
        res.send('success');
    }
    else{
        res.send('invalid email');
    }
});

app.post('/registration',function(req,res){ //регистрация
    console.log(req.body, 'registration')
    if(regCode[req.body.email] != undefined && regCode[req.body.email].code == req.body.code){
        db.push("/users/" + req.body.email, {email: req.body.email, nickname: req.body.nickname, password: req.body.password})
        db.delete("/reg_code/" + req.body.email)
        res.send('reg successful');
    }
    else{
        res.send('reg failed');
    }
});

app.post('/login',function(req,res){ // логин
    console.log(req.body, 'login')
    if (users[req.body.email] != undefined && users[req.body.email].password == req.body.password){
        res.send('login successful');
    }
    else{
        res.send('login failed');
    }
})

function updateREG_CODE(){ //удалить неактивные коды подтверждения
    let now = new Date()
    console.log('updateREG_CODE')
    for(key in regCode){
        if(now.getDate() == regCode[key].date){
            if(now.getHours() * 60 + now.getMinutes() - regCode[key].hours * 60 - regCode[key].minutes >= 60){
                db.delete("/reg_code/" + key)
            }
        }
        else{
            if(now.getMinutes() + regCode[key].minutes >= 60){
                db.delete("/reg_code/" + key)
            }
        }
    }
}

setInterval(updateREG_CODE, 600000)

// socket

let rooms = {}
var server = require('http').createServer();
var io = require('socket.io')(server);

io.sockets.on('connection', function(socket){
    
    socket.on('error', (err) => {
        console.log(err)
    });

    socket.on('newroom', (data) => {
        try{
            rooms[data.newroom] = {messages123456789: []}
            console.log(rooms)
        }catch(err){
            console.log('newroom ', err)
        }
    });

    socket.on('newuser', (data) => {
        try{
            let room = rooms[data.room]
            room[data.newuser] =  socket
            for(item in room.messages123456789){
                room[data.newuser].emit('message', {user: room.messages123456789[item].user, message: room.messages123456789[item].message, time: room.messages123456789[item].time.toString()})
            }
            console.log(rooms)
        }catch(err){
            console.log('newuser ', err)
        }
    });

    socket.on('message', (data) => {
        try{
            let room = rooms[data.room]
            let time = room.messages123456789.length + 1
            room.messages123456789.push({user: data.user, message: data.message, time: time.toString()})
            for(key in room){
                if(key != 'messages123456789'){
                    console.log(room.key)
                    room[key].emit('message', {user: data.user, message: data.message, time: time.toString()})
                }
            }
            console.log(rooms[data.room].messages123456789)
        }catch(err){
            console.log('message', err)
        }
    });
    
    socket.on('delroom', (data) => {
        try{
            delete rooms[data.delroom]
            console.log(rooms)
        }catch(err){
            console.log('delroom ', err)
        }
    });

    socket.on('deluser', (data) => {
        try{
            let room = rooms[data.room]
            delete room[data.deluser]
            console.log(rooms[data.room])
        }catch(err){
            console.log('deluser ', err)
        }
    });

    socket.on('recon', (data) => {
        try{
            console.log(data)
            let room = rooms[data.room]
            room[data.reconnect] = socket
            let num = 0
            for(item in room.messages123456789){
                if(room.messages123456789[item].time == data.time){
                    num = 1
                    continue
                }
                if(num == 1){
                    room[data.reconnect].emit('message', {user: room.messages123456789[item].user, message: room.messages123456789[item].message, time: room.messages123456789[item].time})
                }
            }
        }catch(err){
            console.log('recon ', err)
        }
    });
})

server.listen(3000, () => {
    console.log('Server listening at port 3000');
});

app.listen(3030, function(){
    console.log('Express server listening on port 3030');
});