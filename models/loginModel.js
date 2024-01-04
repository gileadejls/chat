const mongoose = require('mongoose')

const LoginSchema = new mongoose.Schema({
    user: String,
    password: String,
    friends: [Object],
    requests: [Object],
})

const LoginModel = mongoose.model('logins', LoginSchema)


class Login{
    constructor(body){
        this.body = body
        this.errors = []
        this.userID = ''
    }

    async VerifyUser(){
        
        try{
            const result = await LoginModel.find({user: this.body.user, password: this.body.password})
            if(result.length < 1){
                this.errors.push('Usuario ou senha invalidos')
                return false
            }

            //RETORNANDO O ID DO USUARIO
            return (result[0]._id).toString()
        }catch(e){console.log(e)}
    }

    async registerUser(){
        try{
            const newUser = await LoginModel.create({user: this.body.user, password: this.body.password})
            return true
        }catch(e){console.log(e)}

    }

    async sendRequest(whoadd, whosend){
        try{
            //verifica no banco de dados se o usuario existe
            const finduser = await LoginModel.find({user: whoadd})


            //caso este usuario exista
            if(finduser.length > 0){

                //pega o id do usuario que foi solicitado
                let whoAddId = (finduser[0]._id).toString()

                //verifica se não há nenhum pedido de amizade ainda
                if(finduser[0].requests.length < 1){

                    const sendRequest = await LoginModel.findByIdAndUpdate(whoAddId, {$push: {requests: whosend}}, {new: true})
                    return true
                }else{

                    for(const request of finduser[0].requests){
                        if(request.id === whosend.id){

                            this.errors.push('Você ja enviou uma solicitação de amizade para este usuario')
                            return false
                        }
                    }

                    const sendRequest = await LoginModel.findByIdAndUpdate(whoAddId, {$push: {requests: whosend}}, {new: true})
                    return true
                }
            }
            //caso o usuario não for encontrado
            this.errors.push('Usuario não encontrado')
            return false
        }catch(e){console.log(e)}
    }

    async responseRequest(response){
        try{
            const findOnRequestTheUser = await LoginModel.updateOne({_id: response.userid}, {$pull:{requests: {user: response.whosend}}})


            if(response.myresponse === 'accept'){


                const addFriendWhoRequest = await LoginModel.findOneAndUpdate({user: response.whosend}, {$push: {friends: {user: response.username, id: response.userid}}})

                const addFriendWhoResponse = await LoginModel.findOneAndUpdate({user: response.username}, {$push: {friends: {user: response.whosend}}})
                
                return true
            }

            console.log('Solicitação de amizade recusada')
            return false
        }catch(e){console.log(e)}

    }

    //VERIFICA SE HÁ SOLICITAÇÕES DE AMIZADE E RETORNA ELAS
    async verifyRequests(id){
        try{
            const verifyIfHaveRequest = await LoginModel.find({_id: id})
            //retorna os pedidos de amizades se TRUE
            if(verifyIfHaveRequest[0].requests.length > 0){
                return verifyIfHaveRequest[0].requests
            }else{
                return false
            }
        }catch(e){console.log(e)}
    }

    //VERIFICA A LISTA DE AMIGOS
    async gettingFriends(){
        try{
            const friends = await LoginModel.find({user: this.body.user})
            return friends[0].friends
        }catch(e){console.log(e)}
        
        
    }

    async sendMessage(){

    }
}

module.exports = Login