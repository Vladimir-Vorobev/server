//const WebSocket = require('ws')
//const server = new WebSocket.Server({ port: 3000 })
const http = require('http')
const path = require('path');
const express = require('express');
const {JsonDB} = require('node-json-db');
const {Config} = require('node-json-db/dist/lib/JsonDBConfig');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new JsonDB(new Config("Calendare", true, false, '/'));

app.post('/api/testPost',function(req,res){
    console.log(req.body.name)
    res.send('Вы сделали post-запрос, отправили ' + req.body.name)
});

app.get('/api/testGet',function(req,res){
    res.send('Вы сделали get-запрос')
});

app.listen(3030, function(){
    console.log('Express server listening on port 3030');
});

// server.on('connection', ws => {
//     ws.on('message', message => {
//         server.clients.forEach(client => {
//             if(client.readyState === WebSocket.OPEN){
//                if(message == 'close_this_connection'){
//                     ws.close()
//                 }
//                 else{
//                     client.send(message)
//                 }
//             }
//         })
//     })
//     ws.send('Добро пожаловать!')
// })