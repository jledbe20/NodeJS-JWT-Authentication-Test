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
    // console.log(req.headers.authorization); // print the Authorization header
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const PORT = 3000;

// TO DO: convert to env variable:
const secretKey = 'My super secret key';
// console.log(expressJwt);
const jwtMiddleware = expressJwt({
    secret: secretKey,
    algorithms: ['HS256']
});

const JWT_TIMEOUT = process.env.JWT_TIMEOUT || '3m'; // default to 3 minutes

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
    // Find a user that matches the username and password
    const user = users.find(u => u.username === username && u.password === password);

    // if user found, send token
    if (user) {
        let jwtTimeout = '1m';
        let token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: JWT_TIMEOUT });
        return res.json({
            success: true,
            err: null,
            token
        });
    }

    // if no user found in list, err
    return res.status(401).json({
        success: false,
        token: null,
        err: 'Username or password is incorrect.'
    });
});


app.get('/api/dashboard', jwtMiddleware, (req, res) => {
    // console.log(req);
    res.json({
        success: true,
        myContent: `
                <div>
                    Secret content that only those deemed worthy can see.</br></br>
                </div>
                <div>
                    <button class="btn btn-secondary" role="button" onclick="goToSettings()">Settings</button>
                    <button class="btn btn-secondary" role="button" onclick="logout()">Logout</button>
                    <a href="/" class="btn btn-secondary" role="button"onclick="goHome()">Go Back</a>
                </div>
            `
    });
});


app.get('/api/settings', jwtMiddleware, (req, res) => {
    // console.log(req);
    res.json({
        success: true,
        myContent: `
        This is the settings page.</br></br>
        <button class="btn btn-secondary" role="button" onclick="getDashboard()">Dashboard</button>
        <button class="btn btn-secondary" role="button" onclick="logout()">Logout</button>
        <a href="/" class="btn btn-secondary" role="button" onclick="goHome()">Go Back</a>
    `
    });
});

// send JWT timeout value to front end (for display)
app.get('/api/jwt-timeout', (req, res) => {
    console.log("sending jwt timeout value: ", JWT_TIMEOUT);
    return res.send(JWT_TIMEOUT);
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