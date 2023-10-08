const express = require('express');
const app = express();

const jwt = require('jsonwebtoken');
// const expressJwt = require('express-jwt');
// this change fixed the "expressJwt is not a function" runtime error:
const expressJwt = require('express-jwt').expressjwt;
const bodyParser = require('body-parser');
const path = require('path');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Headers', 'Content-type, Authorization');
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3000;

// TODO: convert to env variable:
const secretKey = 'My super secret key';
// console.log(expressJwt);
const jwtMiddleware = expressJwt({
    secret: secretKey,
    algorithms: ['HS256']
});

let users = [
    {
        id: 1,
        username: 'jon',
        password: 'test'
    },
    {
        id: 2,
        username: 'todd',
        password: 'test'
    }
];

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // console.log('This is me', username, password);
    // res.json({ data: 'it works.'});

    for (let user of users) {
        if (username == user.username && password == user.password) {
            let token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '3m' });
            res.json({
                success: true,
                err: null,
                token
            });
            break;
        }
        else {
            return res.status(401).json({
                success: false,
                token: null,
                err: 'Username or password is incorrect.'
            });
        }
    }
});

app.get('/api/dashboard', jwtMiddleware, (req, res) => {
    // console.log(req);
    res.json({
        success: true,
        myContent: 'Secret content that only those deemed worthy can see.'
    });
});

app.get('/api/prices', jwtMiddleware, (req, res) => {
    // console.log(req);
    res.json({
        success: true,
        myContent: 'This is the price: $4.99.'
    });
});

app.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(function (err, req, res, next) {
    // console.log("Unauthorized error?", err.name === 'UnauthorizedError');
    // console.log(err);
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            officialError: err,
            err: "Username or password is incorrect. (jwtMW error)"
        });
    }
    else {
        next(err);
    }
});

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
});