const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
//app.use(express.json())
app.use(express.static(path.join(__dirname, "public")));

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

const Schema = mongoose.Schema;
const userScheme = new Schema({
    email: String,
    nickname: String,
    password: String,
});
const User = mongoose.model("User", userScheme);
const codeScheme = new Schema({
    email: String,
    code: String,
    date: String,
    hours: String,
    minutes: String,
});

const Code = mongoose.model("Code", codeScheme);

app.post('/code',function(req,res){ //код подтверждения
    console.log(req.body, 'code')
    let email = 0
    let reg_email = 0
    async function get(){
        await User.find({email: req.body.email}).exec(function(err, person) {
            if (err) throw err;
            if(person.length != 0){
                email = 1
            }
        });
        await Code.find({email: req.body.email}).exec(function(err, person) {
            if(person.length != 0){
                let em = person[0]
                console.log('email', em.email);
                if (err) throw err;
                if(em.email != undefined){
                    reg_email = 1
                }
            }
            check()
        })
        let check = function(){
            if(email == 0){
                let now = new Date()
                let regCode = Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000
                console.log(regCode)
                if(reg_email == 0){
                    const code = new Code({
                        email: req.body.email,
                        code: regCode,
                        date: now.getDate(),
                        hours: now.getHours(),
                        minutes: now.getMinutes(),
                    });
                    code.save(function(err){
                        if(err) return console.log(err);
                        console.log('Код зарегистрирован!')
                    });
                }
                else{
                    Code.updateOne({email: req.body.email}, {$set: {code: regCode.toString(), date: now.getDate(), hours: now.getHours(), minutes: now.getMinutes(),}}, function(err){
                        if(err) return console.log(err);
                        console.log('Код обновлен!')
                    });
                    res.send('success');
                }
                transporter.sendMail({
                    from: '"no-reply_MafiaOnline" <noreplymafiaonline@gmail.com>',
                    to: req.body.email,
                    subject: "Код подтверждения",
                    text: "Ваш код подтверждения: " + regCode + '. Он действителен один час' + "\n\n\nЕсли это были не Вы, то просто проигнорируйте данное письмо",
                })
                console.log(email, reg_email)
            }
            else{
                console.log('invalid email')
                res.send('invalid email');
            }
        }
    }
    get()
});

app.post('/registration',function(req,res){ //регистрация
    console.log(req.body, 'registration')
    async function check(){
        await Code.find({email: req.body.email}).exec(function(err, person) {
            if(person.length != 0 && person[0].code == req.body.code){
                const user = new User({
                    email: req.body.email,
                    nickname: req.body.nickname,
                    password: req.body.password,
                });
                user.save(function(err){
                    if(err) return console.log(err);
                    console.log('Новый пользователь зарегистрирован!')
                });
                Code.findOneAndRemove({email: req.body.email}).exec(function(err){
                    if(err) throw err
                })
                res.send('reg successful');
            }
            else{
                res.send('reg failed');
            }
        })
    } 
    check()
});

app.post('/login',function(req,res){ // логин
    console.log(req.body, 'login')
    async function get(){
        await User.find({email: req.body.email}).exec(function(err, person) {
            if (err) throw err;
            if(person.length != 0 && person[0].password == req.body.password){
                console.log('Log in')
                res.send('login successful');
            }
            else{
                res.send('login failed');
            }
        });
    }
    get()
})

function updateREG_CODE(){ //удалить неактивные коды подтверждения
    let now = new Date()
    console.log('updateREG_CODE')
    async function get(){
        Code.find().exec(function(err, person) {
            for(let i = 0; i < person.length; i++){
                if(now.getDate() == person[i].date){
                    if(now.getHours() * 60 + now.getMinutes() - person[i].hours * 60 - person[i].minutes >= 60){
                        Code.findOneAndRemove({email: person[i].email}).exec(function(err){
                            if(err) throw err
                        })
                        console.log('delete')
                    }
                }
                else{
                    if(now.getMinutes() + person[i].minutes >= 60){
                        Code.findOneAndRemove({email: person[i].email}).exec(function(err){
                            if(err) throw err
                        })
                    }
                }
            }
        })
    }
    get()
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
            rooms[data.newroom] = {messages123456789: [], settings123456789: {min_people: data.min_people, max_people: data.max_people, timerBegin: 30, timerDay: 60, timerNight: 60, gameOn: false, gameOver: false, timerStarted: false, 
            timer(settings, settingsTimer, room, stop){
                let tim
                if(stop){
                    for(key in room){
                        if(key != 'messages123456789' && key != 'settings123456789'){
                            room[key].emit('system_message_time', {time: 'stopTimer'})
                        }
                    }
                    console.log('stop')
                    clearInterval(tim)
                    settings.timerStarted = false
                    return
                }
                else if(settings.timerStarted == false){
                    settings.timerStarted = true
                    tim = setInterval(function(){
                        console.log('d2')
                        for(key in room){
                            if(key != 'messages123456789' && key != 'settings123456789'){
                                room[key].emit('system_message_time', {time: 'startTimer'})
                            }
                        }
                        if(settings[settingsTimer] == 0){
                            for(key in room){
                                if(key != 'messages123456789' && key != 'settings123456789'){
                                    room[key].emit('system_message_time', {time: 'start'})
                                }
                            }
                            tim = clearInterval(tim)
                            settings.timerStarted = false
                            return
                        }
                        for(key in room){
                            if(key != 'messages123456789' && key != 'settings123456789'){
                                console.log('d1')
                                room[key].emit('system_message_time', {time: settings[settingsTimer]})
                            }
                            settings[settingsTimer] -= 1
                        }
                    }, 1000)
                }
            }
                }}
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
            let settings = rooms[data.room].settings123456789
            // если кол-во людей в "комнате" больше или равно минимальному, запустится таймер
            if(Object.keys(rooms[data.room]).length - 2 >= settings.min_people && settings.timerBegin == 30){
                settings.timer(settings, 'timerBegin', room, false)
            }
            console.log(Object.keys(rooms[data.room]).length - 2, settings.min_people)
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
                if(key != 'messages123456789' && key != 'settings123456789'){
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
            let settings = rooms[data.room].settings123456789
            // если в комнате мало людей, таймер остановится и сбросится
            if(Object.keys(rooms[data.room]).length - 2 < settings.min_people && settings.gameOn == false){
                settings.timerBegin = 30
                settings.timer(settings, 'timerBegin', room, true)
                console.log('d')
            }
            console.log(Object.keys(rooms[data.room]).length - 2, settings.min_people)
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
async function start(){
    try{
        let url = 'mongodb+srv://vladimir:Vorob0405!@cluster0-1lyrr.mongodb.net/MafiaOnlinedb?retryWrites=true&w=majority'
        await mongoose.connect(url,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        })
        server.listen(3000, () => {
            console.log('Server listening at port 3000');
        });
        
        app.listen(3030, function(){
            console.log('Express server listening on port 3030');
        });
    } catch(err){
        console.log(err)
    }
}

start()
