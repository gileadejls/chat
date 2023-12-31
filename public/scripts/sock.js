const socket = io()
const mywords = []
let txt = ''


function initConnection(){
    //FUNÇÕES PARA OS EFEITOS DE SONS AO ENVIAR MENSAGENS
    async function sendAudio(){
        let sendaudiotext = await new Audio('./audios/sentcut.mp3')

        sendaudiotext.play()
    }

    async function recivedAudio(){
        let recivedaudiotext = await new Audio('./audios/recivedcut.mp3')

        recivedaudiotext.play()
    }


    //PEGA O VALOR QUE ESTÁ NO INPUT E IMPEDE O ENVIO DO FORMULARIO PARA TRATAMENTO ANTES
    document.querySelector('#messageForm').addEventListener('submit', function(event) {
        event.preventDefault()
        txt = document.querySelector("#m").value


        //VERIFICA SE TEM SOMENTE ESPAÇOS VAZIOS, CASO TENHA, ELE NÃO ENVIA
        if(txt.match(/[^\s]/gi) !== null){
            socket.emit('chat message', {msg: document.querySelector('#m').value})
            mywords.push(document.querySelector('#m').value)
        }


        console.log(mywords)

        // DEIXA O INPUT VAZIO DEPOIS DE ENVIAR
        document.querySelector('#m').value = ''
    })


    socket.emit('connection', {user: '<%= iduser %>'})


    //adicionar um ouvinte para receber mensagens do servidor


    socket.on('chat history', function(history){

        //limpando a tela para não replicar mensagens repitidas
        const allmsglist = document.querySelectorAll('#messages div')

        allmsglist.forEach((li)=>{
            li.remove()
        })

        //RECEBE DO SERVIDOR UM ARRAY DAS MENSAGENS E FAZ O TRATAMENTO DE CADA UMA
        for (const msg of history){
            const messageList = document.querySelector('#messages')
            const div = document.createElement('div')
            const text = document.createElement('p')
            text.textContent = msg
            div.appendChild(text)
            messageList.appendChild(div)




            //VERIFICA SE A MSG QUE FOI LIDA DO ARRAY ESTÁ NAS MENSAGENS QUE O USUARIO
            if(mywords.indexOf(msg) !== -1){
                console.log('enviado')
                text.className = 'sent'
            }else{
                console.log('foi recebido')
                text.className = 'recived'

            }


            //DEIXA O SCROLL SEMPRE PRA BAIXO
            messageList.scrollTop = messageList.scrollHeight
            const divs = document.querySelectorAll('#messages div')

            //COLOCA A ANIMAÇÃO DA CAIXA DE TEXTO NAS ULTIMAS MENSAGENS
            divs.forEach((el)=>{
                if(mywords.length > 0 || divs.length > 0){
                    if(el === divs[divs.length - 1]){
                        el.className = 'open'
                        console.log("aqui")
                    }else{
                        el.className = ''
                    }
                }
            })

        }

        console.log(mywords)

        //SE DENTRO DO ARRAY RECEBIDO DO SERVIDOR, A MENSAGEM DO USUARIO
        //NÃO ESTIVER, ELE EMITE UM SOM DE AUDIO DIFERENTE
        if(history.indexOf(txt) !== -1){
                recivedAudio()
        }else{
            console.log(history.indexOf(txt))
            sendAudio()
        }



    })
}

export { initConnection }