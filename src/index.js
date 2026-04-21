const express = require('express');
const app = express();
const config = require('./config/index')
const jwt = require('jsonwebtoken');

let UID = 0;
let OID = 0;
let BID = 0;
let TID = 0;

const USERS = [
    {
        uid: 1,
        username: 'Mann T',
        email: 'mannthakar505@gmail.com',
        password: '1234'
    }
];
const ORGANIZATIONS = [
    {
        oid: OID++,
        admin: 1,
        name: '7Span'
    }
];
const BOARDS = [{
    bid: BID++,
    title: 'Bayant',
    uid: 1,
    oid: 1,
    status: 'todo'
}];
const TASKS = [{
    tid: TID++,
    title: 'FE issue',
    description: 'Lorem lorem',
    oid: 1,
    uid: 1
}];

app.use(express.json())

app.post('/sign-up', ((req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send({
            status: 400,
            data: 'All fields are required'
        })
    }

    const hasUser = USERS.find((user) => user?.email === email);

    if (hasUser) {
        return res.status(400).send({
            status: 400,
            data: 'User already exist please login'
        })
    }

    USERS.push({
        uid: UID++,
        username,
        email,
        password
    })

    return res.status(201).send({
        status: 201,
        data: 'User successfully sign up'
    })

}))

app.post('/sign-in', (req, res) => {

    const { userIdentifier, password } = req.body;

    if (!userIdentifier || !password) {
        return res.status(400).send({
            status: 400,
            data: 'All fields are required'
        })
    }

    const hasUser = USERS?.find((user) => user.email === userIdentifier || user.username === userIdentifier)

    if (!hasUser) {
        return res.status(400).send({
            status: 400,
            data: "Invalid credential or user doesn't exist"
        })
    }


    const _EXPIRES_IN = config?.EXPIRES_IN ?? '1h';
    const secretKey = hasUser?.uid;
    const accessToken = jwt.sign({uid: secretKey }, config.SALT, { expiresIn: _EXPIRES_IN});
    return res.status(200).send({
        status: 200,
        data: accessToken
    })

})

app.post('/create-organization', (req, res) => {
    const { name } = req.body ?? {};
    const accessToken = req.headers.authorization?.split(" ")[1] ?? {};

    if (!accessToken) {
        return res.status(401).send({
            status: 401,
            data: "Token is expire or missing"
        })
    }
    
    const {uid} = jwt.verify(accessToken,config.SALT);
    

    if(uid === null || uid === undefined) {
        return res.status(400).send({
            status: 401,
            data: "Invalid token"
        })
    }

    if (!name) {
        return res.status(400).send({
            status: 400,
            data: 'All fields are required'
        })
    }

    ORGANIZATIONS.push({
        oid: OID++,
        name,
        admin: uid
    })

    return res.status(200).send({
        status: 200,
        data: 'Organization created successfully'
    })

})


app.listen(config?.PORT, () => {
    console.log("Server is running on", config?.PORT)
})