require('dotenv').config()
const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const path = require('path')
const Login = require('./models/loginModel')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const session = require('express-session')


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
let userName = ''

app.use(cookieParser())

function verifyCookies(req, res, next){
    const token = req.cookies['token']

    if(!token){
        req.user = null
        return res.status(401).render('login')
    }

    try{
        const decoded = jwt.sign(token, 'banana')
        req.user = decoded
        
        next()
    }catch(error){
        req.user = null
        return res.status(403).render('login')
    }
}

async function verifyTheRequests(req, res){
    const reqs = new Login()
    const havaRequests = await reqs.verifyRequests(req.session.user.id)
    if(havaRequests){
        res.render('home', {requests: havaRequests})
    }else{
        console.log('nao')
        res.render('home', {requests: null})
    }
}

async function responseTheRequests(req, res){
    const response = {whosend: req.body.whosend, myresponse: req.body.myresponse, userid: req.session.user.id, username: req.session.user}
    const requestResponse = new Login()
    const answer = await requestResponse.responseRequest(response)

    if(answer){
        console.log('Solicitação respondida')
        verifyTheRequests(req, res)
    }else{
        console.log('Não foi possivel responder')
        console.log(answer)
        verifyTheRequests(req, res)
    }
}
app.use(session({
    secret: process.env.SECRETKEY,
    resave: false,
    saveUninitialized: false
}))

//HOME DA PAGINA, ONDE O VERIFYCOOKIES ESTÁ VENDO SE O USUARIO ESTA AUTENTICADO
app.get('/', verifyCookies, async (req, res)=>{
    
    if(req.session.user === undefined){
        res.redirect('/login')
    }else{
        return verifyTheRequests(req, res)
    }
})

//ROTA PARA VERIFICAR SE O USUARIO FEZ LOGIN
app.post('/', async(req, res)=>{
    const user = new Login(req.body)
    const tryLogin = await user.VerifyUser()
    const SECRET_KEY = 'banana'

    if(tryLogin){
        const token = jwt.sign(req.body, process.env.SECRETKEY, { expiresIn: '1h' })
        
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: '300000',
            sameSite: 'strict',

        })

        req.session.user = {user: req.body.user, id: tryLogin}
        res.redirect('/')
    }else{
        console.log(user.errors)
        res.redirect('/login')
    }
})


//ROTA PARA O USUARIO FAZER LOGIN
app.get('/login', (req ,res)=>{

    res.render('login')
})


//ROTA PARA ENVIAR SOLICITAÇÕES DE AMIZADE
app.post('/request', verifyCookies, async(req, res)=>{
    console.log('solicitação de amizade --->', req.body)
    const whoadd = req.body.whoadd
    const whosend = req.session.user

    console.log(whosend)
    if(whosend !== undefined){
        const request = new Login()
        const sendingRequest = await request.sendRequest(whoadd, whosend)

        if(sendingRequest){
            console.log('Solicitação enviada')
            verifyTheRequests(req, res)
        }else{
            console.log(request.errors)
            verifyTheRequests(req, res)
        }
    }else{
        res.status(401).send({msg: 'error with session'})
    }
       
})

//ROTA PARA RESPONDER SOLICITAÇÕES DE AMIZADE
app.post('/response', verifyCookies, async (req, res)=>{
    responseTheRequests(req, res)
})

//CONFIGURANDO O SOCKET.IO
io.on('connection', (socket) =>{

    socket.on('chat message', (msg)=>{

        messageHistory.push(msg)
        io.emit('messages', messageHistory)
    })
})


app.on('ok', ()=>{
    server.listen(3000, ()=>{
        console.log('Servidor Rodando em http://localhost:3000')
        console.log("Conectado ao banco de dados")
    })
})
