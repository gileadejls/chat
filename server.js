require('dotenv').config()
const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const path = require('path')
const Login = require('./models/loginModel')
const mongoose = require('mongoose')


const app = express()
const server = http.createServer(app)
const io = socketIO(server)

mongoose.connect(process.env.CN).then(()=>{
    app.emit('ok')
}).catch(e => console.log(e))

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')));


app.set('views', './src/views')
app.set('view engine', 'ejs')


//VARIAVEIS GLOBAIS
let messageHistory = []
let users = []
let us = {}
let OnlineUser = []



app.post('/request', async (req, res)=>{
    //RECEBENDO OS DADOS ATRAVES DO FETCH
    const dados = req.body

    console.log('quem está enviado --->', us)
    const find = new Login(req.body)
    const findresult = await find.sendRequest()
    if(findresult){
        console.log('solicitação enviada')
    }else{
        console.log('chegou false', find.errors)
    }


})

app.get('/', (req, res)=>{

    res.render('home', {requests: null})
})

app.get('/login', (req, res)=>{
    res.render('login')
})

app.post('/home', async (req, res)=>{
    const LoginUser = new Login(req.body)
    const resultLogin = await LoginUser.VerifyUser()
    if(!resultLogin){
        console.log(LoginUser.errors)
        res.render('login')
    }else{   
        //PASSANDO O NOME E O ID DO USUARIO
        users.push({user: req.body.user, id: resultLogin})
        us = {user: req.body.user, id: resultLogin}

        console.log('ID DO USUARIO QUE FEZ LOGIN', resultLogin)
        async function verifyFriendsAndRequests(id){
            const verifyRequests = await LoginUser.verifyRequests(id)
            const verifyFriends = await LoginUser.gettingFriends()
            const theuserid = ''

            const requests =  verifyRequests.length > 0 ? true: false
            const friends = verifyFriends.length > 0 ? true: false


            res.render('home', {requests: verifyRequests, friends: verifyFriends, iduser: resultLogin, nameuser: req.body.user})
        }

        verifyFriendsAndRequests(resultLogin)
    }

})

app.post('/responseRequest', async(req, res)=>{
    const dados = new Login(req.body)
    const response = await dados.responseRequest()
    console.log('dados do usuario ---> ', us)
})

//CONFIGURANDO O SOCKET.IO
io.on('connection', (socket) =>{
    socket.emit('chat history', messageHistory)
    console.log('usuario se conectou')
    OnlineUser.push({idsock: socket.id, userOnline: us})
    
    io.emit('online users', OnlineUser)

    //logica para lidar com mensagens do cliente
    socket.on('chat message', (msg)=>{
        console.log("verificando quem mandou a mensagem", socket.id)
        messageHistory = [msg]

        io.emit('chat history', messageHistory)
    })

    //logica para lidar com as desconexões do cliente
    socket.on('disconnect', (event)=>{
        // console.log(socket.id)
        // console.log('um cliente se desconectou')
        // console.log(event)
        OnlineUser.forEach((user, pos)=>{
            if(user.idsock === socket.id){
                OnlineUser.splice(pos, 1)
            }
        })
        console.log('desconectou')
        console.log(OnlineUser)
        io.emit('online users', OnlineUser)
        io.emit('user disconnect', OnlineUser)

    })

})


app.on('ok', ()=>{
    server.listen(3000, ()=>{
        console.log('Servidor Rodando em http://localhost:3000')
        console.log("Conectado ao banco de dados")
    })
})
