const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const path = require('path')



const app = express()
const server = http.createServer(app)
const io = socketIO(server)

app.use(express.static(path.join(__dirname, 'public')));

const messageHistory = []

app.set('views', './src/views')
app.set('view engine', 'ejs')


app.get('/', (req, res)=>{
    res.render('home')
})

//CONFIGURANDO O SOCKET.IO
io.on('connection', (socket) =>{
    const clientId = socket.id
    socket.emit('chat history', messageHistory)
    // console.log('um cliente se conectou')
    console.log('Cliente Conectado, ID:', clientId)
    
    // socket.emit('chat history', messageHistory)

    //logica para lidar com mensagens do cliente
    socket.on('chat message', (msg)=>{
        messageHistory.push(msg)

        io.emit('chat history', messageHistory)
    })

    //logica para lidar com as desconexões do cliente
    socket.on('disconnect', (event)=>{
        console.log('um cliente se desconectou')
        console.log(event)
    })

})


server.listen(80, ()=>{
    console.log('Servidor Rodando em http://localhost:80')
})