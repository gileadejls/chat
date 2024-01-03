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
            this.userID = (result[0]._id).toString()
            return this.userID
        }catch(e){console.log(e)}
    }

    async registerUser(){
        try{
            const newUser = await LoginModel.create({user: this.body.user, password: this.body.password})
            return true
        }catch(e){console.log(e)}

    }

    async sendRequest(){
        try{
            //verifica no banco de dados se o usuario existe
            const finduser = await LoginModel.find({user: this.body.name})
            if(finduser.length > 0){
                //pega o id do usuario que foi solicitado
                let userid = (finduser[0]._id).toString()

                if(finduser[0].requests.length < 1){
                    const sendRequest = await LoginModel.findByIdAndUpdate(userid, {$push: {requests: this.body.whorequest}}, {new: true})
                    return true
                }else{
                    //verifica se ja tem uma solicitação enviada
                    for(const name of finduser[0].requests){
                        if(name.id === this.body.whorequest.id){
                            this.errors.push('Você ja enviou uma solicitação para este usuario')
                            return false
                        }else{
                            const sendRequest = await LoginModel.findByIdAndUpdate(userid, {$push: {requests: this.body.whorequest}}, {new: true})
                            return true
                        }
                    }
                }
            }

             //caso o usuario não for encontrado
             this.errors.push('Usuario não encontrado')
             return false

           

        }catch(e){console.log(e)}
    }

    async responseRequest(){
        console.log(this.body)
        const findOnRequestTheUser = await LoginModel.updateOne({user: this.body.whoresponse}, {$pull:{requests: {user: this.body.user}}})


        if(this.body.response === 'accept'){


            const addFriendWhoRequest = await LoginModel.findOneAndUpdate({user: this.body.user}, {$push: {friends: {user: this.body.whoresponse}}})

            const addFriendWhoResponse = await LoginModel.findOneAndUpdate({user: this.body.whoresponse}, {$push: {friends: {user: this.body.user}}})
            
            return true
        }

        console.log('Solicitação de amizade recusada')
        return false

    }

    //VERIFICA SE HÁ SOLICITAÇÕES DE AMIZADE E RETORNA ELAS
    async verifyRequests(){
        try{
            const verifyIfHaveRequest = await LoginModel.find({_id: this.userID})
            //retorna os pedidos de amizades se TRUE
            return verifyIfHaveRequest[0].requests
        }catch(e){console.log(e)}
    }

    //VERIFICA A LISTA DE AMIGOS
    async gettingFriends(){
        try{
            const friends = await LoginModel.find({user: this.body.user})
            return friends[0].friends
        }catch(e){console.log(e)}
        
        
    }
}

module.exports = Login