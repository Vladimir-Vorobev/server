const http = require('http')
const path = require('path');
const express = require('express');
const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const db = new JsonDB(new Config("Calendare", true, false, '/'));
let users = db.getData('/users');
let regCode = db.getData('/reg_code');

const nodemailer = require('nodemailer');

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

const WebSocket = require('ws')
const server = new WebSocket.Server({ port: 3000 })
let rooms = {}
server.on('connection', function connection(ws, req){ // websocket
    //clients[req.socket.remoteAddress] = {client: ws} // req.socket.remoteAddress заменить на никнайм
    ws.on('message', function incoming(dataClient) {
        // в message присылать массив [ник, комната, сообщение]
        let data = JSON.parse(dataClient)
        if(data.newroom != undefined){
            rooms[data.newroom] = {}
        }
        if(data.newuser != undefined){
            let room = rooms[data.room]
            room[data.newuser] =  ws
        }
        if(data.message != undefined){
            for(key in rooms[data.room]){
                let room = rooms[data.room]
                room[key].send(data.message)
            }
        }
    })
    ws.send('Добро пожаловать!')
})

app.listen(3030, function(){
    console.log('Express server listening on port 3030');
});